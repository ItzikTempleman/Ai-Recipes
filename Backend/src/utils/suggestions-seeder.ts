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

function normalizeToStringArray(x: any): string[] {
  if (!x) return [];
  if (Array.isArray(x)) return x.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (typeof x === "string") {
    const parts = x.split("\n").map((s) => s.trim()).filter(Boolean);
    return parts.length ? parts : [x.trim()];
  }
  return [String(x).trim()].filter(Boolean);
}

function extractJsonObject(s: string): any | null {
  if (!s) return null;
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) return null;
  const candidate = s.slice(start, end + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
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

async function postJson(systemPrompt: string, userPayload: any, retries = 3): Promise<any> {
  const modelToUse = appConfig.modelNumber;
  const keyToUse = appConfig.freeNoImageApiKey;
  if (!keyToUse) throw new Error("NO_IMAGE_API_KEY is missing (freeNoImageApiKey)");
  let lastErr: any = null;

  for (let i = 0; i < retries; i++) {
    try {
      const body = {
        model: modelToUse,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(userPayload) }
        ],
        temperature: 0
      };

      const resp = await axios.post(appConfig.gptUrl, body, {
        headers: { Authorization: "Bearer " + keyToUse, "Content-Type": "application/json" }
      });

      const content: string = resp.data?.choices?.[0]?.message?.content ?? "";
      const parsed = extractJsonObject(content);
      if (parsed) return parsed;
      lastErr = new Error("Model did not return valid JSON");
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error("Failed to call translation model");
}

function hebrewRatio(arr: string[]): number {
  if (!arr.length) return 0;
  const heb = arr.filter(hasHebrewLetters).length;
  return heb / arr.length;
}

async function translateTitleToHebrew(titleEn: string): Promise<string> {
  const system = `Translate the recipe title from English to Hebrew. Output ONLY JSON: {"title":"..."} . Rules: Hebrew letters required, same dish, no extra words, no explanations, no transliteration in Latin letters.`;
  const parsed = await postJson(system, { title: titleEn }, 5);
  const he = String(parsed?.title ?? "").trim();
  if (!he || !hasHebrewLetters(he)) throw new Error(`Bad Hebrew title for "${titleEn}"`);
  return he;
}

async function translateDescriptionToHebrew(descEn: string): Promise<string> {
  const system = `Translate the recipe description from English to Hebrew. Output ONLY JSON: {"description":"..."} . Rules: Hebrew letters required, same meaning, keep numbers, no explanations, no Latin transliteration.`;
  const parsed = await postJson(system, { description: descEn }, 5);
  const he = String(parsed?.description ?? "").trim();
  if (!he || !hasHebrewLetters(he)) throw new Error("Bad Hebrew description");
  return he;
}

async function translateListToHebrew(kind: "ingredients" | "instructions", linesEn: string[]): Promise<string[]> {
  const system = `Translate ${kind} from English to Hebrew. Output ONLY JSON: {"lines":[...]} . Rules: Return an array of strings in Hebrew. Keep quantities and numbers. No explanations. No Latin transliteration.`;
  const parsed = await postJson(system, { lines: linesEn }, 5);
  const lines = normalizeToStringArray(parsed?.lines);
  if (!lines.length) throw new Error(`Empty Hebrew ${kind}`);
  const ratio = hebrewRatio(lines);
  if (ratio < 0.5) throw new Error(`Not enough Hebrew in ${kind}`);
  return lines;
}

async function translateRecipeToHebrew(en: any): Promise<any> {
  const title = await translateTitleToHebrew(String(en.title ?? ""));
  const description = await translateDescriptionToHebrew(String(en.description ?? ""));
  const ingredientsEn = normalizeToStringArray(en.ingredients);
  const instructionsEn = normalizeToStringArray(en.instructions);
  const ingredients = await translateListToHebrew("ingredients", ingredientsEn);
  const instructions = await translateListToHebrew("instructions", instructionsEn);
  return { ...en, title, description, ingredients, instructions };
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

  while (madePairs < missingPairs && attempts < missingPairs * 50) {
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

    let imageName: string | undefined;
    try {
      const img = await generateImage({
        query: inputEn.query,
        quantity: en.amountOfServings ?? 2,
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

    let he: any;
    try {
      he = await translateRecipeToHebrew(en);
    } catch {
      continue;
    }

    try {
      await recipeService.saveSuggestionRecipe({ ...en, amountOfServings: 2, imageName } as any, "en", pairKey);
      await recipeService.saveSuggestionRecipe({ ...he, amountOfServings: 2, imageName } as any, "he", pairKey);
      madePairs++;
    } catch {
      continue;
    }
  }
}