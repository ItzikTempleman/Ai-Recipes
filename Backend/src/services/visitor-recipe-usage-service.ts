import { dal } from "../utils/dal";
import { RecipeUsageExceededError } from "../middleware/error-middleware";
import { UsageRow } from "./user-recipe-usage-service";



class VisitorRecipeUsageService {

public async recordVisitorFirstVisit(visitorId: string): Promise<void> {
  const sql = `insert ignore into visitor_recipe_usage ( visitorId, windowEndsAt,used,totalGenerated)VALUES (?,DATE_ADD(NOW(), INTERVAL 3 DAY),0,0)`;

  await dal.execute(sql, [visitorId]);
}

  public async consume(visitorId: string): Promise<void> {
    const consumeSql = `select used, windowEndsAt, totalGenerated from visitor_recipe_usage where visitorId = ? limit 1`;
    const rows = (await dal.execute(consumeSql, [visitorId])) as UsageRow[];

    if (rows.length === 0) {
      const insertUsageIntoConsumeSql = `
  insert into visitor_recipe_usage (visitorId, windowEndsAt, used, totalGenerated)
  values (?, DATE_ADD(NOW(), INTERVAL ? DAY), 1, 1)
`;
      await dal.execute(insertUsageIntoConsumeSql, [visitorId,3]);
      return;
    }

    const { used, windowEndsAt } = rows[0];
  

    if (new Date(windowEndsAt).getTime() <= new Date().getTime()) {
      const updateHowMuchIsLeftPerUser = `update visitor_recipe_usage set used = 1,  totalGenerated = totalGenerated + 1, windowEndsAt = DATE_ADD(NOW(), INTERVAL ? DAY) where visitorId = ?`;
      await dal.execute(updateHowMuchIsLeftPerUser, [3, visitorId]);
      return;
    }

    if (used >= 5) {
      throw new RecipeUsageExceededError(5, 3);
    }

    const exceededSql = `update visitor_recipe_usage set used = used + 1, totalGenerated = totalGenerated + 1 where visitorId = ?`
    await dal.execute(exceededSql, [visitorId]);
  }

  public async refund(visitorId: string): Promise<void> {
    const refundSql = `
  update visitor_recipe_usage
  set
    used = if(used > 0, used - 1, 0),
    totalGenerated = if(totalGenerated > 0, totalGenerated - 1, 0)
  where visitorId = ?
`;
    await dal.execute(refundSql, [visitorId]);
  }

  public async getStatus(visitorId: string): Promise<{ used: number; remaining: number; windowEndsAt: Date | null }> {
    const statusSql = `select used, windowEndsAt, totalGenerated from visitor_recipe_usage where visitorId = ? limit 1`
    const rows = (await dal.execute(statusSql, [visitorId])) as UsageRow[];

    if (rows.length === 0) return { used: 0, remaining: 5, windowEndsAt: null };

    const used = rows[0].used ?? 0;
    return { used, remaining: Math.max(0, 5 - used), windowEndsAt: rows[0].windowEndsAt };
  }
}

export const visitorRecipeUsageService = new VisitorRecipeUsageService();