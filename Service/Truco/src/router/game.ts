import { Router } from 'express';

import { GameHandler } from '@app/handler/game';
import { validadeTok } from '@app/router/middlewares';

export default function (router: Router) {
  const handler = new GameHandler();

  router.post('/game/new', validadeTok, handler.newGame());
  router.get('/game/info/:gameId', validadeTok, handler.infoGame());
  router.get('/game/list_active', validadeTok, handler.listActiveGames());
}
