import axios from "axios";
import { appConfig } from "../2-utils/app-config";
import { GeneratedRecipeData, Query } from "../3-models/recipe-model";


class GptService {
  public async getInstructions(query: Query, isWithImage: boolean): Promise<GeneratedRecipeData> {
    const body = {
      model: isWithImage ? appConfig.modelNumber : appConfig.freeNoImageModelNumber,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: query.systemCommandDescription },
        { role: "user", content: query.userCommandDescription }
      ],
    };

    const options = {
      headers: {
        Authorization: "Bearer " + (isWithImage ? appConfig.apiKey : appConfig.freeNoImageApiKey),
        "Content-Type": "application/json"
      }
    };

    const response = await axios.post(appConfig.gptUrl, body, options)
    const content: string = response.data.choices[0].message.content;
    const formattedResponse = JSON.parse(content);



    const title = formattedResponse?.title?.trim() || formattedResponse?.tittle?.trim();
    const ingredients = formattedResponse?.ingredients;
    const instructions = formattedResponse?.instructions;
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
      ingredients,
      instructions,
      calories: Math.max(0, Math.round(calories))
    };
  }
}

export const gptService = new GptService();

