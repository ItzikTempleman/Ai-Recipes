import { NextFunction, Request, Response } from "express";
import { AuthorizationError } from "../models/client-errors";
import { appConfig } from "../utils/app-config";
import { UserModel } from "../models/user-model";
import jwt from "jsonwebtoken";
import { StatusCode } from "../models/status-code";

class VerificationMiddleware {
    public readonly verifyLoggedIn = (request: Request, response: Response, next: NextFunction):void => {
        try {
            const authHeader = (request.headers as any)["authorization"] as string | undefined;
            const userJWT = authHeader?.split(" ")[1];
            if (!userJWT) throw new AuthorizationError("Missing valid user");
            const payload = jwt.verify(userJWT, appConfig.jwtSecretKey) as { user: UserModel };
            (request as any).user = payload.user;
            next();
        } catch {
             response.status(StatusCode.Unauthorized).send("Unauthorized");
        }
    }


public verifyOptional(request: Request, response: Response, next: NextFunction) {
  try {
    const header = request.header("authorization");
    if (!header) return next();

    const token = header.replace("Bearer ", "").trim();
    if (!token) return next();

    const payload = jwt.verify(token, appConfig.jwtSecretKey) as { user: UserModel };
    (request as any).user = payload.user;

    next();
  } catch {
    next();
  }
}
}
export const verificationMiddleware = new VerificationMiddleware();