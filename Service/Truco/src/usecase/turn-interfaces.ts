import { coerce, Infer, number, object, string } from 'superstruct';

import { rounds } from '@app/repository/round';
import { AppTokenSchema } from '@usecase/common-interfaces';

export enum TurnErrorCodes {
  BUSINESS = 'BUSINESS',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  NOT_YOUR_TURN = 'NOT_YOUR_TURN',
};

const stringToNumber = coerce(number(), string(), (value) => {
  return Number.parseInt(value);
});

export const CheckTurnInputSchema = object({
  token: AppTokenSchema,
  roundId: stringToNumber,
});

export type CheckTurnInput = Infer<typeof CheckTurnInputSchema>;

export interface CheckTurnResult {
  roundId: number;
  roundSeq: number;
  gameId: number;
  starterPlayer: number;
  nextPlayerId?: number;
  score: number;
  trumpCard: string;
  player1Id: number;
  player1: string;
  player2Id: number;
  player2: string;
  playerCards: string[];
  playerCardsRemaining: string[];
  turnsCount: number;
  turns: {
    id: number;
    seq: number;
    playerId: number;
    player: string;
    cardOrAction: string;
    when: Date;
  }[];
  TriTurnWinner: number[];
  roundWinner?: number;
  lastTurnSeq?: number;
  possibleActions: string[];
};

export const PlayTurnInputSchema = object({
  token: AppTokenSchema,
  roundId: number(),
  prevSeq: number(),
  cardOrAction: string(),
});

export type PlayTurnInput = Infer<typeof PlayTurnInputSchema>;

export interface PlayTurnResult {
  id: number;
  message: string;
}

export enum turnWin {
  draw,
  player1,
  player2,
}

export interface InfoRoundsLogic {
  round: rounds;
  player1CardsArr: string[];
  player2CardsArr: string[];
  player1CardsRemaining: string[];
  player2CardsRemaining: string[];
  TriTurnWinner: turnWin[];
  roundWinner?: turnWin;
  nextPlayerId?: number;
  askElevate?: string;
  lastTurnSeq?: number;
  possibleActions: string[];
}