import dotenv from "dotenv"; // npm i dotenv

// Load .env file into process.env object.
dotenv.config({ quiet: true });

class AppConfig {
    public readonly isDevelopment = (process.env.ENVIRONMENT === "development");
    public readonly isProduction = (process.env.ENVIRONMENT === "production");
    public readonly port = 4000;
     public readonly host = process.env.HOST!;
    public readonly gptUrl="https://api.openai.com/v1/chat/completions";
    public readonly apiKey= process.env.API_KEY;
}

export const appConfig = new AppConfig();
