import axios from "axios";
import { appConfig } from "../utils/app-config";
import { GeneratedRecipeData, Query, RecipeCategory } from "../models/recipe-model";
import { editSignals } from "../utils/edit-recipe-trigger-list";

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
    const q = this.normalizeForIntent(userQuestion);
    return editSignals.some(signal => q.includes(this.normalizeForIntent(signal)));
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
    const modelToUse = appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-8)
      : [];

    const system = `
You classify user messages about a recipe.

Return ONLY valid JSON:
{ "intent": "question" }
or
{ "intent": "edit_request" }

Use "edit_request" only when the user is asking to modify the recipe itself:
- ingredients
- quantities
- servings
- instructions
- dietary adaptation
- substitutions
- shortening/simplifying/changing the recipe

Use "question" when the user is:
- asking how something works
- asking for advice
- asking what can be changed
- asking whether a substitution is possible
- asking cooking questions without asking you to directly apply the change

Important:
- Support both English and Hebrew.
- Mixed Hebrew/English is common.
- Be conservative: if the user is only asking about possibilities, return "question".
`.trim();

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

      const raw = String(response.data?.choices?.[0]?.message?.content ?? "").trim();
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

  public async getInstructions(query: Query, isWithImage: boolean): Promise<GeneratedRecipeData> {
    const modelToUse = appConfig.modelNumber;
    const keyToUse = isWithImage
      ? (appConfig.apiKey || appConfig.freeNoImageApiKey)
      : (appConfig.freeNoImageApiKey || appConfig.apiKey);

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
    const modelToUse = appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const system = `
You are Chef, a helpful cooking assistant.

Hard rules:
- NEVER use markdown headings or titles. Do not use "#", "##", "###", or any heading-style formatting.
- Write in plain paragraphs or simple bullet points only ("-" or "•" are allowed).
- Do NOT use inability/disclaimer language (never say: "I don't know", "not provided", "can't tell", "unclear", "missing").
- If details aren't present, assume sensible defaults and give 2–3 plausible options.
- Ask clarifying questions ONLY if the user cannot proceed safely without the answer (max 2 questions).
- Keep answers practical, specific, and friendly. No lecturing.

Mode rules:
- You are in QUESTION MODE only.
- Do NOT modify, rewrite, or apply changes to the recipe.
- Do NOT present the recipe as updated.
- Do NOT output a revised ingredient list.
- Do NOT output revised instructions as if they replace the original recipe.
- If the user wants a variation, explain it only as a suggestion.
- Use conditional wording such as:
  "You can replace..."
  "A good option would be..."
  "If you want it sweeter..."
  "You could try..."

Context:
- The user is asking about THIS recipe. You'll receive it as JSON.
- Reference the recipe content whenever possible (ingredients/instructions/title/description/restrictions).
- Reply in the language of the user's latest message.
`.trim();

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
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
    const modelToUse = appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-12)
      : [];

    const system = `
You are Chef, a cooking assistant that edits existing recipes.

Your task:
- The user is asking to EDIT the recipe itself.
- Return ONLY valid JSON.
- Apply the requested edits directly to the existing recipe.
- Keep the recipe realistic and internally consistent.
- Preserve the user's language when possible.
- If the recipe/user is in Hebrew, return Hebrew.
- If the recipe/user is in English, return English.
- If mixed, prefer the latest user message language.
- Keep the recipe compact and storage-safe.
- Keep the same number of instruction steps unless a change is truly required.
- Do not add optional notes, serving ideas, safety notes, explanations, or multiple variants.
- Keep each instruction short and direct.
- Maximum 8 instruction steps.
- Maximum 1 sentence per step.
- Ingredients should stay concise and practical.
- Any nutrition change MUST be reflected by real ingredient and quantity changes.
- If protein goes up, the ingredients must include actual protein-rich ingredients.
- If sugar is removed, explicit sugar/syrup/honey ingredients must be removed.
- If calories go down, quantities and/or higher-calorie ingredients must be reduced or replaced accordingly.
- The nutrition fields must match the ingredient list, not just the user request.
- Do not claim the recipe is high-protein, sugar-free, or lower-calorie unless the ingredient list truly supports that.
- Do not add markdown fences.
- Do not return explanations outside JSON.

Return JSON in exactly this shape:
{
  "answer": "short friendly summary of what changed",
  "recipe": {
    "title": "string",
    "description": "string",
    "amountOfServings": 1,
    "ingredients": [
      { "ingredient": "string", "amount": "string or null" }
    ],
    "instructions": ["step 1", "step 2"],
    "totalSugar": 0,
    "totalProtein": 0,
    "calories": 0,
    "prepTime": 0,
    "categories": ["breakfast"],
    "sugarRestriction": 0,
    "lactoseRestrictions": 0,
    "glutenRestrictions": 0,
    "dietaryRestrictions": 0,
    "difficultyLevel": 1,
    "countryOfOrigin": "string",
    "queryRestrictions": []
  }
}
`.trim();

    const body = {
      model: modelToUse,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `CURRENT_RECIPE_JSON:\n${JSON.stringify(recipe)}`
        },
        ...safeHistory.map(m => ({ role: m.role, content: m.content })),
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

    const raw = String(response.data?.choices?.[0]?.message?.content ?? "").trim();
    const parsed = JSON.parse(raw);

    const fallbackIngredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const fallbackInstructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];

    const compactInstructions = Array.isArray(parsed?.recipe?.instructions)
      ? parsed.recipe.instructions
          .map((s: any) => String(s ?? "").trim())
          .filter(Boolean)
          .slice(0, 8)
          .map((s: string) => (s.length > 140 ? s.slice(0, 140).trim() : s))
      : fallbackInstructions;

    const compactIngredients = Array.isArray(parsed?.recipe?.ingredients)
      ? parsed.recipe.ingredients
          .map((i: any) => ({
            ingredient: String(i?.ingredient ?? "").trim().slice(0, 80),
            amount:
              i?.amount == null ? null : String(i.amount).trim().slice(0, 60)
          }))
          .filter((i: { ingredient: string; amount: string | null }) => i.ingredient.length > 0)
          .slice(0, 20)
      : fallbackIngredients;

return {
  mode: "edit",
  answer: String(parsed?.answer ?? "Updated your recipe.").trim().slice(0, 300),
  recipe: {
    title: String(parsed?.recipe?.title ?? recipe.title).trim().slice(0, 100),
    description: String(parsed?.recipe?.description ?? recipe.description).trim().slice(0, 1000),
    amountOfServings:
      Number(parsed?.recipe?.amountOfServings ?? recipe.amountOfServings) || recipe.amountOfServings,
    ingredients: compactIngredients,
    instructions: compactInstructions,

    totalSugar:
      parsed?.recipe?.totalSugar != null ? Number(parsed.recipe.totalSugar) : undefined,
    totalProtein:
      parsed?.recipe?.totalProtein != null ? Number(parsed.recipe.totalProtein) : undefined,
    calories:
      parsed?.recipe?.calories != null ? Number(parsed.recipe.calories) : undefined,
    prepTime:
      parsed?.recipe?.prepTime != null ? Number(parsed.recipe.prepTime) : undefined,

    categories: Array.isArray(parsed?.recipe?.categories) ? parsed.recipe.categories : undefined,
    sugarRestriction:
      parsed?.recipe?.sugarRestriction != null ? Number(parsed.recipe.sugarRestriction) : undefined,
    lactoseRestrictions:
      parsed?.recipe?.lactoseRestrictions != null ? Number(parsed.recipe.lactoseRestrictions) : undefined,
    glutenRestrictions:
      parsed?.recipe?.glutenRestrictions != null ? Number(parsed.recipe.glutenRestrictions) : undefined,
    dietaryRestrictions:
      parsed?.recipe?.dietaryRestrictions != null ? Number(parsed.recipe.dietaryRestrictions) : undefined,
    difficultyLevel:
      parsed?.recipe?.difficultyLevel != null ? Number(parsed.recipe.difficultyLevel) : undefined,
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
    const modelToUse = appConfig.freeNoImageModelNumber || appConfig.modelNumber;
    const keyToUse = appConfig.freeNoImageApiKey || appConfig.apiKey;

    const safeHistory = Array.isArray(history)
      ? history
          .filter(
            m =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .slice(-12)
      : [];

    const system = `
You are Chef, a cooking assistant.

The user asked to edit the recipe, but in this mode you must NOT act as if you actually edited or saved anything.

Your job:
- Explain textually what the user should change on their own in the recipe.
- Give practical edit instructions in the context of this recipe.
- Be specific about ingredients, quantities, steps, or servings when relevant.
- Reply in the language of the user's latest message.

Hard rules:
- NEVER say or imply that you already updated, changed, saved, edited, rewrote, or applied the recipe.
- NEVER say things like:
  - "I updated it"
  - "I changed it"
  - "Here is the updated recipe"
  - "Done"
- DO say things like:
  - "To make this change..."
  - "You can change..."
  - "Replace..."
  - "Increase..."
  - "Reduce..."
  - "In the instructions, update step..."
- Do NOT return JSON.
- Do NOT output a full rewritten recipe unless absolutely necessary.
- Prefer short, actionable guidance in chat format.
- Keep it friendly and clear.
- No markdown headings.
`.trim();

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: system },
      {
        role: "user",
        content: `CURRENT_RECIPE_JSON:\n${JSON.stringify(recipe)}`
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

    const intent = await this.classifyRecipeChatIntent(recipe, userQuestion, history);

    if (intent !== "edit_request") {
      const answer = await this.askRecipeQuestion(recipe, userQuestion, history);
      return { mode: "answer", answer };
    }

    if (!canEdit) {
      const answer = await this.buildNonPremiumEditPreview(recipe, userQuestion, history);
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