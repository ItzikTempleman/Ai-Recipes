import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecipeModel } from "../Models/RecipeModel";

export type RecipeState={
    items:RecipeModel[],
    loading:boolean;
    error?:string;
}

const initialState: RecipeState={
    items:[],
    loading:false
};


function setIsLoadingReducer(currentState: RecipeState, action: PayloadAction<boolean>) {
  currentState.loading = action.payload;
  if (action.payload) currentState.error = undefined;
}

function setErrorReducer(state: RecipeState, action: PayloadAction<string | undefined>) {
  state.error = action.payload;
}

function getAllRecipesReducer(state: RecipeState, action: PayloadAction<RecipeModel[]>) {
  state.items = action.payload;
}

function addRecipeReducer(state: RecipeState, action: PayloadAction<RecipeModel>) {
  state.items.unshift(action.payload);
}

const recipeSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    setIsLoading: setIsLoadingReducer,
    setError: setErrorReducer,
    getAllRecipes: getAllRecipesReducer,
    addRecipe: addRecipeReducer,
  },
});


export const { setIsLoading, setError, getAllRecipes, addRecipe } = recipeSlice.actions;
export const recipeReducer = recipeSlice.reducer;