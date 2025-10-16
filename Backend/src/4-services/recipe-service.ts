import { FullRecipeModel, RecipeQueryModel, GPTImage, GeneratedRecipeData, DbRecipeRow, openaiImages } from "../3-models/recipe-model";
import { gptService } from "./gpt-service";
import { responseInstructions } from "./response-instructions";
import path from "path";
import { appConfig } from "../2-utils/app-config";
import fs from "fs/promises";
import { fileSaver } from "uploaded-file-saver";
import { OkPacketParams } from "mysql2";
import { dal } from "../2-utils/dal";
import { mapDbRowToFullRecipe } from "../2-utils/map-recipe";
import { ResourceNotFound } from "../3-models/client-errors";

class RecipeService {

  public async generateInstructions(query: RecipeQueryModel, isWithImage: boolean): Promise<GeneratedRecipeData> {
    query.validate();
    const recipeTitle = responseInstructions.getQuery(query);
    return await gptService.getInstructions(recipeTitle, isWithImage);
  }

  public async generateImage(recipe: RecipeQueryModel): Promise<GPTImage> {
    const promptText = `High-resolution, super realistic food photo of: ${recipe.query}`;

    let lastErr: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await openaiImages.images.generate({
          model: "gpt-image-1",
          prompt: promptText,
          size: "1024x1024"
        });

        if (!result.data?.[0]?.b64_json) throw new Error("No image generated");

        const imageBase64 = result.data[0].b64_json;
        const imagesDir = path.join(__dirname, "..", "1-assets", "images");
        await fs.mkdir(imagesDir, { recursive: true });

        const safeTitle = recipe.query
          .toLowerCase()
          .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
          .replace(/^-+|-+$/g, "");

        const fileName = `${safeTitle}-recipe.png`;
        await fs.writeFile(
          path.join(imagesDir, fileName),
          Buffer.from(imageBase64, "base64")
        );

        return { fileName, url: `${appConfig.baseImageUrl}${fileName}` };
      } catch (err: any) {
        console.error("OpenAI IMAGE:", err?.response?.data);
        lastErr = err;

        if (err?.response?.status === 429) {
          const retryAfter =
            Number(err?.response?.headers?.["retry-after"]) || 1500; // ms
          await new Promise((r) => setTimeout(r, retryAfter));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  public async getRecipes(): Promise<FullRecipeModel[]> {
    const sql = "select * from recipe";
    const rows = await dal.execute(sql) as DbRecipeRow[];
    return rows.map(mapDbRowToFullRecipe);
  }

    public async getSingleRecipe(id: number): Promise<FullRecipeModel> {
    const sql = "select * from recipe where id=?";
    const values = [id];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    const row = rows[0];
    if (!row) throw new ResourceNotFound(id);
    return mapDbRowToFullRecipe(row);
  };

  public async saveRecipe(recipe: FullRecipeModel): Promise<FullRecipeModel> {
    let imageName: string | null = null;
    if (recipe.image) { imageName = await fileSaver.add(recipe.image) } else if (recipe.imageName) { imageName = recipe.imageName };
    const title = recipe.title.slice(0, 100);
    const ingredients = recipe.data.ingredients.map(i => i.ingredient).join(", ").slice(0, 350);
    const instructions = recipe.data.instructions.join(" | ").slice(0, 1000);
    const amounts = recipe.data.ingredients.map(i => i.amount).join(", ").slice(0, 40);
    const calories = recipe.calories;
    const sql = "insert into recipe(title, ingredients, instructions,calories, amounts, imageName) values(?,?,?,?,?,?)";
    const values = [title, ingredients, instructions, calories, amounts, imageName];
    const info: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
    recipe.id = info.insertId;
    recipe.image = undefined;
    recipe.imageUrl = imageName ? appConfig.baseImageUrl + imageName : "";
    return recipe;
  }

  public async getImageFilePath(fileName: string): Promise<string> {
    const imagePath = path.join(__dirname, "..", "1-assets", "images", fileName);
    try {
      await fs.access(imagePath);
      return imagePath;
    } catch {
      throw new Error("Image not found");
    }
  }
}

export const recipeService = new RecipeService();
