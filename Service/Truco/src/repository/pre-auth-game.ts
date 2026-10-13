import { BaseRepository } from "@app/repository/base-repository";
import { games } from "@app/repository/game";

export interface preAuthGames {
  id?: number;
  player1Link: string;
  player1DeviceId?: string;
  player2Link: string;
  player2DeviceId?: string;
  game: games;
}

export abstract class PreAuthGameRepository extends BaseRepository {
  public abstract createPreAuthGame(pag: preAuthGames): Promise<preAuthGames>;
  public abstract getPreGameByLink(link: string): Promise<preAuthGames | null>;
  public abstract listPreAuthGame(): Promise<preAuthGames[]>;
  public abstract updatePreAuthGame(pag: preAuthGames): Promise<preAuthGames>;
};