import axios from "axios";
import { appConfig } from "../Utils/AppConfig";
import { getAuth } from "../Utils/GetAuthenticationToken";
import { store } from "../Redux/Store";
import { setRecipeUsage } from "../Redux/UsageSlice";
import { RecipeUsage } from "../Models/UsageModel";

function coerceNumber(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function parseUsage(payload: any): RecipeUsage | null {
  if (!payload || typeof payload !== "object") return null;

  const scope = payload.scope === "visitor" ? "visitor" : "user";
  const used = coerceNumber(payload.used) ?? 0;

  const limit =
    payload.limit === null || payload.limit === undefined
      ? coerceNumber(payload.max) ?? coerceNumber(payload.quota) ?? null
      : coerceNumber(payload.limit);

  const remaining =
    payload.remaining === null || payload.remaining === undefined
      ? coerceNumber(payload.left) ?? (limit != null ? Math.max(limit - used, 0) : null)
      : coerceNumber(payload.remaining);

  const windowEndsAt =
    typeof payload.windowEndsAt === "string"
      ? payload.windowEndsAt
      : typeof payload.resetsAt === "string"
      ? payload.resetsAt
      : typeof payload.windowEnd === "string"
      ? payload.windowEnd
      : null;

  const unlimited = Boolean(payload.unlimited || payload.isUnlimited);

  return { scope, used, limit, remaining, windowEndsAt, unlimited };
}

class UsageService {
  public async refreshRecipeUsage(): Promise<RecipeUsage | null> {
    try {
      const res = await axios.get(appConfig.recipeUsageUrl, getAuth());
      const usage = parseUsage(res.data);
      store.dispatch(setRecipeUsage(usage));
      return usage;
    } catch {
      store.dispatch(setRecipeUsage(null));
      return null;
    }
  }

  public clear() {
    store.dispatch(setRecipeUsage(null));
  }
}

export const usageService = new UsageService();