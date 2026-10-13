import { Router } from 'express';

import { validadeTok } from '@app/router/middlewares';
import { PreGameHandler } from '@app/handler/pre-game';

export default function (router: Router) {
  const handler = new PreGameHandler();

  router.post('/auth/pre_game/new', validadeTok, handler.newPreAuthGame());
  router.post('/auth/pre_game/consume_link', handler.generatePreGameToken());
  router.post('/auth/pre_game/reset_link', validadeTok, handler.resetPreGameToken());
  router.get('/auth/pre_game/list', validadeTok, handler.listPreAuthGames());
}
