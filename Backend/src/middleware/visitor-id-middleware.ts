import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { visitorRecipeUsageService } from "../services/visitor-recipe-usage-service";

function shouldSkipVisitorTracking(req: Request): boolean {
  const path = req.path || req.originalUrl || "";

  // Never track infra / non-user requests
  if (req.method === "OPTIONS") return true;
  if (path === "/api/health") return true;

  // Static image requests are not site entries
  if (path.startsWith("/api/recipes/images")) return true;
  if (path.startsWith("/api/users/images")) return true;

  return false;
}

export async function ensureVisitorId(req: Request, res: Response, next: NextFunction) {
  try {
    if (shouldSkipVisitorTracking(req)) {
      return next();
    }

    let visitorId = req.cookies?.visitorId as string | undefined;

    if (!visitorId) {
      visitorId = uuidv4();

      const isProd = process.env.NODE_ENV === "production";

      res.cookie("visitorId", visitorId, {
        httpOnly: true,
        sameSite: isProd ? "none" : "lax",
        secure: isProd,
        maxAge: 1000 * 60 * 60 * 24 * 365,
      });
    }

    (req as any).visitorId = visitorId;

    const authHeader = req.header("authorization");
    const isLoggedInRequest = !!authHeader?.trim();

    if (!isLoggedInRequest) {
      await visitorRecipeUsageService.recordVisitorFirstVisit(visitorId);
    }

    next();
  } catch (err) {
    next(err);
  }
}