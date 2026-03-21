import express, { Request, Response, Router } from "express";
import { StatusCode } from "../models/status-code";
import { sharePdfService } from "../services/share-pdf-service";
import zlib from "zlib";
import { appConfig } from "../utils/app-config";

class PdfController {
    public router: Router = express.Router();

    public constructor() {
        this.router.get("/api/recipes/:recipeId/share.pdf", this.getSharePdf.bind(this));
        this.router.post("/api/recipes/share.pdf", this.sharePdfFromBody.bind(this));
        this.router.get("/api/share-payload/:token", this.getSharePayload.bind(this));
        this.router.get("/api/recipes/share.pdf", this.getSharePdfByToken.bind(this));
        this.router.post("/api/recipes/share-token", this.createShareToken.bind(this));
    }

    // =========================================
    // Recipe ID → PDF
    // =========================================
    private async getSharePdf(request: Request, response: Response) {
        try {
            const recipeId = Number(request.params.recipeId);

            if (Number.isNaN(recipeId) || recipeId <= 0) {
                response.status(StatusCode.BadRequest).send("Invalid recipeId");
                return;
            }

            const pdf = await sharePdfService.pdfForRecipeId(
                this.getFrontendBaseUrl(request),
                recipeId
            );

            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);

            response.status(StatusCode.OK).send(pdf);
        } catch (e: any) {
            console.error("getSharePdf failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    // =========================================
    // TOKEN → PDF (MAIN SHARE ENTRY POINT)
    // =========================================
    private async getSharePdfByToken(request: Request, response: Response) {
        try {
            const token = String(request.query.token || "").trim();

            if (!token) {
                response.status(StatusCode.BadRequest).send("Missing token");
                return;
            }

            // ✅ CRITICAL FIX: support BOTH token types
            const payload =
                sharePdfService.getPayload(token) ??
                PdfController.decodeShareToken(token);

            if (!payload) {
                response.status(StatusCode.BadRequest).send("Invalid or expired token");
                return;
            }

            const pdf = await sharePdfService.pdfForPayloadInjected(
                this.getFrontendBaseUrl(request),
                payload
            );

            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);

            response.status(StatusCode.OK).send(pdf);
        } catch (e: any) {
            console.error("getSharePdfByToken failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    // =========================================
    // BODY → PDF (NOT WHATSAPP FLOW)
    // =========================================
    private async sharePdfFromBody(request: Request, response: Response) {
        try {
            const recipe = request.body;

            if (!recipe || !recipe.title || !(recipe.data || recipe.ingredients || recipe.instructions)) {
                response.status(StatusCode.BadRequest).send("Missing recipe payload");
                return;
            }

            // ✅ Keep short token even here (consistent)
            const token = sharePdfService.createTokenForPayload(recipe);

            const pdf = await sharePdfService.pdfForPayloadToken(
                this.getFrontendBaseUrl(request),
                token
            );

            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);

            response.status(StatusCode.OK).send(pdf);
        } catch (e: any) {
            console.error("sharePdfFromBody failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    // =========================================
    // TOKEN → JSON PAYLOAD
    // =========================================
    private async getSharePayload(request: Request, response: Response) {
        try {
            const token = String(request.params.token || "").trim();

            if (!token) {
                response.status(StatusCode.BadRequest).send("Missing token");
                return;
            }

            // ✅ CRITICAL FIX: support BOTH token types
            const payload =
                sharePdfService.getPayload(token) ??
                PdfController.decodeShareToken(token);

            if (!payload) {
                response.status(StatusCode.NotFound).send("Share payload expired");
                return;
            }

            response.status(StatusCode.OK).json(payload);
        } catch (e: any) {
            console.error("getSharePayload failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    // =========================================
    // CREATE SHARE TOKEN
    // =========================================
    private async createShareToken(request: Request, response: Response) {
        try {
            const normalized = request.body;

            if (!normalized || !normalized.title) {
                response.status(StatusCode.BadRequest).send("Missing recipe payload");
                return;
            }

            const minimal = {
                title: normalized.title,
                data: normalized.data,
                imageUrl: normalized.imageUrl || normalized.image || "",
                description: normalized.description,
                sugarRestriction: normalized.sugarRestriction,
                lactoseRestrictions: normalized.lactoseRestrictions,
                glutenRestrictions: normalized.glutenRestrictions,
                dietaryRestrictions: normalized.dietaryRestrictions,
                amountOfServings: normalized.amountOfServings,
                calories: normalized.calories,
                totalSugar: normalized.totalSugar,
                totalProtein: normalized.totalProtein,
                healthLevel: normalized.healthLevel,
                prepTime: normalized.prepTime,
                difficultyLevel: normalized.difficultyLevel,
                countryOfOrigin: normalized.countryOfOrigin,
            };

            // ✅ CRITICAL FIX: SHORT TOKEN (WhatsApp-safe)
            const token = sharePdfService.createTokenForPayload(minimal);

            response.status(StatusCode.OK).json({ token });
        } catch (e: any) {
            console.error("createShareToken failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    // =========================================
    // ENCODE (kept for backward compatibility)
    // =========================================
    static encodeShareToken(payload: any): string {
        const json = JSON.stringify(payload);
        const deflated = zlib.deflateRawSync(Buffer.from(json, "utf8"), { level: 9 });
        const b64 = deflated.toString("base64");
        const b64url = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        return `v2.${b64url}`;
    }

    // =========================================
    // DECODE (backward compatibility)
    // =========================================
    private static decodeShareToken(token: string): any | null {
        try {
            if (token.startsWith("v2.")) {
                const part = token.slice(3);
                let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
                while (b64.length % 4 !== 0) b64 += "=";

                const compressed = Buffer.from(b64, "base64");
                const json = zlib.inflateRawSync(compressed).toString("utf8");
                const obj = JSON.parse(json);

                if (!obj || !obj.title) return null;
                return obj;
            }

            return null;
        } catch {
            return null;
        }
    }

    // =========================================
    // FRONTEND URL RESOLUTION
    // =========================================
    private getFrontendBaseUrl(request: Request): string {
        const envOrigin =
            process.env.FRONTEND_BASE_URL?.trim() ||
            process.env.PUBLIC_ORIGIN?.trim();

        if (envOrigin) {
            return envOrigin.replace(/\/$/, "");
        }

        const xfProto = (request.headers["x-forwarded-proto"] as string | undefined)
            ?.split(",")[0]
            ?.trim();

        const xfHost = (request.headers["x-forwarded-host"] as string | undefined)
            ?.split(",")[0]
            ?.trim();

        const host = xfHost || request.headers.host;
        const proto = xfProto || "https";

        if (host) {
            return `${proto}://${host}`.replace(/\/$/, "");
        }

        return appConfig.frontendBaseUrl.replace(/\/$/, "");
    }
}

export const pdfController = new PdfController();