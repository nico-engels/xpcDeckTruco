import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { create, StructError } from 'superstruct';

import { reqToInputSchema } from '@app/util';
import { Logger } from '@app/util/logger';
import {
  InfoGameInputSchema,
  GameErrorCodes,
  ListActiveGamesInputSchema,
  NewGameInputSchema,
} from '@usecase/game-interfaces';
import { GameError, GameUsecase } from '@usecase/game-usecase';

export class GameController
{
  constructor(
    private usecase: GameUsecase,
    private logger: Logger,
  ) {}

  public async infoGame(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), InfoGameInputSchema);
      const result = await this.usecase.infoGame(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async newGame(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), NewGameInputSchema);
      const result = await this.usecase.newGame(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();
    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async listActiveGames(req: Request, res: Response) {
    try {
      const data = create(reqToInputSchema(req), ListActiveGamesInputSchema);
      const result = await this.usecase.listActiveGames(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();
    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  private mapDomainErrorToStatusCode(code: string): StatusCodes {
    const mapError: Record<string, StatusCodes> = {
      [GameErrorCodes.NEW_GAME_WITH_ITSELF]: StatusCodes.CONFLICT,
      [GameErrorCodes.NOT_FOUND]: StatusCodes.NOT_FOUND,
    };

    return mapError[code] ?? StatusCodes.INTERNAL_SERVER_ERROR;
  }

  private handleErrorToResponse(error: unknown, res: Response): void {
    if (error instanceof GameError) {

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
