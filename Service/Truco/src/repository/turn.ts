import { BaseRepository } from "@app/repository/base-repository";
import { users } from "@app/repository/user";
import { rounds } from "@app/repository/round";

export interface turns {
  id?: number;
  round: rounds;
  seq: number;
  player: users;
  cardOrAction: string;
  when: Date;
}

export abstract class TurnRepository extends BaseRepository {
  public abstract createTurn(turn: turns): Promise<turns>;
};
