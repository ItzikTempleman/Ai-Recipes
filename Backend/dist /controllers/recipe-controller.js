"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeController = void 0;
const express_1 = __importDefault(require("express"));
const status_code_1 = require("../models/status-code");
const recipe_model_1 = require("../models/recipe-model");
const recipe_service_1 = require("../services/recipe-service");
const InputModel_1 = require("../models/InputModel");
const verification_middleware_1 = require("../middleware/verification-middleware");
const image_service_1 = require("../services/image-service");
class RecipeController {
    router = express_1.default.Router();
    constructor() {
        this.router.post("/api/generate-free-recipe-without-image/:amount", verification_middleware_1.verificationMiddleware.verifyOptional, this.generateRecipeNoImage);
        this.router.post("/api/generate-recipe-with-image/:amount", verification_middleware_1.verificationMiddleware.verifyOptional, this.generateRecipeWithImage);
        this.router.get("/api/recipes/all", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.getRecipes);
        this.router.get("/api/recipe/:recipeId", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.getSingleRecipe);
        this.router.get("/api/recipes/images/:fileName", this.getImageFile);
        this.router.delete("/api/recipe/:recipeId", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.deleteRecipe);
        this.router.post("/api/recipes/liked/:recipeId", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.likeRecipe);
        this.router.delete("/api/recipes/liked/:recipeId", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.unlikeRecipe);
        this.router.get("/api/recipes/liked/:recipeId", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.isRecipeLikedByUser);
        this.router.get("/api/recipes/liked", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.getMyLikedRecipeIds);
        this.router.get("/api/recipes/liked/full-recipe", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.getLikedRecipesByUserId);
        this.router.post("/api/recipes/:recipeId/generate-image", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.generateImageForSavedRecipe);
        this.router.post("/api/recipes/generate-image-preview", verification_middleware_1.verificationMiddleware.verifyOptional, this.generateImagePreview);
        this.router.get("/api/recipe/public/:recipeId", this.getPublicRecipe.bind(this));
        this.router.get("/api/recipes/liked/count/:recipeId", verification_middleware_1.verificationMiddleware.verifyLoggedIn, this.getRecipesTotalLikeCount);
    }
    ;
    async getRecipes(request, response) {
        const user = request.user;
        const recipes = await recipe_service_1.recipeService.getRecipes(user.id);
        response.json(recipes);
    }
    async getSingleRecipe(request, response) {
        const user = request.user;
        const recipeId = Number(request.params.recipeId);
        const recipes = await recipe_service_1.recipeService.getSingleRecipe(recipeId, user.id);
        response.json(recipes);
    }
    async getLikedRecipesByUserId(request, response) {
        const userId = request.user.id;
        const likedRecipes = await recipe_service_1.recipeService.getLikedRecipesByUserId(userId);
        response.status(status_code_1.StatusCode.OK).json(likedRecipes);
    }
    async generateRecipeNoImage(request, response) {
        const user = request.user;
        const quantity = Number(request.params.amount);
        const inputModel = new InputModel_1.InputModel({
            query: request.body.query,
            quantity,
            sugarRestriction: request.body.sugarRestriction,
            lactoseRestrictions: request.body.lactoseRestrictions,
            glutenRestrictions: request.body.glutenRestrictions,
            dietaryRestrictions: request.body.dietaryRestrictions,
            caloryRestrictions: request.body.caloryRestrictions,
            queryRestrictions: request.body.queryRestrictions
        });
        const data = await recipe_service_1.recipeService.generateInstructions(inputModel, false);
        const noImageRecipe = new recipe_model_1.FullRecipeModel({
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
        });
        if (user?.id) {
            const saved = await recipe_service_1.recipeService.saveRecipe(noImageRecipe, user.id);
            response.status(status_code_1.StatusCode.Created).json(saved);
            return;
        }
        response.status(status_code_1.StatusCode.OK).json(noImageRecipe);
    }
    async generateRecipeWithImage(request, response) {
        const user = request.user;
        const quantity = Number(request.params.amount);
        const inputModel = new InputModel_1.InputModel({
            query: request.body.query,
            quantity,
            sugarRestriction: request.body.sugarRestriction,
            lactoseRestrictions: request.body.lactoseRestrictions,
            glutenRestrictions: request.body.glutenRestrictions,
            dietaryRestrictions: request.body.dietaryRestrictions,
            caloryRestrictions: request.body.caloryRestrictions,
            queryRestrictions: request.body.queryRestrictions
        });
        const data = await recipe_service_1.recipeService.generateInstructions(inputModel, true);
        const { fileName, url } = await (0, image_service_1.generateImage)({
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
        const fullRecipe = new recipe_model_1.FullRecipeModel({
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
        });
        if (user?.id) {
            const saved = await recipe_service_1.recipeService.saveRecipe(fullRecipe, user.id);
            response.status(status_code_1.StatusCode.Created).json(saved);
            return;
        }
        response.status(status_code_1.StatusCode.OK).json(fullRecipe);
    }
    async generateImageForSavedRecipe(request, response) {
        const user = request.user;
        const recipeId = Number(request.params.recipeId);
        const recipe = await recipe_service_1.recipeService.getSingleRecipe(recipeId, user.id);
        if (recipe.imageName && recipe.imageName.trim() !== "") {
            response.json(recipe);
            return;
        }
        const { fileName, url } = await (0, image_service_1.generateImage)({
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
        await recipe_service_1.recipeService.setRecipeImageName(recipeId, user.id, fileName);
        const updated = await recipe_service_1.recipeService.getSingleRecipe(recipeId, user.id);
        updated.imageUrl = url;
        response.status(status_code_1.StatusCode.OK).json(updated);
    }
    async generateImagePreview(request, response) {
        const body = request.body ?? {};
        const title = String(body.title ?? "").trim();
        const description = String(body.description ?? "").trim();
        const amountOfServings = Number(body.amountOfServings ?? 1) || 1;
        if (!title) {
            response.status(status_code_1.StatusCode.BadRequest).send("Missing recipe title");
            return;
        }
        const ingredients = body.data?.ingredients ?? body.ingredients ?? [];
        const instructions = body.data?.instructions ?? body.instructions ?? [];
        const { fileName, url } = await (0, image_service_1.generateImage)({
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
        response.status(status_code_1.StatusCode.OK).json({ imageName: fileName, imageUrl: url });
    }
    async getPublicRecipe(request, response) {
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(status_code_1.StatusCode.BadRequest).send("Invalid recipeId");
            return;
        }
        ;
        const recipe = await recipe_service_1.recipeService.getRecipePublicById(recipeId);
        response.status(status_code_1.StatusCode.OK).json(recipe);
    }
    async getImageFile(request, response) {
        try {
            const { fileName } = request.params;
            if (Array.isArray(fileName) || typeof fileName !== "string") {
                return response.status(status_code_1.StatusCode.BadRequest).json({ message: "Invalid fileName" });
            }
            const imagePath = await recipe_service_1.recipeService.getImageFilePath(fileName);
            return response.sendFile(imagePath);
        }
        catch (err) {
            return response.status(status_code_1.StatusCode.NotFound).json({ message: "Image not found" });
        }
    }
    async deleteRecipe(request, response) {
        const recipeId = Number(request.params.recipeId);
        await recipe_service_1.recipeService.deleteRecipe(recipeId);
        response.sendStatus(status_code_1.StatusCode.NoContent);
    }
    async getMyLikedRecipeIds(request, response) {
        const userId = request.user.id;
        const recipeIds = await recipe_service_1.recipeService.getLikedRecipeIdsByUser(userId);
        response.status(status_code_1.StatusCode.OK).json(recipeIds);
    }
    async isRecipeLikedByUser(request, response) {
        const userId = request.user.id;
        const recipeId = Number(request.params.recipeId);
        const isRecipeLiked = await recipe_service_1.recipeService.isRecipeLikedByUser(userId, recipeId);
        response.status(status_code_1.StatusCode.OK).json(isRecipeLiked);
    }
    async likeRecipe(request, response) {
        const userId = request.user.id;
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(status_code_1.StatusCode.BadRequest).send("Route param recipe id must be a positive number");
            return;
        }
        const success = await recipe_service_1.recipeService.likeRecipe(userId, recipeId);
        response.json(success ? "liked" : "already liked");
    }
    async unlikeRecipe(request, response) {
        const userId = request.user.id;
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response.status(status_code_1.StatusCode.BadRequest).send("Route param recipe id must be a positive number");
            return;
        }
        const success = await recipe_service_1.recipeService.unlikeRecipe(userId, recipeId);
        response.json(success ? "un-liked" : "not liked");
    }
    async getRecipesTotalLikeCount(request, response) {
        const recipeId = Number(request.params.recipeId);
        if (Number.isNaN(recipeId) || recipeId <= 0) {
            response
                .status(status_code_1.StatusCode.BadRequest)
                .send("Route param recipe id must be a positive number");
            return;
        }
        const likedCount = await recipe_service_1.recipeService.getRecipesTotalLikeCount(recipeId);
        response.json(likedCount);
    }
}
exports.recipeController = new RecipeController();
