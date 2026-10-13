import { BaseRepository } from "@app/repository/base-repository";
import { preAuthGames } from "@app/repository/pre-auth-game";
import { rounds } from "@app/repository/round";
import { users } from "@app/repository/user";

export interface games {
  id?: number;
  player1: users;
  player2: users;
  player1Score: number;
  player2Score: number;
  startPlay?: Date;
  lastPlay?: Date;
  endPlay?: Date;
  rounds?: rounds[];
  winnerPlayer?: users;
  preAuthGames?: preAuthGames[];
}

export abstract class GameRepository extends BaseRepository {
  public abstract getGameById(gameId: number): Promise<games | null>;
  public abstract createGame(game: games): Promise<games>;
  public abstract updateGame(game: games): Promise<games>;
  public abstract listGamesByUsername(username: string, active?: boolean): Promise<games[]>;
};