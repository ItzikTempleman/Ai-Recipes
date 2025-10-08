import express, { Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { RecipeTitleModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";

class RecipeController {
  public router: Router = express.Router();
  public constructor() {
    this.router.post("/api/generate-free-recipe-without-image", this.generateFreeNoImageRecipe);
    this.router.post("/api/generate-recipe-with-image", this.generateRecipeWithImage);
    this.router.get("/api/recipes/images/:fileName", this.getImageFile);
  }

  private async generateFreeNoImageRecipe(request: Request, response: Response) {
    const recipe = new RecipeTitleModel(request.body);
    const completion = await recipeService.generateInstructions(recipe, false);
    response.status(StatusCode.Created).json(completion);
  }

  private async generateRecipeWithImage(request: Request, response: Response) {
    const recipe = new RecipeTitleModel(request.body);
    const completion = await recipeService.generateInstructions(recipe, true);
    const { fileName, url } = await recipeService.generateImageFromTitle(recipe.title);
    response.status(StatusCode.Created).json({ completion, fileName, imageUrl: url });
  }

  private async getImageFile(request: Request, response: Response) {
    try {
      const { fileName } = request.params;
      const imagePath = await recipeService.getImageFilePath(fileName);
      response.sendFile(imagePath);
    } catch (err) {
      response.status(StatusCode.NotFound).json({ message: "Image not found." });
    }
  }
}

export const recipeController = new RecipeController();
