import express, { NextFunction, Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { FullRecipeModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";
import { InputModel } from "../3-models/InputModel";
import { verificationMiddleware } from "../6-middleware/verification-middleware";
import { UserModel } from "../3-models/user-model";
import { generateImage } from "../4-services/image-service";
import { ResourceNotFound } from "../3-models/client-errors";

class RecipeController {
  public router: Router = express.Router();
  public constructor() {
    this.router.post("/api/generate-free-recipe-without-image/:amount", verificationMiddleware.verifyOptional, this.generateFreeNoImageRecipe);
    this.router.post("/api/generate-recipe-with-image/:amount", verificationMiddleware.verifyOptional, this.generateRecipeWithImage);
    this.router.get("/api/recipes/all", verificationMiddleware.verifyLoggedIn, this.getRecipes);
    this.router.get("/api/recipe/:recipeId", verificationMiddleware.verifyLoggedIn, this.getSingleRecipe);
    this.router.get("/api/recipes/images/:fileName", this.getImageFile);
    this.router.delete("/api/recipe/:recipeId", verificationMiddleware.verifyLoggedIn, this.deleteRecipe)
    this.router.post("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.likeRecipe);
    this.router.delete("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.unlikeRecipe);
    this.router.get("/api/recipes/liked/count", verificationMiddleware.verifyLoggedIn, this.getRecipesTotalLikeCount);
    this.router.get("/api/recipes/liked/:recipeId", verificationMiddleware.verifyLoggedIn, this.isRecipeLikedByUser);
  };

  private async getRecipes(request: Request, response: Response) {
    const user = (request as any).user as UserModel;
    const recipes = await recipeService.getRecipes(user.id);
    response.json(recipes);
  }

  private async getSingleRecipe(request: Request, response: Response) {
    const user = (request as any).user as UserModel;
    const recipeId = Number(request.params.recipeId)
    const recipes = await recipeService.getSingleRecipe(recipeId, user.id);
    response.json(recipes);
  }

  private async generateFreeNoImageRecipe(request: Request, response: Response): Promise<void> {
    const user = (request as any).user as UserModel | undefined;
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
      userId: user?.id
    } as FullRecipeModel);

    if (user?.id) {
      const saved = await recipeService.saveRecipe(noImageRecipe, user.id);
      response.status(StatusCode.Created).json(saved);
      return;
    }
    response.status(StatusCode.OK).json(noImageRecipe);
  }

  private async generateRecipeWithImage(request: Request, response: Response): Promise<void> {
    const user = (request as any).user as UserModel | undefined;
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
      userId: user?.id
    } as FullRecipeModel);

    if (user?.id) {
      const saved = await recipeService.saveRecipe(fullRecipe, user.id);
      response.status(StatusCode.Created).json(saved);
      return;
    }
    response.status(StatusCode.OK).json(fullRecipe);
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
    const recipeId = Number(request.params.recipeId);
    await recipeService.deleteRecipe(recipeId);
    response.sendStatus(StatusCode.NoContent);
  }

  private async getRecipesTotalLikeCount(request: Request, response: Response) {
    const recipeId = Number(request.params.recipeId);
    if (Number.isNaN(recipeId) || recipeId <= 0) {
      response
        .status(StatusCode.BadRequest)
        .send("Route param recipe id must be a positive number");
      return;
    }
    const likedCount = await recipeService.getRecipesTotalLikeCount(recipeId);
    response.json(likedCount);
  }

  public async isRecipeLikedByUser(request: Request, response: Response) {
    const userId = (request as any).user.id;
    const recipeId = Number(request.params.recipeId);
    if (Number.isNaN(recipeId) || recipeId <= 0) {
      response
        .status(StatusCode.BadRequest)
        .send("Route param recipe id must be a positive number");
      return;
    }
    const isRecipeLiked = await recipeService.isRecipeLikedByUser(userId, recipeId);
    response.status(StatusCode.OK).json(isRecipeLiked);
  }


  private async likeRecipe(request: Request, response: Response) {
    const userId = (request as any).user.id;
    const recipeId = Number(request.params.recipeId);
    if (Number.isNaN(recipeId) || recipeId <= 0) {
      response
        .status(StatusCode.BadRequest)
        .send("Route param recipe id must be a positive number");
      return;
    }
    const success = await recipeService.likeRecipe(userId, recipeId);
    response.json(success ? "liked" : "already liked");
  }

  private async unlikeRecipe(request: Request, response: Response) {
    const userId = (request as any).user.id;
    const recipeId = Number(request.params.recipeId);
    if (Number.isNaN(recipeId) || recipeId <= 0) {
      response
        .status(StatusCode.BadRequest)
        .send("Route param recipe id must be a positive number");
      return;
    }
    const success = await recipeService.unlikeRecipe(userId, recipeId);
    response.json(success ? "un-liked" : "not liked");
  }
}

export const recipeController = new RecipeController();
