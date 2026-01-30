"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialsModel = exports.Gender = exports.UserModel = void 0;
const joi_1 = __importDefault(require("joi"));
const client_errors_1 = require("./client-errors");
class UserModel {
    id;
    firstName;
    familyName;
    email;
    password;
    age;
    phoneNumber;
    gender;
    birthDate;
    image;
    imageUrl;
    imageName;
    constructor(user) {
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
    static validationSchema = joi_1.default.object({
        id: joi_1.default.number().optional().positive(),
        firstName: joi_1.default.string().required().min(2).max(50),
        familyName: joi_1.default.string().required().min(2).max(50),
        email: joi_1.default.string().required().min(0).max(1000),
        password: joi_1.default.string().optional().min(0).max(1000),
        birthDate: joi_1.default.string().optional().allow("", null),
        phoneNumber: joi_1.default.string().optional().allow("", null).min(9).max(16),
        age: joi_1.default.number().optional().allow(null),
        gender: joi_1.default.string().valid("MALE", "FEMALE", "OTHER").optional().allow("", null),
        image: joi_1.default.object().optional(),
        imageUrl: joi_1.default.string().optional().uri(),
        imageName: joi_1.default.string().optional().max(50),
    });
    validate() {
        const result = UserModel.validationSchema.validate(this);
        if (result.error)
            throw new client_errors_1.ValidationError(result.error.message);
    }
}
exports.UserModel = UserModel;
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHER";
})(Gender || (exports.Gender = Gender = {}));
class CredentialsModel {
    email = "";
    password = "";
    constructor(credentials) {
        if (credentials) {
            this.email = credentials.email || "";
            this.password = credentials.password || "";
        }
    }
}
exports.CredentialsModel = CredentialsModel;
