import { dal } from "../utils/dal";
import { RecipeUsageExceededError } from "../middleware/error-middleware";

type UsageRow = { used: number; windowEndsAt: Date };

class VisitorRecipeUsageService {
  private readonly max_amount_per_usage = 8;
  private readonly usage_days = 3;

  public async consume(visitorId: string): Promise<void> {
    const consumeSql = `select used, windowEndsAt from visitor_recipe_usage where visitorId = ? limit 1`;
    const rows = (await dal.execute(consumeSql, [visitorId])) as UsageRow[];

    if (rows.length === 0) {
      const insertUsageIntoConsumeSql = `insert into visitor_recipe_usage (visitorId, windowEndsAt, used) values (?, DATE_ADD(NOW(), INTERVAL ? DAY), 1)`
      await dal.execute(insertUsageIntoConsumeSql, [visitorId, this.usage_days]);
      return;
    }

    const { used, windowEndsAt } = rows[0];
    const now = new Date();

    if (new Date(windowEndsAt).getTime() <= now.getTime()) {
      const updateHowMuchIsLeftPerUser = `update visitor_recipe_usage set used = 1, windowEndsAt = DATE_ADD(NOW(), INTERVAL ? DAY) where visitorId = ?`;
      await dal.execute(updateHowMuchIsLeftPerUser, [this.usage_days, visitorId]);
      return;
    }

    if (used >= this.max_amount_per_usage) {
      throw new RecipeUsageExceededError();
    }
    const exceededSql = `update visitor_recipe_usage set used = used + 1 where visitorId = ?`
    await dal.execute(exceededSql, [visitorId]);
  }

  public async refund(visitorId: string): Promise<void> {
    const refundSql = `update visitor_recipe_usage set used = if(used > 0, used - 1, 0) where visitorId = ?`;
    await dal.execute(refundSql, [visitorId]);
  }

  public async getStatus(visitorId: string): Promise<{ used: number; remaining: number; windowEndsAt: Date | null }> {
    const statusSql=`select used, windowEndsAt from visitor_recipe_usage where visitorId = ? limit 1`
    const rows = (await dal.execute(statusSql,[visitorId])) as UsageRow[];
    if (rows.length === 0) return { used: 0, remaining: 8, windowEndsAt: null };
    const used = rows[0].used ?? 0;
    return { used, remaining: Math.max(0, 8 - used), windowEndsAt: rows[0].windowEndsAt };
  }
}

export const visitorRecipeUsageService = new VisitorRecipeUsageService();


