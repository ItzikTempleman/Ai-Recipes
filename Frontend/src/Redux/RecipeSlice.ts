import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecipeModel, RecipeState } from "../Models/RecipeModel";


const initialState: RecipeState = {
  items: [],
  current: null,
  loading: false,
};

function setCurrentReducer(state: RecipeState, action: PayloadAction<RecipeModel | null>) {
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
  state.items = Array.isArray(action.payload) ? action.payload : [];   
}

function addRecipeReducer(state: RecipeState, action: PayloadAction<RecipeModel>) {
  state.items.unshift(action.payload);
  state.current = action.payload;
}

function deleteRecipeReducer(state: RecipeState, action: PayloadAction<number>) {
  const idOfRecipeToDelete = action.payload;
  let recipes= state.items;
  let recipeToDelete = state.current;
  recipes = recipes.filter(recipe => recipe.id !== idOfRecipeToDelete);
  if (recipeToDelete?.id === idOfRecipeToDelete) recipeToDelete = null;

    state.items = recipes;
  state.current = recipeToDelete;
}

const recipeSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    resetGenerated: resetGeneratedReducer,
   
    setIsLoading: setIsLoadingReducer,
    setError: setErrorReducer,
    getAllRecipes: getAllRecipesReducer,
    setCurrent: setCurrentReducer,
    addRecipe: addRecipeReducer,
    deleteRecipe: deleteRecipeReducer
  }
}
);


export const { resetGenerated,setIsLoading, setError, getAllRecipes, addRecipe, setCurrent, deleteRecipe } = recipeSlice.actions;
export const recipeReducer = recipeSlice.reducer;



