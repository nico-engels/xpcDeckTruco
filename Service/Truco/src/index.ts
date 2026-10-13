import bodyParser from 'body-parser';
import express, { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import http from 'node:http';
import swaggerUI from 'swagger-ui-express';

import { AppConfig } from '@app/app-config';
import router from '@app/router';
import { requestLogger } from '@app/router/middlewares';
import { pinoLogger } from '@app/util/logger';
import swgCfg from '@root/swagger.json' with { type: 'json' };

const app = express();

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swgCfg));
app.use(bodyParser.json());
app.use(pinoLogger);
app.use(requestLogger)

const serverHttp = http.createServer(app);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`Error handler xpcDeck-Truco: ${err.stack}`);
  if (!res.headersSent) {
    res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
  }
};

app.use('/', router());
app.use(errorHandler);

const httpPort = AppConfig.httpPort;

serverHttp.listen(httpPort, () => {
  console.log(`xpcDeck-Truco running (${httpPort} http)`);
});
