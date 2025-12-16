import { RecipeModel, InputModel, SugarRestriction, LactoseRestrictions, GlutenRestrictions, DietaryRestrictions } from "../Models/RecipeModel";
import { appConfig } from "../Utils/AppConfig";
import { store } from "../Redux/Store";
import axios, { AxiosRequestConfig } from "axios";
import {
  getAllRecipes,
  addRecipe,
  setError,
  setIsLoading,
  setCurrent,
  deleteRecipe
} from "../Redux/RecipeSlice";

class RecipeService {

  private getAuth(): AxiosRequestConfig {
    const token = localStorage.getItem("token") ?? "";
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  public async generateRecipe(
    title: InputModel, hasImage: boolean,
    quantity: number = 1,
    sugarLevel: SugarRestriction,
    hasLactose: LactoseRestrictions,
    hasGluten: GlutenRestrictions,
    dietaryRestrictions: DietaryRestrictions,
    excludedIngredients: string[]
  ): Promise<RecipeModel> {
    try {
      store.dispatch(setIsLoading(true));

      const body = {
        query: title.query,
        sugarRestriction: sugarLevel,
        lactoseRestrictions: hasLactose,
        glutenRestrictions: hasGluten,
        dietaryRestrictions: dietaryRestrictions,
        queryRestrictions: excludedIngredients
      };


      const base = hasImage ? appConfig.generateFullRecipeUrl : appConfig.generateNoImageRecipeUrl;
      const url = `${base}/${Number(quantity) || 1}`;

      const { data } = await axios.post<RecipeModel>(url, body, this.getAuth());

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
    const { data } = await axios.get<RecipeModel[]>(appConfig.getAllRecipesUrl, this.getAuth());
    const list = Array.isArray(data) ? data : [];
    store.dispatch(getAllRecipes(list));
    return list;
  }

  public async getSingleRecipe(id: number): Promise<RecipeModel> {
    const { data } = await axios.get<RecipeModel>(`${appConfig.getSingleRecipeUrl}${id}`, this.getAuth());
    return data;
  };

  public async deleteRecipe(recipeId: number): Promise<void> {
    await axios.delete(appConfig.getSingleRecipeUrl + recipeId, this.getAuth());
    store.dispatch(deleteRecipe(recipeId));
  };

  public async likeRecipe(recipeId: number): Promise<void> {
        try {
            await axios.post(appConfig.likeUrl + recipeId, this.getAuth());
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err.message ?? "Like failed");
        }
  }

  public async unLikeRecipe(recipeId: number): Promise<void> {
        try {
            await axios.delete(appConfig.likeUrl + recipeId, this.getAuth());
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err.message ?? "Unlike failed");
        }
  }
}

export const recipeService = new RecipeService();