import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import { appConfig } from "../utils/app-config";


export class ForgotPasswordRequest{
    public email?:string;
}

export class ResetPasswordRequest{
    public resetId?:number;
    public token?:string;
    public newPassword?:string;
}

export enum AuthResponseCode {
  PasswordResetRequested = 1,
  PasswordResetInvalid = 2,
  PasswordResetExpired = 3,
  PasswordResetUsed = 4,
  PasswordResetSuccess = 5
}

export interface AuthResponse {
  code: AuthResponseCode;
  params?: Record<string, string | number>;
}

class Mailer {
  private transport =
    appConfig.senderEmail && appConfig.senderAppPassword
      ? nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: appConfig.senderEmail,
            pass: appConfig.senderAppPassword
          }
        })
      : null;

  public async sendResetLink(to: string, resetLink: string): Promise<void> {
    if (!this.transport) return;

    const subject = appConfig.resetMailSubject;
    const text = resetLink;

    const message: Mail.Options = { to, subject, text };
    await this.transport.sendMail(message);
  }
}

export const mailer = new Mailer();