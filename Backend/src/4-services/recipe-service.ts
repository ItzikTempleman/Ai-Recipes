import { RecipeModel } from "../3-models/recipe-model";
import { GeneratedRecipe, gptService } from "./gpt-service";
import { searchTitleService } from "./search-title-service";

class RecipeService {

    public async generateInstructions(recipe: RecipeModel): Promise<GeneratedRecipe> {
        recipe.validate();
        const recipeTitle = searchTitleService.getQuery(recipe);
        return await gptService.getInstructions(recipeTitle);
    }
}

export const recipeService = new RecipeService();
