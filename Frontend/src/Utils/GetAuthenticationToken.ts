import { AxiosRequestConfig } from "axios";
import { getStoredLanguage } from "./SetLanguage";

export function getAuth(): AxiosRequestConfig {
  const token = localStorage.getItem("token") ?? "";
  const lang = getStoredLanguage();

  const headers: Record<string, string> = {
    "Accept-Language": lang
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  return { headers };
}