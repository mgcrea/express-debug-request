import {RequestHandler} from 'express';
import {readFileSync} from 'fs';

const favicon = readFileSync(`${__dirname}/../assets/favicon.ico`);
const expires = 864e2 * 30;

export const faviconRoutes: RequestHandler[] = [
  (_req, res) => {
    res.header('Content-Length', `${favicon.length}`);
    res.header('Content-Type', 'image/x-icon');
    res.header('Cache-Control', `public, max-age=${expires}`);
    res.header('Expires', new Date(Date.now() + expires * 1000).toUTCString());
    res.status(200).send(favicon);
  }
];

export const robotRoutes: RequestHandler[] = [
  (_req, res) => {
    res.header('Content-Type', 'text/plain');
    res.send('User-agent: *\nDisallow: /');
    res.status(200).send('User-agent: *\nDisallow: /');
  }
];
