import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import {AddressInfo} from 'net';
import {NODE_ENV, NODE_HOST, NODE_PORT} from 'src/config/env';
import {dir, log} from 'src/utils/log';
import {faviconRoutes} from './routes/faviconRoutes';
import {forwardRoutes} from './routes/forwardRoutes';
import {uploadRoutes} from './routes/uploadRoutes';
import {asNumber} from './utils/cast';

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

// Enable pretty JSON output
app.set('json spaces', 2);

// Enable remote IP through a proxy
app.enable('trust proxy');

// Special routes
app.all('/upload*', ...uploadRoutes);
app.all('/favicon.ico', ...faviconRoutes);
app.all('/forward*', ...forwardRoutes);

// Generic debug endpoint
app.all('/*', (req, res) => {
  const {ip, method, hostname, url, query, headers, body} = req;
  const details = {ip, method, hostname, url, query, headers, body};
  dir(details);
  res.json(details);
});

export default app;

if (NODE_ENV !== 'test') {
  const server = app.listen(asNumber(NODE_PORT), NODE_HOST, () => {
    const address = server.address() as AddressInfo;
    log('Express server listening on "%s:%d" in %s mode', address.address, address.port, NODE_ENV);
  });
}
