import { ValidationError } from "../models/client-errors";
import { DietaryRestrictions } from "../models/filters";
import { RecipeCategory } from "../models/recipe-model";
import { normalizeCategories } from "./recipe-normalization";

function collectRecipeText(recipeLike: any): string {
  const title = String(recipeLike?.title ?? "");
  const description = String(recipeLike?.description ?? "");

  const ingredients = Array.isArray(recipeLike?.ingredients)
    ? recipeLike.ingredients
    : Array.isArray(recipeLike?.data?.ingredients)
      ? recipeLike.data.ingredients
      : [];

  const instructions = Array.isArray(recipeLike?.instructions)
    ? recipeLike.instructions
    : Array.isArray(recipeLike?.data?.instructions)
      ? recipeLike.data.instructions
      : [];

  const ingredientText = ingredients
    .map((i: any) => `${String(i?.ingredient ?? "")} ${String(i?.amount ?? "")}`)
    .join(" ");

  const instructionText = instructions.map((s: any) => String(s ?? "")).join(" ");

  return `${title} ${description} ${ingredientText} ${instructionText}`.toLowerCase();
}

function hasAnyTerm(haystack: string, terms: string[]): boolean {
  return terms.some((term) => haystack.includes(term));
}

export function validateRecipeSemantics(recipeLike: any): void {
  const categories = normalizeCategories(recipeLike?.categories ?? recipeLike?.data?.categories ?? []);
  const dietaryRestrictions = Number(recipeLike?.dietaryRestrictions ?? 0);
  const text = collectRecipeText(recipeLike);

  const porkTerms = [
    "pork",
    "bacon",
    "ham",
    "prosciutto",
    "guanciale",
    "pancetta",
    "lard",
    "pork belly",
    "pork shoulder"
  ];

  const shellfishTerms = [
    "shrimp", "prawn", "lobster", "crab", "scallop", "mussel",
    "clam", "oyster", "shellfish", "calamari", "squid", "octopus"
  ];

  const meatTerms = [
    "beef",
    "steak",
    "brisket",
    "veal",
    "lamb",
    "mutton",
    "goat",
    "chicken",
    "turkey",
    "duck",
    "shawarma",
    "meatball",
    "meatballs",
    "burger",
    "hamburger",
    "meat sauce",
    "ground beef",
    "ground lamb",
    "ground turkey",
    "ground chicken",
    "beef broth",
    "chicken broth",
    "beef stock",
    "chicken stock"
  ];

  const fishTerms = [
    "fish", "salmon", "tuna", "cod", "tilapia", "trout", "sea bass",
    "sardine", "anchovy", "mackerel", "halibut"
  ];

  const dairyTerms = [
    "milk", "cream", "butter", "cheese", "mozzarella", "parmesan",
    "cheddar", "yogurt", "labneh", "ricotta", "feta", "cottage cheese",
    "cream cheese"
  ];

  const eggTerms = ["egg", "eggs"];
  const honeyTerms = ["honey"];

  const hasPork = hasAnyTerm(text, porkTerms);
  const hasShellfish = hasAnyTerm(text, shellfishTerms);
  const hasMeat = hasAnyTerm(text, meatTerms);
  const hasFish = hasAnyTerm(text, fishTerms);
  const hasDairy = hasAnyTerm(text, dairyTerms);
  const hasEgg = hasAnyTerm(text, eggTerms);
  const hasHoney = hasAnyTerm(text, honeyTerms);

  const isKosher = dietaryRestrictions === DietaryRestrictions.KOSHER;
  const isVegan = dietaryRestrictions === DietaryRestrictions.VEGAN;
  const isDairyCategory = categories.includes(RecipeCategory.dairy);
  const isMeatCategory = categories.includes(RecipeCategory.meat);
  const isFishCategory = categories.includes(RecipeCategory.fish);
  const isVeganCategory = categories.includes(RecipeCategory.vegan);

  if (isKosher) {
    if (hasPork) {
      throw new ValidationError("Invalid kosher recipe: contains pork/non-kosher meat terms");
    }

    if (hasShellfish) {
      throw new ValidationError("Invalid kosher recipe: contains shellfish/non-kosher seafood terms");
    }

    if (hasMeat && hasDairy) {
      throw new ValidationError("Invalid kosher recipe: mixes meat and dairy");
    }
  }

  if (isDairyCategory && hasMeat) {
    throw new ValidationError("Invalid dairy recipe: contains meat terms");
  }

  if (isMeatCategory && hasDairy) {
    throw new ValidationError("Invalid meat recipe: contains dairy terms");
  }

  if (isFishCategory && hasMeat) {
    throw new ValidationError("Invalid fish recipe: contains meat terms");
  }

  if (isVegan || isVeganCategory) {
    if (hasMeat || hasFish || hasDairy || hasEgg || hasHoney) {
      throw new ValidationError("Invalid vegan recipe: contains animal-product terms");
    }
  }
}