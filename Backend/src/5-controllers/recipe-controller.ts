import express, { Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { FullRecipeModel, RecipeTitleModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";

class RecipeController {
  public router: Router = express.Router();
  public constructor() {
    this.router.post("/api/generate-free-recipe-without-image", this.generateFreeNoImageRecipe);
    this.router.post("/api/generate-recipe-with-image", this.generateRecipeWithImage);
    this.router.get("/api/recipes/all", this.getRecipes);
    this.router.get("/api/recipes/images/:fileName", this.getImageFile);
  };

  private async getRecipes(response: Response) {
    const recipes = await recipeService.getRecipes();
    response.json(recipes);
  }

  private async generateFreeNoImageRecipe(request: Request, response: Response) {
    const titleModel = new RecipeTitleModel(request.body);
    const data = await recipeService.generateInstructions(titleModel, false);

    const noImageRecipe = new FullRecipeModel({
      title: titleModel,
      data,
      image: undefined,
      imageUrl: undefined,
      imageName: undefined
    } as FullRecipeModel);

    const dbNoImageRecipe = await recipeService.saveRecipe(noImageRecipe);
    response.status(StatusCode.Created).json(dbNoImageRecipe);
  }

  private async generateRecipeWithImage(request: Request, response: Response) {
    const titleModel = new RecipeTitleModel(request.body);
    const data = await recipeService.generateInstructions(titleModel, true);
    const { fileName, url } = await recipeService.generateImage(titleModel);
    const fullRecipe = new FullRecipeModel({
      title: titleModel,
      data,
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
}

export const recipeController = new RecipeController();
