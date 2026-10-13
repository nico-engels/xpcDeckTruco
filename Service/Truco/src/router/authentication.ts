import { Router } from 'express';

import { validadeTok } from '@app/router/middlewares';
import { AuthenticationHandler } from '@app/handler/authentication';

export default function (router: Router) {
  const handler = new AuthenticationHandler();

  router.post('/auth/register', validadeTok, handler.register());
  router.post('/auth/login', handler.login());
  router.post('/auth/change_password', validadeTok, handler.changePassword());
}
