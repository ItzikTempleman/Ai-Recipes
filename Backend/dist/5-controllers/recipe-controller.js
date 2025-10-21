"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeController = void 0;
const express_1 = __importDefault(require("express"));
const status_code_1 = require("../3-models/status-code");
const recipe_model_1 = require("../3-models/recipe-model");
const recipe_service_1 = require("../4-services/recipe-service");
const InputModel_1 = require("../3-models/InputModel");
class RecipeController {
    router = express_1.default.Router();
    constructor() {
        this.router.post("/api/generate-free-recipe-without-image/:amount", this.generateFreeNoImageRecipe);
        this.router.post("/api/generate-recipe-with-image/:amount", this.generateRecipeWithImage);
        this.router.get("/api/recipes/all", this.getRecipes);
        this.router.get("/api/recipe/:id", this.getSingleRecipe);
        this.router.get("/api/recipes/images/:fileName", this.getImageFile);
        this.router.delete("/api/recipe/:id", this.deleteRecipe);
    }
    ;
    async getRecipes(_, response) {
        const recipes = await recipe_service_1.recipeService.getRecipes();
        response.json(recipes);
    }
    async getSingleRecipe(request, response) {
        const id = Number(request.params.id);
        const recipes = await recipe_service_1.recipeService.getSingleRecipe(id);
        response.json(recipes);
    }
    async generateFreeNoImageRecipe(request, response) {
        const quantity = Number(request.params.amount);
        const inputModel = new InputModel_1.InputModel({ query: request.body.query, quantity });
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
            image: undefined,
            imageUrl: undefined,
            imageName: undefined
        });
        const dbNoImageRecipe = await recipe_service_1.recipeService.saveRecipe(noImageRecipe);
        response.status(status_code_1.StatusCode.Created).json(dbNoImageRecipe);
    }
    async generateRecipeWithImage(request, response) {
        const quantity = Number(request.params.amount);
        const inputModel = new InputModel_1.InputModel({ query: request.body.query, quantity });
        const data = await recipe_service_1.recipeService.generateInstructions(inputModel, true);
        const { fileName, url } = await recipe_service_1.recipeService.generateImage(inputModel);
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
            image: undefined,
            imageUrl: url,
            imageName: fileName
        });
        const dbFullRecipe = await recipe_service_1.recipeService.saveRecipe(fullRecipe);
        response.status(status_code_1.StatusCode.Created).json(dbFullRecipe);
    }
    async getImageFile(request, response) {
        try {
            const { fileName } = request.params;
            const imagePath = await recipe_service_1.recipeService.getImageFilePath(fileName);
            response.sendFile(imagePath);
        }
        catch (err) {
            response.status(status_code_1.StatusCode.NotFound).json({ message: "Image not found" });
        }
    }
    async deleteRecipe(request, response) {
        const id = Number(request.params.id);
        await recipe_service_1.recipeService.deleteRecipe(id);
        response.sendStatus(status_code_1.StatusCode.NoContent);
    }
}
exports.recipeController = new RecipeController();
