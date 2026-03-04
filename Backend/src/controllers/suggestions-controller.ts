import express, { Request, Response, Router } from "express";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { StatusCode } from "../models/status-code";
import { suggestionsService } from "../services/suggestions-service";

class SuggestionsController {
  public router: Router = express.Router();

  public constructor() {
    this.router.post("/api/suggestions/generate-once", verificationMiddleware.verifyIsAdmin, this.generateOnce);
    this.router.post("/api/suggestions/attach-missing-images", verificationMiddleware.verifyIsAdmin, this.attachMissingImages);
  }

  private async generateOnce(_: Request, response: Response) {
    const result = await suggestionsService.generateOnce();
    response.status(StatusCode.OK).json(result);
  }

  private async attachMissingImages(request: Request, response: Response) {
    const limit = Number((request.body?.limit ?? 20)) || 20;
    const result = await suggestionsService.attachMissingImages(limit);
    response.status(StatusCode.OK).json(result);
  }
}

export const suggestionsController = new SuggestionsController();