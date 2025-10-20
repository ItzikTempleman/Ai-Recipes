
export class InputModel {
    public query!: string;
}


export class RecipeModel {
    public id?: number;
    public amountOfServings!: number;
    public title!: string;
    public description!: string;
    public popularity: number | null
    public data!: GeneratedRecipeData;
    public totalSugar!: number;
    public totalProtein!: number;
    public healthLevel!: number
    public calories!: number;
    public image?: File;
    public imageUrl?: string;
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
