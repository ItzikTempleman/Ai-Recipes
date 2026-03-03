import {
  RecipeModel,
  InputModel,
  SugarRestriction,
  LactoseRestrictions,
  GlutenRestrictions,
  DietaryRestrictions,
  ChatMsg
} from "../Models/RecipeModel";
import { appConfig } from "../Utils/AppConfig";
import { store } from "../Redux/Store";
import axios from "axios";
import {
  getMyRecipes,
  getCatalogRecipes,
  addRecipe,
  setError,
  setIsLoading,
  setCurrent,
  deleteRecipe
} from "../Redux/RecipeSlice";
import { usageService } from "./UsageService";
import { like, setLikes, unlike } from "../Redux/LikeSlice";
import { getAuth } from "../Utils/GetAuthenticationToken";

class RecipeService {
  public async generateRecipe(
    title: InputModel,
    hasImage: boolean,
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

      const { data } = await axios.post<RecipeModel>(url, body, getAuth());


      store.dispatch(setCurrent(data));
usageService.refreshRecipeUsage();
  
      const token = localStorage.getItem("token");
      if (token && data?.id) {
        store.dispatch(addRecipe(data));
      }

      return data;
    } catch (err: any) {
      const msg = err?.response?.data ?? err?.message ?? "Failed to generate recipe";
      store.dispatch(setError(String(msg)));
      throw err;
    } finally {
      store.dispatch(setIsLoading(false));
    }
  }

  public async generateImageForSavedRecipe(recipeId: number): Promise<RecipeModel> {
    const url = `${appConfig.generateImageForSavedRecipeUrl}${recipeId}/generate-image`;
    const { data } = await axios.post<RecipeModel>(url, {}, getAuth());


    store.dispatch(setCurrent(data));


    const state = store.getState().recipes;
    const nextItems = (state.items ?? []).map((r: RecipeModel) => (r.id === data.id ? data : r));
    store.dispatch(getMyRecipes(nextItems));

    return data;
  }

  public async generateImagePreview(
    recipe: RecipeModel
  ): Promise<{ imageUrl: string; imageName?: string }> {
    const url = appConfig.generateImagePreviewUrl;
    const { data } = await axios.post(url, recipe, getAuth());
    return data;
  }

  // Catalog / Suggestions (goes to catalogItems)
  public async getAllRecipes(): Promise<RecipeModel[]> {
    try {
      const { data } = await axios.get<RecipeModel[]>(appConfig.getAllRecipesUrl, getAuth());
      const list = Array.isArray(data) ? data : [];
      store.dispatch(getCatalogRecipes(list));
      return list;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        store.dispatch(getCatalogRecipes([]));
        return [];
      }
      throw err;
    }
  }

  // My Recipes / History (goes to items)
  public async getMyRecipes(): Promise<RecipeModel[]> {
    const token = localStorage.getItem("token") ?? "";
    if (!token) {
      store.dispatch(getMyRecipes([]));
      return [];
    }

    try {
      const { data } = await axios.get<RecipeModel[]>(appConfig.getMyRecipesUrl, getAuth());
      const list = Array.isArray(data) ? data : [];
      store.dispatch(getMyRecipes(list));
      return list;
    } catch (err: any) {
      if (err?.response?.status === 401) {
        store.dispatch(getMyRecipes([]));
        return [];
      }
      throw err;
    }
  }

  public async getSingleRecipe(id: number): Promise<RecipeModel> {
    const token = localStorage.getItem("token") ?? "";
    const privateUrl = `${appConfig.getSingleRecipeUrl}${id}`;
    const publicUrl = `${import.meta.env.VITE_API_URL ?? "/api"}/recipe/public/${id}`;

    if (!token) {
      const { data } = await axios.get<RecipeModel>(publicUrl, getAuth());
      return data;
    }

    try {
      const { data } = await axios.get<RecipeModel>(privateUrl, getAuth());
      return data;
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 403) {
        const { data } = await axios.get<RecipeModel>(publicUrl, getAuth());
        return data;
      }
      throw err;
    }
  }

  public async deleteRecipe(recipeId: number): Promise<void> {
    await axios.delete(appConfig.getSingleRecipeUrl + recipeId, getAuth());
    store.dispatch(deleteRecipe(recipeId));
  }

  public async likeRecipe(recipeId: number): Promise<void> {
    try {
      await axios.post(appConfig.likeUrl + recipeId, {}, getAuth());
      const userId = store.getState().user?.id;
      if (!userId) return;
      store.dispatch(like({ userId, recipeId }));
    } catch (err: any) {
      throw new Error(err?.response?.data ?? err?.message ?? "Like failed");
    }
  }

  public async unLikeRecipe(recipeId: number): Promise<void> {
    try {
      await axios.delete(appConfig.likeUrl + recipeId, getAuth());
      const userId = store.getState().user?.id;
      if (!userId) return;
      store.dispatch(unlike({ userId, recipeId }));
    } catch (err: any) {
      throw new Error(err?.response?.data ?? err?.message ?? "Unlike failed");
    }
  }

  public async loadMyLikes(): Promise<void> {
    const userId = store.getState().user?.id;
    if (!userId) return;
    const { data } = await axios.get<number[]>(appConfig.likeUrl, getAuth());
    store.dispatch(setLikes(data.map((recipeId) => ({ userId, recipeId }))));
  }

  public async askRecipeQuestion(
    recipe: RecipeModel,
    question: string,
    history: ChatMsg[] = []
  ): Promise<string> {
    const url = `${appConfig.askRecipeUrl}/${recipe.id}/ask`;

    const body = {
      query: question,
      history: history.slice(-8)
    };

    const { data } = await axios.post<{ answer: string }>(url, body, getAuth());
    return data.answer;
  }
}

export const recipeService = new RecipeService();