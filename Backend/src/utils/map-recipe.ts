import { appConfig } from "./app-config";
import {DbRecipeRow, DifficultyLevel,FullRecipeModel,GeneratedRecipeData,} from "../models/recipe-model";
import { CaloryRestrictions,DietaryRestrictions, GlutenRestrictions, LactoseRestrictions, SugarRestriction} from "../models/filters";

const parseAmounts = (s?: string | null): (string | null)[] => {
  if (!s) return [];
  try {
    const a = JSON.parse(s);
    return Array.isArray(a) ? a.map((v) => (v == null ? null : String(v))) : [];
  } catch {
    return String(s)
      .replace(/^\s*\[/, "")
      .replace(/\]\s*$/, "")
      .split(",")
      .map((x) => x.trim().replace(/^"+|"+$/g, ""))
      .map((x) => (x === "" || x.toLowerCase() === "null" ? null : x));
  }
};
const parseQueryRestrictions = (v: unknown): unknown[] => {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    if (!s) return [];
    try {
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return[];
};
const toDifficultyEnum = (v: unknown): DifficultyLevel => {
  if (typeof v === "string") {
    const key = v as keyof typeof DifficultyLevel;
    return DifficultyLevel[key] ?? DifficultyLevel.DEFAULT;
  }
  if (typeof v === "number") return v as DifficultyLevel;
  return DifficultyLevel.DEFAULT;
};
export function mapDbRowToFullRecipe(row: DbRecipeRow): FullRecipeModel {
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
  const data: GeneratedRecipeData = {
    ingredients: ingredientObjects,
    instructions,
  } as GeneratedRecipeData;
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
    calories: row.calories ?? 0,
    sugarRestriction: row.sugarRestriction ?? SugarRestriction.DEFAULT,
    lactoseRestrictions: row.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
    glutenRestrictions: row.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
    dietaryRestrictions: row.dietaryRestrictions ?? DietaryRestrictions.DEFAULT,
    caloryRestrictions: row.caloryRestrictions ?? CaloryRestrictions.DEFAULT,
    queryRestrictions,
    prepTime: row.prepTime ?? 0,
    difficultyLevel: difficultyEnum,
    countryOfOrigin: row.countryOfOrigin ?? "",
    imageUrl: row.imageName ? appConfig.baseImageUrl + row.imageName : "",
    imageName: row.imageName ?? undefined,
    userId: row.userId ?? undefined,
  });
}