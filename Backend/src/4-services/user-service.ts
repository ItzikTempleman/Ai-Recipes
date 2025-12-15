import { OkPacketParams } from "mysql2";
import { cyber } from "../2-utils/cyber";
import { dal } from "../2-utils/dal";
import { AuthorizationError, ResourceNotFound, ValidationError } from "../3-models/client-errors";
import { CredentialsModel, UserModel } from "../3-models/user-model";
import { fileSaver } from "uploaded-file-saver";
import { appConfig } from "../2-utils/app-config";
import path from "path";
import { randomUUID } from "crypto";
import { UploadedFile } from "express-fileupload";
import fs from "fs/promises";

class UserService {
    public async register(user: UserModel): Promise<string> {
        user.validate();
        const imageName = user.image ? await this.saveNewUserImage(user.image as UploadedFile) : null;
        const emailTaken = await this.isEmailTaken(user.email);
        if (emailTaken) throw new ValidationError("Email already exists")
        const sql = "insert into user(firstName,familyName,email,password,phoneNumber,Gender,birthDate,imageName) values (?,?,?,?,?,?,?,?)";

        user.password = cyber.hash(user.password);
        const values = [user.firstName, user.familyName, user.email, user.password, user.phoneNumber, user.gender, user.birthDate, imageName];
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

    public async getAllUsers(): Promise<UserModel[]> {
        const sql = "select * from user";
        return await dal.execute(sql) as UserModel[];
    }

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
        const values = [user.firstName, user.familyName, user.email, user.phoneNumber, newImageName, user.id];
        const info = await dal.execute(sql, values) as OkPacketParams;
        if (info.affectedRows === 0) throw new ResourceNotFound(user.id);
        const dbUser = await this.getOneUser(user.id);
        return cyber.generateToken(dbUser);
    }

    private async getImageName(id: number): Promise<string | null> {
        const sql = `select imageName from user where id=?`;
        const values = [id];
        const users = await dal.execute(sql, values) as UserModel[];
        const user = users[0];
        if (!user) return null;
        return user.imageName
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
}

export const userService = new UserService();

