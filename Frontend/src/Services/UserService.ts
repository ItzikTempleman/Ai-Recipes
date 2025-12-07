import { Credentials, User } from "../Models/UserModel";
import { jwtDecode } from "jwt-decode";
import { notify } from "../Utils/Notify";
import { store } from "../Redux/Store";
import { userSlice } from "../Redux/UserSlice";
import axios, { AxiosRequestConfig } from "axios";
import { appConfig } from "../Utils/AppConfig";

export type DecodedToken = {
    user: User;
    exp: number;
}

class UserService {
    private logoutTimer: number | null = null;

    private logoutAfterTimeout(token: string) {
        try {
            const decoded = jwtDecode<DecodedToken>(token);
            if (this.logoutTimer) clearTimeout(this.logoutTimer);
            const delay = Math.max(0, decoded.exp * 1000 - Date.now()); // Math.max (0, ...) will turn a theoretically negative delay into 0 
            this.logoutTimer = setTimeout(() => {
                this.logout()
            }, delay);
        } catch (err) {
            notify.error(err);
            this.logout()
        }
    };

    public constructor() {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) return;
        try {
            const decoded = jwtDecode<DecodedToken>(savedToken);
            const user = decoded.user;
            if ((decoded.exp * 1000) > Date.now() && user) {
                store.dispatch(userSlice.actions.registrationAndLogin(user));
                this.logoutAfterTimeout(savedToken);
            } else {
                this.logout()
            }
        }
        catch (err) {
            notify.error(err);
            this.logout();
        }
    }

    public async loginOrRegister(data: | { login: Credentials; register?: never } | { register: User; login?: never }): Promise<void> {
        try {
            const isLogin = "login" in data;
            const url = isLogin ? appConfig.loginUrl : appConfig.registerUrl;
            const body = isLogin ? data.login : data.register;
            const response = await axios.post<string>(url, body);
            const token: string = response.data;
            const decoded = jwtDecode<DecodedToken>(token);
            const dbUser = decoded.user;
            if ((decoded.exp * 1000) > Date.now() && dbUser) {
                store.dispatch(userSlice.actions.registrationAndLogin(dbUser));
                localStorage.setItem("token", token);
                this.logoutAfterTimeout(token);
            } else {
                this.logout();
            }
        } catch (err) {
            notify.error(err);
            this.logout();
            throw err;
        }
    }

    public logout(): void {
        if (this.logoutTimer) {
            clearTimeout(this.logoutTimer);
            this.logoutTimer = null;
        }
        store.dispatch(userSlice.actions.logout());
        localStorage.removeItem("token");
    }

    public async updateUserInfo(user: User): Promise<void> {
        const options: AxiosRequestConfig = {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        };

            const response = await axios.put<User>(appConfig.userUrl + user.id, user, options)
            const dbUser = response.data;
            store.dispatch(userSlice.actions.updateUserProfile(dbUser));
        
    }

    public async deleteAccount(id: number): Promise<void> {
        await axios.delete(appConfig.userUrl + id);
        store.dispatch(userSlice.actions.deleteAccount(id));
    }
}

export const userService = new UserService();


