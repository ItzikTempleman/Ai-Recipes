import { dal } from "./dal";
import { recipeService } from "../services/recipe-service";
import { InputModel } from "../models/input-model";
import {
  SugarRestriction,
  LactoseRestrictions,
  GlutenRestrictions,
  DietaryRestrictions,
  CaloryRestrictions
} from "../models/filters";
import { getIdeas } from "./normalize-language";
import crypto from "crypto";
import { generateImage } from "../services/image-service"; 

export async function seedSuggestionRecipeIfNeeded(): Promise<void> {
  const countSql = `select count(*) as c from recipe where userId is null and pairKey is not null`;
  const countRows = await dal.execute(countSql, []) as Array<{ c: number }>;
  const existing = Number(countRows?.[0]?.c ?? 0);

  if (existing >= 100) return;

  const ideasEn = getIdeas("en");
  const ideasHe = getIdeas("he");

  let madePairs = 0;

  while (madePairs < 50) {
    const pairKey = crypto.randomBytes(16).toString("hex");

    const qEn = ideasEn[madePairs % ideasEn.length];
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

    const en = await recipeService.generateInstructions(inputEn, false);


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

    const imageName = img?.fileName;
    if (!imageName) continue;

    await recipeService.saveSuggestionRecipe(
      { ...en, amountOfServings: 2, imageName } as any,
      "en",
      pairKey
    );


    const qHe = ideasHe[madePairs % ideasHe.length];
    const inputHe = new InputModel({
      query: qHe,
      quantity: 2,
      sugarRestriction: SugarRestriction.DEFAULT,
      lactoseRestrictions: LactoseRestrictions.DEFAULT,
      glutenRestrictions: GlutenRestrictions.DEFAULT,
      dietaryRestrictions: DietaryRestrictions.KOSHER,
      caloryRestrictions: CaloryRestrictions.DEFAULT,
      queryRestrictions: []
    } as any);

    const he = await recipeService.generateInstructions(inputHe, false);

    await recipeService.saveSuggestionRecipe(
      { ...he, amountOfServings: 2, imageName } as any,
      "he",
      pairKey
    );
    madePairs++;
  }
}