import { Request, Response } from 'express';

import { AuthenticationController } from '@app/controller/authentication';
import { AuthenticationUsecase } from '@usecase/authentication-usecase';
import { TypeOrmUserRepository } from '@app/repository/typeorm-user';
import { PinoLogger } from '@app/util/logger';

export class AuthenticationHandler
{
  private async buildControler(req: Request): Promise<AuthenticationController> {
    const logger = new PinoLogger(req.log);
    const repo = new TypeOrmUserRepository(logger);
    const usecase = new AuthenticationUsecase(repo, logger);
    const controller = new AuthenticationController(usecase, logger);

    await repo.initializeDbEngine();

    return controller;
  }

  public register(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.register(req, res);
    };
  }

  public login(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.login(req, res);
    };
  }

  public changePassword(): (req: Request, res: Response) => Promise<void> {
    return async (req: Request, res: Response): Promise<void> => {
      const controller = await this.buildControler(req);

      await controller.changePassword(req, res);
    };
  }
}