import express, { NextFunction, Request, Response } from "express";
import { userService } from "../4-services/user-service";
import { CredentialsModel, UserModel } from "../3-models/user-model";
import { StatusCode } from "../3-models/status-code";


class UserController {

    public readonly router = express.Router();

    public constructor() {
        this.router.post("/register", this.register);
        this.router.post("/login", this.login);
        this.router.get("/users", this.getAllUsers);
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

     
    public async getAllUsers(request: Request, response: Response){
      const users= await userService.getAllUsers();
      response.json(users);
    }

}
export const userController = new UserController();