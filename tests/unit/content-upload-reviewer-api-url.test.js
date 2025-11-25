/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 共通セットアップをインポート
import '../setup/content-upload-reviewer-setup.js';

import mod from '../../public/modules/content-upload-reviewer.js';
const ContentUploadReviewerManager = mod.ContentUploadReviewerManager || mod.default || mod;

describe('Content Upload Reviewer - API URL', () => {
  let manager;
  let originalLocation;

  beforeEach(() => {
    localStorage.clear();
    manager = new ContentUploadReviewerManager();
    originalLocation = window.location;
  });

  afterEach(() => {
    // window.locationを復元
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });

  describe('getApiUrl (BaseAdvisorManagerから継承)', () => {
    it('Vercel環境では /api/content-upload-reviewer を返す', () => {
      // window.locationをモック
      delete window.location;
      window.location = { hostname: 'myapp.vercel.app' };

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('/api/content-upload-reviewer');
    });

    it('localhost環境では http://localhost:3333/api/content-upload-reviewer を返す', () => {
      delete window.location;
      window.location = { hostname: 'localhost' };

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://localhost:3333/api/content-upload-reviewer');
    });

    it('127.0.0.1環境では http://localhost:3333/api/content-upload-reviewer を返す', () => {
      delete window.location;
      window.location = { hostname: '127.0.0.1' };

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://localhost:3333/api/content-upload-reviewer');
    });

    it('LAN環境ではIPアドレスを使用したURLを返す', () => {
      delete window.location;
      window.location = { hostname: '192.168.1.100' };

      const apiUrl = manager.getApiUrl('content-upload-reviewer');
      expect(apiUrl).toBe('http://192.168.1.100:3333/api/content-upload-reviewer');
    });

    it('異なるエンドポイント名に対応', () => {
      delete window.location;
      window.location = { hostname: 'localhost' };

      expect(manager.getApiUrl('advisor')).toBe('http://localhost:3333/api/advisor');
      expect(manager.getApiUrl('blog-reviewer')).toBe('http://localhost:3333/api/blog-reviewer');
      expect(manager.getApiUrl('web-advisor')).toBe('http://localhost:3333/api/web-advisor');
    });
  });

  describe('getProxyUrl', () => {
    it('Vercel環境では /proxy を使用', () => {
      delete window.location;
      window.location = { hostname: 'myapp.vercel.app' };

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('/proxy?url=https%3A%2F%2Fexample.com%2Fjob');
    });

    it('localhost環境では http://localhost:3333/proxy を使用', () => {
      delete window.location;
      window.location = { hostname: 'localhost' };

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('http://localhost:3333/proxy?url=https%3A%2F%2Fexample.com%2Fjob');
    });

    it('LAN環境ではIPアドレスを使用', () => {
      delete window.location;
      window.location = { hostname: '192.168.1.100' };

      const proxyUrl = manager.getProxyUrl('https://example.com/job');
      expect(proxyUrl).toBe('http://192.168.1.100:3333/proxy?url=https%3A%2F%2Fexample.com%2Fjob');
    });

    it('URLが正しくエンコードされる', () => {
      delete window.location;
      window.location = { hostname: 'localhost' };

      const urlWithSpecialChars = 'https://example.com/job?id=123&name=テスト';
      const proxyUrl = manager.getProxyUrl(urlWithSpecialChars);

      expect(proxyUrl).toContain('url=https%3A%2F%2Fexample.com');
      expect(decodeURIComponent(proxyUrl.split('url=')[1])).toBe(urlWithSpecialChars);
    });
  });

  describe('環境判定ロジック', () => {
    it('vercel.appを含むホスト名をVercel環境と判定', () => {
      const testCases = ['myapp.vercel.app', 'staging.vercel.app', 'test-branch.vercel.app'];

      testCases.forEach(hostname => {
        delete window.location;
        window.location = { hostname };

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toMatch(/^\/api\//);
      });
    });

    it('localhost と 127.0.0.1 をローカル環境と判定', () => {
      ['localhost', '127.0.0.1'].forEach(hostname => {
        delete window.location;
        window.location = { hostname };

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toBe('http://localhost:3333/api/test');
      });
    });

    it('その他のホスト名をLAN環境と判定', () => {
      const lanHosts = ['192.168.1.1', '10.0.0.5', 'mypc.local'];

      lanHosts.forEach(hostname => {
        delete window.location;
        window.location = { hostname };

        const apiUrl = manager.getApiUrl('test');
        expect(apiUrl).toBe(`http://${hostname}:3333/api/test`);
      });
    });
  });
});
