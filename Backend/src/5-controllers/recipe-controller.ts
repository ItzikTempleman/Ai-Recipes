import express, { Request, Response, Router } from "express";
import { StatusCode } from "../3-models/status-code";
import { RecipeModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";

class RecipeController {
    public router: Router = express.Router();
    public constructor() {
        this.router.post("/api/generate-recipe", this.generateRecipe);
         this.router.get("/api/recipes/images/:fileName", this.getImageFile);
    }

    private async generateRecipe(request: Request, response: Response) {
        const recipe = new RecipeModel(request.body);
        const completion = await recipeService.generateInstructions(recipe);
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
