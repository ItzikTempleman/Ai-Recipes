import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../Models/UserModel";

const initialState: User | null = null;
export const userSlice = createSlice(
    {
        name: "user",
        initialState:initialState,
        reducers: {
            registrationAndLogin(_state, action: PayloadAction<User>)  {
                return action.payload;
            },
            updateUserProfile(_state, action: PayloadAction<User>)  {
                return action.payload;
            },
            logout(_state) {
                return null;
            },
            deleteAccount(state, action: PayloadAction<number>) {
                const idToDelete = action.payload;
                if (state && state.id === idToDelete) {
                    return null;
                }
                return state;
            }
        }
    }
);


export const { registrationAndLogin, logout, updateUserProfile, deleteAccount } = userSlice.actions;
export const userReducer = userSlice.reducer;