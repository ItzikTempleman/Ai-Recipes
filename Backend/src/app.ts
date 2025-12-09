import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import path from "path";
import fs from "fs/promises";
import { appConfig } from "./2-utils/app-config";
import { recipeController } from "./5-controllers/recipe-controller";
import { errorMiddleware } from "./6-middleware/error-middleware";
import { userController } from "./5-controllers/user-controller";

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

      const imageDir = process.env.IMAGE_DIR || path.join(__dirname, "1-assets", "images");
    await fs.mkdir(imageDir, { recursive: true });
    server.use("/api/recipes/images", express.static(imageDir));
    server.use("/api", userController.router);
    server.use(recipeController.router);
    server.use(errorMiddleware.routeNotFound);
    server.use(errorMiddleware.catchAll);


    server.listen(appConfig.port, appConfig.serverHost, () => {
      console.log(`Listening to port ${appConfig.port}`);
    });
  }
}

const app = new App();
app.start();