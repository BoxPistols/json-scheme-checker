import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('Extract JSON-LD endpoint', () => {
  it('POST /extract-jsonld without url returns 400', async () => {
    const res = await request(app).post('/extract-jsonld').send({});
    expect(res.status).toBe(400);
  });
});
