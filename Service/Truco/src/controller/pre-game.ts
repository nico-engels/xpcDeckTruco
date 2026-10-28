import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { create, StructError } from 'superstruct';

import { reqToInputSchema } from '@app/util';
import { Logger } from '@app/util/logger';
import {
  GeneratePreGameTokenInputSchema,
  ListPreAuthGamesInputSchema,
  NewPreAuthGameInputSchema,
  PreGameErrorCodes,
  ResetPreGameTokenInputSchema,
} from '@usecase/pre-game-interfaces';
import { PreGameError, PreGameUsecase } from '@usecase/pre-game-usecase';

export class PreGameController
{
  constructor(
    private usecase: PreGameUsecase,
    private logger: Logger,
  ) {}

  public async newPreAuthGame(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), NewPreAuthGameInputSchema);
      const result = await this.usecase.newPreAuthGame(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async generatePreGameToken(req: Request, res: Response): Promise<void> {
    try {
      const data = create(req.body, GeneratePreGameTokenInputSchema);
      const result = await this.usecase.generatePreGameToken(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async resetPreGameToken(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), ResetPreGameTokenInputSchema);
      const result = await this.usecase.resetPreGameToken(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async listPreAuthGames(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), ListPreAuthGamesInputSchema);
      const result = await this.usecase.listPreAuthGames(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  private mapDomainErrorToStatusCode(code: string): StatusCodes {
    const mapError: Record<string, StatusCodes> = {
      [PreGameErrorCodes.BUSINESS]: StatusCodes.UNPROCESSABLE_ENTITY,
      [PreGameErrorCodes.INVALID_INPUT]: StatusCodes.BAD_REQUEST,
      [PreGameErrorCodes.NOT_FOUND]: StatusCodes.NOT_FOUND,
      [PreGameErrorCodes.UNAUTHORIZED]: StatusCodes.UNAUTHORIZED,
    };

    return mapError[code] ?? StatusCodes.INTERNAL_SERVER_ERROR;
  }

  private handleErrorToResponse(error: unknown, res: Response): void {
    if (error instanceof PreGameError) {

      const status = this.mapDomainErrorToStatusCode(error.code);
      res.status(status).json({ message: error.message }).end();
      return;
    } else if (error instanceof StructError) {
      this.logger.error(`error in validation '${error.message}'`);

      res.status(StatusCodes.BAD_REQUEST).json({ message: 'input validation error' }).end();
      return;
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    throw error;
  }
}
