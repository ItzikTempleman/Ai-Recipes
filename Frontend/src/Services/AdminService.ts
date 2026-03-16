import axios from "axios";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { appConfig } from "../Utils/AppConfig";

class AdminService {

    public async getStatistics(): Promise<number> {
        try {
            const { data } = await axios.get<number>(appConfig.adminStatistics, getAuth());
            return data;
        } catch (err: any) {
            throw new Error(err?.response?.data ?? err?.message ?? "Could'nt fetch admin data. Try again later");
        }
    }
}

export const adminService = new AdminService();