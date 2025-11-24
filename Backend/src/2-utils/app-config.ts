import dotenv from "dotenv";
dotenv.config({ quiet: true });

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

  public readonly gptUrl = "https://api.openai.com/v1/chat/completions";
  public readonly apiKey = process.env.API_KEY;
  public readonly freeNoImageApiKey = process.env.NO_IMAGE_API_KEY;
  public readonly modelNumber = "gpt-5.1";
  public readonly freeNoImageModelNumber = "gpt-4o-mini";

  public readonly baseImageUrl = this.normalizeBaseImageUrl();

  private normalizeBaseImageUrl(): string {
    const raw = process.env.BASE_IMAGE_URL;

    // If a full URL was provided, just normalize the trailing slash.
    if (raw && /^https?:\/\//i.test(raw)) {
      return raw.endsWith("/") ? raw : raw + "/";
    }

    // Default per environment
    const host = this.isProduction
      ? (process.env.PUBLIC_HOST || "localhost")
      : "localhost";

    return `http://${host}:${this.port}/api/recipes/images/`;
  }
}

export const appConfig = new AppConfig();




