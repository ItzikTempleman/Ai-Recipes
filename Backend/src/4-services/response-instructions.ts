import { Query, RecipeTitleModel } from "../3-models/recipe-model";

class ResponseInstructions {
  public getQuery(recipeTitle: RecipeTitleModel): Query {
    const systemCommandDescription = "You are a culinary expert. When asked for a recipe, you output ONLY valid JSON (no markdown, no extra text).";
    const userCommandDescription = 
    `Create a concise home-cook recipe for "${recipeTitle.title}".
Return ONLY a JSON object in exactly this shape:
{
  "ingredients": [ { "ingredient": "string", "amount": "string|null" }, ... ],
  "instructions": ["step 1", "..."]
}
- Keep ingredients and amounts paired per item.
- If there’s no precise amount, set "amount": null or a readable phrase.`
.trim();
    return { systemCommandDescription, userCommandDescription }
  }
};

export const responseInstructions = new ResponseInstructions();