"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleOpenAIError = handleOpenAIError;
const axios_1 = __importDefault(require("axios"));
const client_errors_1 = require("../models/client-errors");
const status_code_1 = require("../models/status-code");
function handleOpenAIError(error) {
    if (axios_1.default.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;
        if (status === 429 || error?.status === 429) {
            const openAIErrorCode = data?.error?.code;
            if (openAIErrorCode === "insufficient_quota") {
                console.error("429 - RATE_LIMIT", {
                    message: data?.error?.message,
                });
                throw new client_errors_1.ClientErrors(status_code_1.StatusCode.TooManyRequests, "OpenAI usage limit reached. You are out of credit or over budget. Please add credits or increase your budget.");
            }
        }
    }
}
