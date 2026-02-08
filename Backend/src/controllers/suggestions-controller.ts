import express, { Request, Response, Router } from "express";
import { StatusCode } from "../models/status-code";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { suggestionsService } from "../services/suggestions-service";
import { normalizeLang } from "../utils/daily-cron";


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

private async generateToday(request: Request, response: Response) {
  // Prefer accept-language (CORS-safe). If you still want x-language, read it second.
  const lang = normalizeLang(
    request.header("accept-language") ?? request.header("x-language")
  );

  await suggestionsService.generateToday(lang);

  const suggestionsModel = await suggestionsService.getToday();
  response.status(StatusCode.Created).json(suggestionsModel);
}
};

export const suggestionsController = new SuggestionsController();




