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
    }
}

export enum Gender {
   MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER"
}

export class CredentialsModel{
    
    public email:string="";
    public password:string="";

    public constructor(credentials?:any){
       if (credentials) {
            this.email = credentials.email || "";
            this.password = credentials.password || "";
        }
    }
}