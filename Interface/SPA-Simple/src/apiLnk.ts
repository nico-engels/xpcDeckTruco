import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { xpcSession } from '@app/apiRouter';

interface consumeLinkResponse {
  jwtToken: string;
  player: string;
  playerId: number;
  gameId: number;
}

async function consumeLink(req: Request, res: Response) {
  if (!req.params.playerLink) {
    res.redirect('/');
    return;
  }

  const session = req.session as xpcSession;

  if (!session.deviceID) {
    session.deviceID = crypto.randomUUID();
  }

  const reqApi = await fetch(`${process.env.BASE_URL_API}/auth/pre_game/consume_link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerLink: req.params.playerLink,
      deviceId: session.deviceID,
    }),
  });

  if (reqApi.status === StatusCodes.OK) {
    const resApi = await reqApi.json() as consumeLinkResponse;

    session.tok = resApi.jwtToken;
    session.username = resApi.player;
    session.userid = resApi.playerId;

    res.redirect(`/jogos/${resApi.gameId}`);
  } else {
    console.error('Error consumeLink', {
      playerLink: req.params.playerLink,
      deviceId: session.deviceID,
      message: await reqApi.text(),
    });

    res.redirect('/');
  }
}

export default function () {
  const router = express.Router();

  router.get('/:playerLink', consumeLink);
  router.get('/:playerLink/:playerName', consumeLink);

  return router;
}
