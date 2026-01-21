import crypto from "crypto";
import { dal } from "../utils/dal";
import { cyber } from "../utils/cyber";
import { ValidationError } from "../models/client-errors";
import type { ResultSetHeader } from "mysql2";
import { AuthResponse, AuthResponseCode, mailer } from "../models/reset-password-model";

function sha256Hex(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function otp6(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export type DbUserRow = {
    id: number;
    email: string;
};

type DbPasswordResetRow = {
    id: number;
    userId: number;
    tokenHash: string;
    exp: Date;
    usedAt: Date | null;
};

class PasswordResetService {

    public async verifyResetToken(resetId: number, token: string): Promise<AuthResponse> {
        if (!resetId || !token) throw new ValidationError("Missing data");

        const sql = "select id, userId, tokenHash, exp, usedAt from passwordReset where id = ?";
        const values = [resetId];
        const rows = await dal.execute(sql, values) as DbPasswordResetRow[];
        const row = rows[0];

        if (!row) return { code: AuthResponseCode.PasswordResetInvalid };
        if (row.usedAt) return { code: AuthResponseCode.PasswordResetUsed };
        if (new Date(row.exp).getTime() < Date.now()) return { code: AuthResponseCode.PasswordResetExpired };
        if (sha256Hex(token) !== row.tokenHash) return { code: AuthResponseCode.PasswordResetInvalid };

        return { code: AuthResponseCode.PasswordResetTokenValid }; // ✅ FIX
    }

    public async forgotPassword(email: string): Promise<AuthResponse> {
        email = (email ?? "").trim().toLowerCase();
        if (!email)  throw new ValidationError("Email is required");

        const sql = "select id, email from user where email= ?";
        const values = [email];
        const users = await dal.execute(sql, values) as DbUserRow[];
        const user = users[0];

        if (!user) return { code: AuthResponseCode.EmailNotFound };

        const token = otp6();
        const tokenHash = sha256Hex(token);
        const exp = new Date(Date.now() + 30 * 60 * 1000);

        const insertSql = "insert into passwordReset(userId, tokenHash, exp, created) values (?, ?, ?, now())";
        const insertValues = [user.id, tokenHash, exp];
        const result = await dal.execute(insertSql, insertValues) as ResultSetHeader;
        const resetId = result.insertId;

        const resetLink = `Your password reset code is: ${token}`;
        await mailer.sendResetLink(user.email, resetLink);

        return { code: AuthResponseCode.PasswordResetRequested, params: { resetId } };
    }

    public async resetPassword(resetId: number, token: string, newPassword: string): Promise<AuthResponse> {
        if (!resetId || !token || !newPassword) throw new ValidationError("Missing data");

        const sql = "select id, userId, tokenHash, exp, usedAt from passwordReset where id = ?";
        const values = [resetId];
        const rows = await dal.execute(sql, values) as DbPasswordResetRow[];
        const row = rows[0];

        if (!row) return { code: AuthResponseCode.PasswordResetInvalid };
        if (row.usedAt) return { code: AuthResponseCode.PasswordResetUsed };
        if (new Date(row.exp).getTime() < Date.now()) return { code: AuthResponseCode.PasswordResetExpired };
        if (sha256Hex(token) !== row.tokenHash) return { code: AuthResponseCode.PasswordResetInvalid };

        const hashedPassword = cyber.hash(newPassword);

        const updatedUserSql = "update user set password = ? where id = ?";
        const updatedValues = [hashedPassword, row.userId];
        await dal.execute(updatedUserSql, updatedValues);

        const markUsedSql = "update passwordReset set usedAt = now() where id = ?";
        const markUsedValues = [resetId];
        await dal.execute(markUsedSql, markUsedValues);

        return { code: AuthResponseCode.PasswordResetSuccess };
    }
}

export const passwordResetService = new PasswordResetService();
