import { RecipeModel, RecipeTitleModel } from "../Models/RecipeModel";
import { appConfig } from "../Utils/AppConfig";
import { store } from "../Redux/Store";
import axios from "axios";
import { addRecipe, setError, setLoading } from "../Redux/RecipeSlice";



class RecipeService {

    public async generateRecipe(title: RecipeTitleModel, hasImage: boolean): Promise<void> {
        try {
            store.dispatch(setLoading(true));
            const response = await axios.post<RecipeModel>(!hasImage ? appConfig.generateNoImageRecipeUrl : appConfig.generateFullRecipeUrl, title);
            const generatedRecipe = response.data;
            store.dispatch(addRecipe(generatedRecipe));
        } catch (err: any) {
            store.dispatch(setError(err?.message || "Failed to generate recipe"));
        } finally {
            store.dispatch(setLoading(false));
        }
    }


    public async getAllRecipes(): Promise<RecipeModel[]> {
        const response = await axios.get<RecipeModel[]>(appConfig.getAllRecipesUrl);
        const recipes = response.data;
        store.dispatch(setAllRecipesReducer(recipes));
        return recipes;
    }


}
export const recipeService = new RecipeService();

function setAllRecipesReducer(recipes: RecipeModel[]): any {
    throw new Error("Function not implemented.");
}
