import { dal } from "../utils/dal";
import { RecipeUsageExceededError } from "../middleware/error-middleware";

export type UsageRow = {
  used: number;
  windowEndsAt: Date;
  totalGenerated: number;
};

class UserRecipeUsageService {

  public async recordUserFirstVisit(userId: number): Promise<void> {
    const sql = `
      insert into user_recipe_usage (userId, windowEndsAt, used, totalGenerated)
      values (?, DATE_ADD(NOW(), INTERVAL ? DAY), 0, 0)
      on duplicate key update userId = userId
    `;
    await dal.execute(sql, [userId, 3]);
  }

    public async mergeVisitorIntoUser(userId: number, visitorId: string): Promise<void> {
    const visitorRows = await dal.execute(
      `select used, windowEndsAt, totalGenerated
       from visitor_recipe_usage
       where visitorId = ?
       limit 1`,
      [visitorId]
    ) as UsageRow[];

    await this.recordUserFirstVisit(userId);

    if (visitorRows.length === 0) return;

    const visitor = visitorRows[0];

    await dal.execute(
      `
      update user_recipe_usage
      set
        used = greatest(used, ?),
        totalGenerated = totalGenerated + ?,
        windowEndsAt =
          case
            when windowEndsAt is null then ?
            when ? is null then windowEndsAt
            when ? > windowEndsAt then ?
            else windowEndsAt
          end
      where userId = ?
      `,
      [
        visitor.used ?? 0,
        visitor.totalGenerated ?? 0,
        visitor.windowEndsAt ?? null,
        visitor.windowEndsAt ?? null,
        visitor.windowEndsAt ?? null,
        visitor.windowEndsAt ?? null,
        userId
      ]
    );

    await dal.execute(
      `delete from visitor_recipe_usage where visitorId = ?`,
      [visitorId]
    );
  }

  
  public async consume(userId: number): Promise<void> {
    const sql = `select used, windowEndsAt,totalGenerated from user_recipe_usage where userId = ? limit 1`;
    const values = [userId];
    const rows = (await dal.execute(sql, values)) as UsageRow[];

    if (rows.length === 0) {
      const insertSql = `insert into user_recipe_usage (userId, windowEndsAt, used,totalGenerated) values (?, DATE_ADD(NOW(), INTERVAL ? DAY), 1,1 )`;
      await dal.execute(insertSql, [userId, 3]);
      return;
    }

    const { used, windowEndsAt } = rows[0];
    
    if (new Date(windowEndsAt).getTime() <= new Date().getTime()) {
      const resetSql = `update user_recipe_usage set used = 1,totalGenerated = totalGenerated + 1, windowEndsAt = DATE_ADD(NOW(), INTERVAL ? DAY) where userId = ?`;
      await dal.execute(resetSql, [3, userId]);
      return;
    }

    if (used >= 8) {
      throw new RecipeUsageExceededError(8, 3);
    }

    const incSql = `update user_recipe_usage set used = used + 1,totalGenerated = totalGenerated + 1 where userId = ?`;
    await dal.execute(incSql, [userId]);
  }

  public async refund(userId: number): Promise<void> {
    const refundSql = `update user_recipe_usage set used = if(used > 0, used - 1, 0), totalGenerated = if(totalGenerated > 0, totalGenerated - 1, 0) where userId = ?`;
    await dal.execute(refundSql, [userId]);
  }

  public async getStatus(userId: number): Promise<{ used: number; remaining: number; windowEndsAt: Date | null }> {
    const statusSql = `select used, windowEndsAt,totalGenerated from user_recipe_usage where userId = ? limit 1`;
    const rows = (await dal.execute(statusSql, [userId])) as UsageRow[];

    if (rows.length === 0) return { used: 0, remaining: 8, windowEndsAt: null };

    const used = rows[0].used ?? 0;
    return { used, remaining: Math.max(0, 8 - used), windowEndsAt: rows[0].windowEndsAt };
  }
}

export const userRecipeUsageService = new UserRecipeUsageService();