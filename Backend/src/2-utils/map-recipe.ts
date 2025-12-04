import { appConfig } from "./app-config";
import { DbRecipeRow, FullRecipeModel, GeneratedRecipeData } from "../3-models/recipe-model";
import { CaloryRestrictions, DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, SugarRestriction } from "../3-models/filters";

const parseAmounts = (s?: string | null): (string | null)[] => {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map(v => (v == null ? null : String(v))) : [];
  } catch {
    return String(s)
      .replace(/^\s*\[/, "").replace(/\]\s*$/, "")
      .split(",")
      .map(x => x.trim().replace(/^"+|"+$/g, ""))
      .map(x => (x === "" || x.toLowerCase() === "null" ? null : x));
  }
};

export function mapDbRowToFullRecipe(row: DbRecipeRow): FullRecipeModel {
  const ingredients = (row.ingredients ?? "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const amounts = parseAmounts(row.amounts);
  const ingredientObjects = ingredients.map((name, i) => ({
    ingredient: name,
    amount: amounts[i] ?? null
  }));

  const instructions = (row.instructions ?? "")
    .split("|")
    .map(s => s.trim())
    .filter(Boolean);


  const data: GeneratedRecipeData = {
    title: row.title,
    amountOfServings: row.amountOfServings,
    description: row.description,
    popularity: row.popularity ?? 0,
    ingredients: ingredientObjects,
    instructions,
    totalSugar: row.totalSugar ?? 0,
    totalProtein: row.totalProtein ?? 0,
    healthLevel: row.healthLevel ?? 0,
    calories: row.calories,

    sugarRestriction: row.sugarRestriction ?? SugarRestriction.DEFAULT,
    lactoseRestrictions: row.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
    glutenRestrictions: row.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
    dietaryRestrictions: row.dietaryRestrictions ?? DietaryRestrictions.DEFAULT,
    caloryRestrictions: row.caloryRestrictions ?? CaloryRestrictions.DEFAULT,
    queryRestrictions: row.queryRestrictions ?? []
  };

  return new FullRecipeModel({
    id: row.id,
    title: row.title,
    amountOfServings: row.amountOfServings,
    description: row.description,
    popularity: row.popularity ?? 0,
    data,
    totalSugar: row.totalSugar ?? 0,
    totalProtein: row.totalProtein ?? 0,
    healthLevel: row.healthLevel ?? 0,
    calories: row.calories,
    sugarRestriction: row.sugarRestriction ?? SugarRestriction.DEFAULT,
    lactoseRestrictions: row.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
    glutenRestrictions: row.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
    dietaryRestrictions: row.dietaryRestrictions ?? DietaryRestrictions.DEFAULT,
    caloryRestrictions: row.caloryRestrictions ?? CaloryRestrictions.DEFAULT,
    queryRestrictions: row.queryRestrictions ?? [],
    imageUrl: row.imageName ? appConfig.baseImageUrl + row.imageName : "",
    imageName: row.imageName ?? undefined,
    userId: row.userId ?? undefined
  });
}
