import axios from "axios";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { appConfig } from "../Utils/AppConfig";

export type Statistics = {
    usersEnteredSite: number;
    guestsEnteredSite: number;
    usersWhoGeneratedRecipes: number;
    guestsWhoGeneratedRecipes: number;
    totalRecipesGenerated: number;
};

class AdminService {

    public async getStatistics(): Promise<Statistics> {
        try {
            const { data } = await axios.get<Statistics>(appConfig.adminStatistics, getAuth());
            return data;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch admin data. Try again later");
        }
    }
}

export const adminService = new AdminService();