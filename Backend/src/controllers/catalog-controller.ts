import express, { Request, Response, Router } from "express";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { StatusCode } from "../models/status-code";
import { catalogService } from "../services/catalog-service";

class CatalogController {
  public router: Router = express.Router();

  public constructor() {
    // keep generate-once, but make it ADMIN ONLY (important)
    this.router.post("/api/catalog/generate-once", verificationMiddleware.verifyIsAdmin, this.generateOnce);

    // NEW: attach images to existing catalog recipes without regenerating recipe text
    this.router.post("/api/catalog/attach-missing-images", verificationMiddleware.verifyIsAdmin, this.attachMissingImages);
  }

  private async generateOnce(request: Request, response: Response) {
    const result = await catalogService.generateOnce();
    response.status(StatusCode.OK).json(result);
  }

  private async attachMissingImages(request: Request, response: Response) {
    const limit = Number((request.body?.limit ?? 20)) || 20;
    const result = await catalogService.attachMissingImages(limit);
    response.status(StatusCode.OK).json(result);
  }
}

export const catalogController = new CatalogController();