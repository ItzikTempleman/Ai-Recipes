export type User = {
    id?: number;
    firstName: string;
    familyName: string;
    email: string;
    password?: string;
    birthDate?: string | null;
    phoneNumber?: string | null;
    gender?: Gender | null;
    imageUrl?: string;
    image?: File;
    needsPasswordSetup: boolean;
    roleId: number;

    isPremium?: boolean;
    premiumPlan?: PremiumPlan | null;
    premiumSince?: string | null;
    premiumUntil?: string | null;
    paymentProvider?: PaymentProvider | null;
    paymentStatus?: PaymentStatus | null;
    paymentCustomerId?: string | null;
    paymentSubscriptionId?: string | null;
};

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}

export type Credentials = {
    email?: string;
    password?: string;
};

export enum RoleId {
    Admin = 1,
    User = 2,
}

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