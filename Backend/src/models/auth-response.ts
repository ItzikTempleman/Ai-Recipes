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