import { UploadedFile } from "express-fileupload";
import Joi from "joi";
import { ValidationError } from "./client-errors";

export class UserModel {
    public id!: number;
    public firstName!: string;
    public familyName!: string;
    public email!: string;
    public password!: string;
    public age!: number;
    public birthDate!: string;
    public phoneNumber!: string;
    public gender!: Gender;
    public image!: UploadedFile;
    public imageUrl!: string;
    public imageName!: string;

    constructor(user: UserModel) {
        this.id = user.id;
        this.firstName = user.firstName;
        this.familyName = user.familyName;
        this.email = user.email;
        this.password = user.password;
        this.age = user.age;
        this.birthDate = user.birthDate;
        this.phoneNumber = user.phoneNumber;
        this.gender = user.gender;
        this.image = user.image;
        this.imageUrl = user.imageUrl;
        this.imageName = user.imageName;
    }

    private static validationSchema = Joi.object(
        {
            id: Joi.number().optional().positive(),
            firstName: Joi.string().required().min(2).max(50),
            familyName: Joi.string().required().min(2).max(50),
            email: Joi.string().required().min(0).max(1000),
            password: Joi.string().optional().min(0).max(1000),
            birthDate: Joi.string().optional(),
            phoneNumber: Joi.string().required().min(9).max(16),
            age: Joi.number().optional(),
            gender: Joi.string().valid("MALE", "FEMALE", "OTHER").optional(),
            image: Joi.object().optional(),
            imageUrl: Joi.string().optional().uri,
            imageName: Joi.string().optional().max(50)
        }
    );

    public validate(): void {
        const result = UserModel.validationSchema.validate(this);
        if (result.error) throw new ValidationError(result.error.message);
    }
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}

export class CredentialsModel {

    public email: string = "";
    public password: string = "";

    public constructor(credentials?: any) {
        if (credentials) {
            this.email = credentials.email || "";
            this.password = credentials.password || "";
        }
    }
}