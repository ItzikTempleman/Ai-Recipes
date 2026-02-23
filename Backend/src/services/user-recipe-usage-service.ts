import { dal } from "../utils/dal";
import { RecipeUsageExceededError } from "../middleware/error-middleware";


type UsageRow = { used: number; windowEndsAt: Date };

class UserRecipeUsageService {
  private readonly max_amount_per_usage = 8;
  private readonly usage_days = 3;

  public async consume(userId: number): Promise<void> {
    const sql = `select used, windowEndsAt from user_recipe_usage where userId = ? limit 1`;
    const rows = (await dal.execute(sql, [userId])) as UsageRow[];

    if (rows.length === 0) {
      const insertSql = `insert into user_recipe_usage (userId, windowEndsAt, used) values (?, DATE_ADD(NOW(), INTERVAL ? DAY), 1)`;
      await dal.execute(insertSql, [userId, this.usage_days]);
      return;
    }

    const { used, windowEndsAt } = rows[0];
    const now = new Date();

    if (new Date(windowEndsAt).getTime() <= now.getTime()) {
      const resetSql = `update user_recipe_usage set used = 1, windowEndsAt = DATE_ADD(NOW(), INTERVAL ? DAY) where userId = ?`;
      await dal.execute(resetSql, [this.usage_days, userId]);
      return;
    }

    if (used >= this.max_amount_per_usage) {
      throw new RecipeUsageExceededError();
    }

    const incSql = `update user_recipe_usage set used = used + 1 where userId = ?`;
    await dal.execute(incSql, [userId]);
  }

  public async refund(userId: number): Promise<void> {
    const refundSql = `update user_recipe_usage set used = if(used > 0, used - 1, 0) where userId = ?`;
    await dal.execute(refundSql, [userId]);
  }

  public async getStatus(userId: number): Promise<{ used: number; remaining: number; windowEndsAt: Date | null }> {
    const statusSql = `select used, windowEndsAt from user_recipe_usage where userId = ? limit 1`;
    const rows = (await dal.execute(statusSql, [userId])) as UsageRow[];

    if (rows.length === 0) return { used: 0, remaining: 8, windowEndsAt: null };
    const used = rows[0].used ?? 0;
    return { used, remaining: Math.max(0, 8 - used), windowEndsAt: rows[0].windowEndsAt };
  }
}

export const userRecipeUsageService = new UserRecipeUsageService();