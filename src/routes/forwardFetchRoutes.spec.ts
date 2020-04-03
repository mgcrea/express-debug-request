import express from 'express';
import request from 'supertest';
import {forwardFetchRoutes} from './forwardFetchRoutes';
import nock from 'nock';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

app.all('/forward*', ...forwardFetchRoutes);

describe('forwardFetchRoutes', () => {
  it('properly forward requests', () => {
    nock(`https://github.com:443`)
      .get('/mgcrea/express-debug-request')
      .query({foo: 'bar', baz: 'qux'})
      .once()
      .reply(200, 'Hello World', ['Y-Test', '1']);
    return request(app)
      .get('/forward/github.com/mgcrea/express-debug-request?foo=bar&baz=qux')
      .set('X-Forward-Proto', 'https')
      .set('X-Test', '1')
      .expect('Y-Test', '1')
      .expect(200, 'Hello World');
  });
  it('properly forward json', () => {
    nock(`https://github.com:443`)
      .post('/mgcrea/express-debug-request', {name: /.+/})
      .query({foo: 'bar', baz: 'qux'})
      .once()
      .reply(200, {foo: 'bar'}, ['Y-Test', '2']);
    return request(app)
      .post('/forward/github.com/mgcrea/express-debug-request?foo=bar&baz=qux')
      .send({name: 'john'})
      .set('Content-Type', 'application/json')
      .set('X-Forward-Proto', 'https')
      .set('X-Test', '2')
      .expect('Y-Test', '2')
      .expect(200, {foo: 'bar'});
  });
  it('properly forward errors', () => {
    nock(`https://github.com:443`)
      .get('/mgcrea/express-debug-request')
      .query({foo: 'bar', baz: 'qux'})
      .once()
      .reply(401, 'Unauthorized', ['Y-Test', '3']);
    return request(app)
      .get('/forward/github.com/mgcrea/express-debug-request?foo=bar&baz=qux')
      .set('X-Forward-Proto', 'https')
      .set('X-Test', '3')
      .expect('Y-Test', '3')
      .expect(401, 'Unauthorized');
  });
});
