import {RequestHandler, NextFunction} from 'express';

export const asyncUtil = (fn: RequestHandler): RequestHandler =>
  function asyncUtilWrap(...args) {
    const fnReturn = fn(...args);
    const next = args[args.length - 1] as NextFunction;
    return Promise.resolve(fnReturn).catch(next);
  };
