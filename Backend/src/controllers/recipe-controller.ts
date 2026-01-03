import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCode } from "../models/status-code";
import { FullRecipeModel } from "../models/recipe-model";
import { recipeService } from "../services/recipe-service";
import { InputModel } from "../models/InputModel";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { UserModel } from "../models/user-model";
import { generateImage } from "../services/image-service";
import { appConfig } from "../utils/app-config";
import { sharePdfService } from "../services/share-pdf-service";
import zlib from "zlib";

class RecipeController {
    public router: Router = express.Router();

    public constructor() {
        this.router.post("/api/generate-free-recipe-without-image/:amount", verificationMiddleware.verifyOptional, this.generateFreeNoImageRecipe);
        this.router.post("/api/generate-recipe-with-image/:amount", verificationMiddleware.verifyOptional, this.generateRecipeWithImage);
        this.router.get("/api/recipes/all", verificationMiddleware.verifyLoggedIn, this.getRecipes);
        this.router.get("/api/recipe/:recipeId", verificationMiddleware.verifyLoggedIn, this.getSingleRecipe);
        this.router.get("/api/recipes/images/:fileName", this.getImageFile);
        this.router.delete("/api/recipe/:recipeId", verificationMiddleware.verifyLoggedIn, this.deleteRecipe);
        this.router.post("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.likeRecipe);
        this.router.delete("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.unlikeRecipe);
        this.router.get("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.isRecipeLikedByUser);
        this.router.get("/api/recipes/liked", verificationMiddleware.verifyLoggedIn, this.getMyLikedRecipeIds);
        this.router.get("/api/recipes/liked/full-recipe", verificationMiddleware.verifyLoggedIn, this.getLikedRecipesByUserId);
        this.router.post("/api/recipes/:recipeId/generate-image", verificationMiddleware.verifyLoggedIn, this.generateImageForSavedRecipe);
        this.router.post("/api/recipes/generate-image-preview", verificationMiddleware.verifyOptional, this.generateImagePreview);
        this.router.get("/api/recipe/public/:recipeId", this.getPublicRecipe.bind(this));
        this.router.get("/api/recipes/:recipeId/share.pdf", this.getSharePdf.bind(this));
        this.router.post("/api/recipes/share.pdf", this.sharePdfFromBody.bind(this));
        this.router.get("/api/share-payload/:token", this.getSharePayload.bind(this));
        this.router.get("/api/recipes/share.pdf", this.getSharePdfByToken.bind(this));
        this.router.post("/api/recipes/share-token", this.createShareToken.bind(this));
        this.router.get("/api/recipes/liked/count/:recipeId", verificationMiddleware.verifyLoggedIn, this.getRecipesTotalLikeCount);
    };

    private async getRecipes(request: Request, response: Response) {
        const user = (request as any).user as UserModel;
        const recipes = await recipeService.getRecipes(user.id);
        response.json(recipes);
    }

    private async getSingleRecipe(request: Request, response: Response) {
        const user = (request as any).user as UserModel;
        const recipeId = Number(request.params.recipeId)
        const recipes = await recipeService.getSingleRecipe(recipeId, user.id);
        response.json(recipes);
    }

    
      public async getLikedRecipesByUserId(request: Request, response: Response) {
   const userId = (request as any).user.id;
  const likedRecipes = await recipeService.getLikedRecipesByUserId(userId);
  response.status(StatusCode.OK).json(likedRecipes);
      }

    private async generateFreeNoImageRecipe(request: Request, response: Response): Promise<void> {
        const user = (request as any).user as UserModel | undefined;
        const quantity = Number(request.params.amount);
        const inputModel = new InputModel({
            query: request.body.query,
            quantity,
            sugarRestriction: request.body.sugarRestriction,
            lactoseRestrictions: request.body.lactoseRestrictions,
            glutenRestrictions: request.body.glutenRestrictions,
            dietaryRestrictions: request.body.dietaryRestrictions,
            caloryRestrictions: request.body.caloryRestrictions,
            queryRestrictions: request.body.queryRestrictions
        } as InputModel);

        const data = await recipeService.generateInstructions(inputModel, false);

        const noImageRecipe = new FullRecipeModel({
            title: data.title,
            amountOfServings: quantity,
            description: data.description,
            popularity: data.popularity,
            data: { ingredients: data.ingredients, instructions: data.instructions },
            totalSugar: data.totalSugar,
            totalProtein: data.totalProtein,
            healthLevel: data.healthLevel,
            calories: data.calories,
            sugarRestriction: data.sugarRestriction,
            lactoseRestrictions: data.lactoseRestrictions,
            glutenRestrictions: data.glutenRestrictions,
            dietaryRestrictions: data.dietaryRestrictions,
            caloryRestrictions: data.caloryRestrictions,
            queryRestrictions: data.queryRestrictions,
            prepTime: data.prepTime,
            difficultyLevel: data.difficultyLevel,
            countryOfOrigin: data.countryOfOrigin,
            image: undefined,
            imageUrl: undefined,
            imageName: undefined,
            userId: user?.id
        } as FullRecipeModel);

        if (user?.id) {
            const saved = await recipeService.saveRecipe(noImageRecipe, user.id);
            response.status(StatusCode.Created).json(saved);
            return;
        }
        response.status(StatusCode.OK).json(noImageRecipe);
    }

    private async generateRecipeWithImage(request: Request, response: Response): Promise<void> {
        const user = (request as any).user as UserModel | undefined;
        const quantity = Number(request.params.amount);

        const inputModel = new InputModel({
            query: request.body.query,
            quantity,
            sugarRestriction: request.body.sugarRestriction,
            lactoseRestrictions: request.body.lactoseRestrictions,
            glutenRestrictions: request.body.glutenRestrictions,
            dietaryRestrictions: request.body.dietaryRestrictions,
            caloryRestrictions: request.body.caloryRestrictions,
            queryRestrictions: request.body.queryRestrictions
        } as InputModel);

        const data = await recipeService.generateInstructions(inputModel, true);

        const { fileName, url } = await generateImage({
            query: inputModel.query,
            quantity,
            sugarRestriction: inputModel.sugarRestriction,
            lactoseRestrictions: inputModel.lactoseRestrictions,
            glutenRestrictions: inputModel.glutenRestrictions,
            dietaryRestrictions: inputModel.dietaryRestrictions,
            caloryRestrictions: inputModel.caloryRestrictions,
            queryRestrictions: inputModel.queryRestrictions,
            title: data.title,
            description: data.description,
            ingredients: data.ingredients,
            instructions: data.instructions
        });

        const fullRecipe = new FullRecipeModel({
            title: data.title,
            amountOfServings: quantity,
            description: data.description,
            popularity: data.popularity,
            data: { ingredients: data.ingredients, instructions: data.instructions },
            totalSugar: data.totalSugar,
            totalProtein: data.totalProtein,
            healthLevel: data.healthLevel,
            calories: data.calories,
            sugarRestriction: data.sugarRestriction,
            lactoseRestrictions: data.lactoseRestrictions,
            glutenRestrictions: data.glutenRestrictions,
            dietaryRestrictions: data.dietaryRestrictions,
            caloryRestrictions: data.caloryRestrictions,
            queryRestrictions: data.queryRestrictions,
            prepTime: data.prepTime,
            difficultyLevel: data.difficultyLevel,
            countryOfOrigin: data.countryOfOrigin,
            image: undefined,
            imageUrl: url,
            imageName: fileName,
            userId: user?.id
        } as FullRecipeModel);

        if (user?.id) {
            const saved = await recipeService.saveRecipe(fullRecipe, user.id);
            response.status(StatusCode.Created).json(saved);
            return;
        }
        response.status(StatusCode.OK).json(fullRecipe);
    }

    private async generateImageForSavedRecipe(request: Request, response: Response) {
        const user = (request as any).user as UserModel;
        const recipeId = Number(request.params.recipeId);
        const recipe = await recipeService.getSingleRecipe(recipeId, user.id);
        if (recipe.imageName && recipe.imageName.trim() !== "") {
            response.json(recipe);
            return;
        }
        const { fileName, url } = await generateImage({
            query: recipe.title,
            quantity: recipe.amountOfServings,
            sugarRestriction: recipe.sugarRestriction,
            lactoseRestrictions: recipe.lactoseRestrictions,
            glutenRestrictions: recipe.glutenRestrictions,
            dietaryRestrictions: recipe.dietaryRestrictions,
            caloryRestrictions: recipe.caloryRestrictions,
            queryRestrictions: recipe.queryRestrictions,
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.data?.ingredients ?? [],
            instructions: recipe.data?.instructions ?? []
        });
        await recipeService.setRecipeImageName(recipeId, user.id, fileName);
        const updated = await recipeService.getSingleRecipe(recipeId, user.id);
        updated.imageUrl = url;
        response.status(StatusCode.OK).json(updated);
    }

    private async generateImagePreview(request: Request, response: Response) {
        const body = request.body ?? {};
        const title = String(body.title ?? "").trim();
        const description = String(body.description ?? "").trim();
        const amountOfServings = Number(body.amountOfServings ?? 1) || 1;
        if (!title) {
            response.status(StatusCode.BadRequest).send("Missing recipe title");
            return;
        }
        const ingredients = body.data?.ingredients ?? body.ingredients ?? [];
        const instructions = body.data?.instructions ?? body.instructions ?? [];
        const { fileName, url } = await generateImage({
            query: title,
            quantity: amountOfServings,
            sugarRestriction: body.sugarRestriction,
            lactoseRestrictions: body.lactoseRestrictions,
            glutenRestrictions: body.glutenRestrictions,
            dietaryRestrictions: body.dietaryRestrictions,
            caloryRestrictions: body.caloryRestrictions,
            queryRestrictions: body.queryRestrictions ?? [],
            title,
            description,
            ingredients,
            instructions
        });
        response.status(StatusCode.OK).json({ imageName: fileName, imageUrl: url });
    }

    private async getPublicRecipe(request: Request, response: Response) {
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(StatusCode.BadRequest).send("Invalid recipeId");
            return;
        };
        const recipe = await recipeService.getRecipePublicById(recipeId);
        response.status(StatusCode.OK).json(recipe);
    }

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

    private async getImageFile(request: Request, response: Response) {
        try {
            const { fileName } = request.params;
            const imagePath = await recipeService.getImageFilePath(fileName);
            response.sendFile(imagePath);
        } catch (err) {
            response.status(StatusCode.NotFound).json({ message: "Image not found" });
        }
    }

    private async deleteRecipe(request: Request, response: Response) {
        const recipeId = Number(request.params.recipeId);
        await recipeService.deleteRecipe(recipeId);
        response.sendStatus(StatusCode.NoContent);
    }

    private async getMyLikedRecipeIds(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const recipeIds = await recipeService.getLikedRecipeIdsByUser(userId);
        response.status(StatusCode.OK).json(recipeIds);
    }

    public async isRecipeLikedByUser(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const recipeId = Number(request.params.recipeId);
        const isRecipeLiked = await recipeService.isRecipeLikedByUser(userId, recipeId);
        response.status(StatusCode.OK).json(isRecipeLiked);
    }

    private async likeRecipe(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(StatusCode.BadRequest).send("Route param recipe id must be a positive number");
            return;
        }
        const success = await recipeService.likeRecipe(userId, recipeId);
        response.json(success ? "liked" : "already liked");
    }

    private async unlikeRecipe(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(StatusCode.BadRequest).send("Route param recipe id must be a positive number");
            return;
        }
        const success = await recipeService.unlikeRecipe(userId, recipeId);
        response.json(success ? "un-liked" : "not liked");
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
                RecipeController.decodeShareToken(token);

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

    private async getSharePdfByToken(request: Request, response: Response) {
        try {
            const token = String(request.query.token || "");
            if (!token) {
                response.status(StatusCode.BadRequest).send("Missing token");
                return;
            }

            const payload =
                sharePdfService.getPayload(token) ??
                RecipeController.decodeShareToken(token);

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
        const envOrigin = process.env.PUBLIC_ORIGIN?.trim();
        if (envOrigin) return envOrigin.replace(/\/$/, "");
        const xfProto = (request.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
        const xfHost = (request.headers["x-forwarded-host"] as string | undefined)?.split(",")[0]?.trim();
        const forwarded = (request.headers["forwarded"] as string | undefined);
        let fProto: string | undefined;
        let fHost: string | undefined;
        if (forwarded) {
            const mProto = forwarded.match(/proto=([^;,\s]+)/i);
            const mHost = forwarded.match(/host=([^;,\s]+)/i);
            fProto = mProto?.[1]?.replace(/"/g, "");
            fHost = mHost?.[1]?.replace(/"/g, "");
        }
        const host =
            xfHost ||
            fHost ||
            (request.headers["x-original-host"] as string | undefined) ||
            (request.headers["x-host"] as string | undefined) ||
            request.headers.host;

        let proto = xfProto || fProto || "https";
        if (host && (host.includes("localhost") || host.startsWith("127.0.0.1"))) {
            proto = "http";
        }
        if (!host) {
            return "https://www.itzikrecipe.com";
        }
        return `${proto}://${host}`.replace(/\/$/, "");
    }

    public async createSharePayloadToken(req: Request, res: Response) {
        const payload = req.body;
        if (!payload?.title) return res.status(400).send("Missing payload");
        const token = sharePdfService.createTokenForPayload(payload); // short token in memory
        res.json({ token });
    }

    private async getRecipesTotalLikeCount(request: Request, response: Response) {
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response
                .status(StatusCode.BadRequest)
                .send("Route param recipe id must be a positive number");
            return;
        }
        const likedCount = await recipeService.getRecipesTotalLikeCount(recipeId);
        response.json(likedCount);
    }
}

export const recipeController = new RecipeController();