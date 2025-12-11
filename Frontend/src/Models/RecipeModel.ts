
export type InputModel = {
    query: string;
    sugarLevel: SugarRestriction;
    lactoseRestrictions: LactoseRestrictions;
    glutenRestrictions: GlutenRestrictions;
    dietType: DietaryRestrictions;
    excludedIngredients: string[];
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
    userId?: number;
    prepTime?: number;
    difficultyLevel?: DifficultyLevel;
    countryOfOrigin?: String;
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
    DEFAULT, VEGAN, KOSHER, HALAL
}

export enum CaloryRestrictions {
    DEFAULT, LOW
}

export type QueryRestrictions = string[];


