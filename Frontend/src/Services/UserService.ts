import { Credentials, User } from "../Models/UserModel";
import { jwtDecode } from "jwt-decode";
import { store } from "../Redux/Store";
import { userSlice } from "../Redux/UserSlice";
import axios from "axios";
import { appConfig } from "../Utils/AppConfig";
import { likesSlice } from "../Redux/LikeSlice";

export type DecodedToken = {
    user: User;
    exp: number;
}

class UserService {
    private logoutTimer: ReturnType<typeof setTimeout> | null = null;

    private logoutAfterTimeout(token: string) {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            if (this.logoutTimer) clearTimeout(this.logoutTimer);
            const delay = Math.max(0, decoded.exp * 1000 - Date.now()); // Math.max (0, ...) will turn a theoretically negative delay into 0 
            this.logoutTimer = setTimeout(() => {
                this.logout()
            }, delay);
        } catch (err) {
            this.logout()
        }
    };

    public constructor() {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) return;
        try {
            this.applyToken(savedToken);
        }
        catch (err) {
            this.logout();
        }
    }


    private applyToken(token: string): User | null {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            const dbUser = decoded.user;

            if (decoded.exp * 1000 > Date.now() && dbUser) {
                store.dispatch(userSlice.actions.registrationAndLogin(dbUser));
                localStorage.setItem("token", token);
                this.logoutAfterTimeout(token);
                return dbUser;
            }

            this.logout();
            return null;
        } catch {
            this.logout();
            return null;
        }
    }

    public async loginOrRegister(
        data: { login: Credentials; register?: never } | { register: User; login?: never }
    ): Promise<void> {
        try {
            const isLogin = "login" in data;
            const url = isLogin ? appConfig.loginUrl : appConfig.registerUrl;
            const body = isLogin ? data.login : data.register;

            const response = await axios.post<string>(url, body);
            const token: string = response.data;

            this.applyToken(token);
        } catch (err) {
            this.logout();
            throw err;
        }
    }


    public async loginWithGoogle(credential: string): Promise<User | null> {
        try {
            const response = await axios.post<string>(appConfig.googleLoginUrl, { credential });
            const token: string = response.data;
            return this.applyToken(token);
        } catch (err) {
            this.logout();
            throw err;
        }
    }

    public async setLoggedInUserPassword(password: string): Promise<User> {
        const token = localStorage.getItem("token") ?? "";
        if (!token) throw new Error("Not logged in");

        const response = await axios.post<{ token: string }>(
            appConfig.setUserPasswordUrl,
            { password, confirm: password },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        const newToken = response.data.token;
        const user = this.applyToken(newToken);
        if (!user) throw new Error("Failed to apply updated token");
        return user;
    }

    public logout(): void {
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
            this.logoutTimer = null;
        }
        store.dispatch(likesSlice.actions.clearLikes());
        store.dispatch(userSlice.actions.logout());
        localStorage.removeItem("token");
    }

    public async updateUserInfo(userId: number, formData: FormData): Promise<void> {
        const response = await axios.put<string>(
            appConfig.userUrl + userId,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );

        this.applyToken(response.data);
    }

    public async deleteAccount(id: number): Promise<void> {
        const token = localStorage.getItem("token") ?? "";
        if (!token) throw new Error("Not logged in");
        await axios.delete(appConfig.userUrl + id, {
            headers: { Authorization: `Bearer ${token}` }
        });
        this.logout();
    }


    public async forgotPassword(_email: string): Promise<void> {
        return;
    }
}

export const userService = new UserService();


