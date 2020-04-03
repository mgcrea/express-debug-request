import AbortController from 'abort-controller';
import {RequestHandler} from 'express';
import fetch from 'node-fetch';
import {FETCH_FORWARD_TIMEOUT} from 'src/config/env';
import {asyncUtil} from 'src/utils/async';
import {asNumber} from 'src/utils/cast';
import {chalkJson, chalkNumber, chalkString} from 'src/utils/chalk';
import {
  EXCLUDED_OUTGOING_HEADERS,
  WHITELISTED_IPS,
  filterIncomingHeaders,
  filterOutgoingHeaders,
  forwardResolver
} from 'src/utils/forward';
import {debug, dir} from 'src/utils/log';

export const forwardFetchRoutes: RequestHandler[] = [
  forwardResolver,
  asyncUtil(async (req, res) => {
    const {ip, method, protocol, path, query, headers, body} = req;
    dir({host: req.host, url: req.url, hostname: req.hostname, path: req.path});
    const routePrefix = req.route.path.replace('*', '');
    const routeRegex = new RegExp(`${routePrefix}/([^/\n]+)/(.*)`);
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
    dir({host: req.host, url: req.url, hostname: req.hostname, path: req.path});

    const forwardProto = (headers['x-forward-proto'] as string) || protocol;
    const forwardMethod = (headers['x-forward-method'] as string) || method;
    const forwardQuery = new URLSearchParams(query).toString();
    const forwardHeaders = filterIncomingHeaders(headers) as Record<string, string>;
    const forwardedBody = ['GET', 'HEAD'].includes(forwardMethod) ? undefined : JSON.stringify(body);
    const finalUrl = `${forwardProto}://${forwardedHost}${forwardedUrl ? `/${forwardedUrl}` : ''}${
      forwardQuery ? `?${forwardQuery}` : ''
    }`;

    debug(
      `► Forwarding request with method=${chalkString(method)} to url=${chalkString(finalUrl)}, headers=${chalkJson(
        forwardHeaders
      )}${forwardedBody ? ` & body=${chalkJson(forwardedBody)}` : ''}`
    );
    const controller = new AbortController();
    const timeout = setTimeout(controller.abort, asNumber(FETCH_FORWARD_TIMEOUT));

    try {
      const forwarded = await fetch(finalUrl, {
        method: forwardMethod,
        body: forwardedBody,
        headers: forwardHeaders,
        signal: controller.signal
      });
      debug(
        `◄  Forwarded request with method=${chalkString(method)} to url=${chalkString(finalUrl)}, status=${chalkNumber(
          forwarded.status
        )}`
      );

      filterOutgoingHeaders(res);
      forwarded.headers.forEach((value, name) => {
        res.header(name, value);
      });

      res.status(forwarded.status);
      const contentType = forwarded.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const cloned = forwarded.clone();
        try {
          res.type('json').send(await cloned.json());
          return;
        } catch {
          res.send(await cloned.text());
          return;
        }
      }
      res.send(await forwarded.text());
    } catch (err) {
      dir(err);
      res.status(500).end();
    } finally {
      clearTimeout(timeout);
    }
  })
];
