import express, { NextFunction, Request, Response, Router } from "express";
import { passwordResetService } from "../services/password-reset-service";

class ResetPasswordController {
    public router: Router = express.Router();

    public constructor() {
        this.router.post("/auth/forgot-password", this.forgotPassword);
        this.router.post("/auth/reset-password", this.resetPassword);
         this.router.post("/auth/verify-reset-token", this.verifyResetToken);
    };

    public async forgotPassword(request: Request, response: Response) {
        const body = request.body;
        const result = await passwordResetService.forgotPassword(body.email);
        response.json(result);
    };

    public async resetPassword(request: Request, response: Response, next: NextFunction) {
        const body = request.body;
        const result = await passwordResetService.resetPassword(body.resetId, body.token, body.newPassword);
        response.json(result);
    };


public async verifyResetToken(request: Request, response: Response, next: NextFunction) {
  const body = request.body;
  const result = await passwordResetService.verifyResetToken(body.resetId, body.token);
  response.json(result);
}
}

export const resetPasswordController = new ResetPasswordController();