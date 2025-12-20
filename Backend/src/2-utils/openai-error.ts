import axios from "axios";
import { ClientErrors } from "../3-models/client-errors";
import { StatusCode } from "../3-models/status-code";

export function handleOpenAIError(error: any): void {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data: any = error.response?.data;
        if (status === 429 || error?.status === 429) {
            const openAIErrorCode = data?.error?.code;
            if (openAIErrorCode === "insufficient_quota") {
                console.error("429 - RATE_LIMIT", {
                    message: data?.error?.message,
                });
                throw new ClientErrors(
                    StatusCode.TooManyRequests,
                    "OpenAI usage limit reached. You are out of credit or over budget. Please add credits or increase your budget."
                )
            }
        }
    }
}
