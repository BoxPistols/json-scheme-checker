import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('Test-connection methods and headers', () => {
  it('GET /api/test-connection returns 404/405 (no GET handler)', async () => {
    const res = await request(app).get('/api/test-connection');
    expect([404,405]).toContain(res.status);
  });

  it('POST /api/test-connection without key returns CORS headers', async () => {
    const res = await request(app).post('/api/test-connection').set('Origin', 'http://example.com').send({});
    expect(res.status).toBe(400);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });
});
