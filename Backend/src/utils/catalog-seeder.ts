import { dal } from "./dal";
import { recipeService } from "../services/recipe-service";
import { InputModel } from "../models/input-model";
import { SugarRestriction, LactoseRestrictions, GlutenRestrictions, DietaryRestrictions, CaloryRestrictions } from "../models/filters";
import { getIdeas } from "./normalize-language";
import crypto from "crypto";

export async function seedCatalogIfNeeded(): Promise<void> {
  // Do we already have a full catalog?
  const countSql = `select count(*) as c from recipe where userId is null and pairKey is not null`;
  const countRows = await dal.execute(countSql, []) as Array<{ c: number }>;
  const existing = Number(countRows?.[0]?.c ?? 0);

  if (existing >= 100) return; // already seeded

  // We generate 50 EN; each will have a pairKey.
  // HE generation should use the SAME pairKey (mapping).
  // NOTE: This is “best-effort identical” using same prompts; if you already implemented translation,
  // call translation here instead.
  const ideasEn = getIdeas("en");
  const ideasHe = getIdeas("he");

  let madePairs = 0;

  while (madePairs < 50) {
    const pairKey = crypto.randomBytes(16).toString("hex");

    // EN (always kosher for catalog)
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

    await recipeService.saveCatalogRecipe({
      ...en,
      amountOfServings: 2
    } as any, "en", pairKey);

    // HE (same pairKey)
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

    await recipeService.saveCatalogRecipe({
      ...he,
      amountOfServings: 2
    } as any, "he", pairKey);

    madePairs++;
  }
}