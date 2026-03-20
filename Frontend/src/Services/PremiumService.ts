import axios from "axios";
import { PaymentProvider, PremiumPlan, PremiumPlanInfo, PremiumStatus, User } from "../Models/UserModel";
import { appConfig } from "../Utils/AppConfig";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { jwtDecode } from "jwt-decode";
import { store } from "../Redux/Store";
import { userSlice } from "../Redux/UserSlice";
import { usageService } from "./UsageService";

type DecodedToken = {
    user: User;
    exp: number;
};



class PremiumService {


    public async getPlans(): Promise<PremiumPlanInfo[]> {
        const res = await axios.get<PremiumPlanInfo[]>(appConfig.premiumPlansUrl);
        return res.data;
    }


    public async getPremiumStatus(): Promise<PremiumStatus> {
        const res = await axios.get<PremiumStatus>(appConfig.premiumStatusUrl, getAuth());
        return res.data;
    }


    public async activatePlan(plan: PremiumPlan, provider: PaymentProvider): Promise<PremiumStatus> {
        const res = await axios.post<{
            status: PremiumStatus,
            token: string
        }>(`${appConfig.premiumStatusUrl}/activate`, { plan, provider }, getAuth());
        this.applyToken(res.data.token);
        await usageService.refreshRecipeUsage();
        return res.data.status;
    }
    public async cancel(): Promise<PremiumStatus> {
        const res = await axios.post<{ status: PremiumStatus; token: string }>(
            `${appConfig.premiumStatusUrl}/cancel`,
            {},
            getAuth()
        );

        this.applyToken(res.data.token);
        await usageService.refreshRecipeUsage();
        return res.data.status;
    }

    private applyToken(token: string) {
        localStorage.setItem("token", token);
        const decoded = jwtDecode<DecodedToken>(token);
        store.dispatch(userSlice.actions.registrationAndLogin(decoded.user));
    }
};

export const premiumService = new PremiumService();