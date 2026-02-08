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

const ISRAEL_TZ = "Asia/Jerusalem";
const DAILY_COUNT = 5;

type UserIdRow = { id: number };
type DailyLang = "en" | "he";

function israelDateStr(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(d);
}

class SuggestionsService {

  public async generateToday(lang: DailyLang = "en"): Promise<void> {

    const suggestionDateString = israelDateStr();

    const lockSql = "select GET_LOCK(?, 10) as gotLock";
    const lockValues = [`dailySuggestions:${suggestionDateString}`];
    const lockRows = await dal.execute(lockSql, lockValues) as any[];

    if (Number(lockRows[0]?.gotLock ?? 0) !== 1) return;

    try {
      const existsSql =
        "select 1 from dailySuggestions where suggestionDate = ? limit 1";
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

          const normalizedTitle = String(data.title ?? "")
            .trim()
            .normalize("NFKC")
            .replace(/\s+/g, " ")
            .replace(/[’'"״׳“”\-–—.,:;!()?[\]{}]/g, "")
            .toLowerCase();

          if (!normalizedTitle) continue;

          const dedupeKey =
            normalizedTitle +
            "|" +
            data.ingredients.map(i => i.ingredient).join(",");

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
            console.error("Daily suggestion image generation failed:", e);
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

          const insertSql =
            "insert into dailySuggestions (suggestionDate, recipeId) values (?, ?)";
          const insertValues = [suggestionDateString, saved.id];
          await dal.execute(insertSql, insertValues);

          usedKeys.add(dedupeKey);
          if (fileName) usedImageNames.add(fileName);

          recipeIndex++;
        } catch (e) {
          console.error("Daily suggestion iteration failed:", e);
        }
      }

    } finally {
      const releaseSql = "select RELEASE_LOCK(?)";
      const releaseValues = [`dailySuggestions:${suggestionDateString}`];
      await dal.execute(releaseSql, releaseValues);
    }
  }

  public async getToday(): Promise<SuggestionsModel> {

    const suggestionDateString = israelDateStr();

    const sql = `
      select recipe.*
      from dailySuggestions
      join recipe on recipe.id = dailySuggestions.recipeId
      where dailySuggestions.suggestionDate = ?
      order by dailySuggestions.id asc
      limit 5
    `;
    const values = [suggestionDateString];

    const rows = await dal.execute(sql, values) as DbRecipeRow[];
    const recipes = rows.map(mapDbRowToFullRecipe);

    const model = new SuggestionsModel({
      suggestionDate: suggestionDateString,
      recipes
    } as unknown as SuggestionsModel);

    model.validate();
    return model;
  }

  private createRandomDailyInputModel(lang: DailyLang = "en"): InputModel {
    const ideasEn = [
      "Popular real dinner recipe",
      "Popular real breakfast recipe",
      "Popular real lunch recipe",
      "Popular real vegetarian recipe",
      "Popular real chicken dish",
      "Popular real pasta dish",
      "Popular real salad recipe",
      "Popular real soup recipe",
      "Popular real Mediterranean dish",
      "Popular real Israeli dish",
      "Popular real Asian dish",
      "Popular real dessert recipe"
    ];

    const ideasHe = [
      "מתכון אמיתי ופופולרי לארוחת ערב",
      "מתכון אמיתי ופופולרי לארוחת בוקר",
      "מתכון אמיתי ופופולרי לארוחת צהריים",
      "מתכון צמחוני אמיתי ופופולרי",
      "מנה אמיתית ופופולרית עם עוף",
      "מנה אמיתית ופופולרית עם פסטה",
      "מתכון אמיתי ופופולרי לסלט",
      "מתכון אמיתי ופופולרי למרק",
      "מנה ים־תיכונית אמיתית ופופולרית",
      "מנה ישראלית אמיתית ופופולרית",
      "מנה אסייתית אמיתית ופופולרית",
      "מתכון אמיתי ופופולרי לקינוח"
    ];

    const ideas = lang === "he" ? ideasHe : ideasEn;
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

    const selectSql = "select id from user where email = ? limit 1";
    const selectValues = ["system.generator@smart-recipes.local"];
    const rows = await dal.execute(selectSql, selectValues) as UserIdRow[];

    if (rows[0]?.id) return rows[0].id;

    const insertSql =
      "insert into user (firstName, familyName, email, password) values (?, ?, ?, ?)";
    const insertValues = [
      "System",
      "Generator",
      "system.generator@smart-recipes.local",
      "SYSTEM_GENERATED_NO_LOGIN"
    ];

    const result = await dal.execute(insertSql, insertValues) as { insertId: number };
    return result.insertId;
  }
}

export const suggestionsService = new SuggestionsService();
