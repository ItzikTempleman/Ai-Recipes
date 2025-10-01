import { Query, RecipeModel } from "../3-models/recipe-model";

class SearchTitleService {
  public getQuery(recipe: RecipeModel): Query {
    const systemCommandDescription = "You are a culinary expert. When asked for a recipe, you output ONLY valid JSON (no markdown, no extra text).";
    const userCommandDescription = 
    `Create a concise home-cook recipe for "${recipe.title}".
    Return ONLY a JSON object in exactly this shape:
    {
       "ingredients": ["item - amount", "..."],
      "instructions": ["step 1", "step 2", "..."]
     }`
.trim();

    return { systemCommandDescription, userCommandDescription }
  }
};

export const searchTitleService = new SearchTitleService();