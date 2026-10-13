import express, { Request, Response } from 'express';
import session from 'express-session';
import { StatusCodes } from 'http-status-codes';

export interface xpcSession extends session.Session {
  deviceID?: string;
  tok?: string;
  username?: string;
  userid?: number;
}

interface gameInfoApiResponse {
  id: number;
  player1Id: number;
  player1: string;
  player1Score: number;
  player2Id: number;
  player2: string;
  player2Score: number;
  startPlay: Date;
  lastPlay?: Date;
  lastRoundId: number;
  lastRoundSeq: number;
  endPlay?: Date;
  winnerPlayerId?: number;
}

interface turnPlayApiResponse {
  message: string;
}

interface roundEndApiResponse {
  message: string;
}

interface preGameNewApiResponse {
  message: string;
}

interface preGameListApiResponse {
  message: string;
}

async function gameInfo(req: Request, res: Response) {
  if (!req.params.gameId || Number.isNaN(parseInt(req.params.gameId as string))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo inválido!' }).end();
    return;
  }

  const session = req.session as xpcSession;

  const reqApi = await fetch(`${process.env.BASE_URL_API}/game/info/${req.params.gameId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session.tok}`,
    },
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json() as gameInfoApiResponse;

    let player1Id = resApi.player1Id;
    let player1 = resApi.player1;
    let player1Score = resApi.player1Score;
    let player2Id = resApi.player2Id;
    let player2 = resApi.player2;
    let player2Score = resApi.player2Score;
    let readonly = false;

    if (session.userid === resApi.player2Id) {

      [player1Id, player2Id] = [player2Id, player1Id];
      [player1, player2] = [player2, player1];
      [player1Score, player2Score] = [player2Score, player1Score];

    } else if (session.userid != resApi.player1Id && session.userid != resApi.player2Id) {
      readonly = true;
    }

    res.status(StatusCodes.OK)
       .json({
         id: resApi.id,
         player1Id,
         player1,
         player1Score,
         player2Id,
         player2,
         player2Score,
         readonly,
         startPlay: resApi.startPlay,
         lastPlay: resApi.lastPlay,
         lastRoundId: resApi.lastRoundId,
         lastRoundSeq: resApi.lastRoundSeq,
         endPlay: resApi.endPlay,
         winnerPlayerId: resApi.winnerPlayerId,
       })
       .end();
    return;

  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo não encontrado!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else if (reqApi.status === StatusCodes.FORBIDDEN) {
    res.status(StatusCodes.FORBIDDEN).json({ message: 'Acesso apenas ao jogo do link!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

async function roundLast(req: Request, res: Response) {
  if (!req.params.gameId || Number.isNaN(parseInt(req.params.gameId as string))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo inválido!' }).end();
    return;
  }

  const reqApi = await fetch(`${process.env.BASE_URL_API}/round/last/${req.params.gameId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${(req.session as xpcSession).tok}`,
    },
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json();

    res.status(StatusCodes.OK).json(resApi).end();
  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo não encontrado!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

async function checkRound(req: Request, res: Response) {
  if (!req.params.roundId || Number.isNaN(parseInt(req.params.roundId as string))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo inválido!' }).end();
    return;
  }

  const reqApi = await fetch(`${process.env.BASE_URL_API}/turn/check/${req.params.roundId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${(req.session as xpcSession).tok}`,
    },
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json();

    res.status(StatusCodes.OK).json(resApi).end();
  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo não encontrado!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

async function playTurn(req: Request, res: Response) {
  const reqApi = await fetch(`${process.env.BASE_URL_API}/turn/play`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${(req.session as xpcSession).tok}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json();

    res.status(StatusCodes.OK).json(resApi).end();
  } else if (reqApi.status === StatusCodes.CONFLICT) {
    const resApi = await reqApi.json() as turnPlayApiResponse;

    if (resApi.message === 'Not your turn!') {
      res.status(StatusCodes.CONFLICT).json({ message: 'Não é sua vez!' }).end();
    } else if (resApi.message === 'Round is over!') {
      res.status(StatusCodes.CONFLICT).json({ message: 'A mão encerrou!' }).end();
    } else if (resApi.message === 'Elevation needs a answer!') {
      res.status(StatusCodes.CONFLICT).json({ message: 'Responda nos botões para jogar!' }).end();
    } else {
      console.log(resApi);
      res.status(StatusCodes.CONFLICT).json({ message: 'Mensagem de erro não tratada!' }).end();
    }
  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo não encontrado!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

async function finishRound(req: Request, res: Response) {
  const reqApi = await fetch(`${process.env.BASE_URL_API}/round/end`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${(req.session as xpcSession).tok}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json();

    res.status(StatusCodes.OK).json(resApi).end();
  } else if (reqApi.status === StatusCodes.CONFLICT) {
    const resApi = await reqApi.json() as roundEndApiResponse;

    if (resApi.message === 'Round already finished!') {
      res.status(StatusCodes.OK).json({ message: 'kokok' }).end();
    } else {
      console.log(resApi);
      res.status(StatusCodes.CONFLICT).json({ message: 'Mensagem de erro não tratada!' }).end();
    }
  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Jogo não encontrado!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

async function newPreAuthGame(req: Request, res: Response) {
  const reqApi = await fetch(`${process.env.BASE_URL_API}/auth/pre_game/new`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.TEMP_TOKEN_XT_ADMIN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(req.body),
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json();

    res.status(StatusCodes.OK).json(resApi).end();
  } else if (reqApi.status === StatusCodes.CONFLICT) {
    const resApi = await reqApi.json() as preGameNewApiResponse;

    if (resApi.message === 'xxx') {
      res.status(StatusCodes.CONFLICT).json({ message: 'xxx' }).end();
    } else {
      console.log(resApi);
      res.status(StatusCodes.CONFLICT).json({ message: 'Mensagem de erro não tratada!' }).end();
    }
  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Usuário(s) não encontrados!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

async function listPreAuthGame(req: Request, res: Response) {
  const reqApi = await fetch(`${process.env.BASE_URL_API}/auth/pre_game/list`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.TEMP_TOKEN_XT_ADMIN}`,
      'Content-Type': 'application/json',
    },
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json();

    res.status(StatusCodes.OK).json(resApi).end();
  } else if (reqApi.status === StatusCodes.CONFLICT) {
    const resApi = await reqApi.json() as preGameListApiResponse;

    if (resApi.message === 'xxx') {
      res.status(StatusCodes.CONFLICT).json({ message: 'xxx' }).end();
    } else {
      console.log(resApi);
      res.status(StatusCodes.CONFLICT).json({ message: 'Mensagem de erro não tratada!' }).end();
    }
  } else if (reqApi.status === StatusCodes.NOT_FOUND) {
    res.status(StatusCodes.NOT_FOUND).json({ message: 'Usuário(s) não encontrados!' }).end();
  } else if (reqApi.status === StatusCodes.UNAUTHORIZED) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Deve estar autenticado!' }).end();
  } else {
    const resApi = await reqApi.text();

    res.status(reqApi.status).send(resApi).end();
  }
}

export default function apiTrucoRouter() {
  const router = express.Router();

  router.get('/game/info/:gameId', gameInfo);
  router.get('/round/last/:gameId', roundLast);
  router.get('/turn/check/:roundId', checkRound);

  router.post('/turn/play', playTurn);
  router.post('/round/end', finishRound);
  router.post('/auth/pre_game/new', newPreAuthGame);
  router.get('/auth/pre_game/list', listPreAuthGame);

  return router;
}
