import dotenv from "dotenv";
dotenv.config({ quiet: true });
import fs from "fs";


class AppConfig {
  public readonly isDevelopment = process.env.ENVIRONMENT === "development";
  public readonly isProduction  = process.env.ENVIRONMENT === "production";
  public readonly jwtSecretKey = process.env.JWT_SECRET_KEY!;
    public readonly hashSaltKey = process.env.HASH_SALT_KEY!;
    
  public readonly port = Number(process.env.PORT ?? 4000);
  public readonly serverHost = "0.0.0.0";

  public readonly host = process.env.MYSQL_HOST!;
  public readonly user = process.env.MYSQL_USER!;
  public readonly password = process.env.MYSQL_PASSWORD!;
 public readonly database = process.env.MYSQL_DB || "smart-recipes";
public readonly frontendBaseUrl = this.normalizeFrontendBaseUrl();
  public readonly gptUrl = "https://api.openai.com/v1/chat/completions";
  public readonly apiKey = process.env.API_KEY;
  public readonly freeNoImageApiKey = process.env.NO_IMAGE_API_KEY;
  public readonly modelNumber = "gpt-5-nano";
  public readonly freeNoImageModelNumber = "gpt-image-1.5";

  public readonly baseImageUrl = this.normalizeBaseImageUrl();
public readonly baseUserImageUrl = this.normalizeBaseUserImageUrl();


  private normalizeBaseUserImageUrl(): string {
 const raw = process.env.BASE_USER_IMAGE_URL;

    if (raw && /^https?:\/\//i.test(raw)) {
      return raw.endsWith("/") ? raw : raw + "/";
    }

    const host = this.isProduction
      ? (process.env.PUBLIC_HOST || "localhost")
      : "localhost";

    return `http://${host}:${this.port}/api/users/images/`;
  }


  private normalizeBaseImageUrl(): string {
    const raw = process.env.BASE_IMAGE_URL;

    if (raw && /^https?:\/\//i.test(raw)) {
      return raw.endsWith("/") ? raw : raw + "/";
    }

    const host = this.isProduction
      ? (process.env.PUBLIC_HOST || "localhost")
      : "localhost";

    return `http://${host}:${this.port}/api/recipes/images/`;
  }
  private normalizeFrontendBaseUrl(): string {
  // If you ever define it, it will be used. Otherwise fall back safely.
  const raw = process.env.FRONTEND_BASE_URL;

  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.endsWith("/") ? raw.slice(0, -1) : raw; // no trailing slash
  }

  // dev default (Vite)
  if (this.isDevelopment) return "http://localhost:5173";

  // prod default: same public host as backend
  const host = process.env.PUBLIC_HOST || "localhost";
  return `http://${host}`;
}



}

export const appConfig = new AppConfig();




