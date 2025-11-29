import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../Models/UserModel";


function registerOrLogin(_: User, action: PayloadAction<User>) {
    return action.payload;
};

function logoutUser(): null{
     return null;
};


export const userSlice = createSlice(
    {
        name: "users",
        initialState: null as User | null,
        reducers: {
        registrationAndLogin:registerOrLogin,
        logout: logoutUser
        }
    }
);

export const {registrationAndLogin,logout}= userSlice.actions;
export const userReducer= userSlice.reducer;