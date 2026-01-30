"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const app_config_1 = require("./utils/app-config");
const recipe_controller_1 = require("./controllers/recipe-controller");
const error_middleware_1 = require("./middleware/error-middleware");
const user_controller_1 = require("./controllers/user-controller");
const health_controller_1 = require("./utils/health-controller");
const express_fileupload_1 = __importDefault(require("express-fileupload"));
const reset_password_controller_1 = require("./controllers/reset-password-controller");
const pdf_controller_1 = require("./controllers/pdf-controller");
class App {
    async start() {
        const server = (0, express_1.default)();
        server.use((0, cors_1.default)({
            origin: true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
        }));
        server.use(express_1.default.json());
        server.use((0, express_fileupload_1.default)());
        const imageDir = process.env.IMAGE_DIR || path_1.default.join(__dirname, "1-assets", "images");
        await promises_1.default.mkdir(imageDir, { recursive: true });
        const userImageDir = path_1.default.join(imageDir, "users");
        await promises_1.default.mkdir(userImageDir, { recursive: true });
        server.use("/api/recipes/images", express_1.default.static(imageDir));
        server.use("/api/users/images", express_1.default.static(userImageDir));
        server.use("/api", user_controller_1.userController.router);
        server.use(pdf_controller_1.pdfController.router);
        server.use(recipe_controller_1.recipeController.router);
        server.use("/api", reset_password_controller_1.resetPasswordController.router);
        server.use(health_controller_1.healthController.router);
        server.use(error_middleware_1.errorMiddleware.routeNotFound);
        server.use(error_middleware_1.errorMiddleware.catchAll);
        server.listen(app_config_1.appConfig.port, app_config_1.appConfig.serverHost, () => {
            console.log(`Listening to port ${app_config_1.appConfig.port}`);
        });
    }
}
exports.App = App;
const app = new App();
app.start();
