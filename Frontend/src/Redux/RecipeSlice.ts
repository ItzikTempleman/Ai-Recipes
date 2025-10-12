import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecipeModel, RecipeState } from "../Models/RecipeModel";


const initialState: RecipeState={
    items:[],
    loading:false
};

function resetStateReducer(state: RecipeState) {
  state.items = [];
  state.error = undefined;
  state.loading = false;
} 

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
    resetState:resetStateReducer,
    setIsLoading: setIsLoadingReducer,
    setError: setErrorReducer,
    getAllRecipes: getAllRecipesReducer,
    addRecipe: addRecipeReducer,
  },
});


export const { resetState,setIsLoading, setError, getAllRecipes, addRecipe } = recipeSlice.actions;
export const recipeReducer = recipeSlice.reducer;



