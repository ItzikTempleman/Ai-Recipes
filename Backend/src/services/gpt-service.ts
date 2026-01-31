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

public async askRecipeQuestion(
  recipe: any,
  userQuestion: string,
  history: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  const modelToUse = appConfig.modelNumber;
  const keyToUse = appConfig.freeNoImageApiKey;

const system = `
You are Chef, a helpful cooking assistant.

Hard rules:
- NEVER use markdown headings or titles. Do not use "#", "##", "###", or any heading-style formatting.
- Write in plain paragraphs or simple bullet points only ("-" or "•" are allowed).
- Do NOT use inability/disclaimer language (never say: "I don't know", "not provided", "can't tell", "unclear", "missing").
- If details aren't present, assume sensible defaults and give 2–3 plausible options.
- Ask clarifying questions ONLY if the user cannot proceed safely without the answer (max 2 questions).
- Keep answers practical, specific, and friendly. No lecturing.

Context:
- The user is asking about THIS recipe. You'll receive it as JSON.
- Reference the recipe content whenever possible (ingredients/instructions/title/description/restrictions).
`.trim();

  const safeHistory = Array.isArray(history)
    ? history
        .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-12)
    : [];

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: system },
    {
      role: "user",
      content: `RECIPE (JSON):\n${JSON.stringify(recipe)}`
    },
    ...safeHistory.map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userQuestion }
  ];

  const body = {
    model: modelToUse,
    messages,
    temperature: 0.3
  };

  const response = await axios.post(appConfig.gptUrl, body, {
    headers: {
      Authorization: "Bearer " + keyToUse,
      "Content-Type": "application/json"
    }
  });

  return String(response.data.choices[0].message.content ?? "").trim();
}

}

export const gptService = new GptService();