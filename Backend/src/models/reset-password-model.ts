export class ForgotPasswordRequest{
    public email?:string;
}

export class ResetPasswordRequest{
    public resetId?:number;
    public token?:string;
    public newPassword?:string;
}

