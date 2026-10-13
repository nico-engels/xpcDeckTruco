import { DataSource, IsNull, Not } from "typeorm";

import { makeTypeOrmSqliteConnection } from '@app/repository/typeorm-data-source';
import { gamesModel } from "@app/repository/typeorm-game-model";
import { fromDatabase as fromDatabasePreAuthGame } from "@app/repository/typeorm-pre-auth-game";
import { fromDatabase as fromDatabaseRound } from "@app/repository/typeorm-round";
import { fromDatabase as fromDatabaseUser } from "@app/repository/typeorm-user";
import { GameRepository, games } from "@app/repository/game";
import { Logger } from '@app/util/logger';

export function fromDatabase(model: gamesModel): games {
  return {
    id: model.id,
    player1: fromDatabaseUser(model.player1!),
    player2: fromDatabaseUser(model.player2!),
    player1Score: model.player1Score!,
    player2Score: model.player2Score!,
    startPlay: model.startPlay!,
    lastPlay: model.lastPlay,
    endPlay: model.endPlay,
    rounds: model.rounds?.map(fromDatabaseRound),
    winnerPlayer: model.winnerPlayer ? fromDatabaseUser(model.winnerPlayer) : undefined,
    preAuthGames: model.preAuthGames?.map(fromDatabasePreAuthGame),
  };
}

export class TypeOrmGameRepository extends GameRepository {
  private dataSource: DataSource;

  constructor(private logger: Logger) {
    super();
    this.dataSource = makeTypeOrmSqliteConnection(logger);
  }

  public async getGameById(gameId: number): Promise<games | null> {
    const result = await this.dataSource.getRepository(gamesModel).findOne({
      where: { id: gameId },
      relations: {
        player1: true,
        player2: true,
        rounds: {
          game: {
            player1: true,
            player2: true,
          },
          starterPlayer: true,
        },
        winnerPlayer: true,
      }
    });

    return result ? fromDatabase(result) : null;
  }

  public async createGame(game: games): Promise<games> {
    return await this.dataSource.getRepository(gamesModel).save(game);
  }

  public async updateGame(game: games): Promise<games> {
    return await this.dataSource.getRepository(gamesModel).save(game);
  }

  public async listGamesByUsername(username: string, active?: boolean): Promise<games[]> {
    let result: gamesModel[];
    if (active === undefined) {
      result = await this.dataSource.getRepository(gamesModel).find({
        where: [{ player1: { username } }, { player2: { username } }],
        relations: {
          player1: true,
          player2: true,
        },
      });
    } else {
      if (active) {
        result = await this.dataSource.getRepository(gamesModel).find({
          where: [
            { player1: { username }, endPlay: IsNull() },
            { player2: { username }, endPlay: IsNull() },
          ],
          relations: {
            player1: true,
            player2: true,
          },
        });
      } else {
        result = await this.dataSource.getRepository(gamesModel).find({
          where: [
            { player1: { username }, endPlay: Not(IsNull()) },
            { player2: { username }, endPlay: Not(IsNull()) },
          ],
          relations: {
            player1: true,
            player2: true,
          },
        });
      }
    }

    return result.map(fromDatabase);
  }

  public async initializeDbEngine(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }
  }
};