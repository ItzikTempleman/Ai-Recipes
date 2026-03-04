import { dal } from "./dal";
import { recipeService } from "../services/recipe-service";
import { InputModel } from "../models/input-model";
import { SugarRestriction, LactoseRestrictions, GlutenRestrictions, DietaryRestrictions, CaloryRestrictions } from "../models/filters";
import { getIdeas } from "./normalize-language";
import crypto from "crypto";
import { generateImage } from "../services/image-service";
import axios from "axios";
import { appConfig } from "./app-config";

const TOTAL_PAIRS = 50;
const TOTAL_ROWS = TOTAL_PAIRS * 2;

function hasHebrewLetters(s: string): boolean {
  return /[\u0590-\u05FF]/.test(s);
}

function extractJsonObject(s: string): any | null {
  if (!s) return null;
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  const candidate = s.slice(start, end + 1);
  try { return JSON.parse(candidate); } catch { return null; }
}

async function ensureSystemUserId(): Promise<number> {
  const email = "system.generator@smart-recipes.local";
  const sql = "insert into user (firstName, familyName, email, password) values (?, ?, ?, ?) on duplicate key update id = LAST_INSERT_ID(id)";
  const values = ["System", "Generator", email, "SYSTEM_GENERATED_NO_LOGIN"];
  const result = (await dal.execute(sql, values)) as { insertId: number };
  return Number(result.insertId);
}

async function countSeededRows(systemUserId: number): Promise<number> {
  const sql = "select count(*) as c from recipe where userId = ? and pairKey is not null";
  const rows = (await dal.execute(sql, [systemUserId])) as Array<{ c: number }>;
  return Number(rows?.[0]?.c ?? 0);
}

async function postJson(systemPrompt: string, userPayload: any, retries = 4): Promise<any> {
  const modelToUse = appConfig.modelNumber;
  const keyToUse = appConfig.freeNoImageApiKey;
  if (!keyToUse) throw new Error("NO_IMAGE_API_KEY is missing (freeNoImageApiKey)");
  let lastErr: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const body = {
        model: modelToUse,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, { role: "user", content: JSON.stringify(userPayload) }],
        temperature: 0
      };
      const resp = await axios.post(appConfig.gptUrl, body, { headers: { Authorization: "Bearer " + keyToUse, "Content-Type": "application/json" } });
      const content: string = resp.data?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJsonObject(content);
      if (parsed) return parsed;
      lastErr = new Error("Model did not return valid JSON");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("Failed to call model");
}

async function translateTitleToHebrew(titleEn: string): Promise<string> {
  const system = 'Translate the recipe title from English to Hebrew. Output ONLY JSON: {"title":"..."} Rules: Hebrew letters required, same dish, no extra words, no explanations, no Latin transliteration.';
  const parsed = await postJson(system, { title: titleEn }, 6);
  const he = String(parsed?.title ?? "").trim();
  if (!he || !hasHebrewLetters(he)) throw new Error(`Bad Hebrew title for "${titleEn}"`);
  return he;
}

async function translateCategoriesToHebrew(categories: any): Promise<string[] | null> {
  if (!categories || !Array.isArray(categories) || categories.length === 0) return null;
  const system = 'Translate recipe category labels to Hebrew. Input is an array of short category strings. Output ONLY JSON: {"categories":["..."]}. Rules: Hebrew letters required for each element, keep same length/order, no explanations.';
  const parsed = await postJson(system, { categories }, 4);
  const out = parsed?.categories;
  if (!Array.isArray(out) || out.length !== categories.length) return null;
  const clean = out.map((x: any) => String(x ?? "").trim());
  if (!clean.every((s: string) => s && hasHebrewLetters(s))) return null;
  return clean;
}

function pickServings(recipe: any, fallback: number): number {
  const n = Number(recipe?.amountOfServings);
  if (Number.isFinite(n) && n > 0) return Math.floor(n);
  return fallback;
}

export async function seedSuggestionRecipeIfNeeded(): Promise<void> {
  const systemUserId = await ensureSystemUserId();
  const existingRows = await countSeededRows(systemUserId);
  if (existingRows >= TOTAL_ROWS) return;

  const missingRows = TOTAL_ROWS - existingRows;
  const missingPairs = Math.ceil(missingRows / 2);

  const ideasEn = getIdeas("en");

  let madePairs = 0;
  let attempts = 0;

  while (madePairs < missingPairs && attempts < missingPairs * 60) {
    attempts++;

    const pairKey = crypto.randomBytes(16).toString("hex");
    const qEn = ideasEn[(Math.floor(existingRows / 2) + madePairs) % ideasEn.length];

    const inputEn = new InputModel({
      query: qEn,
      quantity: 2,
      sugarRestriction: SugarRestriction.DEFAULT,
      lactoseRestrictions: LactoseRestrictions.DEFAULT,
      glutenRestrictions: GlutenRestrictions.DEFAULT,
      dietaryRestrictions: DietaryRestrictions.KOSHER,
      caloryRestrictions: CaloryRestrictions.DEFAULT,
      queryRestrictions: []
    } as any);

    let en: any;
    try {
      en = await recipeService.generateInstructions(inputEn, false);
    } catch {
      continue;
    }

    const servings = pickServings(en, Number(inputEn.quantity ?? 2));

    let imageName: string | undefined;
    try {
      const img = await generateImage({
        query: inputEn.query,
        quantity: servings,
        sugarRestriction: en.sugarRestriction,
        lactoseRestrictions: en.lactoseRestrictions,
        glutenRestrictions: en.glutenRestrictions,
        dietaryRestrictions: DietaryRestrictions.KOSHER,
        caloryRestrictions: en.caloryRestrictions,
        queryRestrictions: en.queryRestrictions,
        title: en.title,
        description: en.description,
        ingredients: en.ingredients,
        instructions: en.instructions
      });
      imageName = img?.fileName;
    } catch {
      imageName = undefined;
    }

    if (!imageName) continue;

    let heTitle: string;
    try {
      heTitle = await translateTitleToHebrew(String(en.title ?? ""));
    } catch {
      continue;
    }

    const inputHe = new InputModel({
      query: heTitle,
      quantity: servings,
      sugarRestriction: en.sugarRestriction ?? SugarRestriction.DEFAULT,
      lactoseRestrictions: en.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
      glutenRestrictions: en.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
      dietaryRestrictions: DietaryRestrictions.KOSHER,
      caloryRestrictions: en.caloryRestrictions ?? CaloryRestrictions.DEFAULT,
      queryRestrictions: en.queryRestrictions ?? []
    } as any);

    let he: any;
    try {
      he = await recipeService.generateInstructions(inputHe, false);
    } catch {
      continue;
    }

    let heCategoriesDisplay: string[] | null = null;
    try {
      heCategoriesDisplay = await translateCategoriesToHebrew(en.categories ?? he.categories);
    } catch {
      heCategoriesDisplay = null;
    }

    const enToSave = { ...en, amountOfServings: servings, imageName } as any;
    const heToSave = { ...he, title: heTitle, amountOfServings: servings, imageName } as any;

    if (heCategoriesDisplay) {
      if ("categoriesDisplay" in heToSave) heToSave.categoriesDisplay = heCategoriesDisplay;
      if ("categoryDisplay" in heToSave && typeof heToSave.categoryDisplay !== "undefined") heToSave.categoryDisplay = heCategoriesDisplay.join(", ");
      if ("categoryName" in heToSave && typeof heToSave.categoryName !== "undefined") heToSave.categoryName = heCategoriesDisplay[0];
    }

    try {
      await recipeService.saveSuggestionRecipe(enToSave, "en", pairKey);
      await recipeService.saveSuggestionRecipe(heToSave, "he", pairKey);
      madePairs++;
    } catch {
      continue;
    }
  }
}