import { DataSource } from "typeorm";

import { makeTypeOrmSqliteConnection } from '@app/repository/typeorm-data-source';
import { RoundRepository, rounds } from "@app/repository/round";
import { fromDatabase as fromDatabaseGame } from "@app/repository/typeorm-game";
import { roundsModel } from "@app/repository/typeorm-round-model";
import { fromDatabase as fromDatabaseTurn } from "@app/repository/typeorm-turn";
import { fromDatabase as fromDatabaseUser } from "@app/repository/typeorm-user";
import { Logger } from '@app/util/logger';

export function fromDatabase(model: roundsModel): rounds {
  return {
    id: model.id,
    game: fromDatabaseGame(model.game!),
    seq: model.seq!,
    player1Cards: model.player1Cards!,
    player2Cards: model.player2Cards!,
    trumpCard: model.trumpCard!,
    starterPlayer: fromDatabaseUser(model.starterPlayer!),
    finished: model.finished!,
    winnerPlayer: model.winnerPlayer ? fromDatabaseUser(model.winnerPlayer) : undefined,
    score: model.score!,
    turns: model.turns?.map(fromDatabaseTurn) ?? [],
  };
}

export class TypeOrmRoundRepository extends RoundRepository {
  private dataSource: DataSource;

  constructor(private logger: Logger) {
    super();
    this.dataSource = makeTypeOrmSqliteConnection(logger);
  }

  public async createRound(round: rounds): Promise<rounds> {
    return await this.dataSource.getRepository(roundsModel).save(round);
  }

  public async getAllRoundsByGame(gameId: number): Promise<rounds[]> {
    const result = await this.dataSource.getRepository(roundsModel).find({
      where: {
        game: { id: gameId },
      },
      relations: {
        game: {
          player1: true,
          player2: true,
        },
        starterPlayer: true,
        winnerPlayer: true,
      },
    });

    return result.map(fromDatabase);
  }

  public async getLastRoundByGame(gameId: number): Promise<rounds | null> {
    const [result] =
      await this.dataSource.getRepository(roundsModel).find({
        where: {
          game: { id: gameId },
        },
        relations: {
          game: {
            player1: true,
            player2: true,
          },
          starterPlayer: true,
          winnerPlayer: true,
        },
        order: {
          seq: 'DESC',
        },
        take: 1,
      });

    return result ? fromDatabase(result) : null;
  }

  public async getRoundById(roundId: number): Promise<rounds | null> {
    const [result] =
      await this.dataSource.getRepository(roundsModel).find({
        where: {
          id: roundId,
        },
        relations: {
          game: {
            player1: true,
            player2: true,
          },
          starterPlayer: true,
          winnerPlayer: true,
          turns: {
            player: true,
            round: {
              game: {
                player1: true,
                player2: true,
              },
              starterPlayer: true,
              winnerPlayer: true,
            },
          },
        },
      });

    return result ? fromDatabase(result) : null;
  }

  public async updateRound(round: rounds): Promise<rounds> {
    return await this.dataSource.getRepository(roundsModel).save(round);
  }

  public async initializeDbEngine(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }

}