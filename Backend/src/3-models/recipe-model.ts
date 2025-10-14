import Joi from "joi";
import { ValidationError } from "./client-errors";
import { UploadedFile } from "express-fileupload";
import { appConfig } from "../2-utils/app-config";
import OpenAI from "openai";

export class RecipeQueryModel {
    public query!: string;

    constructor(recipeTitleModel: RecipeQueryModel) {
        if (!recipeTitleModel) throw new ValidationError("Missing recipe query");
        this.query = recipeTitleModel.query;
    }

    private static validationSchema = Joi.object(
        {
            query: Joi.string().required().max(160)
        }
    );

    public validate(): void {
        const result = RecipeQueryModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
};

export type IngredientLine = {
    ingredient: string;
    amount: string | null;
};

export type GeneratedRecipeData = {
  title: string;            
  ingredients: IngredientLine[];
  instructions: string[];
  calories: number;       
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
export const openaiText = new OpenAI({
  apiKey: appConfig.freeNoImageApiKey
});

// One client for IMAGES (uses the image key/project)
export const openaiImages = new OpenAI({
  apiKey: appConfig.apiKey
});
export type DbRecipeRow = {
    id: number;
    title: string;
    ingredients: string;
    amounts: string | null;
    instructions: string;
    calories:number;
    imageName: string | null;
};


export class FullRecipeModel {
    public id?: number;
    public title!: string;
    public data!: GeneratedRecipeData;
    public calories!:number;
    public image?: UploadedFile;
    public imageUrl?: string;
    public imageName: string | null | undefined;

    constructor(recipe: FullRecipeModel) {
        if (!recipe) throw new ValidationError("Missing recipe data");
        this.id = recipe.id;
        this.title = recipe.title;
        this.data = recipe.data;
        this.calories=recipe.calories;
        this.image = recipe.image;
        this.imageUrl = recipe.imageUrl;
        this.imageName = recipe.imageName;
    }
};