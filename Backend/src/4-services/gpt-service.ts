import axios from "axios";
import { appConfig } from "../2-utils/app-config";
import { GeneratedRecipeDataWithoutImage, Query } from "../3-models/recipe-model";


class GptService {
  public async getInstructions(query: Query, isWithImage:boolean): Promise<GeneratedRecipeDataWithoutImage> {
    const body = {
      model: isWithImage? appConfig.modelNumber : appConfig.freeNoImageModelNumber,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: query.systemCommandDescription },
        { role: "user", content: query.userCommandDescription }
      ],
    };

    const options = {
      headers: {
        Authorization: "Bearer " + (isWithImage? appConfig.apiKey:appConfig.freeNoImageApiKey),
        "Content-Type": "application/json"
      }
    };

    const response = await axios.post(appConfig.gptUrl, body, options)
    const content: string = response.data.choices[0].message.content;
    const formattedResponse = JSON.parse(content);

    if (!Array.isArray(formattedResponse.ingredients)|| !Array.isArray(formattedResponse.instructions)) throw new Error("Invalid json")

    return {
      ingredients: formattedResponse.ingredients,
      instructions:formattedResponse.instructions
    };
  };
};

export const gptService = new GptService();

