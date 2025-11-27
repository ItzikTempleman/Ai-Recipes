import { DbRecipeRow, FullRecipeModel } from "../3-models/recipe-model";
import { appConfig } from "./app-config";

const parseAmounts = (s?: string | null): (string | null)[] => {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(v => (v == null ? null : String(v))) : [];
  } catch {

    return String(s)
      .replace(/^\s*\[/, "").replace(/\]\s*$/, "")
      .split(",").map(x => x.trim().replace(/^"+|"+$/g, ""))
      .map(x => (x === "" || x.toLowerCase() === "null" ? null : x));
  }
};

export function mapDbRowToFullRecipe(row: DbRecipeRow): FullRecipeModel {
  const ingredients = (row.ingredients ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const amounts = parseAmounts(row.amounts);
  const ingredientObjects = ingredients.map((name, i) => ({ ingredient: name, amount: amounts[i] ?? null }));
  const instructions = (row.instructions ?? "").split("|").map(s => s.trim()).filter(Boolean);

  return new FullRecipeModel({
    id: row.id,
    amountOfServings:row.amountOfServings,
    title: row.title,
    description: row.description,
    popularity: row.popularity,
    data: { ingredients: ingredientObjects, instructions },
    totalSugar: row.totalSugar,
    totalProtein: row.totalProtein,
    healthLevel: row.healthLevel,
    calories: row.calories,
    imageUrl: row.imageName ? appConfig.baseImageUrl + row.imageName : "",
    imageName: row.imageName ?? undefined,
    userId: row.userId ?? undefined  
  } as FullRecipeModel);
}