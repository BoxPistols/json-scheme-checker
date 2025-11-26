/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from 'vitest';

// 共通セットアップをインポート
import '../setup/content-upload-reviewer-setup.js';

import mod from '../../public/modules/content-upload-reviewer.js';
const ContentUploadReviewerManager = mod.ContentUploadReviewerManager || mod.default || mod;

// window.locationをモックするヘルパー
function mockHostname(hostname) {
  const originalLocation = window.location;
  delete window.location;
  window.location = {
    ...originalLocation,
    hostname: hostname,
    href: `http://${hostname}/`,
    origin: `http://${hostname}`,
  };
  return () => {
    window.location = originalLocation;
  };
}

describe('Content Upload Reviewer - API URL', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new ContentUploadReviewerManager();
  });

  describe('getApiUrl (BaseAdvisorManagerから継承)', () => {
    it('Vercel環境では /api/content-upload-reviewer を返す', () => {
      const restore = mockHostname('myapp.vercel.app');

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('/api/content-upload-reviewer');

      restore();
    });

    it('localhost環境では http://localhost:3333/api/content-upload-reviewer を返す', () => {
      const restore = mockHostname('localhost');

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://localhost:3333/api/content-upload-reviewer');

      restore();
    });

    it('127.0.0.1環境では http://localhost:3333/api/content-upload-reviewer を返す', () => {
      const restore = mockHostname('127.0.0.1');

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://localhost:3333/api/content-upload-reviewer');

      restore();
    });

    it('LAN環境ではIPアドレスを使用したURLを返す', () => {
      const restore = mockHostname('192.168.1.100');

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://192.168.1.100:3333/api/content-upload-reviewer');

      restore();
    });

    it('異なるエンドポイント名に対応', () => {
      const restore = mockHostname('localhost');

      expect(manager.getApiUrl('advisor')).toBe('http://localhost:3333/api/advisor');
      expect(manager.getApiUrl('blog-reviewer')).toBe('http://localhost:3333/api/blog-reviewer');
      expect(manager.getApiUrl('web-advisor')).toBe('http://localhost:3333/api/web-advisor');

      restore();
    });
  });

  describe('getProxyUrl', () => {
    it('Vercel環境では /proxy を使用', () => {
      const restore = mockHostname('myapp.vercel.app');

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('/proxy?url=https%3A%2F%2Fexample.com%2Fjob');

      restore();
    });

    it('localhost環境では http://localhost:3333/proxy を使用', () => {
      const restore = mockHostname('localhost');

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('http://localhost:3333/proxy?url=https%3A%2F%2Fexample.com%2Fjob');

      restore();
    });

    it('LAN環境ではIPアドレスを使用', () => {
      const restore = mockHostname('192.168.1.100');

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('http://192.168.1.100:3333/proxy?url=https%3A%2F%2Fexample.com%2Fjob');

      restore();
    });

    it('URLが正しくエンコードされる', () => {
      const restore = mockHostname('localhost');

      const urlWithSpecialChars = 'https://example.com/job?id=123&name=テスト';
      const proxyUrl = manager.getProxyUrl(urlWithSpecialChars);

      expect(proxyUrl).toContain('url=https%3A%2F%2Fexample.com');
      expect(decodeURIComponent(proxyUrl.split('url=')[1])).toBe(urlWithSpecialChars);

      restore();
    });
  });

  describe('環境判定ロジック', () => {
    it('vercel.appを含むホスト名をVercel環境と判定', () => {
      const testCases = ['myapp.vercel.app', 'staging.vercel.app', 'test-branch.vercel.app'];

      testCases.forEach(hostname => {
        const restore = mockHostname(hostname);

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toMatch(/^\/api\//);

        restore();
      });
    });

    it('localhost と 127.0.0.1 をローカル環境と判定', () => {
      ['localhost', '127.0.0.1'].forEach(hostname => {
        const restore = mockHostname(hostname);

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toBe('http://localhost:3333/api/test');

        restore();
      });
    });

    it('その他のホスト名をLAN環境と判定', () => {
      const lanHosts = ['192.168.1.1', '10.0.0.5', 'mypc.local'];

      lanHosts.forEach(hostname => {
        const restore = mockHostname(hostname);

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toBe(`http://${hostname}:3333/api/test`);

        restore();
      });
    });
  });
});
