
export type InputModel = {
    query: string;
    sugarLevel: SugarRestriction;
    lactoseRestrictions: LactoseRestrictions;
    glutenRestrictions: GlutenRestrictions;
    dietType: DietaryRestrictions;
    excludedIngredients: string[];
}

export type LikeModel = {
    userId: number;
    recipeId: number;
}

export type RecipeModel = {
    id?: number;
    amountOfServings: number;
    title: string;
    description: string;
    popularity: number | null
    data: GeneratedRecipeData;
    totalSugar: number;
    totalProtein: number;
    healthLevel: number
    calories: number;
    sugarRestriction?: SugarRestriction;
    lactoseRestrictions?: LactoseRestrictions
    glutenRestrictions?: GlutenRestrictions
    dietaryRestrictions?: DietaryRestrictions;
    caloryRestrictions?: CaloryRestrictions;
    queryRestrictions?: QueryRestrictions;
    image?: File;
    imageUrl?: string;
    imageName?: string | null; 
    userId?: number;
    prepTime?: number;
    difficultyLevel?: DifficultyLevel;
    countryOfOrigin?: string;
};

export enum DifficultyLevel {
    EASY, MID_LEVEL, PRO
}

export type IngredientLine = {
    ingredient: string;
    amount: string | null;
};

export type GeneratedRecipeData = {
    ingredients: IngredientLine[];
    instructions: string[];
};

export type RecipeState = {
    items: RecipeModel[];
    current?: RecipeModel | null;
    guestStash?: RecipeModel | null; 
    loading: boolean;
    error?: string;
}

export enum SugarRestriction {
    DEFAULT, LOW, NONE
};

export enum LactoseRestrictions {
    DEFAULT, NONE
};

export enum GlutenRestrictions {
    DEFAULT, NONE
};

export enum DietaryRestrictions {
    DEFAULT, VEGAN, KOSHER
}

export enum CaloryRestrictions {
    DEFAULT, LOW
}

export type QueryRestrictions = string[];


export type AskRecipeRequest = {
  query: string;
};

export type AskRecipeResponse = {
  answer: string;
};

export type AskRecipeBody = {
  question: string;
  recipe: {
    title: string;
    description: string;
    ingredients: { ingredient: string; amount: string | null }[];
    instructions: string[];
  };
  history?: { role: "user" | "assistant"; content: string }[];
};

export type ChatMsg = { role: "user" | "assistant"; content: string };