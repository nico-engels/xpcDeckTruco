import { BaseRepository } from "@app/repository/base-repository";
import { games } from "@app/repository/game";
import { users } from "@app/repository/user";
import { turns } from "@app/repository/turn";

export interface rounds {
  id?: number;
  game: games;
  seq: number;
  player1Cards: string;
  player2Cards: string;
  trumpCard: string;
  starterPlayer: users;
  finished: boolean;
  winnerPlayer?: users;
  score: number;
  turns: turns[];
}

export abstract class RoundRepository extends BaseRepository {
  public abstract createRound(round: rounds): Promise<rounds>;
  public abstract updateRound(round: rounds): Promise<rounds>;
  public abstract getAllRoundsByGame(gameId: number): Promise<rounds[]>;
  public abstract getLastRoundByGame(gameId: number): Promise<rounds | null>;
  public abstract getRoundById(roundId: number): Promise<rounds | null>;
};

