"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const client_errors_1 = require("../models/client-errors");
const app_config_1 = require("../utils/app-config");
const status_code_1 = require("../models/status-code");
class ErrorMiddleware {
    catchAll(err, request, response, next) {
        console.log(err);
        const status = err.status || status_code_1.StatusCode.InternalServerError;
        const isCrash = status >= 500 && status <= 599;
        const message = isCrash && app_config_1.appConfig.isProduction ? "Some error, please try again." : err.message;
        response.status(status).send(message);
    }
    routeNotFound(request, response, next) {
        next(new client_errors_1.ClientErrors(status_code_1.StatusCode.NotFound, `Route ${request.originalUrl} not found.`));
    }
}
exports.errorMiddleware = new ErrorMiddleware();
