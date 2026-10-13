/*
import { GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

import { dyndoclient } from '@app/entity/data-source-dyndb';
import { rounds, turns } from '@app/entity/games';
import { gamesModel } from '@app/repository/typeorm-game-model';

interface turnDocument {
  seq?: number;
  player?: number;
  cardOrAction?: string;
  when?: string;
}

interface roundDocument {
  id?: number;
  player1Cards?: string;
  player2Cards?: string;
  trumpCard?: string;
  starterPlayer?: number;
  winnerPlayer?: number;
  score?: number;
  seq?: number;
  finished?: boolean;
  turns?: turnDocument[];
}

interface gameDocument {
  id?: number;
  player1?: number;
  player1Username?: string;
  player1Score?: number;
  player2?: number;
  player2Username?: string;
  player2Score?: number;
  starterPlayer?: number;
  startPlay?: string;
  winnerPlayer?: number;
  endPlay?: string;
  rounds?: roundDocument[];
}

export async function createGameDyndb(game: gamesModel) {
  if (!game.id) {
    game.id = Math.floor(Math.random() * 1024);
  }

  if (!game.startPlay) {
    game.startPlay = new Date();
  }

  const gameDoc: gameDocument = {
    id: game.id,
    player1: game.player1?.id,
    player1Username: game.player1?.username,
    player2: game.player2?.id,
    player2Username: game.player2?.username,
    player1Score: game.player1Score,
    player2Score: game.player2Score,
    startPlay: game.startPlay.toISOString(),
    winnerPlayer: game.winnerPlayer?.id,
    endPlay: game.endPlay?.toISOString(),
    rounds: game.rounds?.map(r => ({
      id: r.id,
      player1Cards: r.player1Cards,
      player2Cards: r.player2Cards,
      trumpCard: r.trumpCard,
      starterPlayer: r.starterPlayer?.id,
      score: r.score,
      seq: r.seq,
      finished: r.finished,
      turns: r.turns?.map(t => ({
        seq: t.seq,
      })),
    })),
  };

  const cmd = new PutCommand({
    TableName: 'games',
    Item: gameDoc,
  });

  await dyndoclient.send(cmd);

  return game;
}

export async function updateGameDyndb(game: gamesModel) {
  const gameDoc = await getGameDocByIdDyndb(game.id ?? 0);

  gameDoc.player1Score = game.player1Score;
  gameDoc.player2Score = game.player2Score;
  gameDoc.startPlay = game.startPlay?.toISOString();
  gameDoc.winnerPlayer = game.winnerPlayer?.id;
  gameDoc.endPlay = game.endPlay?.toISOString();

  const cmd = new PutCommand({
    TableName: 'games',
    Item: gameDoc,
  });
  await dyndoclient.send(cmd);
  return game;
}

export async function getGameDocByIdDyndb(gameId: number) {
  const cmd = new GetCommand({
    TableName: 'games',
    Key: {
      id: gameId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (!res.Item) {
    throw new Error('Game not found');
  }

  return res.Item as gameDocument;
}

export async function getGameByIdDyndb(gameId: number) {
  const item = await getGameDocByIdDyndb(gameId);

  return {
    id: item.id,
    player1: {
      id: item.player1,
      username: item.player1Username,
    },
    player2: {
      id: item.player2,
      username: item.player2Username,
    },
    player1Score: item.player1Score,
    player2Score: item.player2Score,
    startPlay: item.startPlay ? new Date(item.startPlay): undefined,
    winnerPlayer: item.winnerPlayer,
    endPlay: item.endPlay ? new Date(item.endPlay) : undefined,
    rounds: item.rounds?.map(r => ({
      id: r.id,
      seq: r.seq,
      player1Cards: r.player1Cards,
      player2Cards: r.player2Cards,
      trumpCard: r.trumpCard,
      starterPlayer: r.starterPlayer,
      finished: r.finished,
      winnerPlayer: r.winnerPlayer,
      score: r.score,
      turns: r.turns?.map(t => ({
        seq: t.seq,
        player: {
          id: t.player,
        },
        cardOrAction: t.cardOrAction,
        when: t.when ? new Date(t.when) : undefined,
      }))
    })) ?? [],
  } as gamesModel;
}

export async function listGamesByUsernameDyndb(username: string, active?: boolean) {
  let filterExpr = '(player1Username = :username or player2Username = :username)';

  if (active !== undefined) {
    if (active) {
      filterExpr += ' and attribute_not_exists(endPlay)';
    } else {
      filterExpr += ' and attribute_exists(endPlay)';
    }
  }

  const cmd = new ScanCommand({
    TableName: 'games',
    FilterExpression: filterExpr,
    ExpressionAttributeValues: {
      ':username': username,
    },
  });

  const res = await dyndoclient.send(cmd);

  const ret: gamesModel[] = [];
  for (const item of res.Items ?? []) {
    ret.push({
      id: item.id,
      player1: {
        id: item.player1,
        username: item.player1Username,
      },
      player2: {
        id: item.player2,
        username: item.player2Username,
      },
      player1Score: item.player1Score,
      player2Score: item.player2Score,
      startPlay: new Date(item.startPlay),
      winnerPlayer: item.winnerPlayer,
      endPlay: item.endPlay ? new Date(item.endPlay) : undefined,
      rounds: item.rounds,
    });
  }

  return ret;
}

export async function createRoundDyndb(round: rounds) {
  if (!round.id) {
    round.id = Math.floor(Math.random() * 1024);
  }

  const gameDoc = await getGameDocByIdDyndb(round.game?.id ?? 0);

  gameDoc.rounds = [
    ...(gameDoc.rounds ?? []),
    {
      id: round.id,
      player1Cards: round.player1Cards,
      player2Cards: round.player2Cards,
      trumpCard: round.trumpCard,
      starterPlayer: round.starterPlayer?.id,
      score: round.score,
      seq: round.seq,
      finished: round.finished,
      turns: [],
    },
  ];

  const cmd = new PutCommand({
    TableName: 'games',
    Item: gameDoc,
  });

  await dyndoclient.send(cmd);

  await createKeyMapIdDyndb('roundId-' + round.id, {
    id: round.game?.id ?? 0,
    roundSeq: round.seq ?? 0,
  });

  return round;
}

export async function updateRoundDyndb(round: rounds) {
  const gameDoc = await getGameDocByIdDyndb(round.game?.id ?? 0);
  const docRound = gameDoc.rounds?.find(r => r.seq === round.seq);

  if (docRound) {
    docRound.player1Cards = round.player1Cards;
    docRound.player2Cards = round.player2Cards;
    docRound.trumpCard = round.trumpCard;
    docRound.starterPlayer = round.starterPlayer?.id;
    docRound.score = round.score;
    docRound.finished = round.finished;
  }

  const cmd = new PutCommand({
    TableName: 'games',
    Item: gameDoc,
  });

  await dyndoclient.send(cmd);

  return round;
}

export async function getAllRoundsByGameDyndb(gameId: number) {
  const gameDoc = await getGameDocByIdDyndb(gameId);

  return gameDoc.rounds?.map((round): rounds => ({
    id: round.id,
    player1Cards: round.player1Cards,
    player2Cards: round.player2Cards,
    trumpCard: round.trumpCard,
    starterPlayer: {
      id: round.starterPlayer,
      username: gameDoc.player1 === round.starterPlayer ? gameDoc.player1Username : gameDoc.player2Username,
    },
    score: round.score,
    seq: round.seq,
    finished: round.finished,
    game: {
      id: gameDoc.id,
      player1: {
        id: gameDoc.player1,
        username: gameDoc.player1Username,
      },
      player2: {
        id: gameDoc.player2,
        username: gameDoc.player2Username,
      },
      player1Score: gameDoc.player1Score,
      player2Score: gameDoc.player2Score,
      startPlay: gameDoc.startPlay ? new Date(gameDoc.startPlay) : undefined,
      winnerPlayer: {
        id: gameDoc.winnerPlayer,
      },
      endPlay: gameDoc.endPlay ? new Date(gameDoc.endPlay) : undefined,
    },
  }));
}

export async function getLastRoundByGameDyndb(gameId: number) {
  const cmd = new GetCommand({
    TableName: 'games',
    Key: {
      id: gameId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (res.Item) {
    const docGame = res.Item;
    const docRound = res.Item.rounds.at(-1);
    return {
      id: docRound.id,
      player1Cards: docRound.player1Cards,
      player2Cards: docRound.player2Cards,
      trumpCard: docRound.trumpCard,
      starterPlayer: {
        id: docRound.starterPlayer,
        username: res.Item.player1Username === docRound.starterPlayer ? res.Item.player1Username : res.Item.player2Username,
      },
      score: docRound.score,
      seq: docRound.seq,
      finished: docRound.finished,
      game: {
        id: docGame.id,
        player1: {
          id: docGame.player1,
          username: docGame.player1Username,
        },
        player2: {
          id: docGame.player2,
          username: docGame.player2Username,
        },
        player1Score: docGame.player1Score,
        player2Score: docGame.player2Score,
        startPlay: new Date(docGame.startPlay),
        winnerPlayer: docGame.winnerPlayer,
        endPlay: docGame.endPlay ? new Date(docGame.endPlay) : undefined,
      },
    } as rounds;
  }
}

export async function getRoundByGameIdRoundSeqDyndb(gameId: number, roundSeq: number) {
  const game = await getGameByIdDyndb(gameId);
  if (game) {
    const round = game.rounds?.find((round) => round.seq === roundSeq);
    if (round) {
      const turnsFmt =
        round.turns?.map((turn) => ({
          seq: turn.seq,
          player: {
            id: turn.player,
            username: game.player1?.id === turn.player ? game.player1?.username : game.player2?.username,
          },
          cardOrAction: turn.cardOrAction,
          when: turn.when ? new Date(turn.when) : undefined,
        })) || [];

      return {
        id: round.id,
        player1Cards: round.player1Cards,
        player2Cards: round.player2Cards,
        trumpCard: round.trumpCard,
        starterPlayer: {
          id: round.starterPlayer,
          username: game.player1?.username === round.starterPlayer ? game.player1?.username : game.player2?.username,
        },
        score: round.score,
        seq: round.seq,
        finished: round.finished,
        game: {
          id: game.id,
          player1: {
            id: game.player1?.id,
            username: game.player1?.username,
          },
          player2: {
            id: game.player2?.id,
            username: game.player2?.username,
          },
          player1Score: game.player1Score,
          player2Score: game.player2Score,
          startPlay: game.startPlay ? new Date(game.startPlay) : undefined,
          winnerPlayer: game.winnerPlayer,
          endPlay: game.endPlay ? new Date(game.endPlay) : undefined,
        },
        turns: turnsFmt,
      } as rounds;
    }
  }
}

export async function createTurnDyndb(turn: turns) {
  const gameIdRoundSeq = await getGameIdRoundSeqByRoundIdDyndb(turn.round?.id ?? 0);
  if (gameIdRoundSeq) {
    const gameDoc = await getGameDocByIdDyndb(gameIdRoundSeq.gameId);
    const roundDoc = gameDoc.rounds?.find(round => round.seq === gameIdRoundSeq.roundSeq);

    if (roundDoc) {
      const turnDoc: turnDocument = {
        seq: turn.seq,
        player: turn.player?.id,
        cardOrAction: turn.cardOrAction,
        when: turn.when?.toISOString(),
      };

      roundDoc.turns = roundDoc.turns ?? [];
      roundDoc.turns.push(turnDoc);

      const cmd = new PutCommand({
        TableName: 'games',
        Item: gameDoc,
      });

      await dyndoclient.send(cmd);

      return turn;
    }
  }
}

export async function createKeyMapIdDyndb(keyId: string, value: Record<string, string | number>) {
  const cmd = new PutCommand({
    TableName: 'util-key-maps',
    Item: {
      'key-id': keyId,
      value,
    },
  });

  await dyndoclient.send(cmd);
}

export async function getGameIdRoundSeqByRoundIdDyndb(roundId: number) {
  const cmd = new GetCommand({
    TableName: 'util-key-maps',
    Key: {
      'key-id': 'roundId-' + roundId,
    },
  });

  const res = await dyndoclient.send(cmd);

  if (res.Item) {
    return {
      gameId: res.Item.value.id as number,
      roundSeq: res.Item.value.roundSeq as number,
    };
  }
}
*/