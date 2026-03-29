import axios from "axios";
import { appConfig } from "../utils/app-config";
import {
  GeneratedRecipeData,
  Query,
  RecipeCategory
} from "../models/recipe-model";
import { editSignals } from "../utils/edit-recipe-trigger-list";
import { gptPrompts } from "../utils/gpt-prompts";

export type RecipeChatEditResult =
  | {
      mode: "answer";
      answer: string;
    }
  | {
      mode: "edit";
      answer: string;
      recipe: {
        title: string;
        description: string;
        amountOfServings: number;
        ingredients: { ingredient: string; amount: string | null }[];
        instructions: string[];
        totalSugar?: number;
        totalProtein?: number;
        calories?: number;
        prepTime?: number;
        categories?: RecipeCategory[];
        sugarRestriction?: number;
        lactoseRestrictions?: number;
        glutenRestrictions?: number;
        dietaryRestrictions?: number;
        difficultyLevel?: number;
        countryOfOrigin?: string;
        queryRestrictions?: any[];
      };
    };

const NON_PREMIUM_EDIT_PREFIX = {
  en: "Only premium users can actually edit and save the recipe in the chatbot. ",
  he: "רק משתמשי פרימיום יכולים לערוך ולשמור בפועל את המתכון דרך הצ'אטבוט. "
} as const;

class GptService {
  private normalizeForIntent(text: string): string {
    return String(text ?? "")
      .toLowerCase()
      .replace(/[׳']/g, "'")
      .replace(/[״"]/g, '"')
      .replace(/[.,!?;:()[\]"`]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private isEditIntentHeuristic(userQuestion: string): boolean {
    const normalizedQuestion = this.normalizeForIntent(userQuestion);
    return editSignals.some(signal =>
      normalizedQuestion.includes(this.normalizeForIntent(signal))
    );
  }

  private isLikelyHebrew(text: string): boolean {
    return /[\u0590-\u05FF]/.test(String(text ?? ""));
  }

  private getNonPremiumEditPrefix(userQuestion: string): string {
    return this.isLikelyHebrew(userQuestion)
      ? NON_PREMIUM_EDIT_PREFIX.he
      : NON_PREMIUM_EDIT_PREFIX.en;
  }

  public async classifyRecipeChatIntent(
    recipe: {
      title: string;
      description: string;
      amountOfServings: number;
      ingredients: { ingredient: string; amount: string | null }[];
      instructions: string[];
      restrictions?: any;
    },
    userQuestion: string,
    history: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<"question" | "edit_request"> {
    const modelToUse =
      appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            message =>
              message &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string"
          )
          .slice(-8)
      : [];

    const system = gptPrompts.getClassifyRecipeChatIntentPrompt();

    const body = {
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `RECIPE_JSON:\n${JSON.stringify(recipe)}\n\n` +
            `CHAT_HISTORY:\n${JSON.stringify(safeHistory)}\n\n` +
            `USER_MESSAGE:\n${userQuestion}`
        }
      ],
      temperature: 0
    };

    try {
      const response = await axios.post(appConfig.gptUrl, body, {
        headers: {
          Authorization: "Bearer " + keyToUse,
          "Content-Type": "application/json"
        }
      });

      const raw = String(
        response.data?.choices?.[0]?.message?.content ?? ""
      ).trim();

      const parsed = JSON.parse(raw);

      return parsed?.intent === "edit_request" ? "edit_request" : "question";
    } catch (error: any) {
      console.error("classifyRecipeChatIntent error:", {
        model: modelToUse,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        userQuestion
      });
      throw error;
    }
  }

  public async getInstructions(
    query: Query,
    isWithImage: boolean
  ): Promise<GeneratedRecipeData> {
    const modelToUse = appConfig.modelNumber;
    const keyToUse = isWithImage
      ? appConfig.apiKey || appConfig.freeNoImageApiKey
      : appConfig.freeNoImageApiKey || appConfig.apiKey;

    const body = {
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: query.systemCommandDescription },
        { role: "user", content: query.userCommandDescription }
      ]
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
    const categories = formattedResponse?.categories;
    const totalSugar = formattedResponse?.totalSugar;
    const totalProtein = formattedResponse?.totalProtein;
    const healthLevel = formattedResponse?.healthLevel;
    const calories = Number(formattedResponse?.calories);
    const sugarRestriction = formattedResponse?.sugarRestriction;
    const lactoseRestrictions = formattedResponse?.lactoseRestrictions;
    const glutenRestrictions = formattedResponse?.glutenRestrictions;
    const dietaryRestrictions = formattedResponse?.dietaryRestrictions;
    const caloryRestrictions = formattedResponse?.caloryRestrictions;
    const queryRestrictions = formattedResponse?.queryRestrictions;
    const prepTime = formattedResponse?.prepTime;
    const difficultyLevel = formattedResponse?.difficultyLevel;
    const countryOfOrigin = formattedResponse?.countryOfOrigin;

    if (
      !title ||
      !Array.isArray(ingredients) ||
      !Array.isArray(instructions) ||
      !Number.isFinite(calories) ||
      !Array.isArray(categories)
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
      countryOfOrigin,
      categories
    };
  }

  public async askRecipeQuestion(
    recipe: any,
    userQuestion: string,
    history: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<string> {
    const modelToUse =
      appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const system = gptPrompts.getAskRecipeQuestionPrompt();

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            message =>
              message &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string"
          )
          .slice(-12)
      : [];

    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [
      { role: "system", content: system },
      {
        role: "user",
        content: `RECIPE (JSON):\n${JSON.stringify(recipe)}`
      },
      ...safeHistory.map(message => ({
        role: message.role,
        content: message.content
      })),
      { role: "user", content: userQuestion }
    ];

    const body = {
      model: modelToUse,
      messages,
      temperature: 0.3
    };

    try {
      const response = await axios.post(appConfig.gptUrl, body, {
        headers: {
          Authorization: "Bearer " + keyToUse,
          "Content-Type": "application/json"
        }
      });

      return String(response.data?.choices?.[0]?.message?.content ?? "").trim();
    } catch (error: any) {
      console.error("askRecipeQuestion error:", {
        model: modelToUse,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        userQuestion
      });
      throw error;
    }
  }

  private async generateRecipeEdit(
    recipe: {
      title: string;
      description: string;
      amountOfServings: number;
      ingredients: { ingredient: string; amount: string | null }[];
      instructions: string[];
      restrictions?: any;
    },
    userQuestion: string,
    history: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<Extract<RecipeChatEditResult, { mode: "edit" }>> {
    const modelToUse =
      appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            message =>
              message &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string"
          )
          .slice(-12)
      : [];

    const system = gptPrompts.getGenerateRecipeEditPrompt();

    const body = {
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `CURRENT_RECIPE_JSON:\n${JSON.stringify(recipe)}\n\n` +
            `CURRENT_RESTRICTIONS_JSON:\n${JSON.stringify(
              recipe.restrictions ?? {}
            )}`
        },
        ...safeHistory.map(message => ({
          role: message.role,
          content: message.content
        })),
        { role: "user", content: userQuestion }
      ],
      temperature: 0.2
    };

    const response = await axios.post(appConfig.gptUrl, body, {
      headers: {
        Authorization: "Bearer " + keyToUse,
        "Content-Type": "application/json"
      }
    });

    const raw = String(
      response.data?.choices?.[0]?.message?.content ?? ""
    ).trim();

    const parsed = JSON.parse(raw);

    const fallbackIngredients = Array.isArray(recipe.ingredients)
      ? recipe.ingredients
      : [];
    const fallbackInstructions = Array.isArray(recipe.instructions)
      ? recipe.instructions
      : [];

    const compactInstructions = Array.isArray(parsed?.recipe?.instructions)
      ? parsed.recipe.instructions
          .map((step: any) => String(step ?? "").trim())
          .filter(Boolean)
          .slice(0, 8)
          .map((step: string) =>
            step.length > 140 ? step.slice(0, 140).trim() : step
          )
      : fallbackInstructions;

    const compactIngredients = Array.isArray(parsed?.recipe?.ingredients)
      ? parsed.recipe.ingredients
          .map((item: any) => ({
            ingredient: String(item?.ingredient ?? "").trim().slice(0, 80),
            amount:
              item?.amount == null
                ? null
                : String(item.amount).trim().slice(0, 60)
          }))
          .filter(
            (item: { ingredient: string; amount: string | null }) =>
              item.ingredient.length > 0
          )
          .slice(0, 20)
      : fallbackIngredients;

    return {
      mode: "edit",
      answer: String(parsed?.answer ?? "Updated your recipe.")
        .trim()
        .slice(0, 300),
      recipe: {
        title: String(parsed?.recipe?.title ?? recipe.title)
          .trim()
          .slice(0, 100),
        description: String(parsed?.recipe?.description ?? recipe.description)
          .trim()
          .slice(0, 1000),
        amountOfServings:
          Number(parsed?.recipe?.amountOfServings ?? recipe.amountOfServings) ||
          recipe.amountOfServings,
        ingredients: compactIngredients,
        instructions: compactInstructions,
        totalSugar:
          parsed?.recipe?.totalSugar != null
            ? Number(parsed.recipe.totalSugar)
            : undefined,
        totalProtein:
          parsed?.recipe?.totalProtein != null
            ? Number(parsed.recipe.totalProtein)
            : undefined,
        calories:
          parsed?.recipe?.calories != null
            ? Number(parsed.recipe.calories)
            : undefined,
        prepTime:
          parsed?.recipe?.prepTime != null
            ? Number(parsed.recipe.prepTime)
            : undefined,
        categories: Array.isArray(parsed?.recipe?.categories)
          ? parsed.recipe.categories
          : undefined,
        sugarRestriction:
          parsed?.recipe?.sugarRestriction != null
            ? Number(parsed.recipe.sugarRestriction)
            : undefined,
        lactoseRestrictions:
          parsed?.recipe?.lactoseRestrictions != null
            ? Number(parsed.recipe.lactoseRestrictions)
            : undefined,
        glutenRestrictions:
          parsed?.recipe?.glutenRestrictions != null
            ? Number(parsed.recipe.glutenRestrictions)
            : undefined,
        dietaryRestrictions:
          parsed?.recipe?.dietaryRestrictions != null
            ? Number(parsed.recipe.dietaryRestrictions)
            : undefined,
        difficultyLevel:
          parsed?.recipe?.difficultyLevel != null
            ? Number(parsed.recipe.difficultyLevel)
            : undefined,
        countryOfOrigin:
          parsed?.recipe?.countryOfOrigin != null
            ? String(parsed.recipe.countryOfOrigin).trim().slice(0, 100)
            : undefined,
        queryRestrictions: Array.isArray(parsed?.recipe?.queryRestrictions)
          ? parsed.recipe.queryRestrictions
          : undefined
      }
    };
  }

  private async generateNonPremiumEditInstructions(
    recipe: {
      title: string;
      description: string;
      amountOfServings: number;
      ingredients: { ingredient: string; amount: string | null }[];
      instructions: string[];
      restrictions?: any;
    },
    userQuestion: string,
    history: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<string> {
    const modelToUse =
      appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            message =>
              message &&
              (message.role === "user" || message.role === "assistant") &&
              typeof message.content === "string"
          )
          .slice(-12)
      : [];

    const system = gptPrompts.getNonPremiumEditInstructionsPrompt();

    const messages: {
      role: "system" | "user" | "assistant";
      content: string;
    }[] = [
      { role: "system", content: system },
      {
        role: "user",
        content: `CURRENT_RECIPE_JSON:\n${JSON.stringify(recipe)}`
      },
      ...safeHistory.map(message => ({
        role: message.role,
        content: message.content
      })),
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

    return String(response.data?.choices?.[0]?.message?.content ?? "").trim();
  }

  private async buildNonPremiumEditPreview(
    recipe: {
      title: string;
      description: string;
      amountOfServings: number;
      ingredients: { ingredient: string; amount: string | null }[];
      instructions: string[];
      restrictions?: any;
    },
    userQuestion: string,
    history: { role: "user" | "assistant"; content: string }[] = []
  ): Promise<string> {
    const instructions = await this.generateNonPremiumEditInstructions(
      recipe,
      userQuestion,
      history
    );

    const prefix = this.getNonPremiumEditPrefix(userQuestion);

    return `${prefix}${instructions}`.trim();
  }

  public async askRecipeQuestionOrEdit(
    recipe: {
      title: string;
      description: string;
      amountOfServings: number;
      ingredients: { ingredient: string; amount: string | null }[];
      instructions: string[];
      restrictions?: any;
    },
    userQuestion: string,
    history: { role: "user" | "assistant"; content: string }[] = [],
    canEdit: boolean
  ): Promise<RecipeChatEditResult> {
    const shouldCheckEdit =
      this.isEditIntentHeuristic(userQuestion) ||
      String(userQuestion ?? "").trim().length > 0;

    if (!shouldCheckEdit) {
      const answer = await this.askRecipeQuestion(recipe, userQuestion, history);
      return { mode: "answer", answer };
    }

    const intent = await this.classifyRecipeChatIntent(
      recipe,
      userQuestion,
      history
    );

    if (intent !== "edit_request") {
      const answer = await this.askRecipeQuestion(recipe, userQuestion, history);
      return { mode: "answer", answer };
    }

    if (!canEdit) {
      const answer = await this.buildNonPremiumEditPreview(
        recipe,
        userQuestion,
        history
      );
      return { mode: "answer", answer };
    }

    try {
      return await this.generateRecipeEdit(recipe, userQuestion, history);
    } catch (error: any) {
      console.error("askRecipeQuestionOrEdit error:", {
        model: appConfig.freeNoImageModelNumber || appConfig.modelNumber,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
        userQuestion
      });
      throw error;
    }
  }
}

export const gptService = new GptService();