import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { GameController } from '@app/controller/game';
import { GameRepository, games } from '@app/repository/game';
import { UserRepository } from '@app/repository/user';
import { RoundRepository, rounds } from '@app/repository/round';
import { ConsoleLogger } from '@app/util/logger';
import { GameUsecase } from '@usecase/game-usecase';
import { RoundUsecase } from '@app/usecase/round-usecase';

afterEach(() => {
  jest.clearAllMocks();
});

describe('#game', () => {
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockGameRepo: jest.Mocked<GameRepository>;
  let mockRoundRepo: jest.Mocked<RoundRepository>;
  let usecaseRound: RoundUsecase;
  let usecase: GameUsecase;
  let controller: GameController;

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

    const logger = new ConsoleLogger();

    usecaseRound = new RoundUsecase(mockRoundRepo, mockGameRepo, logger);

    usecase = new GameUsecase(mockGameRepo, mockUserRepo, usecaseRound, logger);
    controller = new GameController(usecase, logger);
  });

  test('Should return sucessfully', async () => {
    const expectInfo = {
      gameId: 7771,
      userId: 131,
      username: 'anyone',
      gameInfo: {
        player1Id: 13432,
        player1: 'guga',
        player1Score: 0,
        player2Id: 2,
        player2: 'roger',
        player2Score: 6,
        startPlay: new Date(),
        lastPlay: new Date(),
        rounds: [
          {
            id: 67676,
            seq: 8888,
          },
          {
            id: 1,
            seq: 1,
          },
          {
            id: 5564,
            seq: 1212,
          },
        ] as rounds[],
      },
    };
    const req = {
      params: {
        gameId: expectInfo.gameId,
      },
      appTokenPayload: {
        userId: expectInfo.userId,
        username: expectInfo.username,
      },
    } as unknown as Request;
    const res = {
      end: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockGameRepo.getGameById.mockResolvedValue({
      id: expectInfo.gameId,
      player1: {
        id: expectInfo.gameInfo.player1Id,
        username: expectInfo.gameInfo.player1,
      },
      player1Score: expectInfo.gameInfo.player1Score,
      player2: {
        id: expectInfo.gameInfo.player2Id,
        username: expectInfo.gameInfo.player2,
      },
      player2Score: expectInfo.gameInfo.player2Score,
      startPlay: expectInfo.gameInfo.startPlay,
      lastPlay: expectInfo.gameInfo.lastPlay,
      rounds: expectInfo.gameInfo.rounds,
    } as games);

    await controller.infoGame(req, res);

    expect(mockGameRepo.getGameById).toHaveBeenCalledTimes(1);
    expect(mockGameRepo.getGameById).toHaveBeenCalledWith(expectInfo.gameId);
    expect(res.status).toHaveBeenCalledWith(StatusCodes.OK);
    expect(res.json).toHaveBeenCalledWith({
      id: expectInfo.gameId,
      player1Id: expectInfo.gameInfo.player1Id,
      player1: expectInfo.gameInfo.player1,
      player1Score: expectInfo.gameInfo.player1Score,
      player2Id: expectInfo.gameInfo.player2Id,
      player2: expectInfo.gameInfo.player2,
      player2Score: expectInfo.gameInfo.player2Score,
      startPlay: expectInfo.gameInfo.startPlay,
      lastPlay: expectInfo.gameInfo.lastPlay,
      lastRoundId: expectInfo.gameInfo.rounds.at(-1)?.id,
      lastRoundSeq: expectInfo.gameInfo.rounds.at(-1)?.seq,
    });
  });
});
