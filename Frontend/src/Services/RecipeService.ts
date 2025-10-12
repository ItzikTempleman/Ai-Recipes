import { RecipeModel, RecipeTitleModel } from "../Models/RecipeModel";
import { appConfig } from "../Utils/AppConfig";
import { store } from "../Redux/Store";
import axios from "axios";
import { getAllRecipes,addRecipe, setError, setIsLoading } from "../Redux/RecipeSlice";

class RecipeService {

public async generateRecipe(title: RecipeTitleModel, hasImage: boolean): Promise<RecipeModel> {
  try {
    store.dispatch(setIsLoading(true));
    const url = hasImage ? appConfig.generateFullRecipeUrl : appConfig.generateNoImageRecipeUrl;
    const { data } = await axios.post<RecipeModel>(url, title);
    store.dispatch(addRecipe(data));
    return data; 
  } catch (err: any) {
    const msg = err?.message || "Failed to generate recipe";
    store.dispatch(setError(msg));
    throw err; 
  } finally {
    store.dispatch(setIsLoading(false));
  }
}

    public async getAllRecipes(): Promise<RecipeModel[]> {
        const response = await axios.get<RecipeModel[]>(appConfig.getAllRecipesUrl);
        const recipes = response.data;
        store.dispatch(getAllRecipes(recipes));
        return recipes;
    }
}
export const recipeService = new RecipeService();


