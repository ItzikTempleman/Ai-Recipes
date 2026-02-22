import { InputModel } from "../models/input-model";
import { SuggestionsModel } from "../models/suggestions-model";
import { dal } from "../utils/dal";
import { recipeService } from "./recipe-service";
import {
  SugarRestriction,
  LactoseRestrictions,
  GlutenRestrictions,
  DietaryRestrictions,
  CaloryRestrictions
} from "../models/filters";
import { DbRecipeRow, FullRecipeModel } from "../models/recipe-model";
import { mapDbRowToFullRecipe } from "../utils/map-recipe";
import { generateImage } from "./image-service";
import { getIdeas } from "../utils/normalize-language";

const ISRAEL_TZ = "Asia/Jerusalem";
const DAILY_TOTAL = 8;
const DAILY_PER_LANG = 4;
const DAILY_RETURN = 4;

type DailyLang = "en" | "he";
const generationMutexByDate = new Map<string, Promise<void>>();

class SuggestionsService {
  private isHebrewText(s: string): boolean {
    return /[\u0590-\u05FF]/.test(s);
  }

  private getTodayDateString(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(new Date());
  }

  private normalizeTitle(title: unknown): string {
    return String(title ?? "")
      .trim()
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "")
      .toLowerCase();
  }

  private async withDateMutex(dateKey: string, fn: () => Promise<void>): Promise<void> {
    const existing = generationMutexByDate.get(dateKey);
    if (existing) return existing;

    const p = (async () => {
      try {
        await fn();
      } finally {
        generationMutexByDate.delete(dateKey);
      }
    })();

    generationMutexByDate.set(dateKey, p);
    return p;
  }

  private async getExistingNormalizedTitlesForDate(suggestionDateString: string): Promise<Set<string>> {
    const sql = `
      select recipe.title as title
      from dailySuggestions
      join recipe on recipe.id = dailySuggestions.recipeId
      where dailySuggestions.suggestionDate = ?
    `;
    const rows = (await dal.execute(sql, [suggestionDateString])) as Array<{ title: string }>;
    const set = new Set<string>();
    for (const r of rows) {
      const key = this.normalizeTitle(r.title);
      if (key) set.add(key);
    }
    return set;
  }

  private async countExistingForDate(suggestionDateString: string): Promise<number> {
    const sql = `select count(*) as cnt from dailySuggestions where suggestionDate = ?`;
    const rows = (await dal.execute(sql, [suggestionDateString])) as any[];
    return Number(rows[0]?.cnt ?? 0);
  }

  private async titleAlreadySuggestedToday(suggestionDateString: string, normalizedTitle: string): Promise<boolean> {
    const sql = `
      select recipe.title as title
      from dailySuggestions
      join recipe on recipe.id = dailySuggestions.recipeId
      where dailySuggestions.suggestionDate = ?
    `;
    const rows = (await dal.execute(sql, [suggestionDateString])) as Array<{ title: string }>;
    for (const r of rows) {
      if (this.normalizeTitle(r.title) === normalizedTitle) return true;
    }
    return false;
  }

  public async generateToday(_: DailyLang = "en"): Promise<void> {
    const suggestionDateString = this.getTodayDateString();
    return this.withDateMutex(suggestionDateString, async () => {
      const existingCount = await this.countExistingForDate(suggestionDateString);
      if (existingCount >= DAILY_TOTAL) return;
      const systemUserId = await this.ensureSystemUserId();
      const usedKeys = await this.getExistingNormalizedTitlesForDate(suggestionDateString);
      const usedImageNames = new Set<string>();
      const plan: DailyLang[] = [
        ...Array(DAILY_PER_LANG).fill("en"),
        ...Array(DAILY_PER_LANG).fill("he")
      ];
      const maxAttempts = 180; 
      let attempts = 0;
      let recipeIndex = existingCount;

      for (; recipeIndex < DAILY_TOTAL && attempts < maxAttempts; attempts++) {
        try {
          const plannedLang = plan[recipeIndex] ?? "en";
          const input = this.createRandomDailyInputModel(plannedLang);
          const data = await recipeService.generateInstructions(input, true);
          const titleRaw = String(data.title ?? "");
          const titleIsHe = this.isHebrewText(titleRaw);
          if (plannedLang === "he" && !titleIsHe) continue;
          if (plannedLang === "en" && titleIsHe) continue;
          const normalizedTitle = this.normalizeTitle(titleRaw);
          if (!normalizedTitle) continue;
          if (usedKeys.has(normalizedTitle)) continue;
          let fileName: string | null = null;
          try {
            ({ fileName } = await generateImage({
              query: input.query,
              quantity: data.amountOfServings ?? 1,
              sugarRestriction: data.sugarRestriction,
              lactoseRestrictions: data.lactoseRestrictions,
              glutenRestrictions: data.glutenRestrictions,
              dietaryRestrictions: data.dietaryRestrictions,
              caloryRestrictions: data.caloryRestrictions,
              queryRestrictions: data.queryRestrictions,
              title: data.title,
              description: data.description,
              ingredients: data.ingredients,
              instructions: data.instructions
            }));
          } catch (e) {
            console.error(`Daily suggestion image generation failed:`, e);
          }

          if (fileName && usedImageNames.has(fileName)) continue;

          const recipe = new FullRecipeModel({
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
            dietaryRestrictions: data.dietaryRestrictions,
            caloryRestrictions: data.caloryRestrictions,
            queryRestrictions: data.queryRestrictions,
            prepTime: data.prepTime,
            difficultyLevel: data.difficultyLevel,
            countryOfOrigin: String(data.countryOfOrigin ?? ""),
            imageName: fileName,
            userId: systemUserId
          });

          const saved = await recipeService.saveRecipe(recipe, systemUserId);
          if (!saved.id) throw new Error("Recipe insert failed");
          const alreadySuggested = await this.titleAlreadySuggestedToday(suggestionDateString, normalizedTitle);
          if (alreadySuggested) {
            usedKeys.add(normalizedTitle);
            if (fileName) usedImageNames.add(fileName);
            continue;
          }

          const insertSql = `insert into dailySuggestions (suggestionDate, recipeId) values (?, ?)`;
          await dal.execute(insertSql, [suggestionDateString, saved.id]);

          usedKeys.add(normalizedTitle);
          if (fileName) usedImageNames.add(fileName);

          recipeIndex++;
        } catch (e) {
          console.error(`Daily suggestion iteration failed:`, e);
        }
      }
    });
  }

  public async getToday(lang: DailyLang = "en"): Promise<SuggestionsModel> {
    const suggestionDateString = this.getTodayDateString();

    const sql = `
      select recipe.* 
      from dailySuggestions 
      join recipe on recipe.id = dailySuggestions.recipeId 
      where dailySuggestions.suggestionDate = ? 
      order by dailySuggestions.id asc 
      limit 12
    `;
    const rows = (await dal.execute(sql, [suggestionDateString])) as DbRecipeRow[];
    const all = rows.map(mapDbRowToFullRecipe);

    const wantHebrew = lang === "he";
    const filtered = all.filter((r) => {
      const title = String((r as any).title ?? "");
      const isHe = this.isHebrewText(title);
      return wantHebrew ? isHe : !isHe;
    });

    const recipes =
      filtered.length >= DAILY_RETURN
        ? filtered.slice(0, DAILY_RETURN)
        : [...filtered, ...all.filter((x) => !filtered.includes(x))].slice(0, DAILY_RETURN);

    const model = new SuggestionsModel({
      suggestionDate: suggestionDateString,
      recipes
    } as unknown as SuggestionsModel);

    model.validate();
    return model;
  }

  private createRandomDailyInputModel(lang: DailyLang = "en"): InputModel {
    const ideas = getIdeas(lang);
    const query = ideas[Math.floor(Math.random() * ideas.length)];

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

  private async ensureSystemUserId(): Promise<number> {
    const email = "system.generator@smart-recipes.local";
    const sql = `insert into user (firstName, familyName, email, password)
                 values (?, ?, ?, ?)
                 on duplicate key update id = LAST_INSERT_ID(id)`;
    const values = ["System", "Generator", email, "SYSTEM_GENERATED_NO_LOGIN"];

    const result = (await dal.execute(sql, values)) as { insertId: number };
    return result.insertId;
  }
}

export const suggestionsService = new SuggestionsService();