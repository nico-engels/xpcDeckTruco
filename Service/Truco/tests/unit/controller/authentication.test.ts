import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AuthenticationController } from "@app/controller/authentication";
import { AuthenticationUsecase } from "@app/usecase/authentication-usecase";
import { Logger } from "@app/util/logger";

describe('#unit controller // authentication', () => {
  let mockAuthenticationUsecase: jest.Mocked<AuthenticationUsecase>;
  let mockLogger: jest.Mocked<Logger>;
  let res: jest.Mocked<Response>;

  let controller: AuthenticationController;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticationUsecase = {
      login: jest.fn(),
      changePassword: jest.fn(),
      register: jest.fn(),
    } as unknown as jest.Mocked<AuthenticationUsecase>;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    controller = new AuthenticationController(mockAuthenticationUsecase, mockLogger);

    res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;
  });

  describe('login', () => {
    it('Should validate login input sucessfully with username', async () => {
      const expected = {
        userId: 775,
        username: 'testUser',
        passwd: 'masterSec123',
        jwt: 'jwtTok&8',
      };

      const req = {
        body: {
          username: expected.username,
          password: expected.passwd,
        },
      } as Request;

      mockAuthenticationUsecase.login.mockResolvedValue({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('Should validate login input sucessfully with e-mail', async () => {
      const expected = {
        userId: 2,
        email: 'testUser1',
        passwd: 'mAsterSec123',
        jwt: 'jwtTok.sass.123',
      };

      const req = {
        body: {
          email: expected.email,
          password: expected.passwd,
        },
      } as Request;

      mockAuthenticationUsecase.login.mockResolvedValue({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('Should validate login input sucessfully with XRP address', async () => {
      const expected = {
        userId: 10,
        rpAddress: 'r123',
        passwd: 'mAsterSeC123',
        jwt: 'jwtTok.sBss.123',
      };

      const req = {
        body: {
          rpAddress: expected.rpAddress,
          password: expected.passwd,
        },
      } as Request;

      mockAuthenticationUsecase.login.mockResolvedValue({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('Should return invalid login input with more than one method', async () => {
      const expected = {
        userId: 33,
        username: 'testUser',
        rpAddress: 'r123',
        passwd: 'mAsterSeC123',
        jwt: 'jwtTok.sBss.123',
      };

      const req = {
        body: {
          username: expected.username,
          rpAddress: expected.rpAddress,
          password: expected.passwd,
        },
      } as Request;

      mockAuthenticationUsecase.login.mockResolvedValue({
        userId: expected.userId,
        jwtToken: expected.jwt,
      });

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        message: 'input validation error',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(`error in validation 'Only one method should be defined'`);
    });
  });
});