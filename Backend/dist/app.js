"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const uploaded_file_saver_1 = require("uploaded-file-saver");
const app_config_1 = require("./2-utils/app-config");
const recipe_controller_1 = require("./5-controllers/recipe-controller");
const error_middleware_1 = require("./6-middleware/error-middleware");
class App {
    async start() {
        const server = (0, express_1.default)();
        server.use((0, cors_1.default)());
        server.use(express_1.default.json());
        server.use((0, express_fileupload_1.default)());
        const location = path_1.default.join(__dirname, "1-assets", "images");
        uploaded_file_saver_1.fileSaver.config(location);
        server.use(recipe_controller_1.recipeController.router);
        server.use(error_middleware_1.errorMiddleware.routeNotFound);
        server.use(error_middleware_1.errorMiddleware.catchAll);
        // Bind to 0.0.0.0 so it works in Docker and cloud
        server.listen(app_config_1.appConfig.serverPort, app_config_1.appConfig.serverHost, () => {
            const url = app_config_1.appConfig.isDevelopment
                ? `http://localhost:${app_config_1.appConfig.serverPort}`
                : `:${app_config_1.appConfig.serverPort}`;
            console.log(`Listening on ${url}`);
        });
    }
}
new App().start();
// import cors from "cors";
// import express from "express";
// import { appConfig } from "./2-utils/app-config";
// import { recipeController } from "./5-controllers/recipe-controller";
// import { errorMiddleware } from "./6-middleware/error-middleware";
// import path from "path";
// import { fileSaver } from "uploaded-file-saver";
// import fileUpload from "express-fileupload";
// class App {
//     public async start(): Promise<void> {
//         const server = express();
//         server.use(cors());
//         server.use(express.json());
//         server.use(fileUpload());
//         const location = path.join(__dirname, "1-assets", "images");
//         fileSaver.config(location);
//         server.use(recipeController.router);
//         server.use(errorMiddleware.routeNotFound);
//         server.use(errorMiddleware.catchAll);
//         server.listen(appConfig.port, () => {
//             console.log(`Listening on http://${appConfig.host}:${appConfig.port}`);
//         }
//         );
//     }
// }
// const app = new App();
// app.start();
