import { Query, RecipeQueryModel } from "../3-models/recipe-model";

class ResponseInstructions {
  public getQuery(recipeQuery: RecipeQueryModel): Query {
const systemCommandDescription = `
You are a culinary expert.
Detect the language of the user's query and write the entire recipe in that language.
If the query is in Hebrew — respond fully in Hebrew.
If the query is in English — respond fully in English.
If the query is in any other language — respond fully in that language too.
Do not mix languages or scripts inside words.
Return ONLY valid JSON.
Do not generate food that makes no logic or conceptual sense - 
example "a pokemon head inside a cake"- but DO allow creative kinds of food as long as its really food.
`.trim();

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