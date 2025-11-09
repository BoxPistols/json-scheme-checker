/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import mod from '../../public/modules/content-upload-reviewer.js';
const ContentUploadReviewerManager =
  mod.ContentUploadReviewerManager || mod.default || mod;

describe('Content Upload Reviewer - API URL', () => {
  let manager;
  let originalHostname;

  beforeEach(() => {
    localStorage.clear();
    manager = new ContentUploadReviewerManager();
    originalHostname = window.location.hostname;
  });

  describe('getApiUrl (BaseAdvisorManagerから継承)', () => {
    it('Vercel環境では /api/content-upload-reviewer を返す', () => {
      // window.location.hostnameをモック
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'myapp.vercel.app',
      });

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('/api/content-upload-reviewer');

      // 元に戻す
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('localhost環境では http://localhost:3333/api/content-upload-reviewer を返す', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'localhost',
      });

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://localhost:3333/api/content-upload-reviewer');

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('127.0.0.1環境では http://localhost:3333/api/content-upload-reviewer を返す', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: '127.0.0.1',
      });

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://localhost:3333/api/content-upload-reviewer');

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('LAN環境ではIPアドレスを使用したURLを返す', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: '192.168.1.100',
      });

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://192.168.1.100:3333/api/content-upload-reviewer');

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('異なるエンドポイント名に対応', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'localhost',
      });

      expect(manager.getApiUrl('advisor')).toBe('http://localhost:3333/api/advisor');
      expect(manager.getApiUrl('blog-reviewer')).toBe(
        'http://localhost:3333/api/blog-reviewer'
      );
      expect(manager.getApiUrl('web-advisor')).toBe('http://localhost:3333/api/web-advisor');

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });
  });

  describe('getProxyUrl', () => {
    it('Vercel環境では /proxy を使用', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'myapp.vercel.app',
      });

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('/proxy?url=https%3A%2F%2Fexample.com%2Fjob');

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('localhost環境では http://localhost:3333/proxy を使用', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'localhost',
      });

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe(
        'http://localhost:3333/proxy?url=https%3A%2F%2Fexample.com%2Fjob'
      );

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('LAN環境ではIPアドレスを使用', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: '192.168.1.100',
      });

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe(
        'http://192.168.1.100:3333/proxy?url=https%3A%2F%2Fexample.com%2Fjob'
      );

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('URLが正しくエンコードされる', () => {
      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: 'localhost',
      });

      const urlWithSpecialChars = 'https://example.com/job?id=123&name=テスト';
      const proxyUrl = manager.getProxyUrl(urlWithSpecialChars);

      expect(proxyUrl).toContain('url=https%3A%2F%2Fexample.com');
      expect(decodeURIComponent(proxyUrl.split('url=')[1])).toBe(urlWithSpecialChars);

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });
  });

  describe('環境判定ロジック', () => {
    it('vercel.appを含むホスト名をVercel環境と判定', () => {
      const testCases = [
        'myapp.vercel.app',
        'staging.vercel.app',
        'test-branch.vercel.app',
      ];

      testCases.forEach(hostname => {
        Object.defineProperty(window.location, 'hostname', {
          writable: true,
          value: hostname,
        });

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toMatch(/^\/api\//);
      });

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('localhost と 127.0.0.1 をローカル環境と判定', () => {
      ['localhost', '127.0.0.1'].forEach(hostname => {
        Object.defineProperty(window.location, 'hostname', {
          writable: true,
          value: hostname,
        });

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toBe('http://localhost:3333/api/test');
      });

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });

    it('その他のホスト名をLAN環境と判定', () => {
      const lanHosts = ['192.168.1.1', '10.0.0.5', 'mypc.local'];

      lanHosts.forEach(hostname => {
        Object.defineProperty(window.location, 'hostname', {
          writable: true,
          value: hostname,
        });

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toBe(`http://${hostname}:3333/api/test`);
      });

      Object.defineProperty(window.location, 'hostname', {
        writable: true,
        value: originalHostname,
      });
    });
  });
});
