"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const cyber_1 = require("../utils/cyber");
const dal_1 = require("../utils/dal");
const client_errors_1 = require("../models/client-errors");
const app_config_1 = require("../utils/app-config");
const path_1 = __importDefault(require("path"));
const crypto_1 = require("crypto");
const promises_1 = __importDefault(require("fs/promises"));
class UserService {
    async register(user) {
        user.validate();
        this.normalizeOptionalFields(user);
        const imageName = user.image ? await this.saveNewUserImage(user.image) : null;
        const emailTaken = await this.isEmailTaken(user.email);
        if (emailTaken)
            throw new client_errors_1.ValidationError("Email already exists");
        const sql = "insert into user(firstName,familyName,email,password,phoneNumber,Gender,birthDate,imageName) values (?,?,?,?,?,?,?,?)";
        user.password = cyber_1.cyber.hash(user.password);
        const values = [
            user.firstName,
            user.familyName,
            user.email,
            user.password,
            user.phoneNumber ?? null,
            user.gender ?? null,
            user.birthDate ?? null,
            imageName
        ];
        const info = await dal_1.dal.execute(sql, values);
        user.id = info.insertId;
        return cyber_1.cyber.generateToken(user);
    }
    async login(credentials) {
        const hashedPassword = cyber_1.cyber.hash(credentials.password);
        const sql = `select * , concat(?, imageName) as imageUrl from user where email = ? and password = ?`;
        const values = [app_config_1.appConfig.baseUserImageUrl, credentials.email, hashedPassword];
        const users = await dal_1.dal.execute(sql, values);
        const user = users[0];
        if (!user)
            throw new client_errors_1.AuthorizationError("Incorrect email or password");
        return cyber_1.cyber.generateToken(user);
    }
    async getAllUsers() {
        const sql = "select * from user";
        return await dal_1.dal.execute(sql);
    }
    async getOneUser(id) {
        const sql = `select * , concat(?,imageName) as imageUrl from user where id = ?`;
        const values = [app_config_1.appConfig.baseUserImageUrl, id];
        const users = await dal_1.dal.execute(sql, values);
        const user = users[0];
        if (!users)
            throw new client_errors_1.ResourceNotFound(id);
        return user;
    }
    async isEmailTaken(email) {
        const sql = "select id from user where email=?";
        const value = [email];
        const users = await dal_1.dal.execute(sql, value);
        return users.length > 0;
    }
    async updateUser(user) {
        if (user.id === undefined) {
            throw new client_errors_1.ValidationError("Missing user id for updating profile");
        }
        user.validate();
        const oldImageName = await this.getImageName(user.id);
        let newImageName = oldImageName;
        if (user.image) {
            await this.deleteUserImageIfExists(oldImageName);
            newImageName = await this.saveNewUserImage(user.image);
        }
        const sql = `update user set firstName = ?, familyName = ?, email = ?, phoneNumber = ?, imageName = ? where id = ?`;
        const values = [
            user.firstName,
            user.familyName,
            user.email,
            user.phoneNumber ?? null,
            newImageName,
            user.id
        ];
        const info = await dal_1.dal.execute(sql, values);
        if (info.affectedRows === 0)
            throw new client_errors_1.ResourceNotFound(user.id);
        const dbUser = await this.getOneUser(user.id);
        return cyber_1.cyber.generateToken(dbUser);
    }
    async loginWithGoogle(email, firstName, familyName) {
        const sqlFind = `select * , concat(?, imageName) as imageUrl from user where email = ?`;
        const found = await dal_1.dal.execute(sqlFind, [app_config_1.appConfig.baseUserImageUrl, email]);
        const existing = found[0];
        if (existing)
            return cyber_1.cyber.generateToken(existing);
        const sqlInsert = "insert into user(firstName,familyName,email,password,phoneNumber,Gender,birthDate,imageName) values (?,?,?,?,?,?,?,?)";
        const randomPassword = cyber_1.cyber.hash((0, crypto_1.randomUUID)());
        const values = [
            firstName ?? "Google",
            familyName ?? "User",
            email,
            randomPassword,
            null,
            null,
            null,
            null
        ];
        const info = await dal_1.dal.execute(sqlInsert, values);
        const id = info.insertId;
        const dbUser = await this.getOneUser(id);
        return cyber_1.cyber.generateToken(dbUser);
    }
    async getImageName(id) {
        const sql = `select imageName from user where id=?`;
        const values = [id];
        const users = await dal_1.dal.execute(sql, values);
        const user = users[0];
        if (!user)
            return null;
        return user.imageName;
    }
    async deleteUser(id) {
        const oldImageName = await this.getImageName(id);
        const sql = "delete from user where id = ?";
        const info = await dal_1.dal.execute(sql, [id]);
        await this.deleteUserImageIfExists(oldImageName);
        if (info.affectedRows === 0)
            throw new client_errors_1.ResourceNotFound(id);
    }
    getImageDir() {
        return process.env.IMAGE_DIR || path_1.default.join(__dirname, "..", "1-assets", "images");
    }
    getUserImageDir() {
        return path_1.default.join(this.getImageDir(), "users");
    }
    async saveNewUserImage(image) {
        const dir = this.getUserImageDir();
        await promises_1.default.mkdir(dir, { recursive: true });
        const ext = path_1.default.extname(image.name || "") || ".jpg";
        const fileName = `${(0, crypto_1.randomUUID)()}${ext}`;
        const fullPath = path_1.default.join(dir, fileName);
        await image.mv(fullPath);
        return fileName;
    }
    async deleteUserImageIfExists(imageName) {
        if (!imageName)
            return;
        const fullPath = path_1.default.join(this.getUserImageDir(), imageName);
        try {
            await promises_1.default.unlink(fullPath);
        }
        catch {
        }
    }
    normalizeOptionalFields(user) {
        // treat empty strings (common from forms) as NULLs
        if (user.phoneNumber === "" || user.phoneNumber === undefined) {
            user.phoneNumber = null;
        }
        if (user.gender === "" || user.gender === undefined) {
            user.gender = null;
        }
        if (user.birthDate === "" || user.birthDate === undefined) {
            user.birthDate = null;
        }
    }
}
exports.userService = new UserService();
