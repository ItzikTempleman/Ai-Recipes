import axios from "axios";
import { appConfig } from "../2-utils/app-config";
import { GeneratedRecipeData, Query } from "../3-models/recipe-model";

class GptService {
  public async getInstructions(query: Query, isWithImage: boolean): Promise<GeneratedRecipeData> {

    // pick correct model for this request
    const modelToUse = isWithImage
      ? appConfig.modelNumber              // "gpt-5"
      : appConfig.freeNoImageModelNumber;  // "gpt-4o-mini"

    // pick correct key for this request
    const keyToUse = isWithImage
      ? appConfig.apiKey                   // full / image-capable key
      : appConfig.freeNoImageApiKey;       // cheaper "no image" key

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
      calories: Math.max(0, Math.round(calories))
    };
  }
}

export const gptService = new GptService();






