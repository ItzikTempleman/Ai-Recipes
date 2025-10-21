"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ quiet: true });
class AppConfig {
    // App server (Express)
    serverPort = Number(process.env.PORT ?? 4000);
    serverHost = process.env.SERVER_HOST ?? "0.0.0.0";
    // ---- Database (declare these BEFORE aliases) ----
    dbHost = process.env.MYSQL_HOST;
    dbUser = process.env.MYSQL_USER;
    dbPassword = process.env.MYSQL_PASSWORD;
    dbName = process.env.MYSQL_DB ?? "smart-recipes";
    // ---- Aliases so your existing DAL keeps working ----
    host = this.dbHost;
    user = this.dbUser;
    password = this.dbPassword;
    database = this.dbName;
    // Env flags
    isDevelopment = process.env.ENVIRONMENT === "development";
    isProduction = process.env.ENVIRONMENT === "production";
    // OpenAI + misc
    gptUrl = "https://api.openai.com/v1/chat/completions";
    apiKey = process.env.API_KEY;
    freeNoImageApiKey = process.env.NO_IMAGE_API_KEY;
    baseImageUrl = process.env.BASE_IMAGE_URL ?? "";
    // Models (needed by your gpt-service; keep your original names)
    modelNumber = process.env.MODEL_NUMBER ?? "gpt-5";
    freeNoImageModelNumber = process.env.FREE_NO_IMAGE_MODEL ?? "gpt-4o-mini";
}
exports.appConfig = new AppConfig();
// import dotenv from "dotenv"; 
// dotenv.config({ quiet: true });
// class AppConfig {
//   public readonly isDevelopment = (process.env.ENVIRONMENT === "development");
//   public readonly isProduction = (process.env.ENVIRONMENT === "production");
//   public readonly port = 4000;
//   public readonly host = process.env.MYSQL_HOST!;
//   public readonly user = process.env.MYSQL_USER!;
//   public readonly password = process.env.MYSQL_PASSWORD!;
//   public readonly gptUrl = "https://api.openai.com/v1/chat/completions";
//   public readonly apiKey = process.env.API_KEY;
//   public readonly freeNoImageApiKey=process.env.NO_IMAGE_API_KEY;
//   public readonly database = "smart-recipes";
//   public readonly modelNumber="gpt-5";
//   public readonly freeNoImageModelNumber="gpt-4o-mini";
//   public readonly baseImageUrl = process.env.BASE_IMAGE_URL!;
// }
// export const appConfig = new AppConfig();
