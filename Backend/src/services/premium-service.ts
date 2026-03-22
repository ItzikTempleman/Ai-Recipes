import { ResultSetHeader } from "mysql2";
import { ResourceNotFound, ValidationError } from "../models/client-errors";
import { dal } from "../utils/dal";

export enum PremiumPlan {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
}

export enum PaymentProvider {
    STRIPE = "STRIPE",
    PAYPAL = "PAYPAL",
    MANUAL = "MANUAL"
}

export enum PaymentStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    CANCELED = "CANCELED",
    EXPIRED = "EXPIRED",
    FAILED = "FAILED"
}


type PremiumPlanInfo = {
    code: PremiumPlan;
    name: string;
    price: number;
    currency: string;
    durationDays: number;
};

type ActivatePremiumInput = {
    userId: number;
    plan:PremiumPlan;
    provider: PaymentProvider;
    paymentCustomerId?: string | null;
    paymentSubscriptionId?: string | null;
};

type PremiumStatusResponse = {
    isPremium: boolean;
    premiumPlan: string | null;
    premiumSince: string | null;
    premiumUntil: string | null;
    paymentProvider: string | null;
    paymentStatus: string | null;
};

class PremiumService {
    public getPremiumPlans(): PremiumPlanInfo[] {
        return [
            {
                code: PremiumPlan.MONTHLY,
                name: "Monthly Premium",
                price: 14.9,
                currency: "ILS",
                durationDays: 30
            },
            {
                code: PremiumPlan.YEARLY,
                name: "Yearly Premium",
                price: 119.9,
                currency: "ILS",
                durationDays: 365
            }
        ];
    };

    public async getPremiumStatus(userId: number): Promise<PremiumStatusResponse> {
        const sql = `select isPremium, premiumPlan, premiumSince, premiumUntil, paymentProvider, paymentStatus from user where id=? limit 1`;
        const values = [userId];
        const rows = await dal.execute(sql, values) as PremiumStatusResponse[];
        const row = rows[0];
        if (!row) throw new ResourceNotFound(userId);
        return {
            isPremium: Boolean(row.isPremium),
            premiumPlan: row.premiumPlan ?? null,
            premiumSince: row.premiumSince ?? null,
            premiumUntil: row.premiumUntil ?? null,
            paymentProvider: row.paymentProvider ?? null,
            paymentStatus: row.paymentStatus ?? null
        };
    };

    public async isUserPremium(userId: number): Promise<boolean> {
        const sql = 'select isPremium, premiumUntil from user where id=? limit 1';
        const values = [userId];
        const rows = await dal.execute(sql, values) as any[];
        const row = rows[0];
        if (!row.isPremium) return false;
        if (!row.premiumUntil) return false;
        return new Date(row.premiumUntil).getTime() > Date.now();
    };

    public async activatePremium(input: ActivatePremiumInput): Promise<PremiumStatusResponse> {
        const plans = this.getPremiumPlans();
        const selectedPlan = plans.find(plan => plan.code === input.plan);
        if (!selectedPlan) throw new ValidationError("Invalid premium plan");

        const sql = `update user set 
                isPremium = 1,
                premiumPlan = ?,
                premiumSince = now(),
                premiumUntil = date_add(now(), interval ? day),
                paymentProvider = ?,
                paymentStatus = 'ACTIVE',
                paymentCustomerId = ?,
                paymentSubscriptionId = ?
            where id = ?
`;
        const values = [
            input.plan,
            selectedPlan.durationDays,
            input.provider,
            input.paymentCustomerId ?? null,
            input.paymentSubscriptionId ?? null,
            input.userId
        ];

        const result = await dal.execute(sql, values) as ResultSetHeader;
        if (result.affectedRows === 0) throw new ResourceNotFound(input.userId);
        return this.getPremiumStatus(input.userId);
    };

public async cancelPremium(userId: number):Promise<PremiumStatusResponse>{
    const sql = `update user set isPremium = ?, paymentStatus = ? where id = ? `;
 const values = [0, "CANCELED", userId];
    const result = await dal.execute(sql, values) as ResultSetHeader;
    if (result.affectedRows === 0) throw new ResourceNotFound(userId);

    return this.getPremiumStatus(userId);
}

    public async syncPremiumIfExpired(userId: number): Promise<void> {
        const sql = `
            update user
            set
                isPremium = 0,
                paymentStatus = case
                    when paymentStatus = 'ACTIVE' then 'EXPIRED'
                    else paymentStatus
                end
            where
                id = ?
                and isPremium = 1
                and premiumUntil is not null
                and premiumUntil <= now()
        `;
        const values= [userId];
        await dal.execute(sql, values);
    }



}
export const premiumService = new PremiumService();