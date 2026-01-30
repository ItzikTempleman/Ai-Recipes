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
const banned_filter_1 = require("../2-utils/banned-filter");
class RecipeService {
    async generateInstructions(input, isWithImage) {
        input.validate();
        if ((0, banned_filter_1.isLethalQuery)(input.query)) {
            throw new client_errors_1.DangerousRequestError("Recipe forbidden ☠️");
        }
        const recipeQuery = response_instructions_1.responseInstructions.getQuery(input);
        const data = await gpt_service_1.gptService.getInstructions(recipeQuery, isWithImage);
        let safePrepTime = Number(data.prepTime ?? 0);
        if (!Number.isFinite(safePrepTime) || safePrepTime < 0)
            safePrepTime = 0;
        const popularity = data.popularity ?? 0;
        const desc = (data.description ?? "").toLowerCase();
        if (popularity === 0 || desc.startsWith("fictional dish")) {
            throw new client_errors_1.ValidationError("Non existing dish");
        }
        return { ...data, amountOfServings: input.quantity };
    }
    async setRecipeImageName(recipeId, userId, imageName) {
        const sql = "update recipe set imageName=? where id=? and userId=?";
        const values = [imageName, recipeId, userId];
        const info = await dal_1.dal.execute(sql, values);
        if (info.affectedRows === 0)
            throw new client_errors_1.ResourceNotFound(recipeId);
    }
    async getRecipes(userId) {
        const sql = "select * from recipe where userId = ?";
        const values = [userId];
        const rows = await dal_1.dal.execute(sql, values);
        return rows.map(map_recipe_1.mapDbRowToFullRecipe);
    }
    async getSingleRecipe(id, userId) {
        const sql = "select * from recipe where id=? and userId=?";
        const values = [id, userId];
        const rows = await dal_1.dal.execute(sql, values);
        const row = rows[0];
        if (!row)
            throw new client_errors_1.ResourceNotFound(id);
        return (0, map_recipe_1.mapDbRowToFullRecipe)(row);
    }
    ;
    async getRecipePublicById(id) {
        const sql = "select * from recipe where id=?";
        const values = [id];
        const rows = await dal_1.dal.execute(sql, values);
        const row = rows[0];
        if (!row)
            throw new client_errors_1.ResourceNotFound(id);
        return (0, map_recipe_1.mapDbRowToFullRecipe)(row);
    }
    ;
    async saveRecipe(recipe, userId) {
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
        const sugarRestriction = recipe.sugarRestriction;
        const lactoseRestrictions = recipe.lactoseRestrictions;
        const glutenRestrictions = recipe.glutenRestrictions;
        const dietaryRestrictions = recipe.dietaryRestrictions;
        const caloryRestrictions = recipe.caloryRestrictions;
        const prepTime = recipe.prepTime ?? 0;
        const difficultyEnum = recipe.difficultyLevel ?? recipe_model_1.DifficultyLevel.MID_LEVEL;
        const difficultyLevel = recipe_model_1.DifficultyLevel[difficultyEnum];
        const countryOfOrigin = recipe.countryOfOrigin ?? "";
        const queryRestrictionsJson = JSON.stringify(recipe.queryRestrictions ?? []);
        const sql = `insert into recipe(
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
        sugarRestriction,
        lactoseRestrictions,
        glutenRestrictions,
        dietaryRestrictions,
        caloryRestrictions,
        queryRestrictions,
        prepTime,
        difficultyLevel,
        countryOfOrigin,
        imageName,
        userId) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        `;
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
            sugarRestriction,
            lactoseRestrictions,
            glutenRestrictions,
            dietaryRestrictions,
            caloryRestrictions,
            queryRestrictionsJson,
            prepTime,
            difficultyLevel,
            countryOfOrigin,
            imageName,
            userId
        ];
        const info = await dal_1.dal.execute(sql, values);
        recipe.id = info.insertId;
        recipe.image = undefined;
        recipe.imageUrl = imageName ? app_config_1.appConfig.baseImageUrl + imageName : "";
        recipe.userId = userId;
        return recipe;
    }
    async getImageFilePath(fileName) {
        const imagesDir = process.env.IMAGE_DIR || path_1.default.join(__dirname, "..", "1-assets", "images");
        const imagePath = path_1.default.join(imagesDir, fileName);
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
    async isRecipeLikedByUser(userId, recipeId) {
        const sql = "select 1 from likes where userId=? and recipeId=? limit 1";
        const rows = await dal_1.dal.execute(sql, [userId, recipeId]);
        return rows.length > 0;
    }
    async getLikedRecipes() {
        const sql = "select distinct recipe.* from recipe join likes l on recipe.id = l.recipeId";
        const recipes = await dal_1.dal.execute(sql);
        return recipes.map(map_recipe_1.mapDbRowToFullRecipe);
    }
    async getRecipesTotalLikeCount(recipeId) {
        const sql = "select count(*) as l from likes where recipeId=?";
        const values = [recipeId];
        const totalRecipes = await dal_1.dal.execute(sql, values);
        return totalRecipes.length > 0 ? totalRecipes[0].l : 0;
    }
    async getLikedRecipeIdsByUser(userId) {
        const sql = "select recipeId from likes where userId=?";
        const rows = await dal_1.dal.execute(sql, [userId]);
        return rows.map(r => r.recipeId);
    }
    async isLikedRecipe(userId, recipeId) {
        const sql = "select userId, recipeId from likes where userId=? and recipeId=? limit 1";
        const values = [userId, recipeId];
        const match = await dal_1.dal.execute(sql, values);
        return match.length === 1;
    }
    async likeRecipe(userId, recipeId) {
        if (await this.isLikedRecipe(userId, recipeId))
            return false;
        const sql = "insert into likes(userId, recipeId) values (?,?)";
        const values = [userId, recipeId];
        const info = await dal_1.dal.execute(sql, values);
        return info.affectedRows === 1;
    }
    async unlikeRecipe(userId, recipeId) {
        const sql = "delete from likes where userId=? and recipeId=? limit 1";
        const values = [userId, recipeId];
        const result = await dal_1.dal.execute(sql, values);
        return result.affectedRows === 1;
    }
    async getLikedRecipesByUserId(userId) {
        const sql = "select r.* from recipe r inner join likes l on l.recipeId=r.id where l.userId=?";
        const values = [userId];
        const likedRecipes = await dal_1.dal.execute(sql, values);
        return likedRecipes.map(map_recipe_1.mapDbRowToFullRecipe);
    }
}
exports.recipeService = new RecipeService();
