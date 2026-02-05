import express, { Request, Response, Router } from "express";
import { StatusCode } from "../models/status-code";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { suggestionsService } from "../services/suggestions-service";


class SuggestionsController {
    public router: Router = express.Router();

    public constructor() {
        this.router.get("/api/daily-recipes", verificationMiddleware.verifyOptional, this.getToday);
        this.router.post("/api/daily-recipes", verificationMiddleware.verifyOptional, this.generateToday);
    };

    private async getToday(_: Request, response: Response) {
        const suggestionsModel = await suggestionsService.getToday();
        response.status(StatusCode.OK).json(suggestionsModel);
    };

    private async generateToday(_: Request, response: Response) {
        await suggestionsService.generateToday();
        const suggestionsModel = await suggestionsService.getToday();
        response.status(StatusCode.Created).json(suggestionsModel);
    };
};

export const suggestionsController = new SuggestionsController();




