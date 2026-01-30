"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gptService = void 0;
const axios_1 = __importDefault(require("axios"));
const app_config_1 = require("../2-utils/app-config");
class GptService {
    async getInstructions(query, isWithImage) {
        const modelToUse = app_config_1.appConfig.modelNumber;
        const keyToUse = isWithImage ? app_config_1.appConfig.apiKey : app_config_1.appConfig.freeNoImageApiKey;
        const body = {
            model: modelToUse,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: query.systemCommandDescription },
                { role: "user", content: query.userCommandDescription }
            ],
        };
        const response = await axios_1.default.post(app_config_1.appConfig.gptUrl, body, {
            headers: {
                Authorization: "Bearer " + keyToUse,
                "Content-Type": "application/json"
            }
        });
        const content = response.data.choices[0].message.content;
        const formattedResponse = JSON.parse(content);
        const title = formattedResponse?.title?.trim();
        const amountOfServings = formattedResponse?.amountOfServings;
        const description = formattedResponse?.description;
        const popularity = formattedResponse?.popularity;
        const ingredients = formattedResponse?.ingredients;
        const instructions = formattedResponse?.instructions;
        const totalSugar = formattedResponse?.totalSugar;
        const totalProtein = formattedResponse?.totalProtein;
        const healthLevel = formattedResponse?.healthLevel;
        const calories = Number(formattedResponse?.calories);
        const sugarRestriction = formattedResponse.sugarRestriction;
        const lactoseRestrictions = formattedResponse.lactoseRestrictions;
        const glutenRestrictions = formattedResponse.glutenRestrictions;
        const dietaryRestrictions = formattedResponse.dietaryRestrictions;
        const caloryRestrictions = formattedResponse.caloryRestrictions;
        const queryRestrictions = formattedResponse.queryRestrictions;
        const prepTime = formattedResponse.prepTime;
        const difficultyLevel = formattedResponse.difficultyLevel;
        const countryOfOrigin = formattedResponse.countryOfOrigin;
        if (!title ||
            !Array.isArray(ingredients) ||
            !Array.isArray(instructions) ||
            !Number.isFinite(calories)) {
            throw new Error("Invalid recipe JSON");
        }
        return {
            title,
            amountOfServings,
            description,
            popularity,
            ingredients,
            instructions,
            totalSugar,
            totalProtein,
            healthLevel,
            calories: Math.max(0, Math.round(calories)),
            sugarRestriction,
            lactoseRestrictions,
            glutenRestrictions,
            dietaryRestrictions,
            caloryRestrictions,
            queryRestrictions,
            prepTime,
            difficultyLevel,
            countryOfOrigin
        };
    }
}
exports.gptService = new GptService();
