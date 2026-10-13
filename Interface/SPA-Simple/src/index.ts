import bodyParser from 'body-parser';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import session from 'express-session';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import crypto from 'node:crypto';
import https from 'node:https';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import apiLnk from '@app/apiLnk';
import apiRouter, { xpcSession } from '@app/apiRouter';

const app = express();

app.use(bodyParser.json());
app.use(
  session({
    secret: `${process.env.COOKIE_SCRT}`,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 3600000,
      httpOnly: true,
      secure: true,
    },
  }),
);

if (!import.meta.dirname) {
  import.meta.dirname = dirname(fileURLToPath(import.meta.url));
}

const privateKey = fs.readFileSync('rec/sslcert/selfsigned.key', 'utf8');
const certificate = fs.readFileSync('rec/sslcert/selfsigned.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

const server_https = https.createServer(credentials, app);

app.use('/static', express.static(path.resolve(import.meta.dirname, '../spa', 'static')));
app.use('/api-truco/', apiRouter());
app.use('/lnk/', apiLnk());

app.get(/\/*/, (req: Request, res: Response) => {
  const session = req.session as xpcSession;
  if (!session.deviceID) {
    session.deviceID = crypto.randomUUID();
  }

  res.sendFile(path.resolve(import.meta.dirname, '../spa', 'index.html'));
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error(`Error handler SPA-Simple: ${err.stack}`);
  res.sendStatus(StatusCodes.INTERNAL_SERVER_ERROR);
};

app.use(errorHandler);

const https_port = process.env.HTTPS_PORT || 7780;

server_https.listen(https_port, () => {
  console.log(`xpcDeck-Truco (SPA-Simple) Front running (${https_port} https)`);
});
