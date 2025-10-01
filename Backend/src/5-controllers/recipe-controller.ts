import express, { Request, Response, Router } from "express";

import { StatusCode } from "../3-models/status-code";
import { RecipeModel } from "../3-models/recipe-model";
import { recipeService } from "../4-services/recipe-service";

class RecipeController {
    public router: Router = express.Router();
    public constructor() {
        this.router.post("/api/generate-recipe-instructions", this.generateInstructions);
    }

    private async generateInstructions(request: Request, response: Response) {
        const recipe = new RecipeModel(request.body);
        const completion = await recipeService.generateInstructions(recipe);
        response.status(StatusCode.Created).json(completion);
    }
}

export const recipeController = new RecipeController();
