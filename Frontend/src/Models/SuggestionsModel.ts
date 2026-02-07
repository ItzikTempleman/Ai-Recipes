import { RecipeModel } from "./RecipeModel";

export type SuggestionsModel = {
  suggestionDate: string; 
  recipes: RecipeModel[];
};