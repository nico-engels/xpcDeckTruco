import { Request, Response } from 'express';

import { PreGameController } from '@app/controller/pre-game';
import { PreGameUsecase } from '@usecase/pre-game-usecase';
import { TypeOrmGameRepository } from '@app/repository/typeorm-game';
import { TypeOrmRoundRepository } from '@app/repository/typeorm-round';
import { TypeOrmUserRepository } from '@app/repository/typeorm-user';
import { TypeOrmPreAuthGameRepository } from '@app/repository/typeorm-pre-auth-game';
import { PinoLogger } from '@app/util/logger';
import { RoundUsecase } from '@app/usecase/round-usecase';

export class PreGameHandler
{
  private async buildControler(req: Request): Promise<PreGameController> {
    const logger = new PinoLogger(req.log);
    const repo = new TypeOrmPreAuthGameRepository(logger);
    const userRepo = new TypeOrmUserRepository(logger);
    const gameRepo = new TypeOrmGameRepository(logger);
    const roundRepo = new TypeOrmRoundRepository(logger);
    const roundUsecase = new RoundUsecase(roundRepo, gameRepo, logger);
    const usecase = new PreGameUsecase(repo, userRepo, gameRepo, roundUsecase, logger);
    const controller = new PreGameController(usecase, logger);

    await repo.initializeDbEngine();
    await userRepo.initializeDbEngine();
    await gameRepo.initializeDbEngine();
    await roundRepo.initializeDbEngine();

    return controller;
  }

  public newPreAuthGame(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.newPreAuthGame(req, res);
    };
  }

  public generatePreGameToken(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.generatePreGameToken(req, res);
    };
  }

  public resetPreGameToken(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.resetPreGameToken(req, res);
    };
  }

  public listPreAuthGames(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.listPreAuthGames(req, res);
    };
  }
}