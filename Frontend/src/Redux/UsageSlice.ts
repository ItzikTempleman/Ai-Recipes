import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RecipeUsage } from "../Models/UsageModel";


const initialState: RecipeUsage | null = null;

export const usageSlice = createSlice({
  name: "usage",
  initialState,
  reducers: {
    setRecipeUsage(_state, action: PayloadAction<RecipeUsage | null>) {
      return action.payload;
    },
    clearUsage() {
      return null;
    },
  },
});

export const { setRecipeUsage, clearUsage } = usageSlice.actions;
export const usageReducer = usageSlice.reducer;