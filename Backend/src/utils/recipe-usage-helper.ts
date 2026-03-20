import { UserModel } from "../models/user-model";
import { visitorRecipeUsageService } from "../services/visitor-recipe-usage-service";
import { userRecipeUsageService } from "../services/user-recipe-usage-service";
import { premiumService } from "../services/premium-service";

export type UsageConsumer = "none" | "user" | "visitor";

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function consumeRecipeUsage(
  user: UserModel | undefined,
  visitorId: string
): Promise<UsageConsumer> {
  const roleId = toNum((user as any)?.roleId);

  if (roleId === 1) return "none";

  if (user?.id) {
    const isPremium = await premiumService.isUserPremium(user.id);
    if (isPremium) return "none";

    await userRecipeUsageService.consume(user.id);
    return "user";
  }

  await visitorRecipeUsageService.consume(visitorId);
  return "visitor";
}

export async function refundRecipeUsage(
  consumed: UsageConsumer,
  user: UserModel | undefined,
  visitorId: string
): Promise<void> {
  if (consumed === "user" && user?.id) {
    await userRecipeUsageService.refund(user.id);
  } else if (consumed === "visitor") {
    await visitorRecipeUsageService.refund(visitorId);
  }
}