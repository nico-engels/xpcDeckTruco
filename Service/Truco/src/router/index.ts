import express from 'express';

import authentication from '@app/router/authentication';
import game from '@app/router/game';
import preGame from '@app/router/pre-game';
import round from '@app/router/round';
import turn from '@app/router/turn';

const router = express.Router();

export default function () {
  authentication(router);
  preGame(router);
  game(router);
  round(router);
  turn(router);

  return router;
}
