import { NextFunction, Request, Response } from "express";

import { ClientErrors, RouteNotFound } from "../models/client-errors";
import { appConfig } from "../utils/app-config";
import { StatusCode } from "../models/status-code";


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

export class RecipeUsageExceededError extends ClientErrors {
  public constructor() {
    super(
      StatusCode.TooManyRequests,
      "You reached the limit of 8 recipes every 3 days. Please try again later."
    );
  }
}