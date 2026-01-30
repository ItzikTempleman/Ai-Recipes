"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDbRowToFullRecipe = mapDbRowToFullRecipe;
const app_config_1 = require("./app-config");
const recipe_model_1 = require("../models/recipe-model");
const filters_1 = require("../models/filters");
const parseAmounts = (s) => {
    if (!s)
        return [];
    try {
        const a = JSON.parse(s);
        return Array.isArray(a) ? a.map((v) => (v == null ? null : String(v))) : [];
    }
    catch {
        return String(s)
            .replace(/^\s*\[/, "")
            .replace(/\]\s*$/, "")
            .split(",")
            .map((x) => x.trim().replace(/^"+|"+$/g, ""))
            .map((x) => (x === "" || x.toLowerCase() === "null" ? null : x));
    }
};
const parseQueryRestrictions = (v) => {
    if (v == null)
        return [];
    if (Array.isArray(v))
        return v;
    if (typeof v === "string") {
        const s = v.trim();
        if (!s)
            return [];
        try {
            const parsed = JSON.parse(s);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
const toDifficultyEnum = (v) => {
    if (typeof v === "string") {
        const key = v;
        return recipe_model_1.DifficultyLevel[key] ?? recipe_model_1.DifficultyLevel.DEFAULT;
    }
    if (typeof v === "number")
        return v;
    return recipe_model_1.DifficultyLevel.DEFAULT;
};
function mapDbRowToFullRecipe(row) {
    const ingredients = (row.ingredients ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const amounts = parseAmounts(row.amounts);
    const ingredientObjects = ingredients.map((name, i) => ({
        ingredient: name,
        amount: amounts[i] ?? null,
    }));
    const instructions = (row.instructions ?? "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
    const difficultyEnum = toDifficultyEnum(row.difficultyLevel);
    const queryRestrictions = parseQueryRestrictions(row.queryRestrictions);
    const data = {
        ingredients: ingredientObjects,
        instructions,
    };
    return new recipe_model_1.FullRecipeModel({
        id: row.id,
        title: row.title,
        amountOfServings: row.amountOfServings,
        description: row.description,
        popularity: row.popularity ?? 0,
        data,
        totalSugar: row.totalSugar ?? 0,
        totalProtein: row.totalProtein ?? 0,
        healthLevel: row.healthLevel ?? 0,
        calories: row.calories ?? 0,
        sugarRestriction: row.sugarRestriction ?? filters_1.SugarRestriction.DEFAULT,
        lactoseRestrictions: row.lactoseRestrictions ?? filters_1.LactoseRestrictions.DEFAULT,
        glutenRestrictions: row.glutenRestrictions ?? filters_1.GlutenRestrictions.DEFAULT,
        dietaryRestrictions: row.dietaryRestrictions ?? filters_1.DietaryRestrictions.DEFAULT,
        caloryRestrictions: row.caloryRestrictions ?? filters_1.CaloryRestrictions.DEFAULT,
        queryRestrictions,
        prepTime: row.prepTime ?? 0,
        difficultyLevel: difficultyEnum,
        countryOfOrigin: row.countryOfOrigin ?? "",
        imageUrl: row.imageName ? app_config_1.appConfig.baseImageUrl + row.imageName : "",
        imageName: row.imageName ?? undefined,
        userId: row.userId ?? undefined,
    });
}
