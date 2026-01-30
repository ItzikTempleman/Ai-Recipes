"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordController = void 0;
const express_1 = __importDefault(require("express"));
const password_reset_service_1 = require("../services/password-reset-service");
class ResetPasswordController {
    router = express_1.default.Router();
    constructor() {
        this.router.post("/auth/forgot-password", this.forgotPassword);
        this.router.post("/auth/reset-password", this.resetPassword);
        this.router.post("/auth/verify-reset-token", this.verifyResetToken);
    }
    ;
    async forgotPassword(request, response) {
        const body = request.body;
        const result = await password_reset_service_1.passwordResetService.forgotPassword(body.email);
        response.json(result);
    }
    ;
    async resetPassword(request, response, next) {
        const body = request.body;
        const result = await password_reset_service_1.passwordResetService.resetPassword(body.resetId, body.token, body.newPassword);
        response.json(result);
    }
    ;
    async verifyResetToken(request, response, next) {
        const body = request.body;
        const result = await password_reset_service_1.passwordResetService.verifyResetToken(body.resetId, body.token);
        response.json(result);
    }
}
exports.resetPasswordController = new ResetPasswordController();
