import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs/promises";
import { appConfig } from "./utils/app-config";
import { recipeController } from "./controllers/recipe-controller";
import { errorMiddleware } from "./middleware/error-middleware";
import { userController } from "./controllers/user-controller";
import { healthController } from "./utils/health-controller";
import fileUpload from "express-fileupload";

export class App {
  public async start(): Promise<void> {
    const server = express();

    server.use(
      cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      })
    );

    server.use(express.json());
    server.use(fileUpload());

const imageRoot =
  process.env.IMAGE_DIR || path.join(__dirname, "..", "assets", "images");

const userImageDir = path.join(imageRoot, "users");
const recipeImageDir = path.join(imageRoot, "recipes");

await fs.mkdir(userImageDir, { recursive: true });
await fs.mkdir(recipeImageDir, { recursive: true });

server.use("/api/recipes/images", express.static(recipeImageDir));
server.use("/api/users/images", express.static(userImageDir));

server.use("/api", userController.router);
server.use(recipeController.router);
server.use(healthController.router);
server.use(errorMiddleware.routeNotFound);
server.use(errorMiddleware.catchAll);

server.listen(appConfig.port, appConfig.serverHost, () => {
  console.log(`Listening to port ${appConfig.port}`);
});
  }
}

const app = new App();
app.start();