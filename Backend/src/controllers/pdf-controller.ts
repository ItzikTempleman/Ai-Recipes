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
    };

    private async getSharePdf(request: Request, response: Response) {
        try {
            const recipeId = Number(request.params.recipeId);
            if (Number.isNaN(recipeId) || recipeId <= 0) {
                response.status(StatusCode.BadRequest).send("Invalid recipeId");
                return;
            }
            const pdf = await sharePdfService.pdfForRecipeId(this.getFrontendBaseUrl(request), recipeId);
            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);
            response.status(StatusCode.OK).send(pdf);
        } catch (e: any) {
            console.error("getSharePdf failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    private async getSharePdfByToken(request: Request, response: Response) {
        try {
            const token = String(request.query.token || "");
            if (!token) {
                response.status(StatusCode.BadRequest).send("Missing token");
                return;
            }

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
            response.end(pdf);
        } catch (e: any) {
            console.error("getSharePdfByToken failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    private async sharePdfFromBody(request: Request, response: Response) {
        try {
            const recipe = request.body;
            if (!recipe || !recipe.title || !(recipe.data || recipe.ingredients || recipe.instructions)) {
                response.status(StatusCode.BadRequest).send("Missing recipe payload");
                return;
            }

            const token = sharePdfService.createTokenForPayload(recipe);
            const pdf = await sharePdfService.pdfForPayloadToken(this.getFrontendBaseUrl(request), token);

            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);
            response.status(StatusCode.OK).send(pdf);
        } catch (e: any) {
            console.error("sharePdfFromBody failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }


    private async getSharePayload(request: Request, response: Response) {
        try {
            const token = String(request.params.token || "").trim();
            if (!token) {
                response.status(StatusCode.BadRequest).send("Missing token");
                return;
            }
            const payload =
                sharePdfService.getPayload(token) ??
                PdfController.decodeShareToken(token);

            if (!payload) {
                response.status(404).send("Share payload expired");
                return;
            }

            response.json(payload);
        } catch (e: any) {
            console.error("getSharePayload failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    private async createShareToken(request: Request, response: Response) {
        try {
            const normalized = request.body;

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

            const token = sharePdfService.createTokenForPayload(minimal);

            response.json({ token });
        } catch (e: any) {
            console.error("createShareToken failed:", e?.stack || e);
            response.status(StatusCode.InternalServerError).send("Some error, please try again");
        }
    }

    static encodeShareToken(payload: any): string {

        const json = JSON.stringify(payload);
        const deflated = zlib.deflateRawSync(Buffer.from(json, "utf8"), { level: 9 });
        const b64 = deflated.toString("base64");
        const b64url = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        return `v2.${b64url}`;
    }

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
            let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
            while (b64.length % 4 !== 0) b64 += "=";
            const json = Buffer.from(b64, "base64").toString("utf8");
            const obj = JSON.parse(json);
            if (!obj || !obj.title) return null;
            return obj;
        } catch {
            return null;
        }
    }

    private getFrontendBaseUrl(request: Request): string {
        const envOrigin = process.env.FRONTEND_BASE_URL?.trim() || process.env.PUBLIC_ORIGIN?.trim();
        if (envOrigin) return envOrigin.replace(/\/$/, "");
        const xfProto = (request.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
        const xfHost = (request.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
        const host = xfHost || request.headers.host;
        const proto = xfProto || "https";
        if (host) return `${proto}://${host}`.replace(/\/$/, "");
        return appConfig.frontendBaseUrl.replace(/\/$/, "");
    }
    public async createSharePayloadToken(req: Request, res: Response) {
        const payload = req.body;
        if (!payload?.title) return res.status(400).send("Missing payload");
        const token = sharePdfService.createTokenForPayload(payload);
        res.json({ token });
    }
}

export const pdfController = new PdfController();