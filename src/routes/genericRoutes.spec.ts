import express from 'express';
import request from 'supertest';
import {faviconRoutes} from './genericRoutes';

const app = express();

app.all('/favicon.ico', ...faviconRoutes);

describe('faviconRoutes', () => {
  it('properly send a favicon', () =>
    request(app).get('/favicon.ico').expect('Content-Type', 'image/x-icon').expect(200));
});
