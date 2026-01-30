"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cyber = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const app_config_1 = require("./app-config");
class Cyber {
    hash(plainText) {
        return crypto_1.default.createHmac("sha512", app_config_1.appConfig.hashSaltKey).update(plainText).digest("hex");
    }
    generateToken(user) {
        delete user.password;
        const container = { user };
        const options = {
            expiresIn: "3h"
        };
        return jsonwebtoken_1.default.sign(container, app_config_1.appConfig.jwtSecretKey, options);
    }
    verifyToken(token) {
        try {
            if (!token)
                return false;
            jsonwebtoken_1.default.verify(token, app_config_1.appConfig.jwtSecretKey);
            return true;
        }
        catch (err) {
            return false;
        }
    }
}
;
exports.cyber = new Cyber();
