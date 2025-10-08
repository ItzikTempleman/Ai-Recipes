import OpenAI from "openai";
import { appConfig } from "./app-config";

export const openai = new OpenAI({
  apiKey: appConfig.apiKey
});