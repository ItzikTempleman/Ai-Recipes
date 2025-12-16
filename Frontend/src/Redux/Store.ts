import { configureStore } from "@reduxjs/toolkit";
import { recipeReducer } from "./RecipeSlice";
import { LikeModel, RecipeState } from "../Models/RecipeModel";
import { User } from "../Models/UserModel";
import { userSlice } from "./UserSlice";
import { likesReducer } from "./LikeSlice";

export type AppState = {
    user: User | null;
    recipes: RecipeState;
    likes:LikeModel[]
};


export const store = configureStore(
    {
        reducer: {
            user: userSlice.reducer,
            recipes: recipeReducer,
            likes: likesReducer
        }
    }
)

