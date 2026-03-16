import axios from "axios";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { appConfig } from "../Utils/AppConfig";

type Statistics = {
    usersEnteredSite: number,
    guestsEnteredSite: number,
    usersWhoGeneratedRecipes: number,
    guestsWhoGeneratedRecipes: number,
    totalRecipesGenerated: number
}

class AdminService {

    public async getNumOfUsersEnteredSite(): Promise<number> {
        try {
            const { data } = await axios.get<Statistics>(appConfig.adminStatistics, getAuth());
            return data.usersEnteredSite;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch number of users who entered the site");
        }
    }

    public async getNumOfGuestsEnteredSite(): Promise<number> {
        try {
            const { data } = await axios.get<Statistics>(appConfig.adminStatistics, getAuth());
            return data.guestsEnteredSite;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch number of guests who entered the site");
        }
    }

    public async getNumOfUsersGeneratedRecipes(): Promise<number> {
        try {
            const { data } = await axios.get<Statistics>(appConfig.adminStatistics, getAuth());
            return data.usersWhoGeneratedRecipes;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch number of users who generated recipes");
        }
    }

    public async getNumOfGuestsGeneratedRecipes(): Promise<number> {
        try {
            const { data } = await axios.get<Statistics>(appConfig.adminStatistics, getAuth());
            return data.guestsWhoGeneratedRecipes;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch number of guests who generated recipes");
        }

    }

    public async getNumOfAllRecipesGenerated(): Promise<number> {
        try {
            const { data } = await axios.get<Statistics>(appConfig.adminStatistics, getAuth());
            return data.totalRecipesGenerated;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch number total recipes");
        }
    }
}

export const adminService = new AdminService();