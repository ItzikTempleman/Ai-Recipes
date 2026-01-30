"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mailer = exports.AuthResponseCode = exports.ResetPasswordRequest = exports.ForgotPasswordRequest = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const app_config_1 = require("../utils/app-config");
class ForgotPasswordRequest {
    email;
}
exports.ForgotPasswordRequest = ForgotPasswordRequest;
class ResetPasswordRequest {
    resetId;
    token;
    newPassword;
}
exports.ResetPasswordRequest = ResetPasswordRequest;
var AuthResponseCode;
(function (AuthResponseCode) {
    AuthResponseCode[AuthResponseCode["PasswordResetRequested"] = 1] = "PasswordResetRequested";
    AuthResponseCode[AuthResponseCode["PasswordResetInvalid"] = 2] = "PasswordResetInvalid";
    AuthResponseCode[AuthResponseCode["PasswordResetExpired"] = 3] = "PasswordResetExpired";
    AuthResponseCode[AuthResponseCode["PasswordResetUsed"] = 4] = "PasswordResetUsed";
    AuthResponseCode[AuthResponseCode["PasswordResetSuccess"] = 5] = "PasswordResetSuccess";
    AuthResponseCode[AuthResponseCode["PasswordResetTokenValid"] = 6] = "PasswordResetTokenValid";
})(AuthResponseCode || (exports.AuthResponseCode = AuthResponseCode = {}));
class Mailer {
    transport = app_config_1.appConfig.senderEmail && app_config_1.appConfig.senderAppPassword
        ? nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: app_config_1.appConfig.senderEmail,
                pass: app_config_1.appConfig.senderAppPassword
            }
        })
        : null;
    async sendResetLink(to, resetLink) {
        if (!this.transport)
            return;
        const subject = app_config_1.appConfig.resetMailSubject;
        const text = resetLink;
        const message = {
            from: `AI Recipes <${app_config_1.appConfig.senderEmail}>`,
            to,
            subject,
            text
        };
        await this.transport.sendMail(message);
    }
}
exports.mailer = new Mailer();
