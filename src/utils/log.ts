import console from 'console';
import createDebug from 'debug';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import {name} from './../../package.json';

export const debug = createDebug(name);

export const log = (...args: unknown[]) => {
  console.log(...args);
};

export const dir = (...args: unknown[]) => {
  console.dir(args.length > 1 ? args : args, {colors: true, depth: 10});
};
