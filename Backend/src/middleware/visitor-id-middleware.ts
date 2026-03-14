import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { visitorRecipeUsageService } from "../services/visitor-recipe-usage-service";

export async function ensureVisitorId(req: Request, res: Response, next: NextFunction) {
  try {
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