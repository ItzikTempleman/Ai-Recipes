import { OkPacketParams } from "mysql2";
import { cyber } from "../2-utils/cyber";
import { dal } from "../2-utils/dal";
import { AuthorizationError, ValidationError } from "../3-models/client-errors";
import { CredentialsModel, UserModel } from "../3-models/user-model";
import { start } from "repl";

class UserService {
    public async register(user: UserModel): Promise<string> {
        const emailTaken = await this.isEmailTaken(user.email);
        if (emailTaken) throw new ValidationError("Email already exists")
        const sql = "insert into user(firstName,familyName,email,password,phoneNumber,Gender,birthDate) values (?,?,?,?,?,?,?)";

        user.password = cyber.hash(user.password);
        const values = [user.firstName, user.familyName, user.email, user.password, user.phoneNumber,user.gender,user.birthDate];
        const info: OkPacketParams = await dal.execute(sql, values) as OkPacketParams;
        user.id = info.insertId!;
        return cyber.generateToken(user);
    }

    public async login(credentials: CredentialsModel): Promise<string> {
        credentials.password = cyber.hash(credentials.password);
        const sql = "select * from user where email=? and password=?";
        const values = [credentials.email, credentials.password];
        const users = await dal.execute(sql, values) as UserModel[];
        const user = users[0];
        if (!user) throw new AuthorizationError("Incorrect email or password");
        return cyber.generateToken(user);
    }

    public async getAllUsers():Promise<UserModel[]>{
        const sql="select * from user";
        return await dal.execute(sql) as UserModel[];
    }

    private async isEmailTaken(email: string): Promise<boolean> {
        const sql = "select id from user where email=?";
        const value = [email];
        const users = await dal.execute(sql, value) as UserModel[];
        return users.length > 0
    }
}

export const userService = new UserService();

