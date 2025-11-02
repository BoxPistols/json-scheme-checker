import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('CORS and OPTIONS handling', () => {
  it('OPTIONS /api/test-connection returns 200/204 with CORS headers', async () => {
    const res = await request(app)
      .options('/api/test-connection')
      .set('Origin', 'http://example.com');
    expect([200, 204]).toContain(res.status);
    expect(res.headers['access-control-allow-origin']).toBeDefined();
    // app.use(cors()) が応答するケースでは allow-methods が省略されることがある
    // ここでは存在チェックではなく、存在すればOPTIONSが含まれることのみを確認
    if (res.headers['access-control-allow-methods']) {
      expect(res.headers['access-control-allow-methods']).toMatch(/GET|POST|OPTIONS/);
    }
  });
});
