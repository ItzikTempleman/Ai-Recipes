import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { FullRecipeModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";
import { InputModel } from "../3-models/InputModel";
import { verificationMiddleware } from "../6-middleware/verification-middleware";
import { UserModel } from "../3-models/user-model";
import { generateImage } from "../4-services/image-service";

class RecipeController {
  public router: Router = express.Router();
  public constructor() {
    this.router.post("/api/generate-free-recipe-without-image/:amount", verificationMiddleware.verifyLoggedIn, this.generateFreeNoImageRecipe);
    this.router.post("/api/generate-recipe-with-image/:amount", verificationMiddleware.verifyLoggedIn, this.generateRecipeWithImage);
    this.router.get("/api/recipes/all", verificationMiddleware.verifyLoggedIn, this.getRecipes);
    this.router.get("/api/recipe/:id", verificationMiddleware.verifyLoggedIn, this.getSingleRecipe);
    this.router.get("/api/recipes/images/:fileName", verificationMiddleware.verifyLoggedIn, this.getImageFile);
    this.router.delete("/api/recipe/:id", verificationMiddleware.verifyLoggedIn, this.deleteRecipe)
  };

  private async getRecipes(request: Request, response: Response) {
    const user = (request as any).user as UserModel;
    const recipes = await recipeService.getRecipes(user.id);
    response.json(recipes);
  }

  private async getSingleRecipe(request: Request, response: Response) {
    const user = (request as any).user as UserModel;
    const id = Number(request.params.id)
    const recipes = await recipeService.getSingleRecipe(id, user.id);
    response.json(recipes);
  }

  private async generateFreeNoImageRecipe(request: Request, response: Response) {
    const user = (request as any).user as UserModel;
    const quantity = Number(request.params.amount);
    const inputModel = new InputModel({
      query: request.body.query,
      quantity,
      sugarRestriction: request.body.sugarRestriction,
      lactoseRestrictions: request.body.lactoseRestrictions,
      glutenRestrictions: request.body.glutenRestrictions,
      dietaryRestrictions: request.body.dietaryRestrictions,
      caloryRestrictions: request.body.caloryRestrictions,
      queryRestrictions: request.body.queryRestrictions
    } as InputModel);

    const data = await recipeService.generateInstructions(inputModel, false);

    const noImageRecipe = new FullRecipeModel({
      title: data.title,
      amountOfServings: quantity,
      description: data.description,
      popularity: data.popularity,
      data: { ingredients: data.ingredients, instructions: data.instructions },
      totalSugar: data.totalSugar,
      totalProtein: data.totalProtein,
      healthLevel: data.healthLevel,
      calories: data.calories,
      sugarRestriction: data.sugarRestriction,
      lactoseRestrictions: data.lactoseRestrictions,
      glutenRestrictions: data.glutenRestrictions,
      dietaryRestrictions: data.dietaryRestrictions,
      caloryRestrictions: data.caloryRestrictions,
      queryRestrictions: data.queryRestrictions,
      prepTime: data.prepTime,
      difficultyLevel: data.difficultyLevel,
      countryOfOrigin: data.countryOfOrigin,
      image: undefined,
      imageUrl: undefined,
      imageName: undefined,
      userId: user.id
    } as FullRecipeModel);

    const dbNoImageRecipe = await recipeService.saveRecipe(noImageRecipe, user.id);
    response.status(StatusCode.Created).json(dbNoImageRecipe);
  }

  private async generateRecipeWithImage(request: Request, response: Response) {
    const user = (request as any).user as UserModel;
    const quantity = Number(request.params.amount);
    const inputModel = new InputModel({
      query: request.body.query,
      quantity,
      sugarRestriction: request.body.sugarRestriction,
      lactoseRestrictions: request.body.lactoseRestrictions,
      glutenRestrictions: request.body.glutenRestrictions,
      dietaryRestrictions: request.body.dietaryRestrictions,
      caloryRestrictions: request.body.caloryRestrictions,
      queryRestrictions: request.body.queryRestrictions
    } as InputModel);
    const data = await recipeService.generateInstructions(inputModel, true);
    const { fileName, url } = await generateImage(inputModel);

    const fullRecipe = new FullRecipeModel({
      title: data.title,
      amountOfServings: quantity,
      description: data.description,
      popularity: data.popularity,
      data: { ingredients: data.ingredients, instructions: data.instructions },
      totalSugar: data.totalSugar,
      totalProtein: data.totalProtein,
      healthLevel: data.healthLevel,
      calories: data.calories,
      sugarRestriction: data.sugarRestriction,
      lactoseRestrictions: data.lactoseRestrictions,
      glutenRestrictions: data.glutenRestrictions,
      dietaryRestrictions: data.dietaryRestrictions,
      caloryRestrictions: data.caloryRestrictions,
      queryRestrictions: data.queryRestrictions,
      prepTime: data.prepTime,
      difficultyLevel: data.difficultyLevel,
      countryOfOrigin: data.countryOfOrigin,
      image: undefined,
      imageUrl: url,
      imageName: fileName,
      userId: user.id
    } as FullRecipeModel);

    const dbFullRecipe = await recipeService.saveRecipe(fullRecipe, user.id);
    response.status(StatusCode.Created).json(dbFullRecipe);
  }

  private async getImageFile(request: Request, response: Response) {
    try {
      const { fileName } = request.params;
      const imagePath = await recipeService.getImageFilePath(fileName);
      response.sendFile(imagePath);
    } catch (err) {
      response.status(StatusCode.NotFound).json({ message: "Image not found" });
    }
  }

  private async deleteRecipe(request: Request, response: Response) {
    const id = Number(request.params.id);
    await recipeService.deleteRecipe(id);
    response.sendStatus(StatusCode.NoContent);
  }
}

export const recipeController = new RecipeController();
