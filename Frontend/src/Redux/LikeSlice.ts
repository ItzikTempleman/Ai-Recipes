import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LikeModel } from "../Models/RecipeModel";

const initialLikes: LikeModel[] = [];
export const likesSlice = createSlice(
    {
        name: "likes",
        initialState: initialLikes,
        reducers: {
            like(current, action: PayloadAction<LikeModel>) {
                const exists = current.find(
                    l => l.userId === action.payload.userId && l.recipeId === action.payload.recipeId
                );
                if (exists) return current;
                return [...current, action.payload];
            },
            unlike(currentLikeState: LikeModel[], action: PayloadAction<LikeModel>) {
                return currentLikeState.filter(like =>
                    !(like.userId === action.payload.userId && like.recipeId === action.payload.recipeId)
                );
            },
            setLikes(_state, action: PayloadAction<LikeModel[]>) {
                return action.payload;
            },
            clearLikes() {
                return [];
            },
        }
    }
)
export const { like, unlike, setLikes, clearLikes} = likesSlice.actions;
export const likesReducer = likesSlice.reducer;