import { DataSource } from "typeorm";

import { makeTypeOrmSqliteConnection } from '@app/repository/typeorm-data-source';
import { TurnRepository, turns } from "@app/repository/turn";
import { fromDatabase as fromDatabaseRound } from "@app/repository/typeorm-round";
import { turnsModel } from "@app/repository/typeorm-turn-model";
import { fromDatabase as fromDatabaseUser } from "@app/repository/typeorm-user";
import { Logger } from '@app/util/logger';

export function fromDatabase(model: turnsModel): turns {
  return {
    id: model.id,
    round: fromDatabaseRound(model.round!),
    seq: model.seq!,
    player: fromDatabaseUser(model.player!),
    cardOrAction: model.cardOrAction!,
    when: model.when!,
  };
}

export class TypeOrmTurnRepository extends TurnRepository {
  private dataSource: DataSource;

  constructor(private logger: Logger) {
    super();
    this.dataSource = makeTypeOrmSqliteConnection(logger);
  }

  public async createTurn(turn: turns): Promise<turns> {
    return await this.dataSource.getRepository(turnsModel).save(turn);
  }

  public async initializeDbEngine(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

}
