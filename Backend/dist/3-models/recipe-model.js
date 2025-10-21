"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullRecipeModel = exports.openaiImages = exports.openaiText = void 0;
exports.isImageGenerateRequest = isImageGenerateRequest;
const joi_1 = __importDefault(require("joi"));
const client_errors_1 = require("./client-errors");
const app_config_1 = require("../2-utils/app-config");
const openai_1 = __importDefault(require("openai"));
function isImageGenerateRequest(item) {
    return item.type === "image_generation_call";
}
;
exports.openaiText = new openai_1.default({
    apiKey: app_config_1.appConfig.freeNoImageApiKey
});
exports.openaiImages = new openai_1.default({
    apiKey: app_config_1.appConfig.apiKey
});
class FullRecipeModel {
    id;
    title;
    amountOfServings;
    description;
    popularity;
    data;
    totalSugar;
    totalProtein;
    healthLevel;
    calories;
    image;
    imageUrl;
    imageName;
    constructor(recipe) {
        if (!recipe)
            throw new client_errors_1.ValidationError("Missing recipe data");
        this.id = recipe.id;
        this.title = recipe.title;
        this.amountOfServings = recipe.amountOfServings;
        this.description = recipe.description;
        this.popularity = recipe.popularity;
        this.data = recipe.data;
        this.totalSugar = recipe.totalSugar;
        this.totalProtein = recipe.totalProtein;
        this.healthLevel = recipe.healthLevel;
        this.calories = recipe.calories;
        this.image = recipe.image;
        this.imageUrl = recipe.imageUrl;
        this.imageName = recipe.imageName;
    }
    static validationSchema = joi_1.default.object({
        title: joi_1.default.string().trim().max(160).required(),
        amountOfServings: joi_1.default.number().min(1).required(),
        description: joi_1.default.string().trim().max(1000).required(),
        popularity: joi_1.default.number().integer().min(0).max(10).required(),
        totalSugar: joi_1.default.number().min(0).required(),
        totalProtein: joi_1.default.number().min(0).required(),
        healthLevel: joi_1.default.number().min(1).max(10).required(),
        calories: joi_1.default.number().min(0).required()
    });
    validate() {
        const result = FullRecipeModel.validationSchema.validate(this);
        if (result.error)
            throw new client_errors_1.ValidationError(result.error.message);
    }
}
exports.FullRecipeModel = FullRecipeModel;
