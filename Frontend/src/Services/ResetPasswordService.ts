import axios from "axios";
import { appConfig } from "../Utils/AppConfig";

export enum AuthResponseCode {
    PasswordResetRequested = 1,
    PasswordResetInvalid = 2,
    PasswordResetExpired = 3,
    PasswordResetUsed = 4,
    PasswordResetSuccess = 5
}


export type AuthResponse = {
    code: AuthResponseCode;
    params?: Record<string, string | number>;
}

class ResetPasswordService {
    public async requestOtpCode(email: string): Promise<AuthResponse> {
        const { data } = await axios.post<AuthResponse>(appConfig.forgotPasswordUrl, { email });
        return data;
    };


    public async resetPassword(resetId: number, token: string, newPassword: string): Promise<AuthResponse> {
        const { data } = await axios.post<AuthResponse>(appConfig.resetPasswordUrl, { resetId, token, newPassword });
        return data;
    };
};

export const resetPasswordService = new ResetPasswordService(); 