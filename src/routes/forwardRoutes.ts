import AbortController from 'abort-controller';
import {RequestHandler} from 'express';
import fetch from 'node-fetch';
import {FETCH_FORWARD_TIMEOUT, WHITELIST_FORWARD} from 'src/config/env';
import {asyncUtil} from 'src/utils/async';
import {asNumber} from 'src/utils/cast';
import {chalkJson, chalkString, chalkNumber} from 'src/utils/chalk';
import {debug, dir} from 'src/utils/log';

// Forwarding endpoint

const whitelistedIps = WHITELIST_FORWARD ? WHITELIST_FORWARD.split(',') : [];
const excludedIncomingHeaders = [
  'host',
  'connection',
  'content-length',
  'x-real-ip',
  'x-forwarded-for',
  'x-forwarded-proto',
  'x-forwarded-ssl',
  'x-forwarded-port',
  'x-forward-proto'
];
const excludedOutgoingHeaders = ['access-control-allow-origin', 'access-control-allow-credentials'];

export const forwardRoutes: RequestHandler[] = [
  asyncUtil(async (req, res) => {
    const {ip, method, protocol, url, query, headers, body} = req;
    const matches = url.match(/^\/forward\/([^/\n]+)\/(.*)/);
    if (!matches) {
      res.status(500).end();
      return;
    }
    const [, forwardedHost, forwardedUrl] = matches;
    if (!forwardedHost) {
      res.status(400).end();
      return;
    }
    if (whitelistedIps.length && !whitelistedIps.includes(ip)) {
      res.status(403).end();
      return;
    }

    const forwardProto = (headers['x-forward-proto'] as string) || protocol;
    const forwardMethod = (headers['x-forward-method'] as string) || method;
    const forwardQuery = new URLSearchParams(query).toString();
    const forwardHeaders = Object.keys(headers).reduce<Record<string, string>>((soFar, key) => {
      if (excludedIncomingHeaders.includes(key)) {
        return soFar;
      }
      soFar[key] = headers[key] as string;
      return soFar;
    }, {});
    const finalUrl = `${forwardProto}://${forwardedHost}${forwardedUrl ? `/${forwardedUrl}` : ''}${
      forwardQuery ? `?${forwardQuery}` : ''
    }`;

    debug(
      `► Forwarding request with method=${chalkString(method)} to url=${chalkString(finalUrl)}, headers=${chalkJson(
        forwardHeaders
      )}`
    );
    const controller = new AbortController();
    const timeout = setTimeout(controller.abort, asNumber(FETCH_FORWARD_TIMEOUT));

    try {
      const withoutBody = ['GET', 'HEAD'].includes(forwardMethod);
      const forwarded = await fetch(`${finalUrl}`, {
        method: forwardMethod,
        body: withoutBody ? undefined : JSON.stringify(body),
        headers: forwardHeaders,
        signal: controller.signal
      });
      debug(
        `◄  Forwarded request with method=${chalkString(method)} to url=${chalkString(finalUrl)}, headers=${chalkJson(
          forwardHeaders
        )}, status=${chalkNumber(forwarded.status)}, size=${chalkNumber(forwarded.size)}`
      );

      excludedOutgoingHeaders.forEach((key) => {
        res.removeHeader(key);
      });
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
