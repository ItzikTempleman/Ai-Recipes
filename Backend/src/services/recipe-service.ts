import { FullRecipeModel, GPTImage, GeneratedRecipeData, DbRecipeRow, openaiImages, DifficultyLevel } from "../models/recipe-model";
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
    return { ...data, amountOfServings: input.quantity };
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
  };


  public async getRecipePublicById(id: number): Promise<FullRecipeModel> {
    const sql = "select * from recipe where id=?";
    const values = [id];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    const row = rows[0];
    if (!row) throw new ResourceNotFound(id);
    return mapDbRowToFullRecipe(row);
  };

  
  public async saveRecipe(recipe: FullRecipeModel, userId: number): Promise<FullRecipeModel> {
    let imageName: string | null = null;
    if (recipe.image) { imageName = await fileSaver.add(recipe.image) } else if (recipe.imageName) { imageName = recipe.imageName };
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
    const difficultyEnum = recipe.difficultyLevel ?? DifficultyLevel.MID_LEVEL;
    const difficultyLevel = DifficultyLevel[difficultyEnum];
    const countryOfOrigin = recipe.countryOfOrigin ?? "";
    const queryRestrictionsJson = JSON.stringify(
      recipe.queryRestrictions ?? []
    );

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
    const info: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
    recipe.id = info.insertId;
    recipe.image = undefined;
    recipe.imageUrl = imageName ? appConfig.baseImageUrl + imageName : "";
    recipe.userId = userId;
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
    const info: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
    if (info.affectedRows === 0) throw new ResourceNotFound(id);

    if (imageToDelete) {
      try {
        const imagePath = await this.getImageFilePath(imageToDelete);
        await fs.unlink(imagePath);
      } catch (err) {
        throw new Error("Could not delete image");
      }
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
    type likes = { userId: number, recipeId: number };
    const match = await dal.execute(sql, values) as likes[];
    return match.length === 1
  }

  public async likeRecipe(userId: number, recipeId: number): Promise<boolean> {
    if (await this.isLikedRecipe(userId, recipeId)) return false;
    const sql = "insert into likes(userId, recipeId) values (?,?)";
    const values = [userId, recipeId];
    const info: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
    return info.affectedRows === 1;
  }

  public async unlikeRecipe(userId: number, recipeId: number): Promise<boolean> {
    const sql = "delete from likes where userId=? and recipeId=? limit 1";
    const values = [userId, recipeId];
    const result: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
    return result.affectedRows === 1;
  }

  public async getLikedRecipesByUserId(userId: number): Promise<FullRecipeModel[]> {
    const sql = "select r.* from recipe r inner join likes l on l.recipeId=r.id where l.userId=?"
    const values = [userId];
    const likedRecipes = await dal.execute(sql, values) as DbRecipeRow[];
    return likedRecipes.map(mapDbRowToFullRecipe);
  }


public async askAboutRecipe(
  recipeId: number,
  userId: number,
  query: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const recipe = await this.getSingleRecipe(recipeId, userId);

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

  return await gptService.askRecipeQuestion(recipeContext, query, history);
}


}
export const recipeService = new RecipeService();