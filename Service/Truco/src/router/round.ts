import { Router } from 'express';

import { RoundHandler } from '@app/handler/round';
import { validadeTok } from '@app/router/middlewares';

export default function (router: Router) {
  const handler = new RoundHandler();

  router.get('/round/all/:gameId', validadeTok, handler.allRounds());
  router.get('/round/last/:gameId', validadeTok, handler.lastRound());
  router.post('/round/end', validadeTok, handler.finishRound());
}
