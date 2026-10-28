import { coerce, Infer, number, object, optional, string } from 'superstruct';

import { AppTokenSchema } from "@usecase/common-interfaces";

export enum GameErrorCodes {
  NEW_GAME_WITH_ITSELF = 'NEW_GAME_WITH_ITSELF',
  NOT_FOUND = 'NOT_FOUND',
};

const stringToNumber = coerce(number(), string(), (value) => {
  return Number.parseInt(value);
});

export const InfoGameInputSchema = object({
  token: optional(AppTokenSchema),
  gameId: stringToNumber,
});

export type InfoGameInput = Infer<typeof InfoGameInputSchema>;

export interface InfoGameResult {
  id?: number;
  player1Id: number;
  player1: string;
  player1Score: number;
  player2Id: number;
  player2: string;
  player2Score: number;
  readonly: boolean;
  startPlay?: Date;
  lastPlay?: Date;
  lastRoundId?: number;
  lastRoundSeq?: number;
  endPlay?: Date,
  winnerPlayerId?: number;
};

export const NewGameInputSchema = object({
  token: AppTokenSchema,
  opponentUsername: string(),
});

export type NewGameInput = Infer<typeof NewGameInputSchema>;

export interface NewGameResult {
  id?: number;
  startRoundId?: number;
  player1Cards?: string;
  trumpCard?: string;
};

export const ListActiveGamesInputSchema = object({
  token: AppTokenSchema,
});

export type ListActiveGamesInput = Infer<typeof ListActiveGamesInputSchema>;

export interface ListActiveGamesResult {
  games: {
    id: number;
    player1Id: number;
    player1: string;
    player1Score: number;
    player2Id: number;
    player2: string;
    player2Score: number;
    startPlay: Date;
    endPlay: Date;
  }[],
  gamesCount: number,
};