import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Web Advisor security', () => {
  it('blocks private IP by default (SSRF)', async () => {
    const res = await request(app)
      .get('/api/web-advisor')
      .query({ url: 'http://127.0.0.1:80' });
    expect([400, 403]).toContain(res.status);
  });

  it('rejects invalid session token', async () => {
    const res = await request(app)
      .get('/api/web-advisor')
      .query({ url: 'https://example.com', sessionToken: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('creates session token via POST', async () => {
    const res = await request(app)
      .post('/api/web-advisor/session')
      .send({ userApiKey: 'sk-test', model: 'gpt-4o-mini' })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.sessionToken).toBeTruthy();
  });
});
