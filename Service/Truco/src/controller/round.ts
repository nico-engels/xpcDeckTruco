import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { create, StructError } from 'superstruct';

import { reqToInputSchema } from '@app/util';
import { RoundError, RoundUsecase } from '@app/usecase/round-usecase';
import {
  AllRoundsInputSchema,
  FinishRoundInputSchema,
  LastRoundInputSchema,
  RoundErrorCodes
} from '@app/usecase/round-interfaces';

export class RoundController
{
  constructor(
    private usecase: RoundUsecase,
  ) {}

  public async finishRound(req: Request, res: Response) {
    try {
      const data = create(reqToInputSchema(req), FinishRoundInputSchema);
      const result = await this.usecase.finishRound(data);

      res.status(StatusCodes.OK)
          .json(result)
          .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async allRounds(req: Request, res: Response) {
    try {
      const data = create(reqToInputSchema(req), AllRoundsInputSchema);
      const result = await this.usecase.allRounds(data);

      res.status(StatusCodes.OK)
          .json(result)
          .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async lastRound(req: Request, res: Response) {
    try {
      const data = create(reqToInputSchema(req), LastRoundInputSchema);
      const result = await this.usecase.lastRound(data);

      res.status(StatusCodes.OK)
          .json(result)
          .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  private mapDomainErrorToStatusCode(code: string): StatusCodes {
    const mapError: Record<string, StatusCodes> = {
      [RoundErrorCodes.BUSINESS]: StatusCodes.CONFLICT,
      [RoundErrorCodes.FORBIDDEN]: StatusCodes.FORBIDDEN,
      [RoundErrorCodes.NOT_FOUND]: StatusCodes.NOT_FOUND,
    };

    return mapError[code] ?? StatusCodes.INTERNAL_SERVER_ERROR;
  }

  private handleErrorToResponse(error: unknown, res: Response): void {
    if (error instanceof RoundError) {

      const status = this.mapDomainErrorToStatusCode(error.code);
      res.status(status).json({ message: error.message }).end();
      return;
    } else if (error instanceof StructError) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: error.message }).end();
      return;
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).end();
    throw error;
  }

}
