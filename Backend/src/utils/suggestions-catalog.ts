import crypto from "crypto";
import { dal } from "./dal";
import { DbRecipeRow, RecipeCategory } from "../models/recipe-model";
import { DietaryRestrictions } from "../models/filters";
import { mapDbRowToFullRecipe } from "./map-recipe";
import {
  normalizeCategories,
  normalizeTitle,
  sanitizeQueryRestrictions,
  stableStringify
} from "./recipe-normalization";

export function buildContentHash(recipeLike: any): string {
  const canonical = {
    title: String(recipeLike?.title ?? "").trim(),
    description: String(recipeLike?.description ?? "").trim(),
    amountOfServings: Number(recipeLike?.amountOfServings ?? 0),
    ingredients: (recipeLike?.ingredients ?? []).map((i: any) => ({
      ingredient: String(i?.ingredient ?? "").trim(),
      amount: i?.amount ?? null
    })),
    instructions: (recipeLike?.instructions ?? []).map((s: any) => String(s ?? "").trim()),
    categories: (recipeLike?.categories ?? []).map((c: any) => String(c))
  };

  return crypto.createHash("sha256").update(stableStringify(canonical)).digest("hex");
}

function collectRecipeTextFromRow(row: DbRecipeRow): string {
  const recipe = mapDbRowToFullRecipe(row);
  const title = String(recipe.title ?? "");
  const description = String(recipe.description ?? "");
  const ingredients = (recipe.data?.ingredients ?? [])
    .map((i) => `${String(i?.ingredient ?? "")} ${String(i?.amount ?? "")}`)
    .join(" ");
  const instructions = (recipe.data?.instructions ?? []).join(" ");

  return `${title} ${description} ${ingredients} ${instructions}`.toLowerCase();
}

function rowHasSemanticViolation(row: DbRecipeRow): boolean {
  const recipe = mapDbRowToFullRecipe(row);
  const text = collectRecipeTextFromRow(row);
  const categories = normalizeCategories(recipe.categories ?? recipe.data?.categories ?? []);
  const dietaryRestrictions = Number(recipe.dietaryRestrictions ?? 0);

  const hasAny = (terms: string[]) => terms.some((t) => text.includes(t));

  const porkTerms = [
    "pork", "bacon", "ham", "prosciutto", "guanciale", "pancetta", "lard", "pork belly", "pork shoulder"
  ];

  const shellfishTerms = [
    "shrimp", "prawn", "lobster", "crab", "scallop", "mussel",
    "clam", "oyster", "shellfish", "calamari", "squid", "octopus"
  ];

  const meatTerms = [
    "beef", "steak", "brisket", "veal", "lamb", "mutton", "goat",
    "chicken", "turkey", "duck", "shawarma", "meatball", "meatballs",
    "burger", "hamburger", "meat sauce", "ground beef", "ground lamb",
    "ground turkey", "ground chicken", "beef broth", "chicken broth", "beef stock", "chicken stock"
  ];

  const fishTerms = [
    "fish", "salmon", "tuna", "cod", "tilapia", "trout", "sea bass",
    "sardine", "anchovy", "mackerel", "halibut"
  ];

  const dairyTerms = [
    "milk", "cream", "butter", "cheese", "mozzarella", "parmesan",
    "cheddar", "yogurt", "labneh", "ricotta", "feta", "cottage cheese", "cream cheese"
  ];

  const eggTerms = ["egg", "eggs"];
  const honeyTerms = ["honey"];

  const hasPork = hasAny(porkTerms);
  const hasShellfish = hasAny(shellfishTerms);
  const hasMeat = hasAny(meatTerms);
  const hasFish = hasAny(fishTerms);
  const hasDairy = hasAny(dairyTerms);
  const hasEgg = hasAny(eggTerms);
  const hasHoney = hasAny(honeyTerms);

  const isKosher = dietaryRestrictions === DietaryRestrictions.KOSHER;
  const isVegan = dietaryRestrictions === DietaryRestrictions.VEGAN;
  const isDairyCategory = categories.includes(RecipeCategory.dairy);
  const isMeatCategory = categories.includes(RecipeCategory.meat);
  const isFishCategory = categories.includes(RecipeCategory.fish);
  const isVeganCategory = categories.includes(RecipeCategory.vegan);

  if (isKosher && (hasPork || hasShellfish || (hasMeat && hasDairy))) return true;
  if (isDairyCategory && hasMeat) return true;
  if (isMeatCategory && hasDairy) return true;
  if (isFishCategory && hasMeat) return true;
  if ((isVegan || isVeganCategory) && (hasMeat || hasFish || hasDairy || hasEgg || hasHoney)) return true;

  return false;
}

async function deletePairByKey(systemUserId: number, pairKey: string): Promise<void> {
  await dal.execute(`delete from recipe where userId = ? and pairKey = ?`, [systemUserId, pairKey]);
}

export async function purgeInvalidAndDuplicateCatalogPairs(systemUserId: number): Promise<void> {
  const rows = (await dal.execute(
    `select * from recipe where userId = ? and pairKey is not null order by id asc`,
    [systemUserId]
  )) as DbRecipeRow[];

  const byPair = new Map<string, DbRecipeRow[]>();

  for (const row of rows) {
    const key = String((row as any).pairKey ?? "");
    if (!key) continue;

    if (!byPair.has(key)) byPair.set(key, []);
    byPair.get(key)!.push(row);
  }

  const seenTitles = new Set<string>();
  const seenHashes = new Set<string>();

  for (const [pairKey, pairRows] of byPair.entries()) {
    if (pairRows.length !== 2) {
      await deletePairByKey(systemUserId, pairKey);
      continue;
    }

    const langs = new Set(pairRows.map((r: any) => String(r.lang ?? "")));
    if (!langs.has("en") || !langs.has("he")) {
      await deletePairByKey(systemUserId, pairKey);
      continue;
    }

    if (pairRows.some((row) => rowHasSemanticViolation(row))) {
      await deletePairByKey(systemUserId, pairKey);
      continue;
    }

    const enRow = pairRows.find((r: any) => String(r.lang) === "en")!;
    const normalized = normalizeTitle((enRow as any).title ?? "");

    let contentHash = "";
    try {
      const qr = JSON.parse(String((enRow as any).queryRestrictions ?? "[]"));
      if (Array.isArray(qr)) {
        const marker = qr.find((x) => typeof x === "string" && x.startsWith("__CONTENT_HASH__:"));
        if (marker) {
          contentHash = marker.replace("__CONTENT_HASH__:", "");
        }
      }
    } catch {
    }

    if ((normalized && seenTitles.has(normalized)) || (contentHash && seenHashes.has(contentHash))) {
      await deletePairByKey(systemUserId, pairKey);
      continue;
    }

    if (normalized) seenTitles.add(normalized);
    if (contentHash) seenHashes.add(contentHash);
  }
}

export async function hasExistingSuggestion(
  systemUserId: number,
  normalizedTitleValue: string,
  contentHash: string
): Promise<boolean> {
  const rows = (await dal.execute(
    `
      select title, queryRestrictions
      from recipe
      where userId = ?
        and pairKey is not null
    `,
    [systemUserId]
  )) as Array<{ title: string; queryRestrictions: string }>;

  for (const row of rows) {
    const rowNormalized = normalizeTitle(row.title);
    if (rowNormalized && rowNormalized === normalizedTitleValue) {
      return true;
    }

    try {
      const qr = JSON.parse(String(row.queryRestrictions ?? "[]"));
      if (Array.isArray(qr)) {
        const hasSameHash = qr.some(
          (x) => typeof x === "string" && x === `__CONTENT_HASH__:${contentHash}`
        );
        if (hasSameHash) return true;
      }
    } catch {
    }
  }

  return false;
}

export async function getUsedKeys(systemUserId: number): Promise<{
  usedTitles: Set<string>;
  usedContentHashes: Set<string>;
}> {
  const rows = (await dal.execute(
    `
      select title, description, amountOfServings, ingredients, instructions, amounts, queryRestrictions, categories
      from recipe
      where userId = ? and pairKey is not null
    `,
    [systemUserId]
  )) as Array<{
    title: string;
    description: string;
    amountOfServings: number;
    ingredients: string;
    instructions: string;
    amounts: string;
    queryRestrictions: string;
    categories: string;
  }>;

  const usedTitles = new Set<string>();
  const usedContentHashes = new Set<string>();

  for (const r of rows) {
    const nt = normalizeTitle(r.title);
    if (nt) usedTitles.add(nt);

    try {
      const qr = JSON.parse(String(r.queryRestrictions ?? "[]"));
      if (Array.isArray(qr)) {
        const marker = qr.find((x) => typeof x === "string" && x.startsWith("__CONTENT_HASH__:"));
        if (marker) {
          usedContentHashes.add(marker.replace("__CONTENT_HASH__:", ""));
          continue;
        }
      }
    } catch {
    }

    const ingredientNames = String(r.ingredients ?? "").split(",").map((s) => s.trim()).filter(Boolean);

    let amounts: any[] = [];
    try {
      amounts = JSON.parse(String(r.amounts ?? "[]"));
    } catch {
      amounts = [];
    }

    const ingredients = ingredientNames.map((name, idx) => ({
      ingredient: name,
      amount: (Array.isArray(amounts) ? amounts[idx] : null) ?? null
    }));

    const instructions = String(r.instructions ?? "").split("|").map((s) => s.trim()).filter(Boolean);

    let categories: any[] = [];
    try {
      categories = JSON.parse(String(r.categories ?? "[]"));
    } catch {
      categories = [];
    }

    const hash = buildContentHash({
      title: r.title,
      description: r.description,
      amountOfServings: r.amountOfServings,
      ingredients,
      instructions,
      categories
    });

    usedContentHashes.add(hash);
  }

  return { usedTitles, usedContentHashes };
}