"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.passwordResetService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const dal_1 = require("../utils/dal");
const cyber_1 = require("../utils/cyber");
const client_errors_1 = require("../models/client-errors");
const reset_password_model_1 = require("../models/reset-password-model");
function sha256Hex(value) {
    return crypto_1.default.createHash("sha256").update(value).digest("hex");
}
function otp6() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
class PasswordResetService {
    async verifyResetToken(resetId, token) {
        if (!resetId || !token)
            throw new client_errors_1.ValidationError("Missing data");
        const sql = "select id, userId, tokenHash, exp, usedAt from passwordReset where id = ?";
        const values = [resetId];
        const rows = await dal_1.dal.execute(sql, values);
        const row = rows[0];
        if (!row)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetInvalid };
        if (row.usedAt)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetUsed };
        if (new Date(row.exp).getTime() < Date.now())
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetExpired };
        if (sha256Hex(token) !== row.tokenHash)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetInvalid };
        return { code: reset_password_model_1.AuthResponseCode.PasswordResetTokenValid }; // ✅ FIX
    }
    async forgotPassword(email) {
        if (!email)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetRequested };
        const sql = "select id, email from user where email= ?";
        const values = [email];
        const users = await dal_1.dal.execute(sql, values);
        const user = users[0];
        if (!user)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetRequested };
        const token = otp6();
        const tokenHash = sha256Hex(token);
        const exp = new Date(Date.now() + 30 * 60 * 1000);
        const insertSql = "insert into passwordReset(userId, tokenHash, exp, created) values (?, ?, ?, now())";
        const insertValues = [user.id, tokenHash, exp];
        const result = await dal_1.dal.execute(insertSql, insertValues);
        const resetId = result.insertId;
        const resetLink = `Your password reset code is: ${token}`;
        await reset_password_model_1.mailer.sendResetLink(user.email, resetLink);
        return { code: reset_password_model_1.AuthResponseCode.PasswordResetRequested, params: { resetId } };
    }
    async resetPassword(resetId, token, newPassword) {
        if (!resetId || !token || !newPassword)
            throw new client_errors_1.ValidationError("Missing data");
        const sql = "select id, userId, tokenHash, exp, usedAt from passwordReset where id = ?";
        const values = [resetId];
        const rows = await dal_1.dal.execute(sql, values);
        const row = rows[0];
        if (!row)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetInvalid };
        if (row.usedAt)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetUsed };
        if (new Date(row.exp).getTime() < Date.now())
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetExpired };
        if (sha256Hex(token) !== row.tokenHash)
            return { code: reset_password_model_1.AuthResponseCode.PasswordResetInvalid };
        const hashedPassword = cyber_1.cyber.hash(newPassword);
        const updatedUserSql = "update user set password = ? where id = ?";
        const updatedValues = [hashedPassword, row.userId];
        await dal_1.dal.execute(updatedUserSql, updatedValues);
        const markUsedSql = "update passwordReset set usedAt = now() where id = ?";
        const markUsedValues = [resetId];
        await dal_1.dal.execute(markUsedSql, markUsedValues);
        return { code: reset_password_model_1.AuthResponseCode.PasswordResetSuccess };
    }
}
exports.passwordResetService = new PasswordResetService();
