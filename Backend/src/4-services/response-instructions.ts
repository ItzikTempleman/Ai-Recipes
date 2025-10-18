import { Query, QueryModel } from "../3-models/recipe-model";

class ResponseInstructions {
  public getQueryFromText(text: string): Query {
    
const systemCommandDescription = `
You are a culinary expert. 
Detect the language of the user's query and write the entire recipe in that language. 
If the query is in Hebrew — respond fully in Hebrew.
 If the query is in English — respond fully in English. 
 If the query is in any other language — respond fully in that language too.
  Do not mix languages or scripts inside words.
   Return ONLY valid JSON. Do not generate food that makes no logic or conceptual sense
    - example "a pokemon head inside a cake"- 
    but DO allow creative kinds of food as long as its really food.` 
    .trim();
 const userCommandDescription = `
 Create a concise home-cook recipe 
 for "${text}".
  Return ONLY a JSON object in exactly this shape:
   { 
    "title":string,               // the real-world dish name (not the user's query if it differs) 
    "amountOfServings":number,
    "description":string,          // describe in simple words what the dish is. if the dish is fictional- start with "fictional dish" 
    "popularity":number,           // rate based on real world survey approximately from 1 to 10 only rounded numbers. if no data is available return 0
    "ingredients": [{ "ingredient": "string", "amount": "string|null" }, ... ], 
    "instructions": ["step 1", "..."],
    "totalSugar": number,         // approximate total sugar in grams for the whole recipe
    "totalProtein":number,        // approximate total protein in grams for the whole dish
    "healthLevel":number,         // approximate overall health level from 1 to 10 in 0.1 steps. example: 5.1, 5.2, 5.3
    "calories": number,           // approximate total calories for the whole recipe 
    } 
    - Keep ingredients and amounts paired per item.
    - If there’s no precise amount, set "amount": null or a readable phrase. - The "title" must be the commonly-used dish name for what you’re actually describing.`
    .trim();

    return { systemCommandDescription, userCommandDescription };
  }

  public getQuery(recipeQuery: QueryModel): Query {
    return this.getQueryFromText(recipeQuery.query);
  }
}

export const responseInstructions = new ResponseInstructions();
