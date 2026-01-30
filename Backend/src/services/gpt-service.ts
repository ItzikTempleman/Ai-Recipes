import axios from "axios";
import { appConfig } from "../utils/app-config";
import { GeneratedRecipeData, Query } from "../models/recipe-model";

class GptService {
  public async getInstructions(query: Query, isWithImage: boolean): Promise<GeneratedRecipeData> {

const modelToUse = appConfig.modelNumber;
const keyToUse   = isWithImage ? appConfig.apiKey : appConfig.freeNoImageApiKey;

    const body = {
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: query.systemCommandDescription },
        { role: "user", content: query.userCommandDescription }
      ],
    };

    const response = await axios.post(appConfig.gptUrl, body, {
      headers: {
        Authorization: "Bearer " + keyToUse,
        "Content-Type": "application/json"
      }
    });

    const content: string = response.data.choices[0].message.content;
    const formattedResponse = JSON.parse(content);
    const title = formattedResponse?.title?.trim();
    const amountOfServings = formattedResponse?.amountOfServings;
    const description = formattedResponse?.description;
    const popularity = formattedResponse?.popularity;
    const ingredients = formattedResponse?.ingredients;
    const instructions = formattedResponse?.instructions;
    const totalSugar = formattedResponse?.totalSugar;
    const totalProtein = formattedResponse?.totalProtein;
    const healthLevel = formattedResponse?.healthLevel;
    const calories = Number(formattedResponse?.calories);
    const sugarRestriction = formattedResponse.sugarRestriction;
    const lactoseRestrictions = formattedResponse.lactoseRestrictions;
    const glutenRestrictions = formattedResponse.glutenRestrictions;
    const dietaryRestrictions = formattedResponse.dietaryRestrictions;
    const caloryRestrictions = formattedResponse.caloryRestrictions;
    const queryRestrictions = formattedResponse.queryRestrictions;
    const prepTime = formattedResponse.prepTime;
    const difficultyLevel = formattedResponse.difficultyLevel;
    const countryOfOrigin = formattedResponse.countryOfOrigin;
    if (
      !title ||
      !Array.isArray(ingredients) ||
      !Array.isArray(instructions) ||
      !Number.isFinite(calories)
    ) {
      throw new Error("Invalid recipe JSON");
    }
    return {
      title,
      amountOfServings,
      description,
      popularity,
      ingredients,
      instructions,
      totalSugar,
      totalProtein,
      healthLevel,
      calories: Math.max(0, Math.round(calories)),
      sugarRestriction,
      lactoseRestrictions,
      glutenRestrictions,
      dietaryRestrictions,
      caloryRestrictions,
      queryRestrictions,
      prepTime,
      difficultyLevel,
      countryOfOrigin
    };

  }

  public async askRecipeQuestion(recipe: any, userQuestion: string):Promise<string>{
      const modelToUse = appConfig.modelNumber;
  const keyToUse = appConfig.freeNoImageApiKey;

const system = `
You are Chef, a helpful cooking assistant.

Rules:
- The user is asking about THIS recipe. The recipe is provided in the request.
- NEVER say "I don't know from this recipe" or anything similar.
- If the recipe lacks details, do ONE of these:
  1) Ask up to 2 short clarifying questions, OR
  2) Give general improvements that do not contradict the recipe.
- Always reference the provided recipe content when possible (ingredients/instructions/title/description).
- Keep answers practical and concise.
- If the user asks "make it tastier", give concrete seasoning, cooking, and assembly suggestions (options) even if the recipe is basic.
`;

  const user = `
RECIPE (JSON):
${JSON.stringify(recipe)}

QUESTION:
${userQuestion}
`.trim();

  const body = {
    model: modelToUse,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.3
  };


  const response= await axios.post(appConfig.gptUrl, body,{
        headers: {
      Authorization: "Bearer " + keyToUse,
      "Content-Type": "application/json"
    }
  })
return String(response.data.choices[0].message.content ?? "").trim();
  }
}

export const gptService = new GptService();