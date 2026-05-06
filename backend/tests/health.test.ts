import request from 'supertest';

import app from '../src/app.js';

describe('GET /health', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});

describe('GET /saude', () => {
  it('should return status ok', async () => {
    const response = await request(app).get('/saude');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok' });
  });
});
