import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export function ensureVisitorId(req: Request, res: Response, next: NextFunction) {
  const existing = (req as any).cookies?.visitorId;

  if (existing && typeof existing === "string" && existing.length >= 10) {
    (req as any).visitorId = existing;
    return next();
  }

  const newId = uuidv4();

  res.cookie("visitorId", newId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // set true when you are on HTTPS
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  (req as any).visitorId = newId;
  next();
}