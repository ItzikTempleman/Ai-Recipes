import Joi from "joi";
import { FullRecipeModel } from "./recipe-model";
import { ValidationError } from "./client-errors";

export class SuggestionsModel {
    public suggestionDate: string;
    public recipes: FullRecipeModel[];

    public constructor(suggestedRecipe: SuggestionsModel) {
        this.suggestionDate = suggestedRecipe.suggestionDate;
        this.recipes = suggestedRecipe.recipes;
    }

    public static validationSchema = Joi.object(
        {
            suggestionDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
            recipes: Joi.array().items(Joi.object().required()).min(0).required()
        }
    );

    public validate(): void {
        const result = SuggestionsModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}