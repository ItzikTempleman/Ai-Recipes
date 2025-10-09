import dotenv from "dotenv"; 

dotenv.config({ quiet: true });

class AppConfig {
  public readonly isDevelopment = (process.env.ENVIRONMENT === "development");
  public readonly isProduction = (process.env.ENVIRONMENT === "production");
  public readonly port = 4000;
  public readonly host = process.env.MYSQL_HOST!;
  public readonly user = process.env.MYSQL_USER!;
  public readonly password = process.env.MYSQL_PASSWORD!;
  public readonly gptUrl = "https://api.openai.com/v1/chat/completions";
  public readonly apiKey = process.env.API_KEY;
  public readonly freeNoImageApiKey=process.env.NO_IMAGE_API_KEY;
  public readonly database = "smart-recipes";
  public readonly modelNumber="gpt-5";
  public readonly freeNoImageModelNumber="gpt-4o-mini";
  public readonly baseImageUrl = process.env.BASE_IMAGE_URL!;
}

export const appConfig = new AppConfig();
