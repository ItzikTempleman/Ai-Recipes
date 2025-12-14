import express, { Router } from "express";

class HealthController {
  public router: Router = express.Router();

  public constructor() {
this.router.get("/api/health", (_req, res) => void res.sendStatus(200));
  }
}

export const healthController = new HealthController();