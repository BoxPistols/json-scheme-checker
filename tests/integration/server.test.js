import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('Server endpoints', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('POST /api/test-connection without key returns 400', async () => {
    const res = await request(app).post('/api/test-connection').send({});
    expect(res.status).toBe(400);
    expect(res.body.ok).toBe(false);
  });
});
