import { Request, Response } from 'express';

import { TurnController } from '@app/controller/turn';
import { TypeOrmRoundRepository } from '@app/repository/typeorm-round';
import { TypeOrmTurnRepository } from '@app/repository/typeorm-turn';
import { PinoLogger } from '@app/util/logger';
import { TurnUsecase } from '@app/usecase/turn-usecase';

export class TurnHandler
{
  private async buildControler(req: Request): Promise<TurnController> {
    const logger = new PinoLogger(req.log);
    const repo = new TypeOrmTurnRepository(logger);
    const roundRepo = new TypeOrmRoundRepository(logger);
    const usecase = new TurnUsecase(repo, roundRepo, logger);
    const controller = new TurnController(usecase);

    await repo.initializeDbEngine();
    await roundRepo.initializeDbEngine();

    return controller;
  }

  public checkTurn(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.checkTurn(req, res);
    };
  }

  public playTurn(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.playTurn(req, res);
    };
  }
}