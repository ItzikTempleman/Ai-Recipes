import { UserModel } from "../models/user-model";
import { visitorRecipeUsageService } from "../services/visitor-recipe-usage-service";
import { userRecipeUsageService } from "../services/user-recipe-usage-service";

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

  // Admin => unlimited
  if (roleId === 1) return "none";

  // Any logged-in non-admin => consume USER usage
  if (user?.id) {
    await userRecipeUsageService.consume(user.id);
    return "user";
  }

  // Guest => consume VISITOR usage
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