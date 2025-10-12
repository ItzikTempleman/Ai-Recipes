export class RecipeModel {
    public id?: number;
    public title!: RecipeTitleModel;
    public data!: GeneratedRecipeData;
    public image?: File;
    public imageUrl?: string;
}

export class RecipeTitleModel {
    public title!: string;
}

export type IngredientLine = {
    ingredient: string;
    amount: string | null;
};

export type GeneratedRecipeData = {
    ingredients: IngredientLine[];
    instructions: string[];
};


export type RecipeState={
    items:RecipeModel[],
    loading:boolean;
    error?:string;
}
