import { FullRecipeModel, GeneratedRecipeData, DbRecipeRow, DifficultyLevel } from "../models/recipe-model";
import { gptService } from "./gpt-service";
import { responseInstructions } from "./response-instructions";
import path from "path";
import { appConfig } from "../utils/app-config";
import fs from "fs/promises";
import { fileSaver } from "uploaded-file-saver";
import { OkPacketParams } from "mysql2";
import { dal } from "../utils/dal";
import { mapDbRowToFullRecipe } from "../utils/map-recipe";
import { DangerousRequestError, ResourceNotFound, ValidationError } from "../models/client-errors";
import { InputModel } from "../models/input-model";
import { isLethalQuery } from "../utils/banned-filter";
import { sanitizeQueryRestrictions, normalizeCategories } from "../utils/recipe-normalization";
import { validateRecipeSemantics } from "../utils/recipe-semantic-validator";
import { naturalizeRecipeTitle } from "../utils/title-naturalizer";
import { premiumService } from "./premium-service";

class RecipeService {
  public async generateInstructions(input: InputModel, isWithImage: boolean): Promise<GeneratedRecipeData> {
    input.validate();

    if (isLethalQuery(input.query)) {
      throw new DangerousRequestError("Recipe forbidden ☠️");
    }

    const recipeQuery = responseInstructions.getQuery(input);
    const data = await gptService.getInstructions(recipeQuery, isWithImage);

    let safePrepTime = Number(data.prepTime ?? 0);
    if (!Number.isFinite(safePrepTime) || safePrepTime < 0) safePrepTime = 0;

    const popularity = data.popularity ?? 0;
    const desc = (data.description ?? "").toLowerCase();

    if (popularity === 0 || desc.startsWith("fictional dish")) {
      throw new ValidationError("Non existing dish");
    }

    const normalized: GeneratedRecipeData = {
      ...data,
      title: naturalizeRecipeTitle(data.title),
      prepTime: safePrepTime,
      amountOfServings: input.quantity,
      queryRestrictions: sanitizeQueryRestrictions(data.queryRestrictions),
      categories: normalizeCategories(data.categories)
    };

    validateRecipeSemantics(normalized);

    return normalized;
  }

  public async setRecipeImageName(recipeId: number, userId: number, imageName: string): Promise<void> {
    const sql = "update recipe set imageName=? where id=? and userId=?";
    const values = [imageName, recipeId, userId];
    const info = await dal.execute(sql, values) as OkPacketParams;
    if (info.affectedRows === 0) throw new ResourceNotFound(recipeId);
  }

  public async getRecipes(userId: number): Promise<FullRecipeModel[]> {
    const sql = "select * from recipe where userId = ?";
    const values = [userId];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    return rows.map(mapDbRowToFullRecipe);
  }

  public async getSingleRecipe(id: number, userId: number): Promise<FullRecipeModel> {
    const sql = "select * from recipe where id=? and userId=?";
    const values = [id, userId];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    const row = rows[0];
    if (!row) throw new ResourceNotFound(id);
    return mapDbRowToFullRecipe(row);
  }

  public async getRecipePublicById(id: number): Promise<FullRecipeModel> {
    const sql = "select * from recipe where id=?";
    const values = [id];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    const row = rows[0];
    if (!row) throw new ResourceNotFound(id);
    return mapDbRowToFullRecipe(row);
  }

  public async getCatalogRecipes(lang: "en" | "he"): Promise<FullRecipeModel[]> {
    const systemUserId = await this.ensureSystemUserId();
    const sql = `
      select *
      from recipe
      where userId = ?
        and pairKey is not null
        and lang = ?
      order by pairKey asc, lang asc, id asc
      limit 50
    `;
    const values = [systemUserId, lang];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    return rows.map(mapDbRowToFullRecipe);
  }

  public async saveRecipe(recipe: FullRecipeModel, userId: number): Promise<FullRecipeModel> {
    let imageName: string | null = null;
    if (recipe.image) {
      imageName = await fileSaver.add(recipe.image);
    } else if (recipe.imageName) {
      imageName = recipe.imageName;
    }

    const normalizedQueryRestrictions = sanitizeQueryRestrictions(recipe.queryRestrictions ?? []);
    const normalizedCategories = normalizeCategories(recipe.categories ?? recipe.data?.categories ?? []);

    recipe.title = naturalizeRecipeTitle(recipe.title);

    validateRecipeSemantics({
      ...recipe,
      queryRestrictions: normalizedQueryRestrictions,
      categories: normalizedCategories
    });

    const title = String(recipe.title ?? "").slice(0, 100);
    const description = String(recipe.description ?? "");
    const amountOfServings = Number(recipe.amountOfServings ?? 1);
    const popularity = Number(recipe.popularity ?? 0);
    const ingredients = (recipe.data?.ingredients ?? []).map(i => i.ingredient).join(", ").slice(0, 350);
    const instructions = (recipe.data?.instructions ?? []).join(" | ").slice(0, 1000);
    const totalSugar = Number(recipe.totalSugar ?? 0);
    const totalProtein = Number(recipe.totalProtein ?? 0);
    const healthLevel = Number(recipe.healthLevel ?? 0);
    const amounts = JSON.stringify((recipe.data?.ingredients ?? []).map(i => i.amount ?? null));
    const calories = Number(recipe.calories ?? 0);
    const sugarRestriction = recipe.sugarRestriction;
    const lactoseRestrictions = recipe.lactoseRestrictions;
    const glutenRestrictions = recipe.glutenRestrictions;
    const dietaryRestrictions = recipe.dietaryRestrictions;
    const caloryRestrictions = recipe.caloryRestrictions;
    const prepTime = Number(recipe.prepTime ?? 0);
    const difficultyEnum = recipe.difficultyLevel ?? DifficultyLevel.MID_LEVEL;
    const difficultyLevel = DifficultyLevel[difficultyEnum];
    const countryOfOrigin = String(recipe.countryOfOrigin ?? "");
    const queryRestrictionsJson = JSON.stringify(normalizedQueryRestrictions);
    const categoriesJson = JSON.stringify(normalizedCategories);

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
        userId,
        categories
      ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

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
      userId,
      categoriesJson
    ];

    const info = await dal.execute(sql, values) as OkPacketParams;
    recipe.id = info.insertId;
    recipe.image = undefined;
    recipe.imageName = imageName ?? undefined;
    recipe.imageUrl = imageName ? appConfig.baseImageUrl + imageName : "";
    recipe.userId = userId;
    recipe.queryRestrictions = normalizedQueryRestrictions;
    recipe.categories = normalizedCategories;

    if (recipe.data) {
      recipe.data.categories = normalizedCategories;
    }

    return recipe;
  }

  public async getImageFilePath(fileName: string): Promise<string> {
    const imagesDir = process.env.IMAGE_DIR || path.join(__dirname, "..", "1-assets", "images");
    const imagePath = path.join(imagesDir, fileName);
    try {
      await fs.access(imagePath);
      return imagePath;
    } catch {
      throw new Error("Image not found");
    }
  }

  public async deleteRecipe(id: number): Promise<void> {
    const image = "select imageName from recipe where id = ?";
    const row = await dal.execute(image, [id]) as { imageName: string | null }[];
    if (row.length === 0) throw new ResourceNotFound(id);

    const imageToDelete = row[0].imageName;
    const sql = "delete from recipe where id = ?";
    const values = [id];
    const info = await dal.execute(sql, values) as OkPacketParams;
    if (info.affectedRows === 0) throw new ResourceNotFound(id);

    if (imageToDelete) {
      const imagePath = await this.getImageFilePath(imageToDelete);
      await fs.unlink(imagePath);
    }
  }

  public async isRecipeLikedByUser(userId: number, recipeId: number): Promise<boolean> {
    const sql = "select 1 from likes where userId=? and recipeId=? limit 1";
    const rows = await dal.execute(sql, [userId, recipeId]) as any[];
    return rows.length > 0;
  }

  public async getLikedRecipes(): Promise<FullRecipeModel[]> {
    const sql = "select distinct recipe.* from recipe join likes l on recipe.id = l.recipeId";
    const recipes = await dal.execute(sql) as DbRecipeRow[];
    return recipes.map(mapDbRowToFullRecipe);
  }

  public async getRecipesTotalLikeCount(recipeId: number): Promise<number> {
    const sql = "select count(*) as l from likes where recipeId=?";
    const values = [recipeId];
    const totalRecipes = await dal.execute(sql, values) as { l: number }[];
    return totalRecipes.length > 0 ? totalRecipes[0].l : 0;
  }

  public async getLikedRecipeIdsByUser(userId: number): Promise<number[]> {
    const sql = "select recipeId from likes where userId=?";
    const rows = await dal.execute(sql, [userId]) as { recipeId: number }[];
    return rows.map(r => r.recipeId);
  }

  private async isLikedRecipe(userId: number, recipeId: number): Promise<boolean> {
    const sql = "select userId, recipeId from likes where userId=? and recipeId=? limit 1";
    const values = [userId, recipeId];
    type LikeRow = { userId: number; recipeId: number };
    const match = await dal.execute(sql, values) as LikeRow[];
    return match.length === 1;
  }

  public async likeRecipe(userId: number, recipeId: number): Promise<boolean> {
    if (await this.isLikedRecipe(userId, recipeId)) return false;
    const sql = "insert into likes(userId, recipeId) values (?,?)";
    const values = [userId, recipeId];
    const info = await dal.execute(sql, values) as OkPacketParams;
    return info.affectedRows === 1;
  }

  public async unlikeRecipe(userId: number, recipeId: number): Promise<boolean> {
    const sql = "delete from likes where userId=? and recipeId=? limit 1";
    const values = [userId, recipeId];
    const result = await dal.execute(sql, values) as OkPacketParams;
    return result.affectedRows === 1;
  }

  public async getLikedRecipesByUserId(userId: number): Promise<FullRecipeModel[]> {
    const sql = "select r.* from recipe r inner join likes l on l.recipeId=r.id where l.userId=?";
    const values = [userId];
    const likedRecipes = await dal.execute(sql, values) as DbRecipeRow[];
    return likedRecipes.map(mapDbRowToFullRecipe);
  }

  public async askAboutRecipe(
    recipeId: number,
    userId: number,
    query: string,
    history: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<{ answer: string; updatedRecipe?: FullRecipeModel }> {
    let ownedRecipe: FullRecipeModel | null = null;

    try {
      ownedRecipe = await this.getSingleRecipe(recipeId, userId);
    } catch {
      ownedRecipe = null;
    }

    const recipe = ownedRecipe ?? await this.getRecipePublicById(recipeId);

    const recipeContext = {
      title: recipe.title,
      description: recipe.description,
      amountOfServings: recipe.amountOfServings,
      ingredients: recipe.data?.ingredients ?? [],
      instructions: recipe.data?.instructions ?? [],
      restrictions: {
        sugarRestriction: recipe.sugarRestriction,
        lactoseRestrictions: recipe.lactoseRestrictions,
        glutenRestrictions: recipe.glutenRestrictions,
        dietaryRestrictions: recipe.dietaryRestrictions,
        caloryRestrictions: recipe.caloryRestrictions,
        queryRestrictions: recipe.queryRestrictions ?? []
      }
    };

    const canEdit = !!ownedRecipe && await premiumService.isUserPremium(userId);

    const result = await gptService.askRecipeQuestionOrEdit(
      recipeContext,
      query,
      history,
      canEdit
    );

    if (result.mode === "answer") {
      return { answer: result.answer };
    }

    if (!ownedRecipe) {
      throw new ValidationError("Only your own generated recipes can be edited in chat.");
    }

    const updatedRecipe = await this.updateExistingGeneratedRecipe(recipeId, userId, result.recipe);

    return {
      answer: result.answer,
      updatedRecipe
    };
  }

  private async updateExistingGeneratedRecipe(
    recipeId: number,
    userId: number,
    patch: {
      title: string;
      description: string;
      amountOfServings: number;
      ingredients: { ingredient: string; amount: string | null }[];
      instructions: string[];
    }
  ): Promise<FullRecipeModel> {
    const existing = await this.getSingleRecipe(recipeId, userId);

    const title = String(patch.title ?? existing.title).trim().slice(0, 100);
    const description = String(patch.description ?? existing.description ?? "").trim();

    let amountOfServings = Number(patch.amountOfServings ?? existing.amountOfServings ?? 1);
    if (!Number.isFinite(amountOfServings) || amountOfServings <= 0) {
      amountOfServings = Number(existing.amountOfServings ?? 1) || 1;
    }

    const rawIngredientsList = Array.isArray(patch.ingredients)
      ? patch.ingredients
      : (existing.data?.ingredients ?? []);

    const rawInstructionsList = Array.isArray(patch.instructions)
      ? patch.instructions
      : (existing.data?.instructions ?? []);

    const ingredientsList = rawIngredientsList
      .map(i => ({
        ingredient: String(i?.ingredient ?? "").trim().slice(0, 80),
        amount: i?.amount == null ? null : String(i.amount).trim().slice(0, 60)
      }))
      .filter(i => i.ingredient.length > 0)
      .slice(0, 20);

    const fallbackIngredientsList = (existing.data?.ingredients ?? []).map(i => ({
      ingredient: String(i?.ingredient ?? "").trim().slice(0, 80),
      amount: i?.amount == null ? null : String(i.amount).trim().slice(0, 60)
    }));

    const safeIngredientsList = ingredientsList.length > 0 ? ingredientsList : fallbackIngredientsList;

    const instructionsList = rawInstructionsList
      .map(s => String(s ?? "").trim())
      .filter(Boolean)
      .slice(0, 8)
      .map(s => (s.length > 140 ? s.slice(0, 140).trim() : s));

    const fallbackInstructionsList = (existing.data?.instructions ?? [])
      .map(s => String(s ?? "").trim())
      .filter(Boolean)
      .slice(0, 8)
      .map(s => (s.length > 140 ? s.slice(0, 140).trim() : s));

    const safeInstructionsList =
      instructionsList.length > 0 ? instructionsList : fallbackInstructionsList;

    const ingredients = safeIngredientsList
      .map(i => i.ingredient)
      .join(", ")
      .slice(0, 350);

    const amounts = JSON.stringify(
      safeIngredientsList.map(i => i.amount ?? null)
    ).slice(0, 1000);

    const instructions = safeInstructionsList
      .join(" | ")
      .slice(0, 1000);

    const sql = `
      UPDATE recipe
      SET
        title = ?,
        description = ?,
        amountOfServings = ?,
        ingredients = ?,
        amounts = ?,
        instructions = ?,
        imageName = NULL
      WHERE id = ? AND userId = ?
    `;

    await dal.execute(sql, [
      title,
      description,
      amountOfServings,
      ingredients,
      amounts,
      instructions,
      recipeId,
      userId
    ]);

    const updated = await this.getSingleRecipe(recipeId, userId);
    updated.imageName = null;
    updated.imageUrl = "";

    return updated;
  }

  private async ensureSystemUserId(): Promise<number> {
    const email = "system.generator@smart-recipes.local";
    const sql = `insert into user (firstName, familyName, email, password)
                 values (?, ?, ?, ?)
                 on duplicate key update id = LAST_INSERT_ID(id)`;
    const values = ["System", "Generator", email, "SYSTEM_GENERATED_NO_LOGIN"];
    const result = (await dal.execute(sql, values)) as { insertId: number };
    return result.insertId;
  }

  public async saveSuggestionRecipe(
    recipe: any,
    lang: "en" | "he",
    pairKey: string
  ): Promise<void> {
    const ingredientsArr =
      recipe?.ingredients ??
      recipe?.data?.ingredients ??
      [];

    const instructionsArr =
      recipe?.instructions ??
      recipe?.data?.instructions ??
      [];

    if (!Array.isArray(ingredientsArr) || ingredientsArr.length === 0) {
      throw new Error(
        `saveCatalogRecipe: recipe has no ingredients array. Keys: ${Object.keys(recipe ?? {}).join(", ")}`
      );
    }

    if (!Array.isArray(instructionsArr) || instructionsArr.length === 0) {
      throw new Error(
        `saveCatalogRecipe: recipe has no instructions array. Keys: ${Object.keys(recipe ?? {}).join(", ")}`
      );
    }

    const systemUserId = await this.ensureSystemUserId();

    const normalizedQueryRestrictions = sanitizeQueryRestrictions(recipe.queryRestrictions ?? []);
    const normalizedCategories = normalizeCategories(recipe.categories ?? recipe.data?.categories ?? []);

    recipe.title = naturalizeRecipeTitle(recipe.title);

    validateRecipeSemantics({
      ...recipe,
      queryRestrictions: normalizedQueryRestrictions,
      categories: normalizedCategories
    });

    const title = String(recipe.title ?? "").slice(0, 100);
    const description = String(recipe.description ?? "");
    const amountOfServings = Number(recipe.amountOfServings ?? recipe.amountOfServing ?? 1);
    const popularity = Number(recipe.popularity ?? 5);

    const ingredients = ingredientsArr
      .map((i: any) => String(i?.ingredient ?? "").trim())
      .filter(Boolean)
      .join(", ")
      .slice(0, 350);

    const instructions = instructionsArr
      .map((s: any) => String(s ?? "").trim())
      .filter(Boolean)
      .join(" | ")
      .slice(0, 1000);

    const amounts = JSON.stringify(
      ingredientsArr.map((i: any) => (i?.amount ?? null))
    );

    const totalSugar = Number(recipe.totalSugar ?? 0);
    const totalProtein = Number(recipe.totalProtein ?? 0);
    const healthLevel = Number(recipe.healthLevel ?? 0);
    const calories = Number(recipe.calories ?? 0);

    const sugarRestriction = Number(recipe.sugarRestriction ?? 0);
    const lactoseRestrictions = Number(recipe.lactoseRestrictions ?? 0);
    const glutenRestrictions = Number(recipe.glutenRestrictions ?? 0);
    const dietaryRestrictions = Number(recipe.dietaryRestrictions ?? 0);
    const caloryRestrictions = Number(recipe.caloryRestrictions ?? 0);

    const prepTime = Number(recipe.prepTime ?? 0);
    const difficultyLevel = String(recipe.difficultyLevel ?? "MID_LEVEL");
    const countryOfOrigin = String(recipe.countryOfOrigin ?? "");

    const queryRestrictionsJson = JSON.stringify(normalizedQueryRestrictions);
    const categoriesJson = JSON.stringify(normalizedCategories);
    const imageName = recipe.imageName ?? null;

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
      userId,
      lang,
      pairKey,
      categories
    ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

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
      systemUserId,
      lang,
      pairKey,
      categoriesJson
    ];

    await dal.execute(sql, values);
  }
}

export const recipeService = new RecipeService();