import { SuggestionsModel } from "../Models/SuggestionsModel";
import { getRandomRecipes, setError, setIsLoading } from "../Redux/RecipeSlice";
import { store } from "../Redux/Store";
import axios from "axios";
import { appConfig } from "../Utils/AppConfig";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { RecipeModel } from "../Models/RecipeModel";

class SuggestionsService {



    public async getToday(): Promise<SuggestionsModel> {
        try {
            store.dispatch(setIsLoading(true));

const response= await axios.get<SuggestionsModel>( appConfig.dailyRecipesUrl,getAuth());
const suggestions = response.data;
store.dispatch(getRandomRecipes(suggestions));
  return suggestions;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to load daily recipes";
            store.dispatch(setError(message));
            throw err;
        } finally {
            store.dispatch(setIsLoading(false));
        }
    }

    public async generateToday(): Promise<SuggestionsModel> {

        try {
            store.dispatch(setIsLoading(true));

const response= await axios.post<SuggestionsModel>( appConfig.dailyRecipesUrl,{},getAuth());
const suggestions = response.data;
store.dispatch(getRandomRecipes(suggestions));
  return suggestions;


        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to generate daily recipe";
            store.dispatch(setError(message));
            throw err;
        } finally {
            store.dispatch(setIsLoading(false));
        }
    }

public async getPublicRecipe(recipeId: number): Promise<RecipeModel> {
  const response = await axios.get<RecipeModel>(
    appConfig.getSingleRecipeUrl + "public/" + recipeId
  );
  return response.data;
}

}

export const suggestionsService = new SuggestionsService();