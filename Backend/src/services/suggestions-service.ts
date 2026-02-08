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

function israelDateStr(d = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: ISRAEL_TZ }).format(d);
}

type SuggestionCountRow = { suggestionCount: number };

class SuggestionsService {

    public async generateToday(): Promise<void> {
  const suggestionDateString = israelDateStr();

  const countRows = await dal.execute(
    "select count(*) as suggestionCount from dailySuggestions where suggestionDate = ?",
    [suggestionDateString]
  ) as SuggestionCountRow[];

  const existingSuggestionCount = Number(countRows[0]?.suggestionCount ?? 0);

  if (existingSuggestionCount === DAILY_COUNT) {
    const missingRows = await dal.execute(
      `
      select count(*) as missingCount
      from dailySuggestions ds
      join recipe r on r.id = ds.recipeId
      where ds.suggestionDate = ?
        and (r.imageName is null or r.imageName = '')
      `,
      [suggestionDateString]
    ) as any[];

    const missingCount = Number(missingRows[0]?.missingCount ?? 0);
    if (missingCount === 0) return;
  }

  // ✅ delete only the suggestions rows (DO NOT delete recipes here)
  await dal.execute(
    "delete from dailySuggestions where suggestionDate = ?",
    [suggestionDateString]
  );

  const systemUserId = await this.ensureSystemUserId();

  for (let recipeIndex = 0; recipeIndex < DAILY_COUNT; recipeIndex++) {
    const randomInput = this.createRandomDailyInputModel();
    const generatedData = await recipeService.generateInstructions(randomInput, true);

    let fileName: string | null = null;
    try {
      ({ fileName } = await generateImage({
        query: randomInput.query,
        quantity: generatedData.amountOfServings ?? 1,
        sugarRestriction: generatedData.sugarRestriction,
        lactoseRestrictions: generatedData.lactoseRestrictions,
        glutenRestrictions: generatedData.glutenRestrictions,
        dietaryRestrictions: generatedData.dietaryRestrictions,
        caloryRestrictions: generatedData.caloryRestrictions,
        queryRestrictions: generatedData.queryRestrictions,
        title: generatedData.title,
        description: generatedData.description,
        ingredients: generatedData.ingredients,
        instructions: generatedData.instructions
      }));
    } catch (e) {
      console.error("Daily suggestion image generation failed:", e);
    }

    const recipeToSave = new FullRecipeModel({
      title: generatedData.title,
      amountOfServings: generatedData.amountOfServings,
      description: generatedData.description,
      popularity: generatedData.popularity,
      data: generatedData,
      totalSugar: generatedData.totalSugar,
      totalProtein: generatedData.totalProtein,
      healthLevel: generatedData.healthLevel,
      calories: generatedData.calories,
      sugarRestriction: generatedData.sugarRestriction,
      lactoseRestrictions: generatedData.lactoseRestrictions,
      glutenRestrictions: generatedData.glutenRestrictions,
      dietaryRestrictions: generatedData.dietaryRestrictions,
      caloryRestrictions: generatedData.caloryRestrictions,
      queryRestrictions: generatedData.queryRestrictions,
      prepTime: generatedData.prepTime,
      difficultyLevel: generatedData.difficultyLevel,
      countryOfOrigin: String(generatedData.countryOfOrigin ?? ""),
      imageName: fileName,
      userId: systemUserId
    });

    const savedRecipe = await recipeService.saveRecipe(recipeToSave, systemUserId);

    if (!savedRecipe.id) throw new Error("Failed to insert daily recipe: missing inserted id");

    await dal.execute(
      "insert into dailySuggestions (suggestionDate, recipeId) values (?, ?)",
      [suggestionDateString, savedRecipe.id]
    );
  }
}


    public async getToday(): Promise<SuggestionsModel> {
        await this.generateToday();
        const suggestionDateString = israelDateStr();

        const selectSql = "select recipe.* from dailySuggestions join recipe on recipe.id = dailySuggestions.recipeId where dailySuggestions.suggestionDate = ? order by dailySuggestions.id asc";
        const selectValues = [suggestionDateString];
        const recipeRows = await dal.execute(selectSql, selectValues) as DbRecipeRow[];

        const recipes = recipeRows.map(mapDbRowToFullRecipe);

        const suggestions = new SuggestionsModel(
            {
                suggestionDate: suggestionDateString,
                recipes: recipes
            } as unknown as SuggestionsModel);
            suggestions.validate();
        return suggestions;
    };

    private createRandomDailyInputModel(): InputModel {

        const queryIdeas: string[] = [
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

        const randomIdeaIndex = Math.floor(Math.random() * queryIdeas.length);
        const queryText = queryIdeas[randomIdeaIndex];

        const inputSeed = {
            query: queryText,
            quantity: 1,
            sugarRestriction: SugarRestriction.DEFAULT,
            lactoseRestrictions: LactoseRestrictions.DEFAULT,
            glutenRestrictions: GlutenRestrictions.DEFAULT,
            dietaryRestrictions: DietaryRestrictions.DEFAULT,
            caloryRestrictions: CaloryRestrictions.DEFAULT,
            queryRestrictions: []
        };

        const inputModel = new InputModel(inputSeed as unknown as InputModel);

        inputModel.validate();
        return inputModel;
    }


    private async ensureSystemUserId(): Promise<number> {

        const systemEmail = "system.generator@smart-recipes.local";
        const selectUserSql = "select id from user where email = ? limit 1";
        const selectUserValues = [systemEmail];

        const existingUserRows = await dal.execute(selectUserSql, selectUserValues) as UserIdRow[];
        const existingUserId = existingUserRows[0]?.id;

        if (existingUserId) return existingUserId;

        const insertUserSql = "insert into user (firstName, familyName, email, password, phoneNumber, Gender, birthDate, imageName) values (?, ?, ?, ?, ?, ?, ?, ?)";
        const insertUserValues = [
            "System",
            "Generator",
            systemEmail,
            "SYSTEM_GENERATED_NO_LOGIN",
            null,
            null,
            null,
            null
        ];

        const insertUserResult = await dal.execute(insertUserSql, insertUserValues) as { insertId: number };
        return insertUserResult.insertId;
    }
}

export const suggestionsService = new SuggestionsService();