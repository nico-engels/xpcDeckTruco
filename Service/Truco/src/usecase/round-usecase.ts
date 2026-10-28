import { GameRepository, games } from '@app/repository/game';
import { RoundRepository, rounds } from '@app/repository/round';
import { users } from '@app/repository/user';
import {
  RoundErrorCodes,
  FinishRoundInput,
  FinishRoundInputResult,
  InfoRoundsLogic,
  AllRoundsInput,
  AllRoundsResult,
  LastRoundInput,
  LastRoundResult
} from "@usecase/round-interfaces";
import { chunkSubstr } from '@app/util';
import { Logger } from '@app/util/logger';
import { GameError } from '@usecase/game-usecase';
import { GameErrorCodes } from '@usecase/game-interfaces';
import { UsecaseError } from '@usecase/usecase-error';

export class RoundError extends UsecaseError<RoundErrorCodes> {};

enum turnWin {
  draw,
  player1,
  player2,
};

export class RoundUsecase
{
  constructor(
    private repo: RoundRepository,
    private gameRepo: GameRepository,
    private logger: Logger,
  ) {}

  private generateTrucoDeckCards(count: number) {
    /*      Truco Paulista 40 cartas
            4  5  6  7  Q  J  K  A  2  3
        ♦   0  1  2  3  4  5  6  7  8  9
        ♠  10 11 12 13 14 15 16 17 18 19
        ♥  20 21 22 23 24 25 26 27 28 29
        ♣  30 31 32 33 34 35 36 37 38 39
    */
    const cardsNumbers = new Set<number>();
    while (cardsNumbers.size < count) cardsNumbers.add(Math.floor(Math.random() * 40));

    const ranks: string[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    const suits: string[] = ['♦', '♠', '♥', '♣'];

    return Array.from(cardsNumbers)
      .map(value => (ranks[value % 10] + suits[Math.floor(value / 10)]));
  }

  private getActions() {
    return ['Gu', 'Ys', 'No', 'Tr', 'Sx', 'Nn', 'Tw'];
  }

  private getActionsElevations() {
    return [
      {
        elevation: 'Tr',
        score: 3,
      },
      {
        elevation: 'Sx',
        score: 6,
      },
      {
        elevation: 'Nn',
        score: 9,
      },
      {
        elevation: 'Tw',
        score: 12,
      },
    ];
  }

  private turnWinner(player1Card: string, player2Card: string, trumpCard: string): turnWin {
    /*  Truco Paulista 40 cartas - Codificação
            4  5  6  7  Q  J  K  A  2  3
        ♦   0  1  2  3  4  5  6  7  8  9
        ♠  10 11 12 13 14 15 16 17 18 19
        ♥  20 21 22 23 24 25 26 27 28 29
        ♣  30 31 32 33 34 35 36 37 38 39
    */
    const ranks: string[] = ['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3'];
    const suits: string[] = ['♦', '♠', '♥', '♣'];

    const player1CardNumber = ranks.indexOf(player1Card[0]) + suits.indexOf(player1Card[1]) * 10;
    const player2CardNumber = ranks.indexOf(player2Card[0]) + suits.indexOf(player2Card[1]) * 10;
    const trumpCardNumber = ranks.indexOf(trumpCard[0]) + suits.indexOf(trumpCard[1]) * 10;

    if (   (trumpCardNumber + 1) % 10 === player1CardNumber % 10
        && (trumpCardNumber + 1) % 10 === player2CardNumber % 10) {
      if (Math.floor(player1CardNumber / 10) > Math.floor(player2CardNumber / 10)) {
        return turnWin.player1;
      } else {
        return turnWin.player2;
      }
    } else if ((trumpCardNumber + 1) % 10 === player1CardNumber % 10) {
      return turnWin.player1;
    } else if ((trumpCardNumber + 1) % 10 === player2CardNumber % 10) {
      return turnWin.player2;
    } else if (player1CardNumber % 10 > player2CardNumber % 10) {
      return turnWin.player1;
    } else if (player2CardNumber % 10 > player1CardNumber % 10) {
      return turnWin.player2;
    }

    return turnWin.draw;
  }

  public async newRound(game: games, seq: number, nextStarterPlayer?: users): Promise<rounds> {
    const cards: string[] = this.generateTrucoDeckCards(7);

    const player1Cards = cards[0] + cards[1] + cards[2];
    const player2Cards = cards[3] + cards[4] + cards[5];
    const trumpCard = cards[6];

    const starterPlayer = nextStarterPlayer ??
      (Math.floor(Math.random() * 2) ? game.player1 : game.player2);

    const round = await this.repo.createRound({
      game,
      player1Cards,
      player2Cards,
      trumpCard,
      starterPlayer,
      score: 1,
      seq,
      finished: false,
      turns: [],
    });

    return round;
  }

  public async allInfoTurnsByRound(roundId: number): Promise<InfoRoundsLogic | null> {
    const round = await this.repo.getRoundById(roundId);

    if (!round) {
      return null;
    }

    const player1CardsArr = chunkSubstr(round.player1Cards ?? '', 2);
    const player2CardsArr = chunkSubstr(round.player2Cards ?? '', 2);

    const player1CardsRemaining: string[] = player1CardsArr.slice();
    const player2CardsRemaining: string[] = player2CardsArr.slice();

    let player1LastCard: string = '';
    let player2LastCard: string = '';
    let player1LastAction: string = '';
    let player2LastAction: string = '';
    const triTurnWinner: (number | '-')[] = [];
    let nextPlayerId: number | null = round.starterPlayer?.id ?? null;
    let roundWinner: number | null = null;
    let askElevate: string | null = null;
    let lastTurnSeq: number = 0;

    const actionsElevate = this.getActionsElevations().map((x) => x.elevation);

    for (const t of round.turns ?? []) {
      askElevate = '';

      if (t.player?.id === round.game?.player1?.id) {
        const remInd = player1CardsRemaining.indexOf(t.cardOrAction ?? '');
        if (remInd !== -1) {
          player1CardsRemaining.splice(remInd, 1);
        }

        if (t.cardOrAction === 'Gu') {
          roundWinner = round.game.player2.id!;
        } else if (this.getActions().includes(t.cardOrAction ?? '')) {
          player1LastAction = t.cardOrAction ?? '';
        } else {
          player1LastCard = t.cardOrAction ?? '';
        }
      } else {
        const remInd = player2CardsRemaining.indexOf(t.cardOrAction ?? '');
        if (remInd !== -1) {
          player2CardsRemaining.splice(remInd, 1);
        }

        if (t.cardOrAction === 'Gu') {
          roundWinner = round.game.player1.id!;
        } else if (this.getActions().includes(t.cardOrAction ?? '')) {
          player2LastAction = t.cardOrAction ?? '';
        } else {
          player2LastCard = t.cardOrAction ?? '';
        }
      }

      if (player1LastCard.length && player2LastCard.length) {
        const winner = this.turnWinner(player1LastCard, player2LastCard, round.trumpCard ?? '');

        switch (winner) {
          case turnWin.player1:
            triTurnWinner.push(round.game.player1.id!);
            nextPlayerId = round.game.player1.id!;
            break;

          case turnWin.player2:
            triTurnWinner.push(round.game.player2.id!);
            nextPlayerId = round.game.player2.id!;
            break;

          case turnWin.draw:
            triTurnWinner.push('-');
            nextPlayerId = round.starterPlayer.id!;
            break;
        }

        player1LastCard = '';
        player2LastCard = '';
      } else if (player1LastCard.length) {
        nextPlayerId = round.game.player2.id!;
      } else if (player2LastCard.length) {
        nextPlayerId = round.game.player1.id!;
      }

      if (player1LastAction.length && player2LastAction.length) {
        if (player2LastAction === 'No') {
          roundWinner = round.game.player1.id!;
          player1LastAction = '';
          player2LastAction = '';
        } else if (player1LastAction === 'No') {
          roundWinner = round.game.player2.id!;
          player1LastAction = '';
          player2LastAction = '';
        } else {
          if (actionsElevate.includes(player1LastAction) && player2LastAction === 'Ys') {
            nextPlayerId = player1CardsRemaining.length >= player2CardsRemaining.length
                ? round.game.player1.id!
                : round.game.player2.id!;
            player1LastAction = '';
            player2LastAction = '';
          } else if (actionsElevate.includes(player2LastAction) && player1LastAction === 'Ys') {
            nextPlayerId = player1CardsRemaining.length <= player2CardsRemaining.length
              ? round.game.player2.id!
              : round.game.player1.id!;
            player1LastAction = '';
            player2LastAction = '';
          } else {
            const pl1act = actionsElevate.indexOf(player1LastAction);
            const pl2act = actionsElevate.indexOf(player2LastAction);

            if (pl1act < pl2act) {
              nextPlayerId = round.game.player1.id!;
              player1LastAction = '';
              askElevate = player2LastAction;
            } else {
              nextPlayerId = round.game.player2.id!;
              player2LastAction = '';
              askElevate = player1LastAction;
            }
          }
        }
      } else if (player1LastAction.length) {
        nextPlayerId = round.game.player2.id!;
        askElevate = player1LastAction;
      } else if (player2LastAction.length) {
        nextPlayerId = round.game.player1.id!;
        askElevate = player2LastAction;
      }

      lastTurnSeq = t.seq;
    }

    if (!roundWinner && triTurnWinner.length >= 2) {
      if (triTurnWinner.filter((x) => x === round.game.player1.id!).length == 2) {
        roundWinner = round.game.player1.id!;
      } else if (triTurnWinner.filter((x) => x === round.game.player2.id!).length == 2) {
        roundWinner = round.game.player2.id!;
      } else if (
        triTurnWinner[0] !== '-' &&
        (triTurnWinner[1] === '-' || (triTurnWinner.length === 3 && triTurnWinner[2] === '-'))
      ) {
        roundWinner = triTurnWinner[0];
      } else if (triTurnWinner[0] === '-' && triTurnWinner[1] !== '-') {
        roundWinner = triTurnWinner[1];
      } else if (
        triTurnWinner.length === 3 &&
        triTurnWinner[0] === '-' &&
        triTurnWinner[1] === '-' &&
        triTurnWinner[2] !== '-'
      ) {
        roundWinner = triTurnWinner[2];
      } else if (
        triTurnWinner.length === 3 &&
        triTurnWinner[0] === '-' &&
        triTurnWinner[1] === '-' &&
        triTurnWinner[2] === '-'
      ) {
        if (round.starterPlayer.id === round.game.player1.id) {
          roundWinner = round.game.player1.id!;
        } else {
          roundWinner = round.game.player2.id!;
        }
      }
    }

    const possibleActions: string[] = [];
    if (roundWinner) {
      nextPlayerId = null;
    } else {
      if (askElevate) {
        possibleActions.push('Ys');
        possibleActions.push('No');

        if (askElevate == 'Tr') {
          possibleActions.push('Sx');
        } else if (askElevate == 'Sx') {
          possibleActions.push('Nn');
        }
        if (askElevate == 'Nn') {
          possibleActions.push('Tw');
        }
      } else if (!round.turns?.length || (round.turns.length && round.turns?.at(-1)?.cardOrAction != 'Ys')) {
        if (round.score == 1) {
          possibleActions.push('Tr');
        } else if (round.score == 3) {
          possibleActions.push('Sx');
        } else if (round.score == 6) {
          possibleActions.push('Nn');
        } else if (round.score == 9) {
          possibleActions.push('Tw');
        }
      }
      possibleActions.push('Gu');
    }

    return {
      round,
      player1CardsArr,
      player2CardsArr,
      player1CardsRemaining,
      player2CardsRemaining,
      triTurnWinner,
      roundWinner: roundWinner ?? undefined,
      nextPlayerId: nextPlayerId ?? undefined,
      askElevate: askElevate ?? undefined,
      lastTurnSeq,
      possibleActions,
    };
  }

  public async finishRound(input: FinishRoundInput): Promise<FinishRoundInputResult> {
    const { token: { userId }, roundId } = input;

    const roundTurns = await this.allInfoTurnsByRound(roundId);

    if (!roundTurns) {
      throw new RoundError(RoundErrorCodes.NOT_FOUND);
    }

    if (roundTurns.round.game.player1.id !== userId && roundTurns.round.game.player2.id !== userId) {
      throw new RoundError(RoundErrorCodes.FORBIDDEN, 'You do not participate in this game!');
    }

    if (roundTurns.round.finished) {
      throw new RoundError(RoundErrorCodes.BUSINESS, 'Round already finished!');
    }

    if (!roundTurns.roundWinner) {
      throw new RoundError(RoundErrorCodes.BUSINESS, 'Round is not over!');
    }

    let winnerUser: users | undefined;
    if (roundTurns.roundWinner === roundTurns.round.game.player1.id) {
      winnerUser = roundTurns.round.game.player1;
      roundTurns.round.game.player1Score = Math.min(roundTurns.round.game.player1Score + roundTurns.round.score, 12);
    } else {
      winnerUser = roundTurns.round.game.player2;
      roundTurns.round.game.player2Score = Math.min(roundTurns.round.game.player2Score + roundTurns.round.score, 12);
    }

    if (roundTurns.round.game.player1Score === 12 || roundTurns.round.game.player2Score === 12) {
      roundTurns.round.game.endPlay = new Date();
      roundTurns.round.game.winnerPlayer = winnerUser;
    }

    let nextStartPlayer: users;
    if (roundTurns.round.starterPlayer.id === roundTurns.round.game.player1.id) {
      nextStartPlayer = roundTurns.round.game.player2;
    } else {
      nextStartPlayer = roundTurns.round.game.player1;
    }
    this.logger.info(
      `Current round started by ${roundTurns.round.starterPlayer.username} next round by ${nextStartPlayer.username}`
    );

    roundTurns.round.finished = true;
    roundTurns.round.winnerPlayer = winnerUser;

    await this.repo.updateRound(roundTurns.round);
    await this.gameRepo.updateGame(roundTurns.round.game);

    let newRoundSeq: rounds;
    let playerCards: string | undefined;
    let nextRound:
      | {
          id: number;
          seq: number;
          playerCards: string;
          trumpCard: string;
          startPlayerId: number;
        }
      | undefined;
    if (roundTurns.round.game.player1Score !== 12 && roundTurns.round.game.player2Score !== 12) {
      newRoundSeq = await this.newRound(roundTurns.round.game!, roundTurns.round.seq + 1, nextStartPlayer);

      if (roundTurns.round.game.player1.id === userId) {
        playerCards = newRoundSeq.player1Cards;
      } else {
        playerCards = newRoundSeq.player2Cards;
      }

      nextRound = {
        id: newRoundSeq.id!,
        seq: newRoundSeq.seq,
        playerCards: playerCards,
        trumpCard: newRoundSeq.trumpCard,
        startPlayerId: nextStartPlayer.id!,
      };
    }

    return {
      roundId,
      winnerId: winnerUser.id!,
      finished: true,
      nextRound,
    };
  }

  public async allRounds(input: AllRoundsInput): Promise<AllRoundsResult> {
    const { token: { userId }, gameId } = input;

    const allRounds = await this.repo.getAllRoundsByGame(gameId);

    if (!allRounds) {
      throw new GameError(GameErrorCodes.NOT_FOUND);
    }

    const roundsResult: AllRoundsResult['rounds'] = [];
    for (const r of allRounds) {
      let playerCards: string[] = [];
      if (r.game?.player1?.id == userId) {
        playerCards = chunkSubstr(r.player1Cards ?? '', 2);
      } else if (r.game?.player2?.id == userId) {
        playerCards = chunkSubstr(r.player2Cards ?? '', 2);
      }

      roundsResult.push({
        id: r.id ?? 0,
        seq: r.seq ?? 0,
        playerCards: playerCards,
        trumpCard: r.trumpCard ?? '',
        score: r.score ?? 0,
        starterPlayer: r.starterPlayer?.id ?? 0,
        winnerPlayer: r.winnerPlayer?.id,
      });
    }

    return {
      rounds: roundsResult,
      roundsCount: roundsResult.length,
    };
  }

  public async lastRound(input: LastRoundInput): Promise<LastRoundResult> {
    const { token, gameId } = input;

    const lastRound = await this.repo.getLastRoundByGame(gameId);

    if (!lastRound) {
      throw new RoundError(RoundErrorCodes.NOT_FOUND);
    }

    let playerCards: string[] = [];
    let readonly = false;
    if (token?.userId === lastRound.game.player1.id) {
      playerCards = chunkSubstr(lastRound.player1Cards, 2);
    } else if (token?.userId === lastRound.game.player2.id) {
      playerCards = chunkSubstr(lastRound.player2Cards, 2);
    } else {
      readonly = true;
    }

    return {
      id: lastRound.id!,
      seq: lastRound.seq,
      readonly,
      playerCards: playerCards,
      trumpCard: lastRound.trumpCard,
      starterPlayer: lastRound.starterPlayer.id!,
      winnerPlayer: lastRound.winnerPlayer?.id,
      score: lastRound.score,
    };
  }
}