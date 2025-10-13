import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecipeModel, RecipeState } from "../Models/RecipeModel";


const initialState: RecipeState={
   items: [],
  current: null,
  loading: false,
};

function setCurrentReducer(state: RecipeState, action: PayloadAction<RecipeModel|null>) {
  state.current = action.payload;
}

function resetGeneratedReducer(state: RecipeState) {
  state.current = null;                  
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
  state.current = action.payload;         
}

const recipeSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    resetGenerated:resetGeneratedReducer,
    setIsLoading: setIsLoadingReducer,
    setError: setErrorReducer,
    getAllRecipes: getAllRecipesReducer,
    setCurrent: setCurrentReducer,
    addRecipe: addRecipeReducer,
  },
});


export const { resetGenerated,setIsLoading, setError, getAllRecipes, addRecipe,setCurrent } = recipeSlice.actions;
export const recipeReducer = recipeSlice.reducer;



