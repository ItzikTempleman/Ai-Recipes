import { AxiosRequestConfig } from "axios";

  export function getAuth(): AxiosRequestConfig {
    const token = localStorage.getItem("token") ?? "";
    if (!token) return {};
    return { headers: { Authorization: `Bearer ${token}` } };
  }
