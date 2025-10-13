import { configureStore } from "@reduxjs/toolkit";
import { recipeReducer } from "./RecipeSlice";
import { RecipeState } from "../Models/RecipeModel";

export type AppState = {
  recipes: RecipeState;
};


export const store = configureStore(
    {
        reducer: {
            recipes: recipeReducer
        }
    }
)

