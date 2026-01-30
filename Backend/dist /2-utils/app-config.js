"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
class AppConfig {
    isDevelopment = process.env.ENVIRONMENT === "development";
    isProduction = process.env.ENVIRONMENT === "production";
    jwtSecretKey = process.env.JWT_SECRET_KEY;
    hashSaltKey = process.env.HASH_SALT_KEY;
    port = Number(process.env.PORT ?? 4000);
    serverHost = "0.0.0.0";
    host = process.env.MYSQL_HOST;
    user = process.env.MYSQL_USER;
    password = process.env.MYSQL_PASSWORD;
    database = process.env.MYSQL_DB || "smart-recipes";
    frontendBaseUrl = this.normalizeFrontendBaseUrl();
    gptUrl = "https://api.openai.com/v1/chat/completions";
    apiKey = process.env.API_KEY;
    freeNoImageApiKey = process.env.NO_IMAGE_API_KEY;
    modelNumber = "gpt-5.2";
    freeNoImageModelNumber = "gpt-image-1.5";
    baseImageUrl = this.normalizeBaseImageUrl();
    baseUserImageUrl = this.normalizeBaseUserImageUrl();
    normalizeBaseUserImageUrl() {
        const raw = process.env.BASE_USER_IMAGE_URL;
        if (raw && /^https?:\/\//i.test(raw)) {
            return raw.endsWith("/") ? raw : raw + "/";
        }
        const host = this.isProduction
            ? (process.env.PUBLIC_HOST || "localhost")
            : "localhost";
        return `http://${host}:${this.port}/api/users/images/`;
    }
    normalizeBaseImageUrl() {
        const raw = process.env.BASE_IMAGE_URL;
        if (raw && /^https?:\/\//i.test(raw)) {
            return raw.endsWith("/") ? raw : raw + "/";
        }
        const host = this.isProduction
            ? (process.env.PUBLIC_HOST || "localhost")
            : "localhost";
        return `http://${host}:${this.port}/api/recipes/images/`;
    }
    normalizeFrontendBaseUrl() {
        // If you ever define it, it will be used. Otherwise fall back safely.
        const raw = process.env.FRONTEND_BASE_URL;
        if (raw && /^https?:\/\//i.test(raw)) {
            return raw.endsWith("/") ? raw.slice(0, -1) : raw; // no trailing slash
        }
        // dev default (Vite)
        if (this.isDevelopment)
            return "http://localhost:5173";
        // prod default: same public host as backend
        const host = process.env.PUBLIC_HOST || "localhost";
        return `http://${host}`;
    }
}
exports.appConfig = new AppConfig();
