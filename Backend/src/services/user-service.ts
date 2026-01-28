import { OkPacketParams, ResultSetHeader } from "mysql2";
import { cyber } from "../utils/cyber";
import { dal } from "../utils/dal";
import { AuthorizationError, ResourceNotFound, ValidationError } from "../models/client-errors";
import { CredentialsModel, UserModel } from "../models/user-model";
import { fileSaver } from "uploaded-file-saver";
import { appConfig } from "../utils/app-config";
import path from "path";
import { randomUUID } from "crypto";
import { UploadedFile } from "express-fileupload";
import fs from "fs/promises";
import axios from "axios";

class UserService {
    public async register(user: UserModel): Promise<string> {
        user.validate();
        this.normalizeOptionalFields(user);
        const imageName = user.image ? await this.saveNewUserImage(user.image as UploadedFile) : null;
        const emailTaken = await this.isEmailTaken(user.email);
        if (emailTaken) throw new ValidationError("Email already exists")
        const sql = "insert into user(firstName,familyName,email,password,phoneNumber,Gender,birthDate,imageName) values (?,?,?,?,?,?,?,?)";

        user.password = cyber.hash(user.password);

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
        const info: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
        user.id = info.insertId!;
        return cyber.generateToken(user);
    }

    public async login(credentials: CredentialsModel): Promise<string> {
        const hashedPassword = cyber.hash(credentials.password);
        const sql = `select * , concat(?, imageName) as imageUrl from user where email = ? and password = ?`;
        const values = [appConfig.baseUserImageUrl, credentials.email, hashedPassword];
        const users = await dal.execute(sql, values) as UserModel[];
        const user = users[0];
        if (!user) throw new AuthorizationError("Incorrect email or password");
        return cyber.generateToken(user);
    }

    public async isUserExists(id: number): Promise<boolean> {
        const sql = "select id from user where id = ? limit 1";
const values = [id];
        const rows = (await dal.execute(sql, values)) as Array<{ id: number }>;
        return rows.length > 0;
    }

    public async getAllUsers(): Promise<UserModel[]> {
        const sql = "select * from user";
        return await dal.execute(sql) as UserModel[];
    }

    private googlePlaceHolderHash(userId: number): string {
        const secret = appConfig.jwtSecretKey;
        return cyber.hash(`__google_placeholder__:${userId}:${secret}`);
    };

    private isGooglePlaceHolderPassword(userId: number, passwordHashFromDb: string): boolean {
        return passwordHashFromDb === this.googlePlaceHolderHash(userId);
    };

    public async getOneUser(id: number): Promise<UserModel> {
        const sql = `select * , concat(?,imageName) as imageUrl from user where id = ?`;
        const values = [appConfig.baseUserImageUrl, id];
        const users = await dal.execute(sql, values) as UserModel[];
        const user = users[0];
        if (!users) throw new ResourceNotFound(id);
        return user;
    }

    private async isEmailTaken(email: string): Promise<boolean> {
        const sql = "select id from user where email=?";
        const value = [email];
        const users = await dal.execute(sql, value) as UserModel[];
        return users.length > 0
    }

    public async updateUser(user: UserModel): Promise<string> {
        if (user.id === undefined) {
            throw new ValidationError("Missing user id for updating profile");
        }
        user.validate();
        const oldImageName = await this.getImageName(user.id);
        let newImageName = oldImageName;
        if (user.image) {
            await this.deleteUserImageIfExists(oldImageName);
            newImageName = await this.saveNewUserImage(user.image as UploadedFile);
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
        const info = await dal.execute(sql, values) as OkPacketParams;
        if (info.affectedRows === 0) throw new ResourceNotFound(user.id);
        const dbUser = await this.getOneUser(user.id);
        return cyber.generateToken(dbUser);
    }

    public async loginWithGoogle(email: string, firstName?: string, familyName?: string, pictureUrl?: string | null): Promise<string> {
        email = email.trim().toLowerCase();
        const sql = `select * , concat(?, imageName) as imageUrl from user where email = ?`;
        const users = await dal.execute(sql, [appConfig.baseUserImageUrl, email]) as UserModel[];
        const existing = users[0];
        if (existing) {
            const dbPasswordHash = (existing as any).password as string | undefined;
            const needsPasswordSetup =
                existing.id != null &&
                !!dbPasswordHash &&
                this.isGooglePlaceHolderPassword(existing.id, dbPasswordHash);
            if (!existing.imageName && pictureUrl) {
                const downloaded = await this.saveRemoteUserImage(pictureUrl);
                await dal.execute(`update user set imageName=? where id=?`, [downloaded, existing.id]) as any;
                const refreshed = await this.getOneUser(existing.id!);
                const tokenUser: any = { ...refreshed, needsPasswordSetup };
                return cyber.generateToken(tokenUser);
            }
            const tokenUser: any = { ...existing, needsPasswordSetup };
            delete tokenUser.password;
            return cyber.generateToken(tokenUser);
        }
        const safeFirst = firstName?.trim() || "Google";
        const safeFamily = (familyName ?? "").trim();
        const tempPassword = cyber.hash(randomUUID());
        const imageName = pictureUrl ? await this.saveRemoteUserImage(pictureUrl) : null;
        const insertSql = `insert into user(firstName, familyName, email, password, phoneNumber, Gender, birthDate, imageName) values (?,?,?,?,?,?,?,?)`;
        const values = [safeFirst, safeFamily, email, tempPassword, null, null, null, imageName];
        const result = await dal.execute(insertSql, values) as OkPacketParams;
        const id = result.insertId!;
        const placeholder = this.googlePlaceHolderHash(id);
        await dal.execute(`update user set password=? where id=?`, [placeholder, id]);
        const newUser = await this.getOneUser(id);
        const tokenUser: any = { ...newUser, needsPasswordSetup: true };
        return cyber.generateToken(tokenUser);
    }

    private async getImageName(id: number): Promise<string | null> {
        const sql = `select imageName from user where id=?`;
        const values = [id];
        const users = await dal.execute(sql, values) as UserModel[];
        const user = users[0];
        if (!user) return null;
        return user.imageName
    }

    public async setPasswordForLoggedInUser(userId: number, password: string, confirm: string): Promise<string> {
        if (!password || password.length < 8) throw new ValidationError("Password must be at least 8 characters");
        if (password !== confirm) throw new ValidationError("Passwords do not match");
        const hashed = cyber.hash(password);
        const sql = `update user set password=? where id=?`;
        const info = await dal.execute(sql, [hashed, userId]) as OkPacketParams;
        if (info.affectedRows === 0) throw new ResourceNotFound(userId);
        const refreshed = await this.getOneUser(userId);
        const tokenUser: any = { ...refreshed, needsPasswordSetup: false };
        return cyber.generateToken(tokenUser);
    }

    public async setPassword(token: string, password: string, confirm: string): Promise<string> {
        const response = await axios.post("/api/users/set-password", { password, confirm }, { headers: { Authorization: `Bearer ${token}` } });
        return response.data.token;
    }

    private normalizeGoogleImageUrl(url: string): string {
        const base = url.split("=")[0];
        return `${base}=s1024-c`;
    }

    private async saveRemoteUserImage(url: string): Promise<string> {
        if (!/^https?:\/\//i.test(url)) {
            throw new ValidationError("Invalid profile image URL");
        }

        const dir = this.getUserImageDir();
        await fs.mkdir(dir, { recursive: true });

        const highResUrl = this.normalizeGoogleImageUrl(url);

        const resp = await axios.get<ArrayBuffer>(highResUrl, {
            responseType: "arraybuffer",
            timeout: 15000,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            validateStatus: (s) => s >= 200 && s < 300,
        });

        const contentType = (resp.headers["content-type"] || "").toString().toLowerCase();
        if (!contentType.startsWith("image/")) {
            throw new ValidationError("Google profile image is not an image");
        }

        const extFromType: Record<string, string> = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        };
        const ext = extFromType[contentType] ?? ".jpg";

        const fileName = `${randomUUID()}${ext}`;
        const fullPath = path.join(dir, fileName);

        await fs.writeFile(fullPath, Buffer.from(resp.data));
        return fileName;
    }


    public async deleteUser(id: number): Promise<void> {
        const oldImageName = await this.getImageName(id);
        const sql = "delete from user where id = ?";
        const info: OkPacketParams = await dal.execute(sql, [id]) as OkPacketParams;
        await this.deleteUserImageIfExists(oldImageName);
        if (info.affectedRows === 0) throw new ResourceNotFound(id);
    }

    private getImageDir(): string {
        return process.env.IMAGE_DIR || path.join(__dirname, "..", "1-assets", "images");
    }

    private getUserImageDir(): string {
        return path.join(this.getImageDir(), "users");
    }

    private async saveNewUserImage(image: UploadedFile): Promise<string> {
        const dir = this.getUserImageDir();
        await fs.mkdir(dir, { recursive: true });

        const ext = path.extname(image.name || "") || ".jpg";
        const fileName = `${randomUUID()}${ext}`;
        const fullPath = path.join(dir, fileName);

        await image.mv(fullPath);
        return fileName;
    }

    private async deleteUserImageIfExists(imageName: string | null): Promise<void> {
        if (!imageName) return;
        const fullPath = path.join(this.getUserImageDir(), imageName);
        try {
            await fs.unlink(fullPath);
        } catch {

        }
    }

    private normalizeOptionalFields(user: UserModel): void {
        // treat empty strings (common from forms) as NULLs
        if ((user.phoneNumber as any) === "" || user.phoneNumber === undefined) {
            (user as any).phoneNumber = null;
        }
        if ((user.gender as any) === "" || user.gender === undefined) {
            (user as any).gender = null;
        }
        if ((user.birthDate as any) === "" || user.birthDate === undefined) {
            (user as any).birthDate = null;
        }
    }
}

export const userService = new UserService();