import { DataSource } from "typeorm";

import { makeTypeOrmSqliteConnection } from '@app/repository/typeorm-data-source';
import { fromDatabase as fromDatabaseGame } from "@app/repository/typeorm-game";
import { preAuthGamesModel } from "@app/repository/typeorm-pre-auth-games-model";
import { preAuthGames, PreAuthGameRepository } from "@app/repository/pre-auth-game";
import { Logger } from '@app/util/logger';

export function fromDatabase(model: preAuthGamesModel): preAuthGames {
  return {
    id: model.id,
    player1Link: model.player1Link!,
    player1DeviceId: model.player1DeviceId!,
    player2Link: model.player2Link!,
    player2DeviceId: model.player2DeviceId!,
    game: fromDatabaseGame(model.game!),
  };
}

export class TypeOrmPreAuthGameRepository extends PreAuthGameRepository {
  private dataSource: DataSource;

  constructor(private logger: Logger) {
    super();
    this.dataSource = makeTypeOrmSqliteConnection(logger);
  }

  public async createPreAuthGame(pag: preAuthGames): Promise<preAuthGames> {
    return await this.dataSource.getRepository(preAuthGamesModel).save(pag);
  }

  public async getPreGameByLink(link: string): Promise<preAuthGames | null> {
    const pag = await this.dataSource.getRepository(preAuthGamesModel).findOne({
      where: [{ player1Link: link }, { player2Link: link }],
      relations: {
        game: {
          player1: true,
          player2: true,
        },
      },
    });

    return pag ? fromDatabase(pag) : null;
  }

  public async listPreAuthGame(): Promise<preAuthGames[]> {
    const preGames = await this.dataSource.getRepository(preAuthGamesModel).find({
      relations: {
        game: {
          player1: true,
          player2: true,
        },
      },
    });

    return preGames.map(fromDatabase);
  }

  public async updatePreAuthGame(pag: preAuthGames): Promise<preAuthGames> {
    return await this.dataSource.getRepository(preAuthGamesModel).save(pag);
  }

  public async initializeDbEngine(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }
};