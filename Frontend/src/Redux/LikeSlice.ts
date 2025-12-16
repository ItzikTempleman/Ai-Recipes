import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LikeModel } from "../Models/RecipeModel";

const initialLikes: LikeModel[] = [];
export const likesSlice = createSlice(
    {
        name: "likes",
        initialState: initialLikes,
        reducers: {
            like(currentLikeState: LikeModel[], action: PayloadAction<LikeModel>) {
                return [...currentLikeState, action.payload];
            },
            unlike(currentLikeState: LikeModel[], action: PayloadAction<LikeModel>) {
                return currentLikeState.filter(like =>
                    !(like.userId === action.payload.userId && like.recipeId === action.payload.recipeId)
                );
            }
        }
    }
)
export const { like, unlike } = likesSlice.actions;
export const likesReducer = likesSlice.reducer;