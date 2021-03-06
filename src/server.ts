import bodyParser from 'body-parser';
import chalk from 'chalk';
import cors from 'cors';
import express, {ErrorRequestHandler} from 'express';
import session from 'express-session';
import createError from 'http-errors';
import {AddressInfo} from 'net';
import {EXPRESS_SESSION_SECRET, IS_PRODUCTION, NODE_ENV, NODE_HOST, NODE_PORT} from 'src/config/env';
import {dir, log} from 'src/utils/log';
import {forwardFetchRoutes} from './routes/forwardFetchRoutes';
import {forwardGotRoutes} from './routes/forwardGotRoutes';
import {faviconRoutes, robotRoutes} from './routes/genericRoutes';
import {statusRoutes} from './routes/statusRoutes';
import {uploadRoutes} from './routes/uploadRoutes';
import {asNumber} from './utils/cast';
import {chalkKeyword, chalkNumber} from './utils/chalk';
import {filterIncomingHeaders} from './utils/forward';

const app = express();

// Disable verbose header
app.disable('x-powered-by');

// Parse incoming json
app.use(bodyParser.json());

// Use cors
app.use(
  cors({
    credentials: true
  })
);

// Enable session support
app.use(
  session({
    secret: EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: IS_PRODUCTION}
  })
);

// Enable pretty JSON output
app.set('json spaces', 2);

// Enable remote IP through a proxy
app.enable('trust proxy');

// Default routes
app.get('/favicon.ico', ...faviconRoutes);
app.get('/robots.txt', ...robotRoutes);

// Special routes
app.all('/upload*', ...uploadRoutes);
app.all('/got*', ...forwardGotRoutes);
app.all('/fetch*', ...forwardFetchRoutes);
app.all(/\/status\/([1-5][0-9][0-9])\/?([1-5][0-9][0-9])?/, ...statusRoutes);

// Generic debug endpoint
app.all('/*', (req, res, _next) => {
  const {ip, method, hostname, url, query, headers, body} = req;
  const details = {ip, method, hostname, url, query, headers: filterIncomingHeaders(headers), body};
  dir(details);
  res.json(details);
});

app.use((_req, _res, next) => {
  next(createError(404));
});

app.use(((err, req, res, _next) => {
  const {status = 500, message = 'Internal Error'} = err;
  res.status(status);
  if (req.accepts('json')) {
    res.send({error: message});
  } else {
    res.type('txt').send(message);
  }
}) as ErrorRequestHandler);

export default app;

if (NODE_ENV !== 'test') {
  const server = app.listen(asNumber(NODE_PORT), NODE_HOST, () => {
    const address = server.address() as AddressInfo;
    log(
      `Express server listening on "${chalk.green(address.address, true)}:${chalkNumber(
        address.port
      )}" in ${chalkKeyword(NODE_ENV)} mode ...`
    );
  });
}
