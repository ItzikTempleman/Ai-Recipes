import { configureStore } from "@reduxjs/toolkit";
import { recipeReducer } from "./RecipeSlice";
import { RecipeState } from "../Models/RecipeModel";
import { User } from "../Models/UserModel";
import { userSlice } from "./UserSlice";

export type AppState = {
    user: User | null;
    recipes: RecipeState;
};


export const store = configureStore(
    {
        reducer: {
            user: userSlice.reducer,
            recipes: recipeReducer
        }
    }
)

