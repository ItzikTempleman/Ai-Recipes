import express, { Request, Response, Router } from "express";
import { StatusCode } from "../models/status-code";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { suggestionsService } from "../services/suggestions-service";
import { normalizeLang } from "../utils/normalize-language";



class SuggestionsController {
    public router: Router = express.Router();

    public constructor() {
        this.router.get("/api/daily-recipes", verificationMiddleware.verifyOptional, this.getToday);
        this.router.post("/api/daily-recipes", verificationMiddleware.verifyOptional, this.generateToday);
    };

    private async getToday(request: Request, response: Response) {
          const lang = normalizeLang(
      request.header("accept-language") ?? request.header("x-language")
    );

        const suggestionsModel = await suggestionsService.getToday(lang);
        response.status(StatusCode.OK).json(suggestionsModel);
    };

private async generateToday(request: Request, response: Response) {
  const lang = normalizeLang(
    request.header("accept-language") ?? request.header("x-language")
  );

  await suggestionsService.generateToday(lang);

  const suggestionsModel = await suggestionsService.getToday(lang);
  response.status(StatusCode.Created).json(suggestionsModel);
}
};

export const suggestionsController = new SuggestionsController();




