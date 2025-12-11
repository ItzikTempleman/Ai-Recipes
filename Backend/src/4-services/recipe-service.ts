import { FullRecipeModel, GPTImage, GeneratedRecipeData, DbRecipeRow, openaiImages } from "../3-models/recipe-model";
import { gptService } from "./gpt-service";
import { responseInstructions } from "./response-instructions";
import path from "path";
import { appConfig } from "../2-utils/app-config";
import fs from "fs/promises";
import { fileSaver } from "uploaded-file-saver";
import { OkPacketParams } from "mysql2";
import { dal } from "../2-utils/dal";
import { mapDbRowToFullRecipe } from "../2-utils/map-recipe";
import { DangerousRequestError, ResourceNotFound, ValidationError } from "../3-models/client-errors";
import { InputModel } from "../3-models/InputModel";
import { isLethalQuery } from "../2-utils/banned-filter";

class RecipeService {

  public async generateInstructions(input: InputModel, isWithImage: boolean): Promise<GeneratedRecipeData> {

    input.validate();

    if (isLethalQuery(input.query)) {
      throw new DangerousRequestError("Recipe forbidden ☠️");
    }

    const recipeQuery = responseInstructions.getQuery(input);
    const data = await gptService.getInstructions(recipeQuery, isWithImage);
    const popularity = data.popularity ?? 0;
    const desc = (data.description ?? "").toLowerCase();

    if (popularity === 0 || desc.startsWith("fictional dish")) {
      throw new ValidationError("Non existing dish");
    }

    return { ...data, amountOfServings: input.quantity };
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
    const sugarRestriction = recipe.sugarRestriction;           // enum SugarRestriction
    const lactoseRestrictions = recipe.lactoseRestrictions;     // enum LactoseRestrictions
    const glutenRestrictions = recipe.glutenRestrictions;       // enum GlutenRestrictions
    const dietaryRestrictions = recipe.dietaryRestrictions;     // enum DietaryRestrictions
    const caloryRestrictions = recipe.caloryRestrictions;       // enum CaloryRestrictions
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
        imageName,
        userId) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
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
}

export const recipeService = new RecipeService();
