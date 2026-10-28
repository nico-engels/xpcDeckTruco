import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { create, StructError } from 'superstruct';

import { reqToInputSchema } from '@app/util';
import { Logger } from '@app/util/logger';
import { AuthenticationError, AuthenticationUsecase } from '@usecase/authentication-usecase';
import {
  AuthenticationErrorCodes,
  ChangePasswordInputSchema,
  LoginInputSchemaRefine,
  RegisterInputSchema,
} from '@usecase/authentication-interfaces';

export class AuthenticationController
{
  constructor(
    private usecase: AuthenticationUsecase,
    private logger: Logger,
  ) {}

  public async login(req: Request, res: Response): Promise<void> {
    try {
      const data = create({ ...req.body }, LoginInputSchemaRefine);
      const result = await this.usecase.login(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  public async register(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), RegisterInputSchema);
      const result = await this.usecase.register(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
      return;
    }
  }

  public async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const data = create(reqToInputSchema(req), ChangePasswordInputSchema);
      const result = await this.usecase.changePassword(data);

      res.status(StatusCodes.OK)
         .json(result)
         .end();

    } catch (error) {
      this.handleErrorToResponse(error, res);
    }
  }

  private mapDomainErrorToStatusCode(code: string): StatusCodes {
    const mapError: Record<string, StatusCodes> = {
      [AuthenticationErrorCodes.BUSINESS]: StatusCodes.UNPROCESSABLE_ENTITY,
      [AuthenticationErrorCodes.INVALID_INPUT]: StatusCodes.BAD_REQUEST,
      [AuthenticationErrorCodes.NOT_IMPLEMENTED]: StatusCodes.NOT_IMPLEMENTED,
      [AuthenticationErrorCodes.NOT_FOUND]: StatusCodes.NOT_FOUND,
      [AuthenticationErrorCodes.UNAUTHORIZED]: StatusCodes.UNAUTHORIZED,
    };

    return mapError[code] ?? StatusCodes.INTERNAL_SERVER_ERROR;
  }

  private handleErrorToResponse(error: unknown, res: Response): void {
    if (error instanceof AuthenticationError) {

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
