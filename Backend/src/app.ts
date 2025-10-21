import cors from "cors";
import express from "express";
import path from "path";
import fileUpload from "express-fileupload";
import { fileSaver } from "uploaded-file-saver";

import { appConfig } from "./2-utils/app-config";
import { recipeController } from "./5-controllers/recipe-controller";
import { errorMiddleware } from "./6-middleware/error-middleware";

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

    // Bind to 0.0.0.0 so it works in Docker and cloud
    server.listen(appConfig.serverPort, appConfig.serverHost, () => {
      const url = appConfig.isDevelopment
        ? `http://localhost:${appConfig.serverPort}`
        : `:${appConfig.serverPort}`;
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

