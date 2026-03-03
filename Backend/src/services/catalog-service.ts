import { dal } from "../utils/dal";
import { recipeService } from "./recipe-service";
import { DbRecipeRow, FullRecipeModel, RecipeCategory } from "../models/recipe-model";
import { SugarRestriction, LactoseRestrictions, GlutenRestrictions, DietaryRestrictions, CaloryRestrictions } from "../models/filters";
import { InputModel } from "../models/input-model";
import { getIdeas } from "../utils/normalize-language";
import crypto from "crypto";
import { appConfig } from "../utils/app-config";
import axios from "axios";
import { mapDbRowToFullRecipe } from "../utils/map-recipe";
import { generateImage } from "./image-service";

type Lang = "en" | "he";
const TOTAL_PAIRS = 50;

class CatalogService {

  
  private normalizeTitle(title: unknown): string {
    return String(title ?? "")
      .trim()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "")
      .toLowerCase();
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
    const rows = await dal.execute(sql, [systemUserId]) as any[];
    return Number(rows[0]?.cnt ?? 0);
  }

  private async getUsedTitles(): Promise<Set<string>> {
    const systemUserId = await this.ensureSystemUserId();
    const sql = `select title from recipe where userId=? and pairKey is not null`;
    const rows = await dal.execute(sql, [systemUserId]) as Array<{ title: string }>;
    const set = new Set<string>();
    for (const r of rows) {
      const k = this.normalizeTitle(r.title);
      if (k) set.add(k);
    }
    return set;
  }

  private async insertCatalogRecipe(args: {
    systemUserId: number;
    pairKey: string;
    lang: Lang;
    recipe: FullRecipeModel;
  }): Promise<void> {

    const r = args.recipe;

    const title = r.title.slice(0, 160);
    const description = r.description;
    const amountOfServings = r.amountOfServings;
    const popularity = r.popularity;
    const ingredients = r.data.ingredients.map(i => i.ingredient).join(", ").slice(0, 350);
    const instructions = r.data.instructions.join(" | ").slice(0, 1000);
    const amounts = JSON.stringify(r.data.ingredients.map(i => i.amount ?? null));
    const queryRestrictionsJson = JSON.stringify(r.queryRestrictions ?? []);
    const categoriesJson = JSON.stringify((r.categories ?? r.data.categories ?? []) as RecipeCategory[]);

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
      r.totalSugar,
      r.totalProtein,
      r.healthLevel,
      r.calories,
      amounts,
      r.sugarRestriction,
      r.lactoseRestrictions,
      r.glutenRestrictions,
      r.dietaryRestrictions,
      r.caloryRestrictions,
      queryRestrictionsJson,
      r.prepTime ?? 0,
      (typeof r.difficultyLevel === "number" ? ["EASY", "MID_LEVEL", "PRO"][r.difficultyLevel] : "MID_LEVEL"),
      r.countryOfOrigin ?? "",
      null,
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
    const usedTitles = await this.getUsedTitles();
    const ideas = getIdeas("en");

    let createdPairs = 0;
    let createdRows = 0;

    for (let attempts = 0; createdPairs < TOTAL_PAIRS && attempts < 400; attempts++) {
      const query = ideas[Math.floor(Math.random() * ideas.length)];
      const input = this.createKosherInputModel(query);
      const data = await recipeService.generateInstructions(input, false);

      const normalizedTitle = this.normalizeTitle(data.title);
      if (!normalizedTitle || usedTitles.has(normalizedTitle)) continue;

      const pairKey = crypto.randomBytes(16).toString("hex");

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
        queryRestrictions: data.queryRestrictions,
        prepTime: data.prepTime,
        difficultyLevel: data.difficultyLevel,
        countryOfOrigin: String(data.countryOfOrigin ?? ""),
        imageName: null,
        userId: systemUserId,
        categories: data.categories
      });

      const heJson = await this.translateRecipeToHebrew(data);

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
        queryRestrictions: heJson.queryRestrictions,
        prepTime: heJson.prepTime,
        difficultyLevel: heJson.difficultyLevel,
        countryOfOrigin: String(heJson.countryOfOrigin ?? ""),
        imageName: null,
        userId: systemUserId,
        categories: heJson.categories
      });

      await this.insertCatalogRecipe({ systemUserId, pairKey, lang: "en", recipe: en });
      await this.insertCatalogRecipe({ systemUserId, pairKey, lang: "he", recipe: he });

      usedTitles.add(normalizedTitle);
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

      const { fileName } = await generateImage({
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
      });

      if (!fileName) continue;

      // This checks userId in WHERE; for catalog it's the system userId, so it works.
      await recipeService.setRecipeImageName(Number(row.id), systemUserId, fileName);
      updated++;
    } catch (e) {
      console.error("[attachMissingImages] failed for recipeId:", (row as any)?.id, e);
    }
  }

  return { processed: rows.length, updated };
}

}

export const catalogService = new CatalogService();