import Joi from "joi";
import { ValidationError } from "./client-errors";
import { UploadedFile } from "express-fileupload";
import { appConfig } from "../2-utils/app-config";
import OpenAI from "openai";


export type IngredientLine = {
    ingredient: string;
    amount: string | null;
};

export type GeneratedRecipeData = {
    title: string;
    amountOfServings:number;
    description: string;
    popularity: number;
    ingredients: IngredientLine[];
    instructions: string[];
    totalSugar: number;
    totalProtein: number;
    healthLevel: number
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

export const openaiImages = new OpenAI({
    apiKey: appConfig.apiKey
});
export type DbRecipeRow = {
    id: number;
    title: string;
    amountOfServings:number;
    description: string;
    popularity: number | null;
    ingredients: string;
    amounts: string | null;
    instructions: string;
    totalSugar: number | null;
    totalProtein: number | null;
    healthLevel: number | null
    calories: number;
    imageName: string | null;
};


export class FullRecipeModel {
    public id?: number;
    public title!: string;
    public amountOfServings!:number;
    public description!: string;
    public popularity!: number;
    public data!: GeneratedRecipeData;
    public totalSugar!: number;
    public totalProtein!: number;
    public healthLevel!: number
    public calories!: number;
    public image?: UploadedFile;
    public imageUrl?: string;
    public imageName: string | null | undefined;

    constructor(recipe: FullRecipeModel) {
        if (!recipe) throw new ValidationError("Missing recipe data");
        this.id = recipe.id;
        this.title = recipe.title;
        this.amountOfServings=recipe.amountOfServings;
        this.description = recipe.description;
        this.popularity = recipe.popularity;
        this.data = recipe.data;
        this.totalSugar = recipe.totalSugar;
        this.totalProtein = recipe.totalProtein;
        this.healthLevel = recipe.healthLevel;
        this.calories = recipe.calories;
        this.image = recipe.image;
        this.imageUrl = recipe.imageUrl;
        this.imageName = recipe.imageName;
    }

    private static validationSchema = Joi.object(
        {
            title: Joi.string().trim().max(160).required(),
            amountOfServings:Joi.number().min(1).required(),
            description: Joi.string().trim().max(1000).required(),
            popularity: Joi.number().integer().min(0).max(10).required(),
            totalSugar: Joi.number().min(0).required(),
            totalProtein: Joi.number().min(0).required(),
            healthLevel: Joi.number().min(1).max(10).required(),
            calories: Joi.number().min(0).required()
        }
    );

    public validate(): void {
        const result = FullRecipeModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}