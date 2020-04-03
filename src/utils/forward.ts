import {WHITELIST_FORWARD} from 'src/config/env';
import {IncomingHttpHeaders} from 'http';
import {Response, Request, NextFunction, RequestHandler} from 'express';

export const WHITELISTED_IPS = WHITELIST_FORWARD ? WHITELIST_FORWARD.split(',') : [];
export const EXCLUDED_INCOMING_HEADERS = [
  'host',
  'connection',
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-ssl',
  'x-forwarded-port',
  'x-forward-proto'
];
export const EXCLUDED_OUTGOING_HEADERS = [
  'content-length',
  'access-control-allow-origin',
  'access-control-allow-credentials'
];

export const filterIncomingHeaders = (headers: IncomingHttpHeaders): IncomingHttpHeaders =>
  Object.keys(headers).reduce<Record<string, string>>((soFar, key) => {
    if (EXCLUDED_INCOMING_HEADERS.includes(key)) {
      return soFar;
    }
    soFar[key] = headers[key] as string;
    return soFar;
  }, {});

export const filterOutgoingHeaders = (res: Response): void => {
  EXCLUDED_OUTGOING_HEADERS.forEach((key) => {
    res.removeHeader(key);
  });
};

// export const forwardResolver: RequestHandler = (req: Request, res: Response, next: NextFunction): void => {
//   const {path, route} = req;
//   const routePrefix = route.path.replace('*', '');
//   const routeRegex = new RegExp(`${routePrefix}/([^/\n]+)/(.*)`);
//   const matches = path.match(routeRegex);
//   if (!matches) {
//     res.status(500).end();
//     return;
//   }
//   const [, forwardedHost, forwardedPath] = matches;
//   try {
//     req.host = forwardedHost;
//     // req.hostname = forwardedHost;
//     // req.path = forwardedPath;
//     req.url = req.url.replace(path, forwardedPath);
//   } catch (err) {
//     dir({err});
//   }

//   next();
// };
