import { configureStore } from "@reduxjs/toolkit";
import { recipeReducer } from "./RecipeSlice";

export const store = configureStore(
    {
        reducer: {
            recipes: recipeReducer
        }
    }
)

