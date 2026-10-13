import { Infer, object, string } from 'superstruct';

import { AppTokenSchema } from '@usecase/common-interfaces';

export enum PreGameErrorCodes {
  BUSINESS = 'BUSINESS',
  INVALID_INPUT = 'INVALID_INPUT',
  NOT_FOUND = 'NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  UNAUTHORIZED = 'UNAUTHORIZED',
};

export const NewPreAuthGameInputSchema = object({
  token: AppTokenSchema,
  player1username: string(),
  player2username: string(),
});

export type NewPreAuthGameInput = Infer<typeof NewPreAuthGameInputSchema>;

export interface NewPreAuthGameResult {
  message: string;
  gameId: number;
  player1Link: string;
  player2Link: string;
};

export const GeneratePreGameTokenInputSchema = object({
  playerLink: string(),
  deviceId: string(),
});

export type GeneratePreGameTokenInput = Infer<typeof GeneratePreGameTokenInputSchema>;

export interface GeneratePreGameTokenResult {
  message: string;
  playerId: number;
  player: string;
  jwtToken: string;
  gameId: number;
};

export const ResetPreGameTokenInputSchema = object({
  token: AppTokenSchema,
  playerLink: string(),
});

export type ResetPreGameTokenInput = Infer<typeof ResetPreGameTokenInputSchema>;

export interface ResetPreGameTokenResult {
  message: string;
};

export const ListPreAuthGamesInputSchema = object({
  token: AppTokenSchema,
});

export type ListPreAuthGamesInput = Infer<typeof ListPreAuthGamesInputSchema>;

export interface ListPreAuthGamesResult {
  message: string,
  preAuthGamesCount: number,
  preAuthGames: {
    id: number;
    player1: string;
    player1Link: string;
    player2: string;
    player2Link: string;
    gameId: number;
  }[],
};