import { dal } from "../utils/dal";
import { recipeService } from "./recipe-service";
import { DbRecipeRow, FullRecipeModel, RecipeCategory } from "../models/recipe-model";
import {
  SugarRestriction,
  LactoseRestrictions,
  GlutenRestrictions,
  DietaryRestrictions,
  CaloryRestrictions
} from "../models/filters";
import { InputModel } from "../models/input-model";
import { getIdeas } from "../utils/normalize-language";
import crypto from "crypto";
import { appConfig } from "../utils/app-config";
import axios from "axios";
import { mapDbRowToFullRecipe } from "../utils/map-recipe";
import { generateImage } from "./image-service";

type Lang = "en" | "he";
const TOTAL_PAIRS = 50;

class SuggestionsService {
  private normalizeTitle(title: unknown): string {
    return String(title ?? "")
      .trim()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      // keep this list, but also remove other punctuation safely
      .replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "")
      .toLowerCase();
  }

  /**
   * Stable stringify (sorted keys) so content hashing is deterministic.
   */
  private stableStringify(value: unknown): string {
    const seen = new WeakSet<object>();
    const normalize = (v: any): any => {
      if (v === null || v === undefined) return null;
      if (typeof v !== "object") return v;
      if (seen.has(v)) return null;
      seen.add(v);

      if (Array.isArray(v)) return v.map(normalize);

      const out: Record<string, any> = {};
      for (const k of Object.keys(v).sort()) out[k] = normalize(v[k]);
      return out;
    };

    return JSON.stringify(normalize(value));
  }

  /**
   * Content hash used ONLY for de-duping.
   * NOTE: We do NOT store it in pairKey because pairKey is used to link EN<->HE.
   */
  private buildContentHash(enRecipeLike: any): string {
    const canonical = {
      title: String(enRecipeLike?.title ?? "").trim(),
      description: String(enRecipeLike?.description ?? "").trim(),
      amountOfServings: Number(enRecipeLike?.amountOfServings ?? 0),
      ingredients: (enRecipeLike?.ingredients ?? []).map((i: any) => ({
        ingredient: String(i?.ingredient ?? "").trim(),
        amount: i?.amount ?? null
      })),
      instructions: (enRecipeLike?.instructions ?? []).map((s: any) => String(s ?? "").trim()),
      // categories matter for content equality
      categories: (enRecipeLike?.categories ?? []).map((c: any) => String(c))
    };

    return crypto.createHash("sha256").update(this.stableStringify(canonical)).digest("hex");
  }

  private async ensureSystemUserId(): Promise<number> {
    const email = "system.generator@smart-recipes.local";
    const sql = `insert into user (firstName, familyName, email, password)
                 values (?, ?, ?, ?)
                 on duplicate key update id = LAST_INSERT_ID(id)`;
    const values = ["System", "Generator", email, "SYSTEM_GENERATED_NO_LOGIN"];
    const result = (await dal.execute(sql, values)) as { insertId: number };
    return result.insertId;
  }

  private createKosherInputModel(query: string): InputModel {
    const model = new InputModel({
      query,
      quantity: 1,
      sugarRestriction: SugarRestriction.DEFAULT,
      lactoseRestrictions: LactoseRestrictions.DEFAULT,
      glutenRestrictions: GlutenRestrictions.DEFAULT,
      dietaryRestrictions: DietaryRestrictions.KOSHER,
      caloryRestrictions: CaloryRestrictions.DEFAULT,
      queryRestrictions: []
    } as unknown as InputModel);
    model.validate();
    return model;
  }

  private async countCatalogRows(): Promise<number> {
    const systemUserId = await this.ensureSystemUserId();
    const sql = `select count(*) as cnt from recipe where userId=? and pairKey is not null`;
    const rows = (await dal.execute(sql, [systemUserId])) as any[];
    return Number(rows[0]?.cnt ?? 0);
  }

  /**
   * Fetch existing keys to prevent duplicates:
   * - normalized titles
   * - content hashes (stored in queryRestrictions as a special marker, to avoid schema change)
   *
   * If you prefer a DB column (recommended), tell me and I’ll switch this to use it.
   */
  private async getUsedKeys(): Promise<{ usedTitles: Set<string>; usedContentHashes: Set<string> }> {
    const systemUserId = await this.ensureSystemUserId();

    // We need enough fields to reconstruct the same canonical structure we hash from.
    const sql = `
      select title, description, amountOfServings, ingredients, instructions, amounts, queryRestrictions, categories
      from recipe
      where userId=? and pairKey is not null
    `;

    const rows = (await dal.execute(sql, [systemUserId])) as Array<{
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
      const nt = this.normalizeTitle(r.title);
      if (nt) usedTitles.add(nt);

      // Option 1: If we already stored the content-hash marker in queryRestrictions, parse it
      // Marker format: "__CONTENT_HASH__:abcdef..."
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
        // ignore
      }

      // Otherwise reconstruct from stored fields (best effort)
      const ingredientNames = String(r.ingredients ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

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

      const instructions = String(r.instructions ?? "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);

      let categories: any[] = [];
      try {
        categories = JSON.parse(String(r.categories ?? "[]"));
      } catch {
        categories = [];
      }

      const hash = this.buildContentHash({
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

  /**
   * Ensure generateImage() always results in a string, or return null.
   * Also retries a bit (image generation can be flaky).
   */
  private async generateRequiredImage(payload: Parameters<typeof generateImage>[0], retries = 3): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await generateImage(payload);
        const fileName = typeof res?.fileName === "string" ? res.fileName.trim() : "";
        if (fileName) return fileName;
      } catch {
        // ignore and retry
      }
    }
    return null;
  }

  private async insertCatalogRecipe(args: {
    systemUserId: number;
    pairKey: string;
    lang: Lang;
    recipe: FullRecipeModel;
  }): Promise<void> {
    const r = args.recipe;

    // HARD: no undefineds in SQL values, and imageName MUST exist
    const imageName: string = (typeof r.imageName === "string" && r.imageName.trim())
      ? r.imageName.trim()
      : "";

    if (!imageName) {
      // This should never happen because generator enforces it, but keep it hard.
      throw new Error("insertCatalogRecipe: imageName is required");
    }

    const title = String(r.title ?? "").slice(0, 160);
    const description = String(r.description ?? "");
    const amountOfServings = Number(r.amountOfServings ?? 1);
    const popularity = Number(r.popularity ?? 0);

    const ingredients = (r.data?.ingredients ?? []).map((i) => i.ingredient).join(", ").slice(0, 350);
    const instructions = (r.data?.instructions ?? []).join(" | ").slice(0, 1000);
    const amounts = JSON.stringify((r.data?.ingredients ?? []).map((i) => i.amount ?? null));

    const queryRestrictionsJson = JSON.stringify(r.queryRestrictions ?? []);
    const categoriesJson = JSON.stringify((r.categories ?? r.data?.categories ?? []) as RecipeCategory[]);

    const difficultyText =
      typeof r.difficultyLevel === "number"
        ? (["EASY", "MID_LEVEL", "PRO"][r.difficultyLevel] ?? "MID_LEVEL")
        : "MID_LEVEL";

    const sql = `insert into recipe(
      title,
      amountOfServings,
      description,
      popularity,
      ingredients,
      instructions,
      totalSugar,
      totalProtein,
      healthLevel,
      calories,
      amounts,
      sugarRestriction,
      lactoseRestrictions,
      glutenRestrictions,
      dietaryRestrictions,
      caloryRestrictions,
      queryRestrictions,
      prepTime,
      difficultyLevel,
      countryOfOrigin,
      imageName,
      userId,
      lang,
      pairKey,
      categories
    ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    // IMPORTANT: ensure no undefined in values
    const values = [
      title,
      amountOfServings,
      description,
      popularity,
      ingredients,
      instructions,
      Number(r.totalSugar ?? 0),
      Number(r.totalProtein ?? 0),
      Number(r.healthLevel ?? 0),
      Number(r.calories ?? 0),
      amounts,
      r.sugarRestriction ?? SugarRestriction.DEFAULT,
      r.lactoseRestrictions ?? LactoseRestrictions.DEFAULT,
      r.glutenRestrictions ?? GlutenRestrictions.DEFAULT,
      r.dietaryRestrictions ?? DietaryRestrictions.KOSHER,
      r.caloryRestrictions ?? CaloryRestrictions.DEFAULT,
      queryRestrictionsJson,
      Number(r.prepTime ?? 0),
      difficultyText,
      String(r.countryOfOrigin ?? ""),
      imageName,
      args.systemUserId,
      args.lang,
      args.pairKey,
      categoriesJson
    ];

    await dal.execute(sql, values);
  }

  private async translateRecipeToHebrew(en: any): Promise<any> {
    const modelToUse = appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey;

    const system = `
You translate recipes to Hebrew.
Critical rules:
- Output MUST be a JSON object (response_format json_object).
- Keep the recipe IDENTICAL in meaning, ingredients, and steps.
- Do NOT change categories; translate only textual fields.
- Must remain KOSHER (no pork/shellfish, no meat+dairy mixing).
- Keep numeric values and units consistent.
Return EXACT schema including "categories".
`.trim();

    const body = {
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `RECIPE_JSON:\n${JSON.stringify(en)}` }
      ]
    };

    const resp = await axios.post(appConfig.gptUrl, body, {
      headers: {
        Authorization: "Bearer " + keyToUse,
        "Content-Type": "application/json"
      }
    });

    const content: string = resp.data.choices[0].message.content;
    return JSON.parse(content);
  }

  public async generateOnce(): Promise<{ createdPairs: number; createdRows: number }> {
    const existing = await this.countCatalogRows();
    if (existing >= TOTAL_PAIRS * 2) {
      return { createdPairs: 0, createdRows: 0 };
    }

    const systemUserId = await this.ensureSystemUserId();
    const { usedTitles, usedContentHashes } = await this.getUsedKeys();
    const ideas = getIdeas("en");

    let createdPairs = 0;
    let createdRows = 0;

    for (let attempts = 0; createdPairs < TOTAL_PAIRS && attempts < 600; attempts++) {
      const query = ideas[Math.floor(Math.random() * ideas.length)];
      const input = this.createKosherInputModel(query);
      const data = await recipeService.generateInstructions(input, false);

      const normalizedTitle = this.normalizeTitle(data.title);
      if (!normalizedTitle || usedTitles.has(normalizedTitle)) continue;

      // Content hash dedupe (based on EN source recipe content)
      const contentHash = this.buildContentHash({
        title: data.title,
        description: data.description,
        amountOfServings: data.amountOfServings,
        ingredients: data.ingredients ?? [],
        instructions: data.instructions ?? [],
        categories: data.categories ?? []
      });
      if (usedContentHashes.has(contentHash)) continue;

      // HARD REQUIREMENT: image must exist (generate once per pair)
      const fileName = await this.generateRequiredImage({
        query: input.query,
        quantity: data.amountOfServings ?? 1,
        sugarRestriction: data.sugarRestriction,
        lactoseRestrictions: data.lactoseRestrictions,
        glutenRestrictions: data.glutenRestrictions,
        dietaryRestrictions: DietaryRestrictions.KOSHER,
        caloryRestrictions: data.caloryRestrictions,
        queryRestrictions: data.queryRestrictions,
        title: data.title,
        description: data.description,
        ingredients: data.ingredients,
        instructions: data.instructions
      });

      if (!fileName) {
        // if image fails, skip this candidate completely
        continue;
      }

      // Pair key stays as the EN<->HE link
      const pairKey = crypto.randomBytes(16).toString("hex");

      // Store content hash marker inside queryRestrictions (no schema change)
      const qrWithHash = Array.isArray(data.queryRestrictions) ? [...data.queryRestrictions] : [];
      qrWithHash.push(`__CONTENT_HASH__:${contentHash}`);

      const en = new FullRecipeModel({
        title: data.title,
        amountOfServings: data.amountOfServings,
        description: data.description,
        popularity: data.popularity,
        data,
        totalSugar: data.totalSugar,
        totalProtein: data.totalProtein,
        healthLevel: data.healthLevel,
        calories: data.calories,
        sugarRestriction: data.sugarRestriction,
        lactoseRestrictions: data.lactoseRestrictions,
        glutenRestrictions: data.glutenRestrictions,
        dietaryRestrictions: DietaryRestrictions.KOSHER,
        caloryRestrictions: data.caloryRestrictions,
        queryRestrictions: qrWithHash,
        prepTime: data.prepTime,
        difficultyLevel: data.difficultyLevel,
        countryOfOrigin: String(data.countryOfOrigin ?? ""),
        imageName: fileName,
        userId: systemUserId,
        categories: data.categories
      });

      const heJson = await this.translateRecipeToHebrew(data);

      // Keep the SAME content hash marker in HE too (still no schema change)
      const heQrWithHash = Array.isArray(heJson.queryRestrictions) ? [...heJson.queryRestrictions] : [];
      heQrWithHash.push(`__CONTENT_HASH__:${contentHash}`);

      const he = new FullRecipeModel({
        title: heJson.title,
        amountOfServings: heJson.amountOfServings,
        description: heJson.description,
        popularity: heJson.popularity,
        data: heJson,
        totalSugar: heJson.totalSugar,
        totalProtein: heJson.totalProtein,
        healthLevel: heJson.healthLevel,
        calories: heJson.calories,
        sugarRestriction: heJson.sugarRestriction,
        lactoseRestrictions: heJson.lactoseRestrictions,
        glutenRestrictions: heJson.glutenRestrictions,
        dietaryRestrictions: DietaryRestrictions.KOSHER,
        caloryRestrictions: heJson.caloryRestrictions,
        queryRestrictions: heQrWithHash,
        prepTime: heJson.prepTime,
        difficultyLevel: heJson.difficultyLevel,
        countryOfOrigin: String(heJson.countryOfOrigin ?? ""),
        imageName: fileName,
        userId: systemUserId,
        categories: heJson.categories
      });

      // Insert both — insert will throw if imageName is missing (hard)
      await this.insertCatalogRecipe({ systemUserId, pairKey, lang: "en", recipe: en });
      await this.insertCatalogRecipe({ systemUserId, pairKey, lang: "he", recipe: he });

      usedTitles.add(normalizedTitle);
      usedContentHashes.add(contentHash);

      createdPairs++;
      createdRows += 2;
    }

    return { createdPairs, createdRows };
  }

  public async attachMissingImages(limit: number = 20): Promise<{ processed: number; updated: number }> {
    const systemUserId = await this.ensureSystemUserId();

    const sql = `
      select *
      from recipe
      where userId = ?
        and pairKey is not null
        and (imageName is null or trim(imageName) = '')
      order by id asc
      limit ?
    `;
    const rows = (await dal.execute(sql, [systemUserId, limit])) as DbRecipeRow[];

    let updated = 0;

    for (const row of rows) {
      try {
        const recipe = mapDbRowToFullRecipe(row);

        const fileName = await this.generateRequiredImage(
          {
            query: recipe.title,
            quantity: recipe.amountOfServings,
            sugarRestriction: recipe.sugarRestriction,
            lactoseRestrictions: recipe.lactoseRestrictions,
            glutenRestrictions: recipe.glutenRestrictions,
            dietaryRestrictions: recipe.dietaryRestrictions,
            caloryRestrictions: recipe.caloryRestrictions,
            queryRestrictions: recipe.queryRestrictions,
            title: recipe.title,
            description: recipe.description,
            ingredients: recipe.data?.ingredients ?? [],
            instructions: recipe.data?.instructions ?? []
          },
          3
        );

        if (!fileName) continue;

        await recipeService.setRecipeImageName(Number((row as any).id), systemUserId, fileName);
        updated++;
      } catch (e) {
        console.error("[attachMissingImages] failed for recipeId:", (row as any)?.id, e);
      }
    }

    return { processed: rows.length, updated };
  }
}

export const suggestionsService = new SuggestionsService();