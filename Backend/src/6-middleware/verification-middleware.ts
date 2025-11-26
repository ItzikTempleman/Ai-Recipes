import { NextFunction, Request, Response } from "express";
import { AuthorizationError } from "../3-models/client-errors";
import { appConfig } from "../2-utils/app-config";
import { UserModel } from "../3-models/user-model";
import jwt from "jsonwebtoken";
import { StatusCode } from "../3-models/status-code";

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
}
export const verificationMiddleware = new VerificationMiddleware();