"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = void 0;
const express_1 = __importDefault(require("express"));
const user_service_1 = require("../services/user-service");
const user_model_1 = require("../models/user-model");
const status_code_1 = require("../models/status-code");
const uploaded_file_saver_1 = require("uploaded-file-saver");
const client_errors_1 = require("../models/client-errors");
const app_config_1 = require("../utils/app-config");
const google_auth_library_1 = require("google-auth-library");
class UserController {
    router = express_1.default.Router();
    constructor() {
        this.router.post("/register", this.register);
        this.router.post("/login", this.login);
        this.router.get("/users", this.getAllUsers);
        this.router.get("/users/:id", this.getOneUser);
        this.router.put("/users/:id", this.updateUser);
        this.router.delete("/users/:id", this.deleteUser);
        this.router.post("/auth/google", this.googleLogin);
        this.router.get("/users/images/:imageName", this.getImage);
    }
    async register(request, response) {
        const user = new user_model_1.UserModel(request.body);
        const token = await user_service_1.userService.register(user);
        response.status(status_code_1.StatusCode.Created).json(token);
    }
    async login(request, response) {
        const credentials = new user_model_1.CredentialsModel(request.body);
        const token = await user_service_1.userService.login(credentials);
        response.json(token);
    }
    async googleLogin(request, response) {
        const { credential } = request.body;
        if (!credential)
            throw new client_errors_1.AuthorizationError("Missing Google credential");
        const client = new google_auth_library_1.OAuth2Client(app_config_1.appConfig.googleClientId);
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: app_config_1.appConfig.googleClientId,
        });
        const payload = ticket.getPayload();
        if (!payload?.email)
            throw new client_errors_1.AuthorizationError("Google token missing email");
        const token = await user_service_1.userService.loginWithGoogle(payload.email, payload.given_name, payload.family_name);
        response.json(token);
    }
    async getAllUsers(request, response) {
        const users = await user_service_1.userService.getAllUsers();
        response.json(users);
    }
    async getOneUser(request, response) {
        const id = Number(request.params.id);
        const user = await user_service_1.userService.getOneUser(id);
        response.json(user);
    }
    async updateUser(request, response) {
        const id = Number(request.params.id);
        const image = request.files?.image;
        const user = new user_model_1.UserModel({ ...request.body, id, image });
        const token = await user_service_1.userService.updateUser(user);
        response.json(token);
    }
    async getImage(request, response) {
        const { imageName } = request.params;
        if (Array.isArray(imageName) || typeof imageName !== "string") {
            return response.status(status_code_1.StatusCode.BadRequest).json({ message: "Invalid imageName" });
        }
        const imagePath = uploaded_file_saver_1.fileSaver.getFilePath(imageName);
        return response.sendFile(imagePath);
    }
    async deleteUser(request, response) {
        const id = Number(request.params.id);
        await user_service_1.userService.deleteUser(id);
        response.sendStatus(status_code_1.StatusCode.NoContent);
    }
}
exports.userController = new UserController();
