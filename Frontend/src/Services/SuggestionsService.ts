import { setError, setIsLoading } from "../Redux/RecipeSlice";
import { store } from "../Redux/Store";
import axios from "axios";
import { appConfig } from "../Utils/AppConfig";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { RecipeModel } from "../Models/RecipeModel";


class SuggestionsService {

  public async generateSavedRecipesPool(): Promise<void> {
    try {
      store.dispatch(setIsLoading(true));

      await axios.post(
        appConfig.suggestionsUrl,
        {},
        getAuth()
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate saved recipes pool";
      store.dispatch(setError(message));
      throw err;
    } finally {
      store.dispatch(setIsLoading(false));
    }
  }

  public async getPublicRecipe(recipeId: number): Promise<RecipeModel> {
    const response = await axios.get<RecipeModel>(
      `${appConfig.getSingleRecipeUrl}public/${recipeId}`
    );
    return response.data;
  }
}

export const suggestionsService = new SuggestionsService();