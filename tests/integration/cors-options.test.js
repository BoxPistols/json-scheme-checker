import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('CORS and OPTIONS handling', () => {
  it('OPTIONS /api/test-connection returns 200 with CORS headers', async () => {
    const res = await request(app).options('/api/test-connection').set('Origin', 'http://example.com');
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
    expect(res.headers['access-control-allow-methods']).toContain('OPTIONS');
  });
});
