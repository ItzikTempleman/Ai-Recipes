import { configureStore } from "@reduxjs/toolkit";
import { recipeReducer } from "./RecipeSlice";
import { LikeModel, RecipeState } from "../Models/RecipeModel";
import { User } from "../Models/UserModel";
import { userSlice } from "./UserSlice";
import { likesReducer } from "./LikeSlice";
import { passwordResetReducer, PasswordResetState } from "./ResetSlice";
import { RecipeUsage } from "../Models/UsageModel";
import { usageReducer } from "./UsageSlice";

export type AppState = {
    user: User | null;
    recipes: RecipeState;
    likes: LikeModel[];
    passwordReset: PasswordResetState,
    usage: RecipeUsage | null;
};


export const store = configureStore(
    {
        reducer: {
            user: userSlice.reducer,
            recipes: recipeReducer,
            likes: likesReducer,
            passwordReset: passwordResetReducer,
            usage: usageReducer
        }
    }
)

