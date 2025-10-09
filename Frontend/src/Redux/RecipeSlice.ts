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


function setLoadingReducer(state: RecipeState, action: PayloadAction<boolean>) {
  state.loading = action.payload;
  if (action.payload) state.error = undefined;
}

function setErrorReducer(state: RecipeState, action: PayloadAction<string | undefined>) {
  state.error = action.payload;
}

function setAllRecipesReducer(state: RecipeState, action: PayloadAction<RecipeModel[]>) {
  state.items = action.payload;
}

function addRecipeReducer(state: RecipeState, action: PayloadAction<RecipeModel>) {
  state.items.unshift(action.payload);
}

const recipeSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    setLoading: setLoadingReducer,
    setError: setErrorReducer,
    setAllRecipes: setAllRecipesReducer,
    addRecipe: addRecipeReducer,
  },
});


export const { setLoading, setError, setAllRecipes, addRecipe } = recipeSlice.actions;
export const recipeReducer = recipeSlice.reducer;