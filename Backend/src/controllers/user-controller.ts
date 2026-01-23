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

        const pictureUrl = (payload.picture ?? null) as string | null;

const fullName = (payload.name ?? "").trim();
const parts = fullName.split(/\s+/).filter(Boolean);

const firstName =
  (payload.given_name ?? parts[0] ?? "Google").trim();

const familyName =
  (payload.family_name ?? (parts.length > 1 ? parts[parts.length - 1] : "")).trim();


const token = await userService.loginWithGoogle(
  payload.email.toLowerCase(),
  firstName,
  familyName,
  pictureUrl
);
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
        const { imageName } = request.params;

        if (Array.isArray(imageName) || typeof imageName !== "string") {
            return response.status(StatusCode.BadRequest).json({ message: "Invalid imageName" });
        }

        const imagePath = fileSaver.getFilePath(imageName);
        return response.sendFile(imagePath);
    }

    public async deleteUser(request: Request, response: Response) {
        const id = Number(request.params.id);
        await userService.deleteUser(id);
        response.sendStatus(StatusCode.NoContent);
    }
}

export const userController = new UserController();