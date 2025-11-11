import request from 'supertest';
import app from '../../server.js';
import { describe, it, expect } from 'vitest';

describe('Beta feature routes', () => {
  describe('GET /file', () => {
    it('ステータスコード200を返す', async () => {
      const res = await request(app).get('/file');
      expect(res.status).toBe(200);
    });

    it('Content-Typeがtext/htmlである', async () => {
      const res = await request(app).get('/file');
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    it('ページタイトルに「コンテンツアップロード」が含まれる', async () => {
      const res = await request(app).get('/file');
      expect(res.text).toContain('コンテンツアップロード');
    });

    it('トップページへのリンクが含まれる', async () => {
      const res = await request(app).get('/file');
      expect(res.text).toContain('トップページに戻る');
    });
  });

  describe('GET /skill', () => {
    it('ステータスコード200を返す', async () => {
      const res = await request(app).get('/skill');
      expect(res.status).toBe(200);
    });

    it('Content-Typeがtext/htmlである', async () => {
      const res = await request(app).get('/skill');
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });

    it('ページタイトルに「My Skill Sheet」が含まれる', async () => {
      const res = await request(app).get('/skill');
      expect(res.text).toContain('My Skill Sheet');
    });

    it('トップページへのリンクが含まれる', async () => {
      const res = await request(app).get('/skill');
      expect(res.text).toContain('トップページに戻る');
    });
  });

  describe('静的ファイルとの互換性', () => {
    it('GET /file.html も正常に動作する', async () => {
      const res = await request(app).get('/file.html');
      expect(res.status).toBe(200);
      expect(res.text).toContain('コンテンツアップロード');
    });

    it('GET /skill.html も正常に動作する', async () => {
      const res = await request(app).get('/skill.html');
      expect(res.status).toBe(200);
      expect(res.text).toContain('My Skill Sheet');
    });
  });
});
