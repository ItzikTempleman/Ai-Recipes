
export class RecipeQueryModel {
  public query!: string; 
}


export class RecipeModel {
    public id?: number;
    public title!: string;
    public data!: GeneratedRecipeData;
    public calories!: number;  
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
   items: RecipeModel[];     
  current?: RecipeModel | null; 
  loading: boolean;
  error?: string;
}
