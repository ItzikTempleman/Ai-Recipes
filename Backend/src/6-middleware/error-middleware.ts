import { NextFunction, Request, Response } from "express";

import { ClientErrors, RouteNotFound } from "../3-models/client-errors";
import { appConfig } from "../2-utils/app-config";
import { StatusCode } from "../3-models/status-code";


class ErrorMiddleware {

    public catchAll(err: any, request: Request, response: Response, next: NextFunction): void {
        console.log(err);
        const status = err.status || StatusCode.InternalServerError;
        const isCrash = status >= 500 && status <= 599;
        const message = isCrash && appConfig.isProduction ? "Some error, please try again." : err.message;
        response.status(status).send(message);
    }

    public routeNotFound(request: Request, response: Response, next: NextFunction): void {
        next(new ClientErrors(StatusCode.NotFound, `Route ${request.originalUrl} not found.`));
    }
}

export const errorMiddleware = new ErrorMiddleware();
