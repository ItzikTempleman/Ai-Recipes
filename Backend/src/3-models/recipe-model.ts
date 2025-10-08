import Joi from "joi";
import { ValidationError } from "./client-errors";

export class RecipeModel {
    public title!: string;

    constructor(recipe: RecipeModel) {
        if (!recipe) throw new ValidationError("Missing recipe data");
        this.title = recipe.title;
    }

    private static validationSchema = Joi.object(
        {
            title: Joi.string().required().max(60)
        }
    );

    public validate(): void {
        const result = RecipeModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}

export type IngredientLine = {
    ingredient: string;
    amount: string | null;
};

export type GeneratedRecipe = {
    ingredients: IngredientLine[];
    instructions: string[];
};

export type Query = {
    systemCommandDescription: string;
    userCommandDescription: string;
}

export type GPTImage = {
    fileName: string,
    url: string
}


export type OutputItem =
  | { type: "image_generation_call"; result: string }
  | { type: string };

export function isImageGenerateRequest(
  item: OutputItem
): item is { type: "image_generation_call"; result: string } {
  return item.type === "image_generation_call";
}