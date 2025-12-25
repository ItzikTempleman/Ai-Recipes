import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { FullRecipeModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";
import { InputModel } from "../3-models/InputModel";
import { verificationMiddleware } from "../6-middleware/verification-middleware";
import { UserModel } from "../3-models/user-model";
import { generateImage } from "../4-services/image-service";
import { ResourceNotFound } from "../3-models/client-errors";
import { chromium } from "playwright";
import { PDFDocument } from "pdf-lib";
import { appConfig } from "../2-utils/app-config";
import { sharePdfService } from "../2-utils/share-pdf-service";

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
        this.router.post("/api/recipes/:recipeId/generate-image", verificationMiddleware.verifyLoggedIn, this.generateImageForSavedRecipe);
        this.router.post("/api/recipes/generate-image-preview", verificationMiddleware.verifyOptional, this.generateImagePreview);
        this.router.get("/api/recipe/public/:recipeId", this.getPublicRecipe.bind(this));
        this.router.get("/api/recipes/:recipeId/share.pdf", this.getSharePdf.bind(this));
        this.router.post("/api/recipes/share.pdf", this.sharePdfFromBody.bind(this));
        this.router.get("/api/share-payload/:token", this.getSharePayload.bind(this));
        this.router.get("/api/recipes/share.pdf", this.getSharePdfByToken.bind(this));
        this.router.post("/api/recipes/share-token", this.createShareToken.bind(this));
    };

    private getFrontendBaseUrl(_request: Request): string {
        return appConfig.frontendBaseUrl;
    }

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

    // public fetch so it works without auth too
    const recipe = await recipeService.getRecipePublicById(recipeId);

    const pdf = await sharePdfService.pdfForRecipePayload(recipe);

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

    const pdf = await sharePdfService.pdfForRecipePayload(recipe);

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
        const token = String(request.params.token || "");
        const payload = sharePdfService.getPayload(token);

        if (!payload) {
            response.status(404).send("Share payload expired");
            return;
        }

        response.json(payload);
    }

    private async createShareToken(request: Request, response: Response) {
        const recipe = request.body;

        if (!recipe || !recipe.title || recipe.data) {
            response.status(StatusCode.BadRequest).send("Missing recipe payload");
            return;
        }
        const token = sharePdfService.createTokenForPayload(recipe);
        response.json({ token })
    }

    private async getSharePdfByToken(request: Request, response: Response) {
        const token = String(request.query.token || "");
        if (!token) {
            response.status(StatusCode.BadRequest).send("Missing token");
            return;
        }

        const payload = sharePdfService.getPayload(token);
        if (!payload) {
            response.status(404).send("Share payload expired");
            return;
        }

        const pdf = await sharePdfService.pdfForPayloadToken(this.getFrontendBaseUrl(request), token);

        response.setHeader("Content-Type", "application/pdf");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Content-Disposition", `inline; filename="recipe.pdf"`);
        response.status(200).send(pdf);
    }

}

export const recipeController = new RecipeController();


//this.router.get("/api/recipes/liked/count/:recipeId", verificationMiddleware.verifyLoggedIn, this.getRecipesTotalLikeCount);


// private async getRecipesTotalLikeCount(request: Request, response: Response) {
//   const recipeId = Number(request.params.recipeId);
//   if (Number.isNaN(recipeId) || recipeId <= 0) {
//     response
//       .status(StatusCode.BadRequest)
//       .send("Route param recipe id must be a positive number");
//     return;
//   }
//   const likedCount = await recipeService.getRecipesTotalLikeCount(recipeId);
//   response.json(likedCount);
// }