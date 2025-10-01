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

export type GeneratedRecipe = {
  ingredients: string[];
  instructions: string[];
};

export type Query={
    systemCommandDescription:string;
    userCommandDescription:string;
}