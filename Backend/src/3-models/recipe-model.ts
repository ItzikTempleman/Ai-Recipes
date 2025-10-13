import Joi from "joi";
import { ValidationError } from "./client-errors";
import { UploadedFile } from "express-fileupload";
import { appConfig } from "../2-utils/app-config";
import OpenAI from "openai";

export class RecipeTitleModel {
    public title!: string;

    constructor(recipeTitleModel: RecipeTitleModel) {
        if (!recipeTitleModel) throw new ValidationError("Missing recipe title prompt");
        this.title = recipeTitleModel.title;
    }

    private static validationSchema = Joi.object(
        {
            title: Joi.string().required().max(60)
        }
    );

    public validate(): void {
        const result = RecipeTitleModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
};

export type IngredientLine = {
    ingredient: string;
    amount: string | null;
};

export type GeneratedRecipeData = {
    ingredients: IngredientLine[];
    instructions: string[];
};

export type Query = {
    systemCommandDescription: string;
    userCommandDescription: string;
};

export type GPTImage = {
    fileName: string,
    url: string
};


export type OutputItem =
    | { type: "image_generation_call"; result: string }
    | { type: string };


export function isImageGenerateRequest(
    item: OutputItem
): item is { type: "image_generation_call"; result: string } {
    return item.type === "image_generation_call";
};
export const openai = new OpenAI({
    apiKey: appConfig.apiKey
});

export type DbRecipeRow = {
    id: number;
    title: string;
    ingredients: string;
    amounts: string | null;
    instructions: string;
    imageName: string | null;
};


export class FullRecipeModel {
    public id?: number;
    public title!: RecipeTitleModel;
    public data!: GeneratedRecipeData;
    public image?: UploadedFile;
    public imageUrl?: string;
    public imageName: string | null | undefined;

    constructor(recipe: FullRecipeModel) {
        if (!recipe) throw new ValidationError("Missing recipe data");
        this.id = recipe.id;
        this.title = recipe.title;
        this.data = recipe.data;
        this.image = recipe.image;
        this.imageUrl = recipe.imageUrl;
        this.imageName = recipe.imageName;
    }
};