import express, { NextFunction, Request, Response } from "express";
import { userService } from "../services/user-service";
import { CredentialsModel, UserModel } from "../models/user-model";
import { StatusCode } from "../models/status-code";
import { fileSaver } from "uploaded-file-saver";
import { AuthorizationError } from "../models/client-errors";
import { appConfig } from "../utils/app-config";
import { OAuth2Client } from "google-auth-library";
import { verificationMiddleware } from "../middleware/verification-middleware";
import { userRecipeUsageService } from "../services/user-recipe-usage-service";
import { premiumService } from "../services/premium-service";
import { cyber } from "../utils/cyber";



class UserController {


    public readonly router = express.Router();

    public constructor() {
        this.router.post("/register", this.register);
        this.router.post("/login", this.login);
        this.router.get("/users", this.getAllUsers);
        this.router.get("/users/:id", this.getOneUser);
        this.router.put("/users/:id", this.updateUser);
        this.router.delete("/users/:id", verificationMiddleware.verifyLoggedIn, this.deleteUser);
        this.router.post("/auth/google", this.googleLogin);
        this.router.get("/users/images/:imageName", this.getImage);
        this.router.post("/users/set-password", verificationMiddleware.verifyLoggedIn, this.setPassword);
        this.router.get("/users/premium", verificationMiddleware.verifyLoggedIn, this.getPremiumStatus);
        this.router.post("/users/premium/activate", verificationMiddleware.verifyLoggedIn, this.activatePremium);
        this.router.post("/users/premium/cancel", verificationMiddleware.verifyLoggedIn, this.cancelPremium);
        this.router.get("/premium/plans", this.getPremiumPlans);

    }

    private async register(request: Request, response: Response) {
        const user = new UserModel(request.body);
        const token = await userService.register(user);
        const createdUser = new UserModel(JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()));
        const visitorId = (request as any).visitorId;

        if (visitorId && createdUser?.id) {
            await userRecipeUsageService.mergeVisitorIntoUser(createdUser.id, visitorId);
        }
        response.status(StatusCode.Created).json(token);
    }

    private async login(request: Request, response: Response) {
        const credentials = new CredentialsModel(request.body);
        const token = await userService.login(credentials);
        const createdUser = new UserModel(JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()));
        const visitorId = (request as any).visitorId;

        if (visitorId && createdUser?.id) {
            await userRecipeUsageService.mergeVisitorIntoUser(createdUser.id, visitorId);
        }
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

        const loggedInUser = new UserModel(JSON.parse(Buffer.from(token.split(".")[1], "base64").toString()));
        const visitorId = (request as any).visitorId;

        if (visitorId && loggedInUser?.id) {
            await userRecipeUsageService.mergeVisitorIntoUser(loggedInUser.id, visitorId);
        }

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
        const loggedInUserId = (request as any).user?.id;


        if (!loggedInUserId || loggedInUserId !== id) {
            throw new AuthorizationError("You can only delete your own account");
        }
        await userService.deleteUser(id);
        response.sendStatus(StatusCode.NoContent);
    }

    public async setPassword(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const { password, confirm } = request.body as { password?: string; confirm?: string };
        const token = await userService.setPasswordForLoggedInUser(userId, password || "", confirm || "");
        response.json({ token });
    }


    private async getPremiumStatus(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const status = await premiumService.getPremiumStatus(userId);
        response.json(status);
    }

    private async getPremiumPlans(request: Request, response: Response) {
        const plans = premiumService.getPremiumPlans();
        response.json(plans);
    }

private async activatePremium(request: Request, response: Response, next: NextFunction) {
    try {
        const userId = (request as any).user.id;
        const { plan, provider, paymentCustomerId, paymentSubscriptionId } = request.body;

        console.log("activatePremium start", { userId, plan, provider });

        const status = await premiumService.activatePremium({
            userId,
            plan,
            provider,
            paymentCustomerId,
            paymentSubscriptionId
        });
        console.log("premium activated", status);

        const dbUser = await userService.getOneUser(userId);
        console.log("dbUser loaded", dbUser?.id);

        const token = cyber.generateToken(dbUser);
        console.log("token generated");

        response.json({ status, token });
    }
    catch (err) {
        console.error("activatePremium failed:", err);
        next(err);
    }
}

    private async cancelPremium(request: Request, response: Response) {
        const userId = (request as any).user.id;
        const status = await premiumService.cancelPremium(userId);
        const dbUser = await userService.getOneUser(userId);
        const token = cyber.generateToken(dbUser);

        response.json({
            status,
            token
        });
    }




}

export const userController = new UserController();