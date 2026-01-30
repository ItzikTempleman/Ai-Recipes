"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfController = void 0;
const express_1 = __importDefault(require("express"));
const status_code_1 = require("../models/status-code");
const share_pdf_service_1 = require("../services/share-pdf-service");
const zlib_1 = __importDefault(require("zlib"));
const app_config_1 = require("../utils/app-config");
class PdfController {
    router = express_1.default.Router();
    constructor() {
        this.router.get("/api/recipes/:recipeId/share.pdf", this.getSharePdf.bind(this));
        this.router.post("/api/recipes/share.pdf", this.sharePdfFromBody.bind(this));
        this.router.get("/api/share-payload/:token", this.getSharePayload.bind(this));
        this.router.get("/api/recipes/share.pdf", this.getSharePdfByToken.bind(this));
        this.router.post("/api/recipes/share-token", this.createShareToken.bind(this));
    }
    ;
    async getSharePdf(request, response) {
        try {
            const recipeId = Number(request.params.recipeId);
            if (Number.isNaN(recipeId) || recipeId <= 0) {
                response.status(status_code_1.StatusCode.BadRequest).send("Invalid recipeId");
                return;
            }
            const pdf = await share_pdf_service_1.sharePdfService.pdfForRecipeId(this.getFrontendBaseUrl(request), recipeId);
            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);
            response.status(status_code_1.StatusCode.OK).send(pdf);
        }
        catch (e) {
            console.error("getSharePdf failed:", e?.stack || e);
            response.status(status_code_1.StatusCode.InternalServerError).send("Some error, please try again");
        }
    }
    async getSharePdfByToken(request, response) {
        try {
            const token = String(request.query.token || "");
            if (!token) {
                response.status(status_code_1.StatusCode.BadRequest).send("Missing token");
                return;
            }
            const payload = share_pdf_service_1.sharePdfService.getPayload(token) ??
                PdfController.decodeShareToken(token);
            if (!payload) {
                response.status(status_code_1.StatusCode.BadRequest).send("Invalid or expired token");
                return;
            }
            const pdf = await share_pdf_service_1.sharePdfService.pdfForPayloadInjected(this.getFrontendBaseUrl(request), payload);
            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);
            response.end(pdf);
        }
        catch (e) {
            console.error("getSharePdfByToken failed:", e?.stack || e);
            response.status(status_code_1.StatusCode.InternalServerError).send("Some error, please try again");
        }
    }
    async sharePdfFromBody(request, response) {
        try {
            const recipe = request.body;
            if (!recipe || !recipe.title || !(recipe.data || recipe.ingredients || recipe.instructions)) {
                response.status(status_code_1.StatusCode.BadRequest).send("Missing recipe payload");
                return;
            }
            const token = share_pdf_service_1.sharePdfService.createTokenForPayload(recipe);
            const pdf = await share_pdf_service_1.sharePdfService.pdfForPayloadToken(this.getFrontendBaseUrl(request), token);
            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);
            response.status(status_code_1.StatusCode.OK).send(pdf);
        }
        catch (e) {
            console.error("sharePdfFromBody failed:", e?.stack || e);
            response.status(status_code_1.StatusCode.InternalServerError).send("Some error, please try again");
        }
    }
    async getSharePayload(request, response) {
        try {
            const token = String(request.params.token || "").trim();
            if (!token) {
                response.status(status_code_1.StatusCode.BadRequest).send("Missing token");
                return;
            }
            const payload = share_pdf_service_1.sharePdfService.getPayload(token) ??
                PdfController.decodeShareToken(token);
            if (!payload) {
                response.status(404).send("Share payload expired");
                return;
            }
            response.json(payload);
        }
        catch (e) {
            console.error("getSharePayload failed:", e?.stack || e);
            response.status(status_code_1.StatusCode.InternalServerError).send("Some error, please try again");
        }
    }
    async createShareToken(request, response) {
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
            const token = share_pdf_service_1.sharePdfService.createTokenForPayload(minimal);
            response.json({ token });
        }
        catch (e) {
            console.error("createShareToken failed:", e?.stack || e);
            response.status(status_code_1.StatusCode.InternalServerError).send("Some error, please try again");
        }
    }
    static encodeShareToken(payload) {
        const json = JSON.stringify(payload);
        const deflated = zlib_1.default.deflateRawSync(Buffer.from(json, "utf8"), { level: 9 });
        const b64 = deflated.toString("base64");
        const b64url = b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
        return `v2.${b64url}`;
    }
    static decodeShareToken(token) {
        try {
            if (token.startsWith("v2.")) {
                const part = token.slice(3);
                let b64 = part.replace(/-/g, "+").replace(/_/g, "/");
                while (b64.length % 4 !== 0)
                    b64 += "=";
                const compressed = Buffer.from(b64, "base64");
                const json = zlib_1.default.inflateRawSync(compressed).toString("utf8");
                const obj = JSON.parse(json);
                if (!obj || !obj.title)
                    return null;
                return obj;
            }
            let b64 = token.replace(/-/g, "+").replace(/_/g, "/");
            while (b64.length % 4 !== 0)
                b64 += "=";
            const json = Buffer.from(b64, "base64").toString("utf8");
            const obj = JSON.parse(json);
            if (!obj || !obj.title)
                return null;
            return obj;
        }
        catch {
            return null;
        }
    }
    getFrontendBaseUrl(request) {
        const envOrigin = process.env.FRONTEND_BASE_URL?.trim() || process.env.PUBLIC_ORIGIN?.trim();
        if (envOrigin)
            return envOrigin.replace(/\/$/, "");
        const xfProto = request.headers["x-forwarded-proto"]?.split(",")[0]?.trim();
        const xfHost = request.headers["x-forwarded-host"]?.split(",")[0]?.trim();
        const host = xfHost || request.headers.host;
        const proto = xfProto || "https";
        if (host)
            return `${proto}://${host}`.replace(/\/$/, "");
        return app_config_1.appConfig.frontendBaseUrl.replace(/\/$/, "");
    }
    async createSharePayloadToken(req, res) {
        const payload = req.body;
        if (!payload?.title)
            return res.status(400).send("Missing payload");
        const token = share_pdf_service_1.sharePdfService.createTokenForPayload(payload);
        res.json({ token });
    }
}
exports.pdfController = new PdfController();
