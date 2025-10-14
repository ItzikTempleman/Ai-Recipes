import { Query, RecipeQueryModel } from "../3-models/recipe-model";

class ResponseInstructions {
  public getQuery(recipeQuery: RecipeQueryModel): Query {
    const systemCommandDescription =
      "You are a culinary expert. When asked for a recipe, you output ONLY valid JSON (no markdown, no extra text).";
    const userCommandDescription = `
Create a concise home-cook recipe for "${recipeQuery.query}".

Return ONLY a JSON object in exactly this shape:
{
  "title": string,                           // the real-world dish name (not the user's query if it differs)
  "ingredients": [ { "ingredient": "string", "amount": "string|null" }, ... ],
  "instructions": ["step 1", "..."],
  "calories": number                         // approximate total calories for the whole recipe
}
- Keep ingredients and amounts paired per item.
- If there’s no precise amount, set "amount": null or a readable phrase.
- The "title" must be the commonly-used dish name for what you’re actually describing.
`.trim();

    return { systemCommandDescription, userCommandDescription };
  }
}

export const responseInstructions = new ResponseInstructions();