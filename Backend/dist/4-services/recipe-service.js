"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeService = void 0;
const recipe_model_1 = require("../3-models/recipe-model");
const gpt_service_1 = require("./gpt-service");
const response_instructions_1 = require("./response-instructions");
const path_1 = __importDefault(require("path"));
const app_config_1 = require("../2-utils/app-config");
const promises_1 = __importDefault(require("fs/promises"));
const uploaded_file_saver_1 = require("uploaded-file-saver");
const dal_1 = require("../2-utils/dal");
const map_recipe_1 = require("../2-utils/map-recipe");
const client_errors_1 = require("../3-models/client-errors");
class RecipeService {
    async generateInstructions(input, isWithImage) {
        input.validate();
        const recipeQuery = response_instructions_1.responseInstructions.getQuery(input);
        const data = await gpt_service_1.gptService.getInstructions(recipeQuery, isWithImage);
        return { ...data, amountOfServings: input.quantity };
    }
    async generateImage(recipe) {
        const promptText = `High-resolution, super realistic food photo of: ${recipe.query}`;
        let lastErr;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const result = await recipe_model_1.openaiImages.images.generate({
                    model: "gpt-image-1",
                    prompt: promptText,
                    size: "1024x1024"
                });
                if (!result.data?.[0]?.b64_json)
                    throw new Error("No image generated");
                const imageBase64 = result.data[0].b64_json;
                const imagesDir = path_1.default.join(__dirname, "..", "1-assets", "images");
                await promises_1.default.mkdir(imagesDir, { recursive: true });
                const safeTitle = recipe.query
                    .toLowerCase()
                    .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
                    .replace(/^-+|-+$/g, "");
                const fileName = `${safeTitle}-recipe.png`;
                await promises_1.default.writeFile(path_1.default.join(imagesDir, fileName), Buffer.from(imageBase64, "base64"));
                return { fileName, url: `${app_config_1.appConfig.baseImageUrl}${fileName}` };
            }
            catch (err) {
                console.error("OpenAI IMAGE:", err?.response?.data);
                lastErr = err;
                if (err?.response?.status === 429) {
                    const retryAfter = Number(err?.response?.headers?.["retry-after"]) || 1500; // ms
                    await new Promise((r) => setTimeout(r, retryAfter));
                    continue;
                }
                throw err;
            }
        }
        throw lastErr;
    }
    async getRecipes() {
        const sql = "select * from recipe";
        const rows = await dal_1.dal.execute(sql);
        return rows.map(map_recipe_1.mapDbRowToFullRecipe);
    }
    async getSingleRecipe(id) {
        const sql = "select * from recipe where id=?";
        const values = [id];
        const rows = await dal_1.dal.execute(sql, values);
        const row = rows[0];
        if (!row)
            throw new client_errors_1.ResourceNotFound(id);
        return (0, map_recipe_1.mapDbRowToFullRecipe)(row);
    }
    ;
    async saveRecipe(recipe) {
        let imageName = null;
        if (recipe.image) {
            imageName = await uploaded_file_saver_1.fileSaver.add(recipe.image);
        }
        else if (recipe.imageName) {
            imageName = recipe.imageName;
        }
        ;
        const title = recipe.title.slice(0, 100);
        const description = recipe.description;
        const amountOfServings = recipe.amountOfServings;
        const popularity = recipe.popularity;
        const ingredients = recipe.data.ingredients.map(i => i.ingredient).join(", ").slice(0, 350);
        const instructions = recipe.data.instructions.join(" | ").slice(0, 1000);
        const totalSugar = recipe.totalSugar;
        const totalProtein = recipe.totalProtein;
        const healthLevel = recipe.healthLevel;
        const amounts = JSON.stringify(recipe.data.ingredients.map(i => i.amount ?? null));
        const calories = recipe.calories;
        const sql = "insert into recipe(title, amountOfServings, description, popularity, ingredients, instructions, totalSugar, totalProtein, healthLevel, calories, amounts, imageName) values(?,?,?,?,?,?,?,?,?,?,?,?)";
        const values = [
            title,
            amountOfServings,
            description,
            popularity,
            ingredients,
            instructions,
            totalSugar,
            totalProtein,
            healthLevel,
            calories,
            amounts,
            imageName
        ];
        const info = await dal_1.dal.execute(sql, values);
        recipe.id = info.insertId;
        recipe.image = undefined;
        recipe.imageUrl = imageName ? app_config_1.appConfig.baseImageUrl + imageName : "";
        return recipe;
    }
    async getImageFilePath(fileName) {
        const imagePath = path_1.default.join(__dirname, "..", "1-assets", "images", fileName);
        try {
            await promises_1.default.access(imagePath);
            return imagePath;
        }
        catch {
            throw new Error("Image not found");
        }
    }
    async deleteRecipe(id) {
        const image = "select imageName from recipe where id = ?";
        const row = await dal_1.dal.execute(image, [id]);
        if (row.length === 0)
            throw new client_errors_1.ResourceNotFound(id);
        const imageToDelete = row[0].imageName;
        const sql = "delete from recipe where id = ?";
        const values = [id];
        const info = await dal_1.dal.execute(sql, values);
        if (info.affectedRows === 0)
            throw new client_errors_1.ResourceNotFound(id);
        if (imageToDelete) {
            try {
                const imagePath = await this.getImageFilePath(imageToDelete);
                await promises_1.default.unlink(imagePath);
            }
            catch (err) {
                throw new Error("Could not delete image");
            }
        }
    }
}
exports.recipeService = new RecipeService();
