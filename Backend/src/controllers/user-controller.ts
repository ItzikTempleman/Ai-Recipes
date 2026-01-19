import express, { NextFunction, Request, Response } from "express";
import { userService } from "../services/user-service";
import { CredentialsModel, UserModel } from "../models/user-model";
import { StatusCode } from "../models/status-code";
import { fileSaver } from "uploaded-file-saver";
import { AuthorizationError } from "../models/client-errors";
import { appConfig } from "../utils/app-config";
import { OAuth2Client } from "google-auth-library";

class UserController {

    public readonly router = express.Router();

    public constructor() {
        this.router.post("/register", this.register);
        this.router.post("/login", this.login);
        this.router.get("/users", this.getAllUsers);
        this.router.get("/users/:id", this.getOneUser);
        this.router.put("/users/:id", this.updateUser);
        this.router.delete("/users/:id", this.deleteUser);
        this.router.post("/auth/google", this.googleLogin);
        this.router.get("/users/images/:imageName", this.getImage);
    }

    private async register(request: Request, response: Response) {
        const user = new UserModel(request.body);
        const token = await userService.register(user);
        response.status(StatusCode.Created).json(token);
    }

    private async login(request: Request, response: Response) {
        const credentials = new CredentialsModel(request.body);
        const token = await userService.login(credentials);
        response.json(token);
    }

    private async googleLogin(request: Request, response: Response) {
    const { credential } = request.body as { credential?: string };
    if (!credential) throw new AuthorizationError("Missing Google credential");

    const client = new OAuth2Client(appConfig.googleClientId);

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: appConfig.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw new AuthorizationError("Google token missing email");

    const token = await userService.loginWithGoogle(payload.email, payload.given_name, payload.family_name);
    response.json(token);
}

    public async getAllUsers(request: Request, response: Response) {
        const users = await userService.getAllUsers();
        response.json(users);
    }

    public async getOneUser(request: Request, response: Response) {
        const id = Number(request.params.id);
        const user = await userService.getOneUser(id);
        response.json(user);
    }

    public async updateUser(request: Request, response: Response) {
        const id = Number(request.params.id);
        const image = request.files?.image;
        const user = new UserModel({ ...request.body, id, image } as any);
        const token = await userService.updateUser(user);
        response.json(token);
    }
    
    public async getImage(request: Request, response: Response) {
        const imageName = request.params.imageName
        const imagePath = fileSaver.getFilePath(imageName);
        response.sendFile(imagePath);
    }

    public async deleteUser(request: Request, response: Response) {
        const id = Number(request.params.id);
        await userService.deleteUser(id);
        response.sendStatus(StatusCode.NoContent);
    }
}

export const userController = new UserController();