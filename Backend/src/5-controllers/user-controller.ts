import express, { NextFunction, Request, Response } from "express";
import { userService } from "../4-services/user-service";
import { CredentialsModel, UserModel } from "../3-models/user-model";
import { StatusCode } from "../3-models/status-code";
import { fileSaver } from "uploaded-file-saver";

class UserController {

    public readonly router = express.Router();

    public constructor() {
        this.router.post("/register", this.register);
        this.router.post("/login", this.login);
        this.router.get("/users", this.getAllUsers);
        this.router.get("/users/:id", this.getOneUser);
        this.router.put("/users/:id", this.updateUser);
        this.router.delete("/users/:id", this.deleteUser);
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
        request.body.image = request.files?.image;
        request.body.id = Number(request.params.id);
        const user = new UserModel(request.body);
        const dbUser = await userService.updateUser(user);
        response.json(dbUser);
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