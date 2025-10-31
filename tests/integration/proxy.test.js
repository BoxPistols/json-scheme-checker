import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('Proxy endpoint', () => {
  it('GET /proxy without url returns 400', async () => {
    const res = await request(app).get('/proxy');
    expect(res.status).toBe(400);
  });
});
