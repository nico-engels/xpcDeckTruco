import { coerce, Infer, number, object, optional, string } from 'superstruct';

import { rounds } from '@app/repository/round';
import { AppTokenSchema } from '@usecase/common-interfaces';

export enum RoundErrorCodes {
  BUSINESS = 'BUSINESS',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
};

const stringToNumber = coerce(number(), string(), (value) => {
  return Number.parseInt(value);
});

export const FinishRoundInputSchema = object({
  token: AppTokenSchema,
  roundId: number(),
});

export type FinishRoundInput = Infer<typeof FinishRoundInputSchema>;

export interface FinishRoundInputResult {
  roundId: number;
  winnerId: number;
  finished: boolean;
  nextRound?: {
    id: number;
    seq: number;
    playerCards: string;
    trumpCard: string;
    startPlayerId: number;
  };
};

export const AllRoundsInputSchema = object({
  token: AppTokenSchema,
  gameId: stringToNumber,
});

export type AllRoundsInput = Infer<typeof AllRoundsInputSchema>;

export interface AllRoundsResult {
  rounds: {
    id: number;
    seq: number;
    playerCards: string[];
    trumpCard: string;
    score: number;
    starterPlayer: number;
    winnerPlayer?: number;
  }[],
  roundsCount: number;
};

export const LastRoundInputSchema = object({
  token: optional(AppTokenSchema),
  gameId: stringToNumber,
});

export type LastRoundInput = Infer<typeof LastRoundInputSchema>;

export interface LastRoundResult {
  id: number;
  seq: number;
  readonly: boolean;
  playerCards: string[];
  trumpCard: string;
  score: number;
  starterPlayer: number;
  winnerPlayer?: number;
};

export interface InfoRoundsLogic {
  round: rounds;
  player1CardsArr?: string[];
  player2CardsArr?: string[];
  player1CardsRemaining?: string[];
  player2CardsRemaining?: string[];
  triTurnWinner?: (number | '-')[];
  roundWinner?: number;
  nextPlayerId?: number;
  askElevate?: string;
  lastTurnSeq?: number;
  possibleActions?: string[];
};