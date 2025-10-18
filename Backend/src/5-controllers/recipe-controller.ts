import express, { Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { FullRecipeModel, QueryModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";

class RecipeController {
  public router: Router = express.Router();
  public constructor() {
    this.router.post("/api/generate-free-recipe-without-image", this.generateFreeNoImageRecipe);
    this.router.post("/api/generate-recipe-with-image", this.generateRecipeWithImage);
    this.router.get("/api/recipes/all", this.getRecipes);
    this.router.get("/api/recipe/:id", this.getSingleRecipe);
    this.router.get("/api/recipes/images/:fileName", this.getImageFile);
    this.router.delete("/api/recipe/:id", this.deleteRecipe)
  };

  private async getRecipes(_: Request, response: Response) {
    const recipes = await recipeService.getRecipes();
    response.json(recipes);
  }

  private async getSingleRecipe(request: Request, response: Response) {
    const id = Number(request.params.id)
    const recipes = await recipeService.getSingleRecipe(id);
    response.json(recipes);
  }

  private async generateFreeNoImageRecipe(request: Request, response: Response) {
    const titleModel = new QueryModel(request.body);
    const data = await recipeService.generateInstructions(titleModel, false);

    const noImageRecipe = new FullRecipeModel({
      title: data.title,
      amountOfServings:data.amountOfServings,
      description: data.description,
      popularity: data.popularity,
      data: { ingredients: data.ingredients, instructions: data.instructions },
      totalSugar: data.totalSugar,
      totalProtein: data.totalProtein,
      healthLevel: data.healthLevel,
      calories: data.calories,
      image: undefined,
      imageUrl: undefined,
      imageName: undefined
    } as FullRecipeModel);

    const dbNoImageRecipe = await recipeService.saveRecipe(noImageRecipe);
    response.status(StatusCode.Created).json(dbNoImageRecipe);
  }

  private async generateRecipeWithImage(request: Request, response: Response) {
    const titleModel = new QueryModel(request.body);
    const data = await recipeService.generateInstructions(titleModel, true);
    const { fileName, url } = await recipeService.generateImage(titleModel);
    const fullRecipe = new FullRecipeModel({
      title: data.title,
      amountOfServings:data.amountOfServings,
      description: data.description,
      popularity: data.popularity,
      data: { ingredients: data.ingredients, instructions: data.instructions },
      totalSugar: data.totalSugar,
      totalProtein: data.totalProtein,
      healthLevel: data.healthLevel,
      calories: data.calories,
      image: undefined,
      imageUrl: url,
      imageName: fileName
    } as FullRecipeModel);

    const dbFullRecipe = await recipeService.saveRecipe(fullRecipe);
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
