import {RequestHandler} from 'express';
import got, {Method} from 'got';
import {FETCH_FORWARD_TIMEOUT} from 'src/config/env';
import {asyncUtil} from 'src/utils/async';
import {asNumber} from 'src/utils/cast';
import {chalkJson, chalkNumber, chalkString} from 'src/utils/chalk';
import {filterIncomingHeaders, filterOutgoingHeaders, WHITELISTED_IPS} from 'src/utils/forward';
import {debug, dir} from 'src/utils/log';

export const forwardGotRoutes: RequestHandler[] = [
  asyncUtil(async (req, res) => {
    const {ip, method, protocol, path, query, headers, body} = req;
    const routePrefix = req.route.path.replace('*', '');
    const routeRegex = new RegExp(`${routePrefix}/([^/\n]+)/?(.*)`);
    const matches = path.match(routeRegex);
    if (!matches) {
      res.status(500).end();
      return;
    }
    const [, forwardedHost, forwardedUrl] = matches;
    if (!forwardedHost) {
      res.status(400).end();
      return;
    }
    if (WHITELISTED_IPS.length && !WHITELISTED_IPS.includes(ip)) {
      res.status(403).end();
      return;
    }

    const forwardProto = (headers['x-forward-proto'] as string) || protocol;
    const forwardMethod: Method = (headers['x-forward-method'] as Method) || method;
    const forwardQuery = new URLSearchParams(query).toString();
    const forwardHeaders = filterIncomingHeaders(headers);
    const forwardedBody = ['GET', 'HEAD'].includes(forwardMethod) ? undefined : JSON.stringify(body);
    const finalUrl = `${forwardProto}://${forwardedHost}${forwardedUrl ? `/${forwardedUrl}` : ''}${
      forwardQuery ? `?${forwardQuery}` : ''
    }`;

    debug(
      `► Forwarding request with method=${chalkString(method)} to url=${chalkString(finalUrl)}, headers=${chalkJson(
        forwardHeaders
      )}${forwardedBody ? ` & body=${chalkJson(forwardedBody)}` : ''}`
    );

    try {
      const forwarded = await got(finalUrl, {
        method: forwardMethod,
        body: forwardedBody,
        headers: forwardHeaders,
        timeout: asNumber(FETCH_FORWARD_TIMEOUT),
        throwHttpErrors: false,
        decompress: false
      });
      debug(
        `◄  Forwarded request with method=${chalkString(method)} to url=${chalkString(finalUrl)}, headers=${chalkJson(
          forwardHeaders
        )}, statusCode=${chalkNumber(forwarded.statusCode)}`
      );

      filterOutgoingHeaders(res);
      Object.keys(forwarded.headers).forEach((name) => {
        res.header(name, forwarded.headers[name]);
      });

      res.status(forwarded.statusCode);
      const contentType = forwarded.headers['content-type'] ?? '';

      if (contentType.includes('application/json')) {
        try {
          res.type('json').send(JSON.parse(forwarded.body));
          return;
        } catch {
          res.send(forwarded.body);
          return;
        }
      }
      res.send(forwarded.body);
    } catch (err) {
      dir({err});
      res.status(500).end();
    }
  })
];
