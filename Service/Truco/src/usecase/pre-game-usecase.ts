import { AppConfig } from '@app/app-config';

import { PreAuthGameRepository } from '@app/repository/pre-auth-game';
import { GameRepository } from '@app/repository/game';
import { UserRepository } from '@app/repository/user';
import { generateAccessTok, saltRandom } from '@app/util';
import { Logger } from '@app/util/logger';
import {
  GeneratePreGameTokenInput,
  GeneratePreGameTokenResult,
  ListPreAuthGamesInput,
  ListPreAuthGamesResult,
  NewPreAuthGameInput,
  NewPreAuthGameResult,
  PreGameErrorCodes,
  ResetPreGameTokenInput,
  ResetPreGameTokenResult
} from '@usecase/pre-game-interfaces';
import { RoundUsecase } from '@app/usecase/round-usecase';
import { UsecaseError } from '@usecase/usecase-error';

export class PreGameError extends UsecaseError<PreGameErrorCodes> {};

export class PreGameUsecase
{
  constructor(
    private repo: PreAuthGameRepository,
    private userRepo: UserRepository,
    private gameRepo: GameRepository,
    private roundUsecase: RoundUsecase,
    private logger: Logger,
  ) {}

  public async newPreAuthGame(input: NewPreAuthGameInput): Promise<NewPreAuthGameResult> {
    const { token: { username: tokenUsername }, player1username, player2username } = input;

    if (tokenUsername !== 'xt-admin') {
      throw new PreGameError(PreGameErrorCodes.UNAUTHORIZED);
    }

    if (player1username === player2username) {
      this.logger.error(`Game against itself '${player1username}'`);
      throw new PreGameError(PreGameErrorCodes.BUSINESS, 'Username cannot reference itself!');
    }

    const player1 = await this.userRepo.getUserByUsername(player1username);
    const player2 = await this.userRepo.getUserByUsername(player2username);

    if (!player1 || !player2) {
      throw new PreGameError(PreGameErrorCodes.NOT_FOUND, 'Player not found!');
    }

    this.logger.info(`Creating pre auth game of '${player1username}' vs '${player2username}'...`)
    const game = await this.gameRepo.createGame({
      player1: player1,
      player2: player2,
      player1Score: 0,
      player2Score: 0,
    });
    await this.roundUsecase.newRound(game, 1);

    const player1Link = saltRandom().substring(0, 15).replaceAll(/[/+]/g, '');
    const player2Link = saltRandom().substring(0, 15).replaceAll(/[/+]/g, '');

    const newPreGame = await this.repo.createPreAuthGame({
      player1Link,
      player2Link,
      game,
    });

    return {
      message: 'ok',
      gameId: newPreGame.game.id!,
      player1Link: newPreGame.player1Link,
      player2Link: newPreGame.player2Link,
    };
  }

  public async generatePreGameToken(input: GeneratePreGameTokenInput): Promise<GeneratePreGameTokenResult> {
    const { playerLink, deviceId } = input;

    const preGame = await this.repo.getPreGameByLink(playerLink);
    if (!preGame) {
      throw new PreGameError(PreGameErrorCodes.NOT_FOUND, 'Link not found!');
    }

    const player = playerLink === preGame.player1Link ? preGame.game.player1 : preGame.game.player2;
    const deviceIdRegistred =
      (playerLink === preGame.player1Link ? preGame.player1DeviceId : preGame.player2DeviceId) ?? '-';

    if (AppConfig.security.preAuthGameValidateDevice && deviceIdRegistred !== deviceId) {
      this.logger.error(`Invalid device trying to consume link. ` +
        `Device registred ${deviceIdRegistred} device request ${deviceId} ${process.env.PREAUTH_VALIDATE_DEVICE}`);
      throw new PreGameError(PreGameErrorCodes.UNAUTHORIZED);
    }

    if (playerLink === preGame.player1Link) {
      preGame.player1DeviceId = deviceId;
    } else {
      preGame.player2DeviceId = deviceId;
    }

    const jwtToken = generateAccessTok(player.username, player.id!, preGame.game.id!);

    await this.repo.updatePreAuthGame(preGame);

    return {
      message: 'ok',
      playerId: player.id!,
      player: player.username,
      jwtToken,
      gameId: preGame.game.id!,
    };
  }

  public async resetPreGameToken(input: ResetPreGameTokenInput): Promise<ResetPreGameTokenResult> {
    const { token: { username: tokenUsername }, playerLink } = input;

    if (tokenUsername !== 'xt-admin') {
      throw new PreGameError(PreGameErrorCodes.UNAUTHORIZED);
    }

    if (!playerLink) {
      throw new PreGameError(PreGameErrorCodes.NOT_FOUND);
    }

    const preGame = await this.repo.getPreGameByLink(playerLink);

    if (!preGame) {
      throw new PreGameError(PreGameErrorCodes.NOT_FOUND, 'Link not found!');
    }

    let player: string;
    if (playerLink === preGame.player1Link) {
      preGame.player1DeviceId = undefined;
      player = 'p1';
    } else {
      preGame.player2DeviceId = undefined;
      player = 'p2';
    }

    await this.repo.updatePreAuthGame(preGame);

    return {
      message: `ok ${player}`,
    };
  }

  public async listPreAuthGames(input: ListPreAuthGamesInput): Promise<ListPreAuthGamesResult> {
    const { token: { username: tokenUsername }} = input;

    if (tokenUsername !== 'xt-admin') {
      throw new PreGameError(PreGameErrorCodes.UNAUTHORIZED);
    }

    const preAuthGames = await this.repo.listPreAuthGame();

    return {
      message: 'ok',
      preAuthGamesCount: preAuthGames.length,
      preAuthGames: preAuthGames.map((pag) => ({
        id: pag.id!,
        player1: pag.game.player1.username,
        player1Link: pag.player1Link,
        player2: pag.game.player2.username,
        player2Link: pag.player2Link,
        gameId: pag.game.id!,
      })),
    };
  }
}