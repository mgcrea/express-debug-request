import {RequestHandler} from 'express';
import {asNumber} from 'src/utils/cast';
import {assert} from 'src/utils/assert';

export const statusRoutes: RequestHandler[] = [
  (req, res) => {
    if (!req.params[1]) {
      res.status(asNumber(req.params[0])).send();
      return;
    }
    assert(req.session);
    req.session.statusIndex = ((req.session.statusIndex ?? 1) + 1) % 2;
    res.status(asNumber(req.params[req.session.statusIndex])).send();
  }
];
