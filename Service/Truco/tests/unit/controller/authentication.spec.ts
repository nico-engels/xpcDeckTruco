import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { AuthenticationController } from '@app/controller/authentication';
import { PreGameController } from '@app/controller/pre-game';
import { GameRepository, games } from '@app/repository/game';
import { PreAuthGameRepository } from '@app/repository/pre-auth-game';
import { RoundRepository } from '@app/repository/round';
import { UserRepository, users } from '@app/repository/user';
import { AuthenticationUsecase } from '@usecase/authentication-usecase';
import { PreGameUsecase } from '@usecase/pre-game-usecase';
import { RoundUsecase } from '@app/usecase/round-usecase';
import * as utilModule from '@app/util';
import { ConsoleLogger, Logger } from '@app/util/logger';

const mockAuthentication = jest.spyOn(utilModule, 'authentication');
const mockGenerateAccessTok = jest.spyOn(utilModule, 'generateAccessTok');
const mockSaltRandom = jest.spyOn(utilModule, 'saltRandom');

describe('#authentication', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockPreAuthGameRepo: jest.Mocked<PreAuthGameRepository>;
  let mockGameRepo: jest.Mocked<GameRepository>;
  let mockRoundRepo: jest.Mocked<RoundRepository>;
  let mockLogger: jest.Mocked<Logger>;
  let usecase: AuthenticationUsecase;
  let controller: AuthenticationController;
  let usecasePreGame: PreGameUsecase;
  let usecaseRound: RoundUsecase;
  let controllerPreGame: PreGameController;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUserRepo = {
      createSpecialUsers: jest.fn(),
      createUser: jest.fn(),
      getUserByEmail: jest.fn(),
      getUserByRpAddress: jest.fn(),
      getUserByUsername: jest.fn(),
      updateUser: jest.fn(),
      initializeDbEngine: jest.fn(),
    };

    mockPreAuthGameRepo = {
      createPreAuthGame: jest.fn(),
      getPreGameByLink: jest.fn(),
      listPreAuthGame: jest.fn(),
      updatePreAuthGame: jest.fn(),
      initializeDbEngine: jest.fn(),
    };

    mockGameRepo = {
      getGameById: jest.fn(),
      createGame: jest.fn(),
      updateGame: jest.fn(),
      listGamesByUsername: jest.fn(),
      initializeDbEngine: jest.fn(),
    };

    mockRoundRepo = {
      createRound: jest.fn(),
      getAllRoundsByGame: jest.fn(),
      getLastRoundByGame: jest.fn(),
      getRoundById: jest.fn(),
      updateRound: jest.fn(),
      initializeDbEngine: jest.fn(),
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    usecase = new AuthenticationUsecase(mockUserRepo, mockLogger);
    controller = new AuthenticationController(usecase);

    const logger = new ConsoleLogger();

    usecaseRound = new RoundUsecase(mockRoundRepo, mockGameRepo);
    usecasePreGame = new PreGameUsecase(mockPreAuthGameRepo, mockUserRepo, mockGameRepo, usecaseRound, logger);
    controllerPreGame = new PreGameController(usecasePreGame);
  });

  describe('login', () => {
    test('Should login sucessfully with username', async () => {
      const expectInfo = {
        id: 775,
        username: 'testUser',
        passwd: 'masterSec123',
        hashPasswd: '#pass',
        salt: 'salty21',
        jwt: 'jwtTok&8',
      };

      const req = {
        body: {
          username: expectInfo.username,
          password: expectInfo.passwd,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        sendStatus: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        hashedPasswd: expectInfo.hashPasswd,
        salt: expectInfo.salt,
      });
      mockAuthentication.mockReturnValue(expectInfo.hashPasswd);
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

      await controller.login(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockAuthentication).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expectInfo.id,
        jwtToken: expectInfo.jwt,
      });
    });

    test('Should login sucessfully with e-mail', async () => {
      const expectInfo = {
        id: 775,
        username: 'testUser',
        email: 'testUser@provider.io',
        passwd: 'masterSec123',
        hashPasswd: '#123',
        salt: 'salty21',
        jwt: 'jwtTok&8',
      };

      const req = {
        body: {
          email: expectInfo.email,
          password: expectInfo.passwd,
        },
      } as unknown as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        sendStatus: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByEmail.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        hashedPasswd: expectInfo.hashPasswd,
        salt: expectInfo.salt,
      });

      mockAuthentication.mockReturnValue(expectInfo.hashPasswd);
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

      await controller.login(req, res);

      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledWith(expectInfo.email);
      expect(mockAuthentication).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expectInfo.id,
        jwtToken: expectInfo.jwt,
      });
    });

    test('Should not login without POST parameters', async () => {
      const req = {} as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not login with e-mail and username must be one or another', async () => {
      const expectInfo = {
        username: 'testUser',
        email: 'testUseree@provider.io',
      };
      const req = {
        body: {
          username: expectInfo.username,
          email: expectInfo.email,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not login with wrong password', async () => {
      const expectInfo = {
        username: 'testUser',
        correctPasswd: 'masterSec123',
        wrongPasswd: 'masterSec1234',
        id: 7755,
        salt: 'ssalty21',
      };
      const req = {
        body: {
          username: expectInfo.username,
          password: expectInfo.wrongPasswd,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;
      const userDb = {
        username: expectInfo.username,
        id: expectInfo.id,
        passwd: expectInfo.correctPasswd,
        salt: expectInfo.salt,
      } as users;

      mockUserRepo.getUserByEmail.mockResolvedValue(userDb);
      mockAuthentication.mockReturnValue(expectInfo.wrongPasswd);

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    test('Should not login with innexistent user', async () => {
      const expectInfo = {
        innexistentUsername: 'testUser222',
        innexistentPassword: 'jkjkjka23',
      };
      const req = {
        body: {
          username: expectInfo.innexistentUsername,
          password: expectInfo.innexistentPassword,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    test('Should not login xrp-address (NOT_IMPLEMENTED)', async () => {
      const expectInfo = {
        rpAddress: 'r11223456123',
        password: '123jnnm',
      };
      const req = {
        body: {
          rpAddress: expectInfo.rpAddress,
          password: expectInfo.password,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.login(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_IMPLEMENTED);
    });
  });

  describe('register', () => {
    test('Should create user sucessfully', async () => {
      const expectInfo = {
        id: 554,
        userId: 787,
        username: 'testt3',
        email: 'tttt@tes.io',
        passwd: '12345tty',
        jwt: 'jwtTok333',
        salt: 'salty212',
        usernameCreator: 'xpcUsrCreator',
      };
      const req = {
        body: {
          username: expectInfo.username,
          email: expectInfo.email,
          password: expectInfo.passwd,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
      mockSaltRandom.mockReturnValue(expectInfo.salt);
      mockAuthentication.mockReturnValue(expectInfo.passwd);
      mockUserRepo.createUser.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        salt: expectInfo.salt,
      });
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

      await controller.register(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledWith(expectInfo.email);
      expect(mockSaltRandom).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
      expect(mockUserRepo.createUser).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.createUser).toHaveBeenCalledWith({
        username: expectInfo.username,
        email: expectInfo.email,
        passwd: expectInfo.passwd,
        salt: expectInfo.salt,
      });
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expectInfo.id,
        jwtToken: expectInfo.jwt,
        message: 'ok',
      });
    });

    test('Should create user by e-mail sucessfully', async () => {
      const expectInfo = {
        id: 5541,
        userId: 787,
        username: 'tttta',
        email: 'tttta@tes.io',
        passwd: '1asaa45tty',
        jwt: 'jwtsToks333',
        salt: 'sal33ty212',
        usernameCreator: 'xpcUsrCreator',
      };
      const req = {
        body: {
          email: expectInfo.email,
          password: expectInfo.passwd,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);
      mockUserRepo.getUserByEmail.mockResolvedValue(null);
      mockSaltRandom.mockReturnValue(expectInfo.salt);
      mockAuthentication.mockReturnValue(expectInfo.passwd);
      mockUserRepo.createUser.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        salt: expectInfo.salt,
      });
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

      await controller.register(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledWith(expectInfo.email);
      expect(mockSaltRandom).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
      expect(mockUserRepo.createUser).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.createUser).toHaveBeenCalledWith({
        username: expectInfo.username,
        email: expectInfo.email,
        passwd: expectInfo.passwd,
        salt: expectInfo.salt,
      });
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expectInfo.id,
        jwtToken: expectInfo.jwt,
        message: 'ok',
      });
    });

    test('Should create user by xrp address sucessfully', async () => {
      const expectInfo = {
        id: 5,
        userId: 787,
        username: 'r233344dsdaccc',
        rpAddress: 'r233344dsdaccc',
        passwd: 'ahsg99986ggg',
        jwt: 'jwtsToks333wsaaa',
        salt: 'Sal33ty212',
        usernameCreator: 'xpcUsrCreator',
      };
      const req = {
        body: {
          rpAddress: expectInfo.rpAddress,
          password: expectInfo.passwd,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);
      mockUserRepo.getUserByRpAddress.mockResolvedValue(null);
      mockSaltRandom.mockReturnValue(expectInfo.salt);
      mockAuthentication.mockReturnValue(expectInfo.passwd);
      mockUserRepo.createUser.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        salt: expectInfo.salt,
      });
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwt);

      await controller.register(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockUserRepo.getUserByRpAddress).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByRpAddress).toHaveBeenCalledWith(expectInfo.rpAddress);
      expect(mockSaltRandom).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.passwd);
      expect(mockUserRepo.createUser).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.createUser).toHaveBeenCalledWith({
        username: expectInfo.username,
        rpAddress: expectInfo.rpAddress,
        passwd: expectInfo.passwd,
        salt: expectInfo.salt,
      });
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.username, expectInfo.id);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expectInfo.id,
        jwtToken: expectInfo.jwt,
        message: 'ok',
      });
    });

    test('Should not create user without parameters', async () => {
      const req = {} as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not create user without parameters with creator', async () => {
      const req = {
        appTokenPayload: {
          userId: 1,
          username: 'xpcUsrCreator',
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not create user without parameters with wrong creator', async () => {
      const req = {
        appTokenPayload: {
          userId: 0,
          username: 'xpcUsrCreatossr',
        },
        body: {
          password: 'aaa',
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    test('Should not duplicate user', async () => {
      const expectInfo = {
        id: 510,
        userId: 787,
        username: 'oi',
        email: 'oi@1234.xyz',
        usernameCreator: 'xpcUsrCreator',
        password: 'oioioi123',
        salt: 'salzin123',
      };
      const req = {
        body: {
          email: expectInfo.email,
          password: expectInfo.password,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        salt: expectInfo.salt,
      });

      await controller.register(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    test('Should not create user with duplicated xrp address', async () => {
      const expectInfo = {
        id: 2,
        userId: 787,
        rpAddress: 'r233344dsdaccc',
        usernameCreator: 'xpcUsrCreator',
        password: 'oioioi123',
        salt: 'salsssl123',
        usernameOther: 'xptoAbc',
      };
      const req = {
        body: {
          rpAddress: expectInfo.rpAddress,
          password: expectInfo.password,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);
      mockUserRepo.getUserByRpAddress.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.usernameOther,
        salt: expectInfo.salt,
      });

      await controller.register(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.rpAddress);
      expect(mockUserRepo.getUserByRpAddress).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByRpAddress).toHaveBeenCalledWith(expectInfo.rpAddress);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    test('Should not create user with duplicated e-mail', async () => {
      const expectInfo = {
        id: 2,
        userId: 787,
        username: 'pele',
        email: 'pele@santos.com.br',
        password: 'oioioi123',
        salt: 'ss112',
        usernameCreator: 'xpcUsrCreator',
        usernameOther: 'xxtSenha',
      };
      const req = {
        body: {
          email: expectInfo.email,
          password: expectInfo.password,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);
      mockUserRepo.getUserByEmail.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.usernameOther,
        salt: expectInfo.salt,
      });

      await controller.register(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByEmail).toHaveBeenCalledWith(expectInfo.email);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });

    test('Should not create user without password', async () => {
      const expectInfo = {
        id: 2,
        userId: 787,
        username: 'pele',
        email: 'pele@santos.com.br',
        usernameCreator: 'xpcUsrCreator',
      };
      const req = {
        body: {
          email: expectInfo.email,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.usernameCreator,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);
      mockUserRepo.getUserByEmail.mockResolvedValue(null);

      await controller.register(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });
  });

  describe('change password', () => {
    test('Should change password sucessfully', async () => {
      const expectInfo = {
        id: 2,
        userId: 787,
        username: 'pele',
        oldPasswd: 'peixe123',
        newPasswd: 'neymar123BiMundial',
        salt: '123dry',
      };

      const req = {
        body: {
          oldPassword: expectInfo.oldPasswd,
          newPassword: expectInfo.newPasswd,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        passwd: expectInfo.oldPasswd,
        salt: expectInfo.salt,
      });
      mockAuthentication.mockImplementation((salt: string, password: string) => {
        if (password === expectInfo.oldPasswd) return expectInfo.oldPasswd;
        else return expectInfo.newPasswd;
      });
      mockSaltRandom.mockReturnValue(expectInfo.salt);
      mockUserRepo.updateUser.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        salt: expectInfo.salt,
      });

      await controller.changePassword(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockAuthentication).toHaveBeenCalledTimes(2);
      expect(mockUserRepo.updateUser).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.updateUser).toHaveBeenCalledWith({
        id: expectInfo.id,
        username: expectInfo.username,
        passwd: expectInfo.newPasswd,
        salt: expectInfo.salt,
      });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        userId: expectInfo.id,
        message: 'ok',
      });
    });

    test('Should not change password if not find the user', async () => {
      const expectInfo = {
        id: 2,
        userId: 787,
        username: 'pele',
        oldPasswd: 'peixe123',
        newPasswd: '1223',
      };

      const req = {
        body: {
          oldPassword: expectInfo.oldPasswd,
          newPassword: expectInfo.newPasswd,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue(null);

      await controller.changePassword(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    });

    test('Should not change password if not provided the parameters', async () => {
      const expectInfo = {
        id: 22,
        userId: 787,
        username: 'pele',
        salt: 'santos',
      };

      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        salt: expectInfo.salt,
      });

      await controller.changePassword(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not change password if new password is not valid', async () => {
      const expectInfo = {
        id: 12,
        userId: 787,
        username: 'neymar',
        oldPasswd: 'peixe123',
        newPasswd: '1223',
        salt: '123dry',
      };

      const req = {
        body: {
          oldPassword: expectInfo.oldPasswd,
          newPassword: expectInfo.newPasswd,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockResolvedValue({
        id: expectInfo.id,
        username: expectInfo.username,
        passwd: expectInfo.oldPasswd,
        salt: expectInfo.salt,
      });
      mockAuthentication.mockReturnValue(expectInfo.oldPasswd);
      mockSaltRandom.mockReturnValue(expectInfo.salt);

      await controller.changePassword(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(1);
      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledWith(expectInfo.username);
      expect(mockAuthentication).toHaveBeenCalledTimes(1);
      expect(mockAuthentication).toHaveBeenCalledWith(expectInfo.salt, expectInfo.oldPasswd);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Create pre-auth game', () => {
    test('Should create pre-auth game successfully', async () => {
      const expectInfo = {
        player1: {
          username: 'pyr1',
          id: 22,
          salt: 'ss112',
        },
        player2: {
          username: 'ply2',
          id: 25,
          salt: 'ss321',
        },
        jwtUserId: 787,
        jwtUsername: 'xt-admin',
      };
      const expectNewGameDb = {
        id: 24,
        player1: expectInfo.player1,
        player2: expectInfo.player2,
      } as games;
      const expectNewPreGameDb = {
        game: {
          id: 11,
        } as games,
        player1Link: 'jkjksjdm',
        player2Link: 'jkDDfjdm',
      };

      const req = {
        body: {
          player1username: expectInfo.player1.username,
          player2username: expectInfo.player2.username,
        },
        appTokenPayload: {
          userId: expectInfo.jwtUserId,
          username: expectInfo.jwtUsername,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockUserRepo.getUserByUsername.mockImplementation((username: string) => {
        if (username === expectInfo.player1.username) return Promise.resolve(expectInfo.player1);
        else return Promise.resolve(expectInfo.player2);
      });
      mockGameRepo.createGame.mockResolvedValue(expectNewGameDb);
      mockPreAuthGameRepo.createPreAuthGame.mockResolvedValue(expectNewPreGameDb);
      mockSaltRandom.mockReturnValueOnce(expectNewPreGameDb.player1Link);
      mockSaltRandom.mockReturnValueOnce(expectNewPreGameDb.player2Link);

      await controllerPreGame.newPreAuthGame(req, res);

      expect(mockUserRepo.getUserByUsername).toHaveBeenCalledTimes(2);
      expect(mockGameRepo.createGame).toHaveBeenCalledTimes(1);
      expect(mockGameRepo.createGame).toHaveBeenCalledWith({
        player1: expectInfo.player1,
        player2: expectInfo.player2,
        player1Score: 0,
        player2Score: 0,
      });
      expect(mockSaltRandom).toHaveBeenCalledTimes(2);
      expect(mockRoundRepo.createRound).toHaveBeenCalledTimes(1);
      expect(mockRoundRepo.createRound).toHaveBeenCalledWith({
        finished: false,
        game: {
          id: expectNewGameDb.id,
          player1: expectNewGameDb.player1,
          player2: expectNewGameDb.player2,
        } as games,
        score: 1,
        seq: 1,
        turns: [],
        player1Cards: expect.any(String),
        player2Cards: expect.any(String),
        trumpCard: expect.any(String),
        starterPlayer: expect.any(Object),
      });
      expect(mockPreAuthGameRepo.createPreAuthGame).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.createPreAuthGame).toHaveBeenCalledWith({
        player1Link: expectNewPreGameDb.player1Link,
        player2Link: expectNewPreGameDb.player2Link,
        game: expectNewGameDb,
      });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ok',
        gameId: expectNewPreGameDb.game.id,
        player1Link: expectNewPreGameDb.player1Link,
        player2Link: expectNewPreGameDb.player2Link,
      });
    });

    test('Only xt-admin should create a new pre-auth game', async () => {
      const expectInfo = {
        jwtUserId: 787,
        jwtUsername: 'super-admin',
        player1username: 'abc',
        player2username: 'def',
      };

      const req = {
        appTokenPayload: {
          userId: expectInfo.jwtUserId,
          username: expectInfo.jwtUsername,
        },
        body: {
          player1username: expectInfo.player1username,
          player2username: expectInfo.player2username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.newPreAuthGame(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    test('Should not create without parameters', async () => {
      const expectInfo = {
        jwtUserId: 787,
        jwtUsername: 'xt-admin',
      };

      const req = {
        appTokenPayload: {
          userId: expectInfo.jwtUserId,
          username: expectInfo.jwtUsername,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.newPreAuthGame(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not create a game against himself', async () => {
      const expectInfo = {
        player1: {
          id: 15,
          username: 'blast',
        },
        player2: {
          id: 15,
          username: 'blast',
        },
        jwtUserId: 787,
        jwtUsername: 'xt-admin',
      };

      const req = {
        body: {
          player1username: expectInfo.player1.username,
          player2username: expectInfo.player2.username,
        },
        appTokenPayload: {
          userId: expectInfo.jwtUserId,
          username: expectInfo.jwtUsername,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.newPreAuthGame(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNPROCESSABLE_ENTITY);
    });
  });

  describe('Login with the pre-auth link', () => {
    test('Should generate the jwt token by the link ply1', async () => {
      const expectInfo = {
        player1Link: 'jksdj34312sd',
        deviceId: 'device-123',
        player2Link: 'petecaGy777',
        player1: {
          id: 33,
          username: 'playerk1',
        },
        player2: {
          id: 35,
          username: 'playerk2',
        },
        jwtTok: 'xXxjwtTok&8',
        gameId: 889,
        userId: 778,
        username: 'caneta'
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
        body: {
          playerLink: expectInfo.player1Link,
          deviceId: expectInfo.deviceId,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        game: {
          id: expectInfo.gameId,
          player1: {
            id: expectInfo.player1.id,
            username: expectInfo.player1.username,
          } as users,
        } as games,
      });
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwtTok);
      mockPreAuthGameRepo.updatePreAuthGame.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        game: {
          id: expectInfo.gameId,
          player1: {
            id: expectInfo.player1.id,
            username: expectInfo.player1.username,
          } as users,
        } as games,
      });

      await controllerPreGame.generatePreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player1Link);
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.player1.username, expectInfo.player1.id, expectInfo.gameId);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledWith({
        game: {
          id: expectInfo.gameId,
          player1: {
            id: expectInfo.player1.id,
            username: expectInfo.player1.username,
          } as users,
        } as games,
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        player1DeviceId: expectInfo.deviceId,
      });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ok',
        playerId: expectInfo.player1.id,
        player: expectInfo.player1.username,
        jwtToken: expectInfo.jwtTok,
        gameId: expectInfo.gameId,
      });
    });

    test('Should generate the jwt token by the link ply2', async () => {
      const expectInfo = {
        player1Link: 'jksdj34312sd',
        deviceId: 'device-123',
        player2Link: 'petecaGy777',
        player: {
          id: 33,
          username: 'playerk1',
        },
        jwtTok: 'xXxjwtTok&8',
        gameId: 889,
        userId: 778,
        username: 'caneta',
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
        body: {
          playerLink: expectInfo.player2Link,
          deviceId: expectInfo.deviceId,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        game: {
          id: expectInfo.gameId,
          player2: {
            id: expectInfo.player.id,
            username: expectInfo.player.username,
          } as users,
        } as games,
      });
      mockGenerateAccessTok.mockReturnValue(expectInfo.jwtTok);
      mockPreAuthGameRepo.updatePreAuthGame.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        game: {
          id: expectInfo.gameId,
          player2: {
            id: expectInfo.player.id,
            username: expectInfo.player.username,
          } as users,
        } as games,
      });

      await controllerPreGame.generatePreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player2Link);
      expect(mockGenerateAccessTok).toHaveBeenCalledTimes(1);
      expect(mockGenerateAccessTok).toHaveBeenCalledWith(expectInfo.player.username, expectInfo.player.id, expectInfo.gameId);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledWith({
        game: {
          id: expectInfo.gameId,
          player2: {
            id: expectInfo.player.id,
            username: expectInfo.player.username,
          } as users,
        } as games,
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        player2DeviceId: expectInfo.deviceId,
      });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ok',
        playerId: expectInfo.player.id,
        player: expectInfo.player.username,
        jwtToken: expectInfo.jwtTok,
        gameId: expectInfo.gameId,
      });
    });

    test('Should not generate without parameters', async () => {
      const req = {} as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.generatePreGameToken(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not generate with invalid link', async () => {
      const expectInfo = {
        player1Link: 'jksdj34312sd',
        deviceId: 'device-123',
        userId: 778,
        username: 'caneta',
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
        body: {
          playerLink: expectInfo.player1Link,
          deviceId: expectInfo.deviceId,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue(null);

      await controllerPreGame.generatePreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player1Link);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
    });

    test('Should not generate with invalid deviceId', async () => {
      const expectInfo = {
        player1Link: 'jksdj34312sd',
        player2Link: 'asdsjksdj34312sd',
        deviceIdPlayer2: 'sice-123',
        deviceIdPlayer2Correct: 'slice-123',
        player1: {
          id: 387,
          username: 'playeaark1',
        },
        player2: {
          id: 31187,
          username: 'playk2',
        },
        userId: 778,
        username: 'caneta',
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
        body: {
          playerLink: expectInfo.player2Link,
          deviceId: expectInfo.deviceIdPlayer2,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        player2DeviceId: expectInfo.deviceIdPlayer2Correct,
        game: {
          player1: expectInfo.player1,
          player2: expectInfo.player2,
        } as games,
      });

      await controllerPreGame.generatePreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player2Link);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('Reset pre-auth game device', () => {
    test('Should reset the device id player1', async () => {
      const expectInfo = {
        player1Link: 'aaavvvccc',
        deviceId: 'device-12ss3',
        player2Link: 'aaavvvccc2',
        userId: 787,
        username: 'xt-admin',
      };
      const req = {
        body: {
          playerLink: expectInfo.player1Link,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player1DeviceId: expectInfo.deviceId,
        player2Link: expectInfo.player2Link,
        game: {} as games,
      });
      mockPreAuthGameRepo.updatePreAuthGame.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        game: {} as games,
      });

      await controllerPreGame.resetPreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player1Link);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledWith({
        player1Link: expectInfo.player1Link,
        player1DeviceId: undefined,
        player2Link: expectInfo.player2Link,
        game: {} as games,
      });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ok p1',
      });
    });

    test('Should reset the device id player 2', async () => {
      const expectInfo = {
        player1Link: 'bnbnb',
        player2Link: 'aaavvvccc',
        deviceId: 'device-12ss3',
        userId: 787,
        username: 'xt-admin',
      };
      const req = {
        body: {
          playerLink: expectInfo.player2Link,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        player2DeviceId: expectInfo.deviceId,
        game: {} as games,
      });
      mockPreAuthGameRepo.updatePreAuthGame.mockResolvedValue({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        player2DeviceId: expectInfo.deviceId,
        game: {} as games,
      });

      await controllerPreGame.resetPreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player2Link);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.updatePreAuthGame).toHaveBeenCalledWith({
        player1Link: expectInfo.player1Link,
        player2Link: expectInfo.player2Link,
        player2DeviceId: undefined,
        game: {} as games,
      });
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ok p2',
      });
    });

    test('Should not reset if user is not the admin', async () => {
      const expectInfo = {
        userId: 787,
        username: 'admin',
        playerLink: ' rererer',
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
        body: {
          playerLink: expectInfo.playerLink,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.resetPreGameToken(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });

    test('Should not reset without parameters', async () => {
      const expectInfo = {
        userId: 787,
        username: 'xt-admin',
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.resetPreGameToken(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    test('Should not reset with inexistent link', async () => {
      const expectInfo = {
        player1Link: 'aaavvvccc',
        userId: 787,
        username: 'xt-admin',
      };
      const req = {
        body: {
          playerLink: expectInfo.player1Link,
        },
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.getPreGameByLink.mockResolvedValue(null);

      await controllerPreGame.resetPreGameToken(req, res);

      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledTimes(1);
      expect(mockPreAuthGameRepo.getPreGameByLink).toHaveBeenCalledWith(expectInfo.player1Link);
      expect(res.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Link not found!',
      });
    });
  });

  describe('Listing pre-auth links', () => {
    test('Should list all pre-auth games for admin', async () => {
      const expectInfo = {
        userId: 787,
        username: 'xt-admin',
        preAuthGames: [
          {
            id: 1,
            player1: 'tatu',
            player1Link: 'link1',
            player2: 'bolinha',
            player2Link: 'link2',
            gameId: 1,
          },
          {
            id: 2,
            player1: 'jao',
            player1Link: 'link3',
            player2: 'tatu',
            player2Link: 'link4',
            gameId: 2,
          },
        ],
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      mockPreAuthGameRepo.listPreAuthGame.mockResolvedValue(
        expectInfo.preAuthGames.map(game => ({
          id: game.id,
          player1Link: game.player1Link,
          player2Link: game.player2Link,
          game: {
            id: game.id,
            player1: {
              username: game.player1,
            },
            player2: {
              username: game.player2,
            },
          } as games,
        }))
      );

      await controllerPreGame.listPreAuthGames(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
      expect(res.json).toHaveBeenCalledWith({
        message: 'ok',
        preAuthGamesCount: expectInfo.preAuthGames.length,
        preAuthGames: expectInfo.preAuthGames,
      });
    });

    test('Should not list if user is not the admin', async () => {
      const expectInfo = {
        userId: 787,
        username: 'admin',
      };
      const req = {
        appTokenPayload: {
          userId: expectInfo.userId,
          username: expectInfo.username,
        },
      } as Request;
      const res = {
        end: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
      } as unknown as Response;

      await controllerPreGame.listPreAuthGames(req, res);

      expect(res.status).toHaveBeenCalledWith(StatusCodes.UNAUTHORIZED);
    });
  });
});
