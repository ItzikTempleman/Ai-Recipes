"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthController = void 0;
const express_1 = __importDefault(require("express"));
class HealthController {
    router = express_1.default.Router();
    constructor() {
        this.router.get("/api/health", (_req, res) => void res.sendStatus(200));
    }
}
exports.healthController = new HealthController();
