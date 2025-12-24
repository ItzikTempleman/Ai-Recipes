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

class RecipeController {
    public router: Router = express.Router();

    public constructor() {
        this.router.post("/api/generate-free-recipe-without-image/:amount", verificationMiddleware.verifyOptional, this.generateFreeNoImageRecipe);
        this.router.post("/api/generate-recipe-with-image/:amount", verificationMiddleware.verifyOptional, this.generateRecipeWithImage);
        this.router.get("/api/recipes/all", verificationMiddleware.verifyLoggedIn, this.getRecipes);
        this.router.get("/api/recipe/:recipeId", verificationMiddleware.verifyLoggedIn, this.getSingleRecipe);
        this.router.get("/api/recipes/images/:fileName", this.getImageFile);
        this.router.delete("/api/recipe/:recipeId", verificationMiddleware.verifyLoggedIn, this.deleteRecipe)
        this.router.post("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.likeRecipe);
        this.router.delete("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.unlikeRecipe);
        this.router.get("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.isRecipeLikedByUser);
        this.router.get("/api/recipes/liked", verificationMiddleware.verifyLoggedIn, this.getMyLikedRecipeIds);
        this.router.post("/api/recipes/:recipeId/generate-image", verificationMiddleware.verifyLoggedIn, this.generateImageForSavedRecipe);
        this.router.post("/api/recipes/generate-image-preview", verificationMiddleware.verifyOptional, this.generateImagePreview);

        this.router.get("/api/recipes/:recipeId/share.pdf", this.getSharePdf);
    };

    private getFrontendBaseUrl(request: Request): string {
        return (
            process.env.FRONTEND_BASE_URL ||
            `${request.header("x-forwarded-proto") || request.protocol}://${request.get("host")}`
        );
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
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(StatusCode.BadRequest).send("Invalid recipeId");
            return;
        }

        await recipeService.getRecipePublicById(recipeId);

        const shareUrl = `${this.getFrontendBaseUrl(request)}/share-render/${recipeId}`;

        const browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        });

        try {
            const page = await browser.newPage({
                viewport: { width: 1000, height: 1600 },
                deviceScaleFactor: 2,
            });
            await page.goto(shareUrl, { waitUntil: "networkidle" });
            await page.waitForFunction(() => (window as any).__SHARE_READY__ === true, null, { timeout: 15000 });

            const root = await page.$("#share-root");
            if (!root) {
                response.status(StatusCode.InternalServerError).send("share-root not found");
                return;
            }

            const png = await root.screenshot({ type: "png", omitBackground: false });

            const pdfDoc = await PDFDocument.create();
            const img = await pdfDoc.embedPng(png);

            const width = img.width * (72 / 96);
            const height = img.height * (72 / 96);

            const pdfPage = pdfDoc.addPage([width, height]);
            pdfPage.drawImage(img, { x: 0, y: 0, width, height });

            const pdfBytes = await pdfDoc.save();

            response.setHeader("Content-Type", "application/pdf");
            response.setHeader("Cache-Control", "no-store");
            response.status(StatusCode.OK).send(Buffer.from(pdfBytes));
        } catch (e: any) {
            response.status(StatusCode.InternalServerError).json({ message: e?.message || String(e) });
        } finally {
            await browser.close();
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