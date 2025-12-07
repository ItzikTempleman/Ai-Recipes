export type User = {
     id?: number;
     firstName: string;
     familyName: string;
     email: string;
     password: string;
     birthDate: string;
     phoneNumber: string;
     gender: Gender;
     imageUrl?: string;
     image?: File;
}

export enum Gender {
     MALE = "MALE",
     FEMALE = "FEMALE",
     OTHER = "OTHER"
}

export type Credentials = {
     email?: string;
     password?: string;
}

