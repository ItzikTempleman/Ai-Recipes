export type User = {
     id?: number;
     firstName: string;
     familyName: string;
     email: string;
     password?: string;
     birthDate?: string | null;
     phoneNumber?: string | null;
     gender?: Gender | null;
     imageUrl?: string;
     image?: File;
     needsPasswordSetup: boolean;
       roleId: number; 
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

export enum RoleId {
 Admin = 1,
   User = 2,
}