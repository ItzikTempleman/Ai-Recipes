"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificationMiddleware = void 0;
const client_errors_1 = require("../models/client-errors");
const app_config_1 = require("../utils/app-config");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const status_code_1 = require("../models/status-code");
class VerificationMiddleware {
    verifyLoggedIn = (request, response, next) => {
        try {
            const authHeader = request.headers["authorization"];
            const userJWT = authHeader?.split(" ")[1];
            if (!userJWT)
                throw new client_errors_1.AuthorizationError("Missing valid user");
            const payload = jsonwebtoken_1.default.verify(userJWT, app_config_1.appConfig.jwtSecretKey);
            request.user = payload.user;
            next();
        }
        catch {
            response.status(status_code_1.StatusCode.Unauthorized).send("Unauthorized");
        }
    };
    verifyOptional(request, response, next) {
        try {
            const header = request.header("authorization");
            if (!header)
                return next();
            const token = header.replace("Bearer ", "").trim();
            if (!token)
                return next();
            const payload = jsonwebtoken_1.default.verify(token, app_config_1.appConfig.jwtSecretKey);
            request.user = payload.user;
            next();
        }
        catch {
            next();
        }
    }
}
exports.verificationMiddleware = new VerificationMiddleware();
