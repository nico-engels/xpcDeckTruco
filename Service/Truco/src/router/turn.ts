import { Router } from 'express';

import { TurnHandler } from '@app/handler/turn';
import { validadeTok } from '@app/router/middlewares';

export default function (router: Router) {
  const handler = new TurnHandler();

  router.get('/turn/check/:roundId', validadeTok, handler.checkTurn());
  router.post('/turn/play', validadeTok, handler.playTurn());
}
