import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type PasswordResetState = {
    email: string;
    resetId: number | null;
    token: string;
    step: "enterEmail" | "enterCode" | "enterNewPassword" | "finnish";
    
};

const initialState: PasswordResetState = {
    email: "",
    resetId: null,
    token: "",
    step: "enterEmail",
    
};


export const passwordResetSlice = createSlice(
    {
        name: "passwordReset",
        initialState,
        reducers: {
            setEmail(state, action: PayloadAction<string>) {
                state.email = action.payload ?? "";
            },
            setResetId(state, action: PayloadAction<number | null>) {
                state.resetId = action.payload;
            },
            setToken(state, action: PayloadAction<string>) {
                state.token = action.payload ?? "";
            },
            setStep(state, action: PayloadAction<"enterEmail" | "enterCode" | "enterNewPassword" | "finnish">) {
                state.step = action.payload;
            },
            clearReset() {
                return initialState;
            }
        }
    }
);

export const { setEmail, setResetId, setToken, setStep, clearReset } = passwordResetSlice.actions;
export const passwordResetReducer = passwordResetSlice.reducer;