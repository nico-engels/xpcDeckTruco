import { TurnRepository } from '@app/repository/turn';
import { RoundRepository } from '@app/repository/round';
import { users } from '@app/repository/user';
import { chunkSubstr } from '@app/util';
import { Logger } from '@app/util/logger';
import { UsecaseError } from '@usecase/usecase-error';
import {
  CheckTurnInput,
  CheckTurnResult,
  InfoRoundsLogic,
  PlayTurnInput,
  PlayTurnResult,
  TurnErrorCodes,
} from "@usecase/turn-interfaces";

export class TurnError extends UsecaseError<TurnErrorCodes> {};

enum turnWin {
  draw,
  player1,
  player2,
};

export class TurnUsecase
{
  constructor(
    private repo: TurnRepository,
    private roundRepo: RoundRepository,
    private logger: Logger,
  ) {}

  private getActions(): string[] {
    return ['Gu', 'Ys', 'No', 'Tr', 'Sx', 'Nn', 'Tw'];
  }

  private getActionsElevations(): { elevation: string; score: number; }[] {
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
    /*  Truco Paulista 40 cartas
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

    if ((trumpCardNumber + 1) % 10 === player1CardNumber % 10 && (trumpCardNumber + 1) % 10 === player2CardNumber % 10) {
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

  private async allInfoTurnsByRound(roundId: number, playerId?: number): Promise<InfoRoundsLogic | null> {
    const round = await this.roundRepo.getRoundById(roundId);

    if (!round) {
      return null;
    }

    const player1CardsArr = chunkSubstr(round.player1Cards, 2);
    const player2CardsArr = chunkSubstr(round.player2Cards, 2);

    const player1CardsRemaining: string[] = player1CardsArr.slice();
    const player2CardsRemaining: string[] = player2CardsArr.slice();

    let player1LastCard: string = '';
    let player2LastCard: string = '';
    let player1LastAction: string = '';
    let player2LastAction: string = '';
    const triTurnWinner: (number | '-')[] = [];
    let nextPlayerId: number | undefined = round.starterPlayer.id!;
    let roundWinner: number | undefined;
    let askElevate: string | undefined;
    let lastTurnSeq: number | undefined;

    const actionsElevate = this.getActionsElevations().map((x) => x.elevation);

    for (const t of round.turns) {

      askElevate = '';

      if (t.player.id === round.game.player1.id) {
        const remInd = player1CardsRemaining.indexOf(t.cardOrAction);
        if (remInd !== -1) {
          player1CardsRemaining.splice(remInd, 1);
        }

        if (t.cardOrAction === 'Gu') {
          roundWinner = round.game.player2.id!;
        } else if (this.getActions().includes(t.cardOrAction)) {
          player1LastAction = t.cardOrAction;
        } else {
          player1LastCard = t.cardOrAction;
        }
      } else {
        const remInd = player2CardsRemaining.indexOf(t.cardOrAction);
        if (remInd !== -1) {
          player2CardsRemaining.splice(remInd, 1);
        }

        if (t.cardOrAction === 'Gu') {
          roundWinner = round.game.player1.id!;
        } else if (this.getActions().includes(t.cardOrAction)) {
          player2LastAction = t.cardOrAction;
        } else {
          player2LastCard = t.cardOrAction;
        }
      }

      if (player1LastCard.length && player2LastCard.length) {
        const winner = this.turnWinner(player1LastCard, player2LastCard, round.trumpCard);

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
            nextPlayerId = player1CardsRemaining.length >= player2CardsRemaining.length ? round.game.player1.id! : round.game.player2.id!;
            player1LastAction = '';
            player2LastAction = '';
          } else if (actionsElevate.includes(player2LastAction) && player1LastAction === 'Ys') {
            nextPlayerId = player1CardsRemaining.length <= player2CardsRemaining.length ? round.game.player2.id : round.game.player1.id!;
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
      if (triTurnWinner.filter((x) => x === round.game.player1.id).length == 2) {
        roundWinner = round.game.player1.id!;
      } else if (triTurnWinner.filter((x) => x === round.game.player2.id).length == 2) {
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
      nextPlayerId = undefined;
    } else {
      if (nextPlayerId === playerId) {
        if (askElevate?.length) {
          if (askElevate !== 'Ys' && askElevate !== 'No') {
            possibleActions.push('Ys');
            possibleActions.push('No');
          }

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
      roundWinner,
      nextPlayerId,
      askElevate,
      lastTurnSeq,
      possibleActions,
    };
  }

  public async checkTurn(input: CheckTurnInput): Promise<CheckTurnResult> {
    const { token, roundId } = input;

    const roundTurns = await this.allInfoTurnsByRound(roundId, token?.userId);

    if (!roundTurns || !roundTurns.round) {
      throw new TurnError(TurnErrorCodes.NOT_FOUND);
    }

    const turnFmtArr: CheckTurnResult['turns'] = [];
    for (const t of roundTurns.round?.turns ?? []) {
      turnFmtArr.push({
        id: t.id!,
        seq: t.seq,
        playerId: t.player.id!,
        player: t.player.username,
        cardOrAction: t.cardOrAction,
        when: t.when,
      });
    }

    let playerCards: string[] = [];
    let playerCardsRemaining: string[] = [];
    if (roundTurns.round.game.player1.id! === token?.userId) {
      playerCards = roundTurns.player1CardsArr ?? [];
      playerCardsRemaining = roundTurns.player1CardsRemaining ?? [];
    } else if (roundTurns.round.game.player2.id === token?.userId) {
      playerCards = roundTurns.player2CardsArr ?? [];
      playerCardsRemaining = roundTurns.player2CardsRemaining ?? [];
    }

    return {
      roundId: roundTurns.round.id!,
      roundSeq: roundTurns.round.seq,
      gameId: roundTurns.round.game.id!,
      starterPlayer: roundTurns.round.starterPlayer.id!,
      nextPlayerId: roundTurns.nextPlayerId,
      score: roundTurns.round.score,
      trumpCard: roundTurns.round.trumpCard,
      player1Id: roundTurns.round.game.player1.id!,
      player1: roundTurns.round.game.player1.username,
      player2Id: roundTurns.round.game.player2.id!,
      player2: roundTurns.round.game.player2.username,
      playerCards,
      playerCardsRemaining,
      turnsCount: turnFmtArr.length,
      turns: turnFmtArr,
      triTurnWinner: roundTurns.triTurnWinner,
      roundWinner: roundTurns.roundWinner,
      lastTurnSeq: roundTurns.lastTurnSeq,
      possibleActions: roundTurns.possibleActions,
    };
  }

  public async playTurn(input: PlayTurnInput): Promise<PlayTurnResult> {
    const { token: { userId }, roundId, prevSeq, cardOrAction } = input;

    const roundTurns = await this.allInfoTurnsByRound(roundId, userId);

    if (!roundTurns || !roundTurns.round) {
      throw new TurnError(TurnErrorCodes.NOT_FOUND);
    }

    let playerCards: string[];
    let playerCardsRemaining: string[];
    if (roundTurns.round.game.player1.id! === userId) {
      playerCards = roundTurns.player1CardsArr ?? [];
      playerCardsRemaining = roundTurns.player1CardsRemaining ?? [];
    } else if (roundTurns.round.game.player2.id! === userId) {
      playerCards = roundTurns.player2CardsArr ?? [];
      playerCardsRemaining = roundTurns.player2CardsRemaining ?? [];
    } else {
      throw new TurnError(TurnErrorCodes.FORBIDDEN, 'You do not participate in this game!');
    }

    if (roundTurns.roundWinner) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Round is over!');
    }

    if (roundTurns.round.turns.length == 0 && prevSeq !== 0) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Invalid sequence!');
    }

    if (roundTurns.round.turns.length && prevSeq !== roundTurns.round.turns.at(-1)?.seq) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Invalid sequence!');
    }

    if (roundTurns.nextPlayerId !== userId && cardOrAction !== 'Gu') {
      throw new TurnError(TurnErrorCodes.NOT_YOUR_TURN, 'Not your turn!');
    }

    const actions = this.getActions();
    const actionsElevations = this.getActionsElevations();

    if (!playerCards.includes(cardOrAction) && !actions.includes(cardOrAction)) {
      this.logger.error(
        `Invalid cardOrAction informed ${cardOrAction} - player cards (${JSON.stringify(playerCards)})`
      );
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Invalid card or action!');
    }

    if (!playerCardsRemaining.includes(cardOrAction) && !actions.includes(cardOrAction)) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Card already played!');
    }

    if (roundTurns.askElevate?.length === 0 && (cardOrAction === 'Ys' || cardOrAction === 'No')) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Answer for no elevation!');
    }

    if (roundTurns.askElevate?.length && !actions.includes(cardOrAction)) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Elevation needs a answer!');
    }

    const actionInfo = actionsElevations.find((x) => x.elevation === cardOrAction);
    const turnElevation = actionsElevations.find((x) => x.elevation === roundTurns.askElevate);

    if (actionInfo && actionInfo.score <= roundTurns.round.score) {
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Elevation already done!');
    }

    if (actionInfo && turnElevation && actionInfo.score <= turnElevation.score) {
      this.logger.warn(`Elevation ${cardOrAction} but turn has ${roundTurns.askElevate}.`);
      throw new TurnError(TurnErrorCodes.BUSINESS, 'Elevation aswered must be upper!');
    }

    if (roundTurns.askElevate?.length && (cardOrAction === 'Ys' || actionInfo)) {
      const newScore = actionInfo?.score ?? turnElevation?.score;
      this.logger.info(`Elevated round score from ${roundTurns.round.score} to ${newScore}`);

      roundTurns.round.score = newScore!;
      await this.roundRepo.updateRound(roundTurns.round);
    }

    const turn = await this.repo.createTurn({
      round: roundTurns.round,
      seq: prevSeq + 1,
      player: { id: userId } as users,
      cardOrAction,
      when: new Date(),
    });

    return {
      id: turn.id!,
      message: 'Ok',
    };
  }

}