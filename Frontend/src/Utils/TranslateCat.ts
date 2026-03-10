import { RecipeCategory } from "../Models/RecipeModel";



export const ALL_RECIPE_CATEGORIES: RecipeCategory[] = [
    RecipeCategory.breakfast,
    RecipeCategory.lunch,
    RecipeCategory.supper,
    RecipeCategory.deserts,
    RecipeCategory.dairy,
    RecipeCategory.vegan,
    RecipeCategory.fish,
    RecipeCategory.meat,
];

const hebrewCategoryMap = {
    breakfast: "בוקר",
    lunch: "צהריים",
    supper: "ערב",
    deserts: "קינוחים",
    dairy: "חלבי",
    vegan: "טבעוני",
    fish: "דגים",
    meat: "בשרי",
};

export function normalizeAppLanguage(language?: string): "en" | "he" {
    return (language ?? "").startsWith("he") ? "he" : "en";
}

export function translateRecipeCategory( category: RecipeCategory | string,language: "en" | "he"
): string {
  const key = String(category) as keyof typeof hebrewCategoryMap;

  if (language === "he") {
    return hebrewCategoryMap[key] || String(category);
  }

  return String(category);
}