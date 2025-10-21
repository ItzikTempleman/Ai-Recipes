import dotenv from "dotenv";
dotenv.config({ quiet: true });

class AppConfig {
  // App server (Express)
  public readonly serverPort = Number(process.env.PORT ?? 4000);
  public readonly serverHost = process.env.SERVER_HOST ?? "0.0.0.0";

  // ---- Database (declare these BEFORE aliases) ----
  public readonly dbHost = process.env.MYSQL_HOST!;
  public readonly dbUser = process.env.MYSQL_USER!;
  public readonly dbPassword = process.env.MYSQL_PASSWORD!;
  public readonly dbName = process.env.MYSQL_DB ?? "smart-recipes";

  // ---- Aliases so your existing DAL keeps working ----
  public readonly host = this.dbHost;
  public readonly user = this.dbUser;
  public readonly password = this.dbPassword;
  public readonly database = this.dbName;

  // Env flags
  public readonly isDevelopment = process.env.ENVIRONMENT === "development";
  public readonly isProduction = process.env.ENVIRONMENT === "production";

  // OpenAI + misc
  public readonly gptUrl = "https://api.openai.com/v1/chat/completions";
  public readonly apiKey = process.env.API_KEY!;
  public readonly freeNoImageApiKey = process.env.NO_IMAGE_API_KEY!;
  public readonly baseImageUrl = process.env.BASE_IMAGE_URL ?? "";

  // Models (needed by your gpt-service; keep your original names)
  public readonly modelNumber = process.env.MODEL_NUMBER ?? "gpt-5";
  public readonly freeNoImageModelNumber = process.env.FREE_NO_IMAGE_MODEL ?? "gpt-4o-mini";
}

export const appConfig = new AppConfig();





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
