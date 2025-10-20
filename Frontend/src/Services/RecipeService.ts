import { RecipeModel, InputModel } from "../Models/RecipeModel";
import { appConfig } from "../Utils/AppConfig";
import { store } from "../Redux/Store";
import axios from "axios";
import { getAllRecipes, addRecipe, setError, setIsLoading, setCurrent, deleteRecipe } from "../Redux/RecipeSlice";



class RecipeService {

  public async generateRecipe(title: InputModel, hasImage: boolean, quantity: number = 1): Promise<RecipeModel> {
    try {
      store.dispatch(setIsLoading(true));
      const body: InputModel = { query: title.query };

           const base = hasImage ? appConfig.generateFullRecipeUrl : appConfig.generateNoImageRecipeUrl;
      const url = `${base}/${Number(quantity) || 1}`;

      const { data } = await axios.post<RecipeModel>(url, body);

      store.dispatch(addRecipe(data));
      store.dispatch(setCurrent(data));
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
    const { data } = await axios.get<RecipeModel[]>(appConfig.getAllRecipesUrl);
    store.dispatch(getAllRecipes(data));
    return data;
  };

  public async getSingleRecipe(id: Number): Promise<RecipeModel> {
    const { data } = await axios.get<RecipeModel>(`${appConfig.getSingleRecipeUrl}${id}`);
    return data;
  };


  public async deleteRecipe(recipeId: number): Promise<void> {
    await axios.delete(appConfig.getSingleRecipeUrl + recipeId);
    store.dispatch(deleteRecipe(recipeId));
  };
}


export const recipeService = new RecipeService();


