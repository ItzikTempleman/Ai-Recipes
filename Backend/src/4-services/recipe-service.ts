import { FullRecipeModel, RecipeTitleModel, GPTImage, GeneratedRecipeData, openai, DbRecipeRow } from "../3-models/recipe-model";
import { gptService } from "./gpt-service";
import { responseInstructions } from "./response-instructions";
import path from "path";
import { appConfig } from "../2-utils/app-config";
import fs from "fs/promises";
import { fileSaver } from "uploaded-file-saver";
import { OkPacketParams } from "mysql2";
import { dal } from "../2-utils/dal";

class RecipeService {

  public async generateInstructions(recipe: RecipeTitleModel, isWithImage: boolean): Promise<GeneratedRecipeData> {
    recipe.validate();
    const recipeTitle = responseInstructions.getQuery(recipe);
    return await gptService.getInstructions(recipeTitle, isWithImage);
  }

  public async generateImage(recipe: RecipeTitleModel): Promise<GPTImage> {
    const promptText = `High-resolution, super realistic food photo of: ${recipe.title}`;
    const result = await openai.images.generate({ model: "gpt-image-1", prompt: promptText, size: "1024x1024" });
    if (!result.data?.[0]?.b64_json) throw new Error("No image generated");
    const imageBase64 = result.data[0].b64_json;
    const imagesDir = path.join(__dirname, "..", "1-assets", "images");
    await fs.mkdir(imagesDir, { recursive: true });
    const safeTitle = recipe.title.toLowerCase()
      .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const fileName = `${safeTitle}-recipe.png`;
    await fs.writeFile(path.join(imagesDir, fileName), Buffer.from(imageBase64, "base64"));
    return { fileName, url: `${appConfig.baseImageUrl}${fileName}` };
  }

  public async getRecipes(): Promise<FullRecipeModel[]> {
    const sql = "select * from recipe";
    const rows = await dal.execute(sql) as DbRecipeRow[];

    return rows.map(row => {
      const ingredientsArr = row.ingredients
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const amountsArr = (row.amounts ?? "")
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const ingredientObjects = ingredientsArr.map((ingredient, index) => ({
        ingredient,
        amount: amountsArr[index] ?? null,
      }));

      const instructionsArr = row.instructions
        .split("|")
        .map(s => s.trim())
        .filter(Boolean);

      const titleModel = new RecipeTitleModel({ title: row.title } as RecipeTitleModel);

      return new FullRecipeModel({
        id: row.id,
        title: titleModel,
        data: { ingredients: ingredientObjects, instructions: instructionsArr },
        image: undefined,
        imageUrl: row.imageName ? appConfig.baseImageUrl + row.imageName : undefined,
        imageName: row.imageName ?? undefined,
      } as FullRecipeModel);
     }
    );
  }

  public async saveRecipe(recipe: FullRecipeModel): Promise<FullRecipeModel> {
    let imageName: string | null = null;
    if (recipe.image) { imageName = await fileSaver.add(recipe.image) } else if (recipe.imageName) { imageName = recipe.imageName };
    const title = recipe.title.title.slice(0, 60);
    const ingredients = recipe.data.ingredients.map(i => i.ingredient).join(", ").slice(0, 350);
    const instructions = recipe.data.instructions.join(" | ").slice(0, 1000);
    const amounts = recipe.data.ingredients.map(i => i.amount).join(", ").slice(0, 40);
    const sql = "insert into recipe(title, ingredients, instructions, amounts, imageName) values(?,?,?,?,?)";
    const values = [title, ingredients, instructions, amounts, imageName];
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
