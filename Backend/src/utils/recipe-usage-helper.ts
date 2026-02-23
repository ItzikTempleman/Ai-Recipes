import { UserModel } from "../models/user-model";
import { visitorRecipeUsageService } from "../services/visitor-recipe-usage-service";
import { userRecipeUsageService } from "../services/user-recipe-usage-service";

export type UsageConsumer = "none" | "user" | "visitor";

export async function consumeRecipeUsage(
  user: UserModel | undefined,
  visitorId: string
): Promise<UsageConsumer> {

  if (user?.roleId === 1) {
    return "none";
  }

  if (user?.id && user.roleId === 2) {
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
  }
  if (consumed === "visitor") {
    await visitorRecipeUsageService.refund(visitorId);
  }
}