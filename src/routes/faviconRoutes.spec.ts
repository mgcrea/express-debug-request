import express from 'express';
import request from 'supertest';
import {faviconRoutes} from './faviconRoutes';

const app = express();

app.all('/favicon.ico', ...faviconRoutes);

describe('GET /user', () => {
  it('responds with json', () =>
    request(app).get('/user').set('Accept', 'application/json').expect('Content-Type', /json/).expect(200));
});
