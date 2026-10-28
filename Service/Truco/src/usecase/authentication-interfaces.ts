import { Infer, object, optional, refine, string } from 'superstruct';

import { AppTokenSchema } from "@usecase/common-interfaces";

export enum AuthenticationErrorCodes {
  BUSINESS = 'BUSINESS',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
};

const LoginInputSchema = object({
  username: optional(string()),
  email: optional(string()),
  rpAddress: optional(string()),
  password: string(),
});

export const LoginInputSchemaRefine = refine(LoginInputSchema, 'LoginInputSchemaRefine', (value) => {
  const hasUsername = !!value.username;
  const hasEmail = !!value.email;
  const hasRpAddress = !!value.rpAddress;

  return [hasUsername, hasEmail, hasRpAddress].filter(flag => flag).length === 1 || 'Only one method should be defined';
});

export type LoginInput = Infer<typeof LoginInputSchemaRefine>;

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
