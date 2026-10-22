import { GameRepository } from '@app/repository/game';
import { UserRepository, users } from '@app/repository/user';
import { Logger } from '@app/util/logger';
import {
  GameErrorCodes,
  InfoGameInput,
  InfoGameResult,
  ListActiveGamesInput,
  ListActiveGamesResult,
  NewGameInput,
  NewGameResult
} from "@usecase/game-interfaces";
import { UsecaseError } from '@usecase/usecase-error';
import { RoundUsecase } from '@app/usecase/round-usecase';

export class GameError extends UsecaseError<GameErrorCodes> {};

export class GameUsecase
{
  constructor(
    private repo: GameRepository,
    private userRepo: UserRepository,
    private roundUsecase: RoundUsecase,
    private logger: Logger,
  ) {}

  public async infoGame(input: InfoGameInput): Promise<InfoGameResult> {
    const { token: { gameId: tokenGameId, userId }, gameId } = input;

    if (tokenGameId && gameId !== tokenGameId) {
      this.logger.error(`GameId in token ${tokenGameId} not match the ${gameId} in request`);
      throw new GameError(GameErrorCodes.FORBIDDEN, 'Link auth only access predefined games!');
    }

    const game = await this.repo.getGameById(gameId);

    if (!game) {
      this.logger.error(`GameId ${gameId} not found`);
      throw new GameError(GameErrorCodes.NOT_FOUND);
    }

    let player1Id = game.player1.id!;
    let player1 = game.player1.username;
    let player1Score = game.player1Score;
    let player2Id = game.player2.id!;
    let player2 = game.player2.username;
    let player2Score = game.player2Score;
    let readonly = false;

    if (userId === game.player2.id) {

      [player1Id, player2Id] = [player2Id, player1Id];
      [player1, player2] = [player2, player1];
      [player1Score, player2Score] = [player2Score, player1Score];

    } else if (userId != game.player1.id && userId != game.player2.id) {
      readonly = true;
    }

    return {
      id: game.id,
      player1Id,
      player1,
      player1Score,
      player2Id,
      player2,
      player2Score,
      readonly,
      startPlay: game.startPlay,
      lastPlay: game.lastPlay,
      lastRoundId: game.rounds?.at(-1)?.id,
      lastRoundSeq: game.rounds?.at(-1)?.seq,
      endPlay: game.endPlay,
      winnerPlayerId: game.winnerPlayer?.id,
    };
  }

  public async newGame(input: NewGameInput): Promise<NewGameResult> {
    const { token: { userId, username }, opponentUsername } = input;

    if (opponentUsername === username) {
      throw new GameError(GameErrorCodes.NEW_GAME_WITH_ITSELF, 'Username cannot reference itself!');
    }

    const opponentUser = await this.userRepo.getUserByUsername(opponentUsername);
    if (!opponentUser) {
      throw new GameError(GameErrorCodes.NOT_FOUND, 'Opponent not found!');
    }

    const game = await this.repo.createGame({
      player1: {
        id: userId,
        username: username,
      } as users,
      player2: opponentUser,
      player1Score: 0,
      player2Score: 0,
    });

    const round = await this.roundUsecase.newRound(game, 1);

    this.logger.info(`New game ${game.id} created.`);

    return {
      id: game.id,
      startRoundId: round.id,
      player1Cards: round.player1Cards,
      trumpCard: round.trumpCard,
    };
  }

  public async listActiveGames(input: ListActiveGamesInput): Promise<ListActiveGamesResult> {
    const { token: { username } } = input;

    const activeGames = await this.repo.listGamesByUsername(username, true);

    const gameFmt: {
      id: number;
      player1Id: number;
      player1: string;
      player1Score: number;
      player2Id: number;
      player2: string;
      player2Score: number;
      startPlay: Date;
      endPlay: Date;
    }[] = [];

    for (const gss of activeGames) {
      gameFmt.push({
        id: gss.id ?? 0,
        player1Id: gss.player1?.id ?? 0,
        player1: gss.player1?.username ?? '',
        player1Score: gss.player1Score ?? 0,
        player2Id: gss.player2?.id ?? 0,
        player2: gss.player2?.username ?? '',
        player2Score: gss.player2Score ?? 0,
        startPlay: gss.startPlay ?? new Date(),
        endPlay: gss.endPlay ?? new Date(),
      });
    }

    return {
      games: gameFmt,
      gamesCount: activeGames.length,
    };
  }
}