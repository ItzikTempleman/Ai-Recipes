import { DbRecipeRow, FullRecipeModel } from "../3-models/recipe-model";
import { appConfig } from "./app-config";

export function mapDbRowToFullRecipe(row: DbRecipeRow): FullRecipeModel {
  const ingredientsArr = (row.ingredients ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const amountsArr = (row.amounts ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const ingredientObjects = ingredientsArr.map((ingredient, index) => ({
    ingredient,
    amount: amountsArr[index] ?? null,
  }));

  const instructionsArr = (row.instructions ?? "")
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  return new FullRecipeModel({
    id: row.id,
    title: row.title,
    data: { ingredients: ingredientObjects, instructions: instructionsArr },
    calories: row.calories,
    image: undefined,
    imageUrl: row.imageName ? appConfig.baseImageUrl + row.imageName : "",
    imageName: row.imageName ?? undefined,
  } as FullRecipeModel);
}