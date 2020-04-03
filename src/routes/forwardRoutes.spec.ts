import express from 'express';
import request from 'supertest';
import {forwardRoutes} from './forwardRoutes';
import nock from 'nock';

const app = express();

app.all('/forward*', ...forwardRoutes);

describe('forwardRoutes', () => {
  it('properly forward requests', () => {
    nock(`https://mediation.tydom.com:443`)
      .get('/mediation/client')
      .query({foo: 'bar', baz: 'qux'})
      .once()
      .reply(200, 'Hello World', ['X-Test', 'foobarbaz']);
    return request(app)
      .get('/forward/mediation.tydom.com/mediation/client?foo=bar&baz=qux')
      .set('X-Forward-Proto', 'https')
      .expect('X-Test', 'foobarbaz')
      .expect(200, 'Hello World');
  });
  it('properly forward errors', () => {
    nock(`https://mediation.tydom.com:443`)
      .get('/mediation/client')
      .query({foo: 'bar', baz: 'qux'})
      .once()
      .reply(401, 'Unauthorized', ['X-Test', 'foobarbaz']);
    return request(app)
      .get('/forward/mediation.tydom.com/mediation/client?foo=bar&baz=qux')
      .set('X-Forward-Proto', 'https')
      .expect('X-Test', 'foobarbaz')
      .expect(401, 'Unauthorized');
  });
});
