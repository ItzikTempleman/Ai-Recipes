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
const DAILY_COUNT = 5;

type UserIdRow = { id: number };
type DailyLang = "en" | "he";


class SuggestionsService {

  public async generateToday(lang: DailyLang = "en"): Promise<void> {

    const suggestionDateString = new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(new Date());

    const lockSql = `select GET_LOCK(?, 10) as gotLock`;
    const lockValues = [`dailySuggestions:${suggestionDateString}`];
    const lockRows = await dal.execute(lockSql, lockValues) as any[];

    if (Number(lockRows[0]?.gotLock ?? 0) !== 1) return;

    try {
      const existsSql = `select count(*) as cnt from dailySuggestions where suggestionDate = ?`;
      const existsValues = [suggestionDateString];
      const existing = await dal.execute(existsSql, existsValues) as any[];

      if (Number(existing[0]?.cnt ?? 0) >= DAILY_COUNT) return;

      const systemUserId = await this.ensureSystemUserId();

      const usedKeys = new Set<string>();
      const usedImageNames = new Set<string>();

      const maxAttempts = 60;
      let attempts = 0;

      for (let recipeIndex = 0; recipeIndex < DAILY_COUNT && attempts < maxAttempts; attempts++) {
        try {
          const input = this.createRandomDailyInputModel(lang);
          const data = await recipeService.generateInstructions(input, true);
          const normalizedTitle = String(data.title ?? "").trim().normalize(`NFKC`).replace(/\s+/g, " ").replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "").toLowerCase();
          if (!normalizedTitle) continue;
          const dedupeKey = normalizedTitle;
          if (usedKeys.has(dedupeKey)) continue;
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
          }
        );

          const saved = await recipeService.saveRecipe(recipe, systemUserId);
          if (!saved.id) throw new Error("Recipe insert failed");

          const insertSql = `insert ignore into dailySuggestions (suggestionDate, recipeId) values (?, ?)`;
          const insertValues = [suggestionDateString, saved.id];
          await dal.execute(insertSql, insertValues);

          usedKeys.add(dedupeKey);
          if (fileName) usedImageNames.add(fileName);

          recipeIndex++;
        } catch (e) {
          console.error(`Daily suggestion iteration failed:`, e);
        }
      }

    } finally {
      const releaseSql = "select RELEASE_LOCK(?)";
      const releaseValues = [`dailySuggestions:${suggestionDateString}`];
      await dal.execute(releaseSql, releaseValues);
    }
  }

  public async getToday(): Promise<SuggestionsModel> {

    const suggestionDateString = new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(new Date());

    const sql = `select recipe.* from dailySuggestions join recipe on recipe.id = dailySuggestions.recipeId where dailySuggestions.suggestionDate = ? order by dailySuggestions.id asc limit 5`;
    const values = [suggestionDateString];
    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    const recipes = rows.map(mapDbRowToFullRecipe);

    const model = new SuggestionsModel(
      {
        suggestionDate: suggestionDateString,
        recipes
      } as unknown as SuggestionsModel);

    model.validate();
    return model;
  }

  private createRandomDailyInputModel(lang: DailyLang = "en"): InputModel {
    const ideas = getIdeas(lang);
    const query = ideas[Math.floor(Math.random() * ideas.length)];

    const model = new InputModel(
      {
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
  const sql = `insert into user (firstName, familyName, email, password)values (?, ?, ?, ?) on duplicate key update id = LAST_INSERT_ID(id)
  `;
  const values = ["System", "Generator", email, "SYSTEM_GENERATED_NO_LOGIN"];

  const result = await dal.execute(sql, values) as { insertId: number };
  return result.insertId;
}


}

export const suggestionsService = new SuggestionsService();
