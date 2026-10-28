import { Request, Response } from 'express';

import { GameController } from '@app/controller/game';
import { TypeOrmGameRepository } from '@app/repository/typeorm-game';
import { TypeOrmUserRepository } from '@app/repository/typeorm-user';
import { PinoLogger } from '@app/util/logger';
import { GameUsecase } from '@usecase/game-usecase';
import { RoundUsecase } from '@app/usecase/round-usecase';
import { TypeOrmRoundRepository } from '@app/repository/typeorm-round';

export class GameHandler
{
  private async buildControler(req: Request): Promise<GameController> {
    const logger = new PinoLogger(req.log);
    const repo = new TypeOrmGameRepository(logger);
    const userRepo = new TypeOrmUserRepository(logger);
    const roundRepo = new TypeOrmRoundRepository(logger);
    const roundUsecase = new RoundUsecase(roundRepo, repo, logger);
    const usecase = new GameUsecase(repo, userRepo, roundUsecase, logger);
    const controller = new GameController(usecase, logger);

    await repo.initializeDbEngine();
    await userRepo.initializeDbEngine();
    await roundRepo.initializeDbEngine();

    return controller;
  }

  public newGame(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.newGame(req, res);
    };
  }

  public infoGame(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.infoGame(req, res);
    };
  }

  public listActiveGames(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.listActiveGames(req, res);
    };
  }
}