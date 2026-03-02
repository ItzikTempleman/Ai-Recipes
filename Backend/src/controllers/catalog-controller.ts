import express, { Request, Response, Router } from "express";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { StatusCode } from "../models/status-code";
import { catalogService } from "../services/catalog-service";

class CatalogController {
  public router: Router = express.Router();

  public constructor() {
    this.router.post("/api/catalog/generate-once",verificationMiddleware.verifyLoggedIn,this.generateOnce);
  }

  private async generateOnce(request: Request, response: Response) {
    const result = await catalogService.generateOnce();
    response.status(StatusCode.OK).json(result);
  }
}

export const catalogController = new CatalogController();