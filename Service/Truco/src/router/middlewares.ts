import { AppConfig } from '@app/app-config';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface jwtAppPayload extends JwtPayload {
  username: string;
  userId: number;
  gameId?: number;
}

interface reqAppTokenPayload {
  username: string;
  userId: number;
  gameId?: number;
}

declare global {
  // eslint-disable-next-line
  namespace Express {
    interface Request {
      appTokenPayload?: reqAppTokenPayload
    }
  }
}

export function requestLogger(req: Request,res: Response, next: NextFunction): void {
  req.log.info(`[Req] ${req.method} ${req.originalUrl}`);
  next();
}

export async function validadeTok(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.header('Authorization')?.replace(/^Bearer /, '');
    if (!token || token === 'undefined') {
      res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Access denied' }).end();
      return;
    }

    const decoded = jwt.verify(token, AppConfig.security.tokSecret) as jwtAppPayload;
    req.appTokenPayload = {
      username: decoded.username,
      userId: decoded.userId,
      gameId: decoded.gameId,
    };
    req.log.info(`validate token ok for '${decoded.username}'`);
  } catch (error) {
    req.log.error(error);
    res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid token' }).end();
    return;
  }

  next();
  return;
}
