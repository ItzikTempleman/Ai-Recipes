"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DangerousRequestError = exports.AuthorizationError = exports.ValidationError = exports.ResourceNotFound = exports.RouteNotFound = exports.ClientErrors = void 0;
const status_code_1 = require("./status-code");
class ClientErrors {
    status;
    message;
    constructor(status, message) {
        this.status = status;
        this.message = message;
    }
    ;
}
exports.ClientErrors = ClientErrors;
class RouteNotFound extends ClientErrors {
    constructor(method, route) {
        super(status_code_1.StatusCode.NotFound, `Route ${route} on method: ${method} not found`);
    }
    ;
}
exports.RouteNotFound = RouteNotFound;
class ResourceNotFound extends ClientErrors {
    constructor(id) {
        super(status_code_1.StatusCode.NotFound, `id ${id} not found.`);
    }
    ;
}
exports.ResourceNotFound = ResourceNotFound;
class ValidationError extends ClientErrors {
    constructor(message) {
        super(status_code_1.StatusCode.BadRequest, message);
    }
    ;
}
exports.ValidationError = ValidationError;
class AuthorizationError extends ClientErrors {
    constructor(message) {
        super(status_code_1.StatusCode.Unauthorized, message);
    }
    ;
}
exports.AuthorizationError = AuthorizationError;
class DangerousRequestError extends ClientErrors {
    constructor(message) {
        super(status_code_1.StatusCode.Forbidden, message);
    }
    ;
}
exports.DangerousRequestError = DangerousRequestError;
