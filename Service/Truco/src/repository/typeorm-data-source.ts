import { AbstractLogger, DataSource, LogLevel, LogMessage, QueryRunner } from 'typeorm';

import { gamesModel } from '@app/repository/typeorm-game-model';
import { preAuthGamesModel } from '@app/repository/typeorm-pre-auth-games-model';
import { roundsModel } from '@app/repository/typeorm-round-model';
import { turnsModel } from '@app/repository/typeorm-turn-model';
import { usersModel } from '@app/repository/typeorm-users-model';
import { Logger } from '@app/util/logger';

export function makeTypeOrmSqliteConnection(logger?: Logger): DataSource {
  const conection = new DataSource({
    type: 'better-sqlite3',
    database: './rec/bd/db.sqlite3',
    //synchronize: true,
    logger: logger ? new MyCustomLogger(logger!) : undefined,
    entities: [usersModel, gamesModel, roundsModel, turnsModel, preAuthGamesModel],
  });

  return conection;
}

export const defaultSchemaDataSource = makeTypeOrmSqliteConnection();

class MyCustomLogger extends AbstractLogger {
  constructor(private logger: Logger) {
    super(true);
  };

  protected writeLog(level: LogLevel, logMessage: LogMessage | LogMessage[], queryRunner?: QueryRunner) {
    const messages = this.prepareLogMessages(
      logMessage,
      {
        highlightSql: false,
      },
      queryRunner,
    );

    for (const message of messages) {
      switch (message.type ?? level) {
        case "log":
        case "schema-build":
        case "migration":
        case "info":
        case "query":
          if (message.prefix) {
            this.logger.info(`${message.prefix} ${message.message}`);
          } else {
            this.logger.info(`${message.message}`);
          }
          break;

        case "warn":
        case "query-slow":
          if (message.prefix) {
            this.logger.warn(`${message.prefix} ${message.message}`);
          } else {
            this.logger.warn(`${message.message}`);
          }
          break;

        case "error":
        case "query-error":
          if (message.prefix) {
            this.logger.error(`${message.prefix} ${message.message}`);
          } else {
            this.logger.error(`${message.message}`);
          }
          break;
      }
    }
  }
}