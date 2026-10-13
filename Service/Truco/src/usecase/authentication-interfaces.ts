import { Infer, object, optional, string } from 'superstruct';

import { AppTokenSchema } from "@usecase/common-interfaces";

export enum AuthenticationErrorCodes {
  BUSINESS = 'BUSINESS',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
};

export const LoginInputSchema = object({
  username: optional(string()),
  email: optional(string()),
  rpAddress: optional(string()),
  password: string(),
});

export type LoginInput = Infer<typeof LoginInputSchema>;

export interface LoginResult {
  userId: number;
  jwtToken: string;
};

export const RegisterInputSchema = object({
  token: AppTokenSchema,
  username: optional(string()),
  email: optional(string()),
  rpAddress: optional(string()),
  password: string(),
});

export type RegisterInput = Infer<typeof RegisterInputSchema>;

export interface RegisterResult {
  message: string;
  userId: number;
  jwtToken: string;
};

export const ChangePasswordInputSchema = object({
  token: AppTokenSchema,
  oldPassword: string(),
  newPassword: string(),
});

export type ChangePasswordInput = Infer<typeof ChangePasswordInputSchema>;

export interface ChangePasswordResult {
  message: string;
  userId: number;
}
