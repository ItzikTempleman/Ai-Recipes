import { dal } from "../utils/dal";
import { RecipeUsageExceededError } from "../middleware/error-middleware";

export enum UserUsagePolicy {
  FREE_3_DAYS = "FREE_3_DAYS",
  PREMIUM_1_DAY = "PREMIUM_1_DAY"
}

export type UsageRow = {
  used: number;
  windowEndsAt: Date;
  totalGenerated: number;
  windowStartedAt?: Date | null;
  windowPolicy?: UserUsagePolicy | null;
};

type UsagePolicyConfig = {
  limit: number;
  windowDays: number;
};

class UserRecipeUsageService {
  private getPolicyConfig(policy: UserUsagePolicy): UsagePolicyConfig {
    switch (policy) {
      case UserUsagePolicy.PREMIUM_1_DAY:
        return { limit: 15, windowDays: 1 };
      case UserUsagePolicy.FREE_3_DAYS:
      default:
        return { limit: 8, windowDays: 3 };
    }
  }

  public async recordUserFirstVisit(
    userId: number,
    policy: UserUsagePolicy = UserUsagePolicy.FREE_3_DAYS
  ): Promise<void> {
    const config = this.getPolicyConfig(policy);

    const sql = `
      insert into user_recipe_usage (
        userId,
        windowStartedAt,
        windowEndsAt,
        used,
        totalGenerated,
        windowPolicy
      )
      values (?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 0, 0, ?)
      on duplicate key update userId = userId
    `;

    await dal.execute(sql, [userId, config.windowDays, policy]);
  }

public async mergeVisitorIntoUser(
  userId: number,
  visitorId: string,
  policy: UserUsagePolicy = UserUsagePolicy.FREE_3_DAYS
): Promise<void> {
  const visitorRows = (await dal.execute(
    `
    select used, windowEndsAt, totalGenerated
    from visitor_recipe_usage
    where visitorId = ?
    limit 1
    `,
    [visitorId]
  )) as UsageRow[];

  await this.recordUserFirstVisit(userId, policy);

  if (visitorRows.length === 0) return;

  const visitor = visitorRows[0];
  const config = this.getPolicyConfig(policy);

  const userRows = (await dal.execute(
    `
    select used, windowEndsAt, totalGenerated, windowStartedAt, windowPolicy
    from user_recipe_usage
    where userId = ?
    limit 1
    `,
    [userId]
  )) as UsageRow[];

  const userRow = userRows[0];
  const currentPolicy = userRow.windowPolicy ?? UserUsagePolicy.FREE_3_DAYS;
  const windowExpired =
    !userRow.windowEndsAt ||
    new Date(userRow.windowEndsAt).getTime() <= Date.now();

  const policyChanged = currentPolicy !== policy;

  if (windowExpired || policyChanged) {
    await dal.execute(
      `
      update user_recipe_usage
      set
        used = least(?, ?),
        totalGenerated = totalGenerated + ?,
        windowStartedAt = NOW(),
        windowEndsAt = DATE_ADD(NOW(), INTERVAL ? DAY),
        windowPolicy = ?
      where userId = ?
      `,
      [
        visitor.used ?? 0,
        config.limit,
        visitor.totalGenerated ?? 0,
        config.windowDays,
        policy,
        userId
      ]
    );
  } else {
    await dal.execute(
      `
      update user_recipe_usage
      set
        used = least(greatest(used, ?), ?),
        totalGenerated = totalGenerated + ?
      where userId = ?
      `,
      [
        visitor.used ?? 0,
        config.limit,
        visitor.totalGenerated ?? 0,
        userId
      ]
    );
  }

  await dal.execute(
    `delete from visitor_recipe_usage where visitorId = ?`,
    [visitorId]
  );
}

  public async consume(
    userId: number,
    policy: UserUsagePolicy = UserUsagePolicy.FREE_3_DAYS
  ): Promise<void> {
    const config = this.getPolicyConfig(policy);

    const sql = `
      select used, windowEndsAt, totalGenerated, windowStartedAt, windowPolicy
      from user_recipe_usage
      where userId = ?
      limit 1
    `;

    const rows = (await dal.execute(sql, [userId])) as UsageRow[];

    if (rows.length === 0) {
      const insertSql = `
        insert into user_recipe_usage (
          userId,
          windowStartedAt,
          windowEndsAt,
          used,
          totalGenerated,
          windowPolicy
        )
        values (?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), 1, 1, ?)
      `;
      await dal.execute(insertSql, [userId, config.windowDays, policy]);
      return;
    }

    const row = rows[0];
    const currentPolicy = row.windowPolicy ?? UserUsagePolicy.FREE_3_DAYS;
    const windowExpired =
      !row.windowEndsAt ||
      new Date(row.windowEndsAt).getTime() <= Date.now();

    const policyChanged = currentPolicy !== policy;

    if (windowExpired || policyChanged) {
      const resetSql = `
        update user_recipe_usage
        set
          used = 1,
          totalGenerated = totalGenerated + 1,
          windowStartedAt = NOW(),
          windowEndsAt = DATE_ADD(NOW(), INTERVAL ? DAY),
          windowPolicy = ?
        where userId = ?
      `;
      await dal.execute(resetSql, [config.windowDays, policy, userId]);
      return;
    }

    if ((row.used ?? 0) >= config.limit) {
      throw new RecipeUsageExceededError(config.limit, config.windowDays);
    }

    const incSql = `
      update user_recipe_usage
      set
        used = used + 1,
        totalGenerated = totalGenerated + 1
      where userId = ?
    `;
    await dal.execute(incSql, [userId]);
  }

  public async refund(userId: number): Promise<void> {
    const refundSql = `
      update user_recipe_usage
      set
        used = if(used > 0, used - 1, 0),
        totalGenerated = if(totalGenerated > 0, totalGenerated - 1, 0)
      where userId = ?
    `;
    await dal.execute(refundSql, [userId]);
  }

  public async getStatus(
    userId: number,
    policy: UserUsagePolicy = UserUsagePolicy.FREE_3_DAYS
  ): Promise<{
    used: number;
    remaining: number;
    windowEndsAt: Date | null;
    limit: number;
  }> {
    const config = this.getPolicyConfig(policy);

    const statusSql = `
      select used, windowEndsAt, totalGenerated, windowStartedAt, windowPolicy
      from user_recipe_usage
      where userId = ?
      limit 1
    `;

    const rows = (await dal.execute(statusSql, [userId])) as UsageRow[];

    if (rows.length === 0) {
      return {
        used: 0,
        remaining: config.limit,
        windowEndsAt: null,
        limit: config.limit
      };
    }

    const row = rows[0];
    const currentPolicy = row.windowPolicy ?? UserUsagePolicy.FREE_3_DAYS;

    if (
      currentPolicy !== policy ||
      !row.windowEndsAt ||
      new Date(row.windowEndsAt).getTime() <= Date.now()
    ) {
      return {
        used: 0,
        remaining: config.limit,
        windowEndsAt: null,
        limit: config.limit
      };
    }

    const used = row.used ?? 0;

    return {
      used,
      remaining: Math.max(0, config.limit - used),
      windowEndsAt: row.windowEndsAt,
      limit: config.limit
    };
  }
}

export const userRecipeUsageService = new UserRecipeUsageService();