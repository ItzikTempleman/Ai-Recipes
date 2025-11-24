export type UserModel= {
     id?: number;
     firstName: string;
     familyName: string;
     email: string;
     password: string;
     age?: number;
     birthDate: string;
     phoneNumber: string;
     gender: Gender;
}

export enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}

export type CredentialsModel ={
     email?: string;
     password?: string;
}

