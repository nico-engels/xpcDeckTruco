import logger from 'pino-http';

export const pinoLogger = logger({
  redact: {
    paths: ['*.headers.authorization'],
    censor: '[****Censored****]',
  },
  serializers: {
    req: (req) => ({
      'request-id': req.id,
    }),
    res: (res) => ({
      'status-code': res.statusCode,
    }),
  }
});

interface LoggerLike {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

export abstract class Logger {
  public abstract info(msg: string): void;
  public abstract warn(msg: string): void;
  public abstract error(msg: string): void;
}

export class PinoLogger implements Logger {
  constructor(private pinoLog: LoggerLike) { };

  public info(msg: string): void {
    this.pinoLog.info(msg);
  }

  public warn(msg: string): void {
    this.pinoLog.warn(msg);
  }

  public error(msg: string): void {
    this.pinoLog.error(msg);
  }
}

export class ConsoleLogger implements Logger {
  public info(msg: string): void {
    console.info(msg);
  }

  public warn(msg: string): void {
    console.warn(msg);
  }

  public error(msg: string): void {
    console.error(msg);
  }
}
