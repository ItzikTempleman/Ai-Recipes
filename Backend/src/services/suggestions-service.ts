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
  private readonly generationLockName = "smart_recipes_suggestions_generate_once";

  private normalizeTitle(title: unknown): string {
    return String(title ?? "")
      .trim()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "")
      .toLowerCase();
  }

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
      categories: (enRecipeLike?.categories ?? []).map((c: any) => String(c))
    };

    return crypto.createHash("sha256").update(this.stableStringify(canonical)).digest("hex");
  }

  private async acquireGenerationLock(timeoutSeconds = 30): Promise<boolean> {
    const rows = (await dal.execute(
      "select GET_LOCK(?, ?) as locked",
      [this.generationLockName, timeoutSeconds]
    )) as Array<{ locked: number | null }>;

    return Number(rows?.[0]?.locked ?? 0) === 1;
  }

  private async releaseGenerationLock(): Promise<void> {
    try {
      await dal.execute("select RELEASE_LOCK(?)", [this.generationLockName]);
    } catch {
    }
  }

  private sanitizeQueryRestrictions(values: unknown): string[] {
    if (!Array.isArray(values)) return [];

    const seen = new Set<string>();
    const out: string[] = [];

    for (const value of values) {
      const normalized = String(value ?? "").trim();
      if (!normalized) continue;
      if (normalized.startsWith("__CONTENT_HASH__:")) continue;

      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      out.push(normalized);
    }

    return out;
  }

  private normalizeCategories(values: unknown): RecipeCategory[] {
    if (!Array.isArray(values)) return [];

    const allowed = new Set(Object.values(RecipeCategory));
    const seen = new Set<string>();
    const out: RecipeCategory[] = [];

    for (const value of values) {
      const normalized = String(value ?? "").trim() as RecipeCategory;
      if (!allowed.has(normalized)) continue;
      if (seen.has(normalized)) continue;

      seen.add(normalized);
      out.push(normalized);
    }

    return out;
  }

  private async hasExistingSuggestion(
    systemUserId: number,
    normalizedTitle: string,
    contentHash: string
  ): Promise<boolean> {
    const sql = `
      select title, queryRestrictions
      from recipe
      where userId = ?
        and pairKey is not null
    `;

    const rows = (await dal.execute(sql, [systemUserId])) as Array<{
      title: string;
      queryRestrictions: string;
    }>;

    for (const row of rows) {
      const rowNormalizedTitle = this.normalizeTitle(row.title);
      if (rowNormalizedTitle && rowNormalizedTitle === normalizedTitle) {
        return true;
      }

      try {
        const qr = JSON.parse(String(row.queryRestrictions ?? "[]"));
        if (Array.isArray(qr)) {
          const hasSameHash = qr.some(
            (x) => typeof x === "string" && x === `__CONTENT_HASH__:${contentHash}`
          );
          if (hasSameHash) {
            return true;
          }
        }
      } catch {
      }
    }

    return false;
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

  private async countCatalogPairs(): Promise<number> {
    const systemUserId = await this.ensureSystemUserId();
    const sql = `
      select count(distinct pairKey) as cnt
      from recipe
      where userId = ?
        and pairKey is not null
    `;
    const rows = (await dal.execute(sql, [systemUserId])) as any[];
    return Number(rows[0]?.cnt ?? 0);
  }

  private async getUsedKeys(): Promise<{ usedTitles: Set<string>; usedContentHashes: Set<string> }> {
    const systemUserId = await this.ensureSystemUserId();

    const sql = `
      select title, description, amountOfServings, ingredients, instructions, amounts, queryRestrictions, categories
      from recipe
      where userId = ? and pairKey is not null
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

  private collectRecipeTextFromRow(row: DbRecipeRow): string {
    const recipe = mapDbRowToFullRecipe(row);
    const title = String(recipe.title ?? "");
    const description = String(recipe.description ?? "");
    const ingredients = (recipe.data?.ingredients ?? [])
      .map((i) => `${String(i?.ingredient ?? "")} ${String(i?.amount ?? "")}`)
      .join(" ");
    const instructions = (recipe.data?.instructions ?? []).join(" ");

    return `${title} ${description} ${ingredients} ${instructions}`.toLowerCase();
  }

  private rowHasSemanticViolation(row: DbRecipeRow): boolean {
    const recipe = mapDbRowToFullRecipe(row);
    const text = this.collectRecipeTextFromRow(row);
    const categories = this.normalizeCategories(recipe.categories ?? recipe.data?.categories ?? []);
    const dietaryRestrictions = Number(recipe.dietaryRestrictions ?? 0);

    const hasAny = (terms: string[]) => terms.some((t) => text.includes(t));

    const porkTerms = [
      "pork", "bacon", "ham", "prosciutto", "salami", "pepperoni",
      "guanciale", "pancetta", "lard", "chorizo", "sausage", "pork sausage"
    ];

    const shellfishTerms = [
      "shrimp", "prawn", "lobster", "crab", "scallop", "mussel",
      "clam", "oyster", "shellfish", "calamari", "squid", "octopus"
    ];

    const meatTerms = [
      "beef", "steak", "brisket", "veal", "lamb", "mutton", "goat",
      "chicken", "turkey", "duck", "shawarma", "meatball", "meatballs",
      "burger", "hamburger", "meat sauce", "ground beef", "ground lamb",
      "ground turkey", "ground chicken", "broth", "stock", "sausage",
      "pepperoni", "salami", "guanciale", "pancetta", "bacon", "ham"
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

  private async deletePairByKey(systemUserId: number, pairKey: string): Promise<void> {
    await dal.execute(
      `delete from recipe where userId = ? and pairKey = ?`,
      [systemUserId, pairKey]
    );
  }

  private async purgeInvalidAndDuplicateCatalogPairs(): Promise<void> {
    const systemUserId = await this.ensureSystemUserId();

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
        await this.deletePairByKey(systemUserId, pairKey);
        continue;
      }

      const langs = new Set(pairRows.map((r: any) => String(r.lang ?? "")));
      if (!langs.has("en") || !langs.has("he")) {
        await this.deletePairByKey(systemUserId, pairKey);
        continue;
      }

      if (pairRows.some((row) => this.rowHasSemanticViolation(row))) {
        await this.deletePairByKey(systemUserId, pairKey);
        continue;
      }

      const enRow = pairRows.find((r: any) => String(r.lang) === "en")!;
      const normalizedTitle = this.normalizeTitle((enRow as any).title ?? "");

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

      if ((normalizedTitle && seenTitles.has(normalizedTitle)) || (contentHash && seenHashes.has(contentHash))) {
        await this.deletePairByKey(systemUserId, pairKey);
        continue;
      }

      if (normalizedTitle) seenTitles.add(normalizedTitle);
      if (contentHash) seenHashes.add(contentHash);
    }
  }

  private async generateRequiredImage(
    payload: Parameters<typeof generateImage>[0],
    retries = 3
  ): Promise<string | null> {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await generateImage(payload);
        const fileName = typeof res?.fileName === "string" ? res.fileName.trim() : "";
        if (fileName) return fileName;
      } catch {
      }
    }

    return null;
  }

  private async insertSuggestionRecipe(args: {
    systemUserId: number;
    pairKey: string;
    lang: Lang;
    recipe: FullRecipeModel;
  }): Promise<void> {
    const r = args.recipe;
    const imageName =
      typeof r.imageName === "string" && r.imageName.trim()
        ? r.imageName.trim()
        : "";

    if (!imageName) {
      throw new Error("insertSuggestionRecipe: imageName is required");
    }

    const title = String(r.title ?? "").slice(0, 160);
    const description = String(r.description ?? "");
    const amountOfServings = Number(r.amountOfServings ?? 1);
    const popularity = Number(r.popularity ?? 0);

    const ingredients = (r.data?.ingredients ?? [])
      .map((i) => i.ingredient)
      .join(", ")
      .slice(0, 350);

    const instructions = (r.data?.instructions ?? [])
      .join(" | ")
      .slice(0, 1000);

    const amounts = JSON.stringify((r.data?.ingredients ?? []).map((i) => i.amount ?? null));

    const queryRestrictionsJson = JSON.stringify(this.sanitizeQueryRestrictions(r.queryRestrictions ?? []));
    const categoriesJson = JSON.stringify(this.normalizeCategories(r.categories ?? r.data?.categories ?? []));

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
    const hasLock = await this.acquireGenerationLock();
    if (!hasLock) {
      return { createdPairs: 0, createdRows: 0 };
    }

    try {
      await this.purgeInvalidAndDuplicateCatalogPairs();

      const existingPairs = await this.countCatalogPairs();
      if (existingPairs >= TOTAL_PAIRS) {
        return { createdPairs: 0, createdRows: 0 };
      }

      const missingPairs = TOTAL_PAIRS - existingPairs;

      const systemUserId = await this.ensureSystemUserId();
      const { usedTitles, usedContentHashes } = await this.getUsedKeys();
      const ideas = getIdeas("en");

      let createdPairs = 0;
      let createdRows = 0;

      for (let attempts = 0; createdPairs < missingPairs && attempts < 600; attempts++) {
        try {
          const query = ideas[Math.floor(Math.random() * ideas.length)];
          const input = this.createKosherInputModel(query);
          const data = await recipeService.generateInstructions(input, false);

          const normalizedTitle = this.normalizeTitle(data.title);
          if (!normalizedTitle || usedTitles.has(normalizedTitle)) continue;

          const normalizedCategories = this.normalizeCategories(data.categories);

          const contentHash = this.buildContentHash({
            title: data.title,
            description: data.description,
            amountOfServings: data.amountOfServings,
            ingredients: data.ingredients ?? [],
            instructions: data.instructions ?? [],
            categories: normalizedCategories
          });

          if (usedContentHashes.has(contentHash)) continue;
          if (await this.hasExistingSuggestion(systemUserId, normalizedTitle, contentHash)) continue;

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
            instructions: data.instructions,
            categories: normalizedCategories
          });

          if (!fileName) continue;

          const pairKey = crypto.randomBytes(16).toString("hex");

          const qrWithHash = this.sanitizeQueryRestrictions(data.queryRestrictions);
          qrWithHash.push(`__CONTENT_HASH__:${contentHash}`);

          const en = new FullRecipeModel({
            title: data.title,
            amountOfServings: data.amountOfServings,
            description: data.description,
            popularity: data.popularity,
            data: {
              ...data,
              categories: normalizedCategories
            },
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
            categories: normalizedCategories
          });

          const heJson = await this.translateRecipeToHebrew({
            ...data,
            queryRestrictions: this.sanitizeQueryRestrictions(data.queryRestrictions),
            categories: normalizedCategories
          });

          const heQrWithHash = this.sanitizeQueryRestrictions(heJson.queryRestrictions);
          heQrWithHash.push(`__CONTENT_HASH__:${contentHash}`);

          const he = new FullRecipeModel({
            title: heJson.title,
            amountOfServings: heJson.amountOfServings,
            description: heJson.description,
            popularity: heJson.popularity,
            data: {
              ...heJson,
              categories: normalizedCategories
            },
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
            categories: normalizedCategories
          });

          if (await this.hasExistingSuggestion(systemUserId, normalizedTitle, contentHash)) continue;

          await this.insertSuggestionRecipe({ systemUserId, pairKey, lang: "en", recipe: en });
          await this.insertSuggestionRecipe({ systemUserId, pairKey, lang: "he", recipe: he });

          usedTitles.add(normalizedTitle);
          usedContentHashes.add(contentHash);
          createdPairs++;
          createdRows += 2;
        } catch (e) {
          console.error("[suggestionsService.generateOnce] skipped candidate:", e);
          continue;
        }
      }

      return { createdPairs, createdRows };
    } finally {
      await this.releaseGenerationLock();
    }
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
            instructions: recipe.data?.instructions ?? [],
            categories: recipe.categories ?? recipe.data?.categories ?? []
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