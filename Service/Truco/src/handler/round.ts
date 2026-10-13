import { Request, Response } from 'express';

import { RoundController } from '@app/controller/round';
import { TypeOrmGameRepository } from '@app/repository/typeorm-game';
import { TypeOrmRoundRepository } from '@app/repository/typeorm-round';
import { PinoLogger } from '@app/util/logger';
import { RoundUsecase } from '@app/usecase/round-usecase';

export class RoundHandler
{
  private async buildControler(req: Request): Promise<RoundController> {
    const logger = new PinoLogger(req.log);
    const repo = new TypeOrmRoundRepository(logger);
    const gameRepo = new TypeOrmGameRepository(logger);
    const usecase = new RoundUsecase(repo, gameRepo);
    const controller = new RoundController(usecase);

    await repo.initializeDbEngine();
    await gameRepo.initializeDbEngine();

    return controller;
  }

  public allRounds(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.allRounds(req, res);
    };
  }

  public lastRound(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.lastRound(req, res);
    };
  }

  public finishRound(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.finishRound(req, res);
    };
  }
}