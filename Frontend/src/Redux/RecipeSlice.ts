import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecipeModel, RecipeState } from "../Models/RecipeModel";

const initialState: RecipeState = {
  items: [],
  catalogItems: [],
  current: null,
  guestStash: null,
  loading: false
};

function stashGuestRecipeReducer(state: RecipeState, action: PayloadAction<RecipeModel | null>) {
  state.guestStash = action.payload;
}

function restoreGuestRecipeReducer(state: RecipeState) {
  if (!state.current?.title && state.guestStash) {
    state.current = state.guestStash;
  }
}

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

function getMyRecipesReducer(state: RecipeState, action: PayloadAction<RecipeModel[]>) {
  state.items = Array.isArray(action.payload) ? action.payload : [];
}

function getCatalogRecipesReducer(state: RecipeState, action: PayloadAction<RecipeModel[]>) {
  state.catalogItems = Array.isArray(action.payload) ? action.payload : [];
}

function addRecipeReducer(state: RecipeState, action: PayloadAction<RecipeModel>) {
  state.items.unshift(action.payload);
  state.current = action.payload;
}

function deleteRecipeReducer(state: RecipeState, action: PayloadAction<number>) {
  const idOfRecipeToDelete = action.payload;

  state.items = state.items.filter((recipe) => recipe.id !== idOfRecipeToDelete);
  state.catalogItems = state.catalogItems.filter((recipe) => recipe.id !== idOfRecipeToDelete);

  if (state.current?.id === idOfRecipeToDelete) state.current = null;
}

function upsertRecipeReducer(state: RecipeState, action: PayloadAction<RecipeModel>) {
  const recipe = action.payload;

  state.items = [recipe, ...state.items.filter(r => r.id !== recipe.id)];
  state.catalogItems = (state.catalogItems ?? []).map(r => (r.id === recipe.id ? recipe : r));

  if (state.current?.id === recipe.id) {
    state.current = recipe;
  }
}

const recipeSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    resetGenerated: resetGeneratedReducer,
    setIsLoading: setIsLoadingReducer,
    setError: setErrorReducer,
    getMyRecipes: getMyRecipesReducer,
    getCatalogRecipes: getCatalogRecipesReducer,
    setCurrent: setCurrentReducer,
    addRecipe: addRecipeReducer,
    deleteRecipe: deleteRecipeReducer,
    stashGuestRecipe: stashGuestRecipeReducer,
    restoreGuestRecipe: restoreGuestRecipeReducer,
    upsertRecipe:upsertRecipeReducer
  }
});

export const {
  resetGenerated,
  setIsLoading,
  setError,
  getMyRecipes,
  getCatalogRecipes,
  addRecipe,
  setCurrent,
  deleteRecipe,
  stashGuestRecipe,
  restoreGuestRecipe,
  upsertRecipe
} = recipeSlice.actions;

export const recipeReducer = recipeSlice.reducer;