import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { reqToInputSchema } from '@app/util';
import { Logger } from '@app/util/logger';
import { TurnError, TurnUsecase } from '@app/usecase/turn-usecase';
import { create, StructError } from 'superstruct';
import { CheckTurnInputSchema, PlayTurnInputSchema, TurnErrorCodes } from '@app/usecase/turn-interfaces';


export class TurnController
{
  constructor(
    private usecase: TurnUsecase,
    private logger: Logger,
  ) {}

  public async checkTurn(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), CheckTurnInputSchema);
      const result = await this.usecase.checkTurn(data);

      res.status(StatusCodes.OK)
          .json(result)
          .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async playTurn(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), PlayTurnInputSchema);
      const result = await this.usecase.playTurn(data);

      res.status(StatusCodes.OK)
          .json(result)
          .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  private mapDomainErrorToStatusCode(code: string): StatusCodes {
    const mapError: Record<string, StatusCodes> = {
      [TurnErrorCodes.BUSINESS]: StatusCodes.CONFLICT,
      [TurnErrorCodes.NOT_FOUND]: StatusCodes.CONFLICT,
      [TurnErrorCodes.NOT_YOUR_TURN]: StatusCodes.CONFLICT,
    };

    return mapError[code] ?? StatusCodes.INTERNAL_SERVER_ERROR;
  }

  private handleErrorToResponse(error: unknown, res: Response): void {
    if (error instanceof TurnError) {
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
