import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { appConfig } from "./2-utils/app-config";
import { recipeController } from "./5-controllers/recipe-controller";
import { errorMiddleware } from "./6-middleware/error-middleware";
import path from "path";
import { fileSaver } from "uploaded-file-saver";

class App {
    public async start(): Promise<void> {
        const server = express();
        server.use(cors());
        server.use(express.json());

            server.use(fileUpload());
        const location = path.join(__dirname, "1-assets", "images");
        fileSaver.config(location);

        
        server.use(recipeController.router);
        server.use(errorMiddleware.routeNotFound);
        server.use(errorMiddleware.catchAll);
        server.listen(appConfig.port, () => {
            console.log(`Listening on http://${appConfig.host}:${appConfig.port}`);
          }
        );
    }
}

const app = new App();
app.start();
function fileUpload(): any {
    throw new Error("Function not implemented.");
}

