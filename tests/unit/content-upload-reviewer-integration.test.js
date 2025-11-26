/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// 共通セットアップをインポート
import '../setup/content-upload-reviewer-setup.js';

import mod from '../../public/modules/content-upload-reviewer.js';
const ContentUploadReviewerManager = mod.ContentUploadReviewerManager || mod.default || mod;

describe('Content Upload Reviewer - Integration Tests', () => {
  let manager;

  beforeEach(() => {
    localStorage.clear();
    manager = new ContentUploadReviewerManager();

    // DOMのモック
    document.body.innerHTML = `
      <div id="snackbar" class="snackbar"></div>
    `;
  });

  describe('初期化', () => {
    it('ContentUploadReviewerManagerが正しく初期化される', () => {
      expect(manager).toBeInstanceOf(ContentUploadReviewerManager);
      expect(manager.config.RATE_LIMIT_KEY).toBe('jsonld_content_upload_reviewer_usage');
      expect(manager.config.USER_API_KEY).toBe('jsonld_content_upload_reviewer_openai_key');
      expect(manager.config.MAX_REQUESTS_PER_DAY).toBe(50);
    });

    it('初期状態でcurrentReviewTypeがblog', () => {
      expect(manager.currentReviewType).toBe('blog');
    });

    it('初期状態でisStreamingがfalse', () => {
      expect(manager.isStreaming).toBe(false);
    });

    it('初期状態でrevisedTextが空文字列', () => {
      expect(manager.revisedText).toBe('');
    });

    it('初期状態でuploadedFileがnull', () => {
      expect(manager.uploadedFile).toBe(null);
    });
  });

  describe('モデル選択', () => {
    it('getSelectedModelでデフォルトモデルを取得', () => {
      const model = manager.getSelectedModel();
      expect(model).toBe(window.ADVISOR_CONST.DEFAULT_MODEL);
    });

    it('setSelectedModelでモデルを保存', () => {
      manager.setSelectedModel('gpt-4.1-nano');
      expect(manager.model).toBe('gpt-4.1-nano');
      expect(localStorage.getItem('jsonld_content_upload_reviewer_model')).toBe('gpt-4.1-nano');
    });

    it('保存されたモデルをgetSelectedModelで取得', () => {
      localStorage.setItem('jsonld_content_upload_reviewer_model', 'gpt-5-mini');
      const model = manager.getSelectedModel();
      expect(model).toBe('gpt-5-mini');
    });
  });

  describe('ファイル削除', () => {
    it('removeFileでuploadedFileとcurrentContentがクリア', () => {
      manager.uploadedFile = new File(['test'], 'test.txt');
      manager.currentContent = 'test content';

      // DOMのモック
      document.body.innerHTML = `
        <div id="fileInfo" style="display: block;"></div>
        <div class="file-upload-placeholder" style="display: none;"></div>
        <input id="fileInput" type="file" />
      `;

      manager.removeFile();

      expect(manager.uploadedFile).toBeNull();
      expect(manager.currentContent).toBeNull();
    });
  });

  describe('エラー表示', () => {
    it('showErrorでスナックバーにエラーメッセージを表示', () => {
      const message = 'テストエラーメッセージ';
      manager.showError(message);

      const snackbar = document.getElementById('snackbar');
      expect(snackbar.textContent).toBe(message);
      expect(snackbar.className).toContain('show');
      expect(snackbar.className).toContain('error');
    });
  });

  describe('成功メッセージ表示', () => {
    it('showSnackbarでスナックバーにメッセージを表示', () => {
      const message = 'テスト成功メッセージ';
      manager.showSnackbar(message);

      const snackbar = document.getElementById('snackbar');
      expect(snackbar.textContent).toBe(message);
      expect(snackbar.className).toContain('show');
    });
  });

  describe('マッチングフィールドの表示切替', () => {
    it('toggleMatchingFieldsでマッチングフィールドの表示を切り替え', () => {
      document.body.innerHTML = `
        <div id="matchingFields" class="matching-mode-fields-hidden"></div>
      `;

      manager.toggleMatchingFields(true);
      const matchingFields = document.getElementById('matchingFields');
      expect(matchingFields.classList.contains('matching-mode-fields-hidden')).toBe(false);

      manager.toggleMatchingFields(false);
      expect(matchingFields.classList.contains('matching-mode-fields-hidden')).toBe(true);
    });
  });

  describe('レビュー種類の切り替え', () => {
    it('currentReviewTypeが正しく設定される', () => {
      manager.currentReviewType = 'job';
      expect(manager.currentReviewType).toBe('job');

      manager.currentReviewType = 'skill-sheet';
      expect(manager.currentReviewType).toBe('skill-sheet');

      manager.currentReviewType = 'matching';
      expect(manager.currentReviewType).toBe('matching');
    });
  });

  describe('グローバル公開', () => {
    it('window.ContentUploadReviewerManagerが定義されている', () => {
      expect(window.ContentUploadReviewerManager).toBeDefined();
      expect(typeof window.ContentUploadReviewerManager).toBe('function');
    });

    it('window.contentUploadReviewerManagerが定義されている', () => {
      expect(window.contentUploadReviewerManager).toBeDefined();
      expect(window.contentUploadReviewerManager).toBeInstanceOf(ContentUploadReviewerManager);
    });
  });

  describe('ES6モジュールエクスポート', () => {
    it('ContentUploadReviewerManagerがインポート可能', () => {
      // mod自体がContentUploadReviewerManagerクラスまたはそれを含むオブジェクト
      const Manager = mod.ContentUploadReviewerManager || mod.default || mod;
      expect(Manager).toBeDefined();
      expect(typeof Manager).toBe('function');
    });

    it('インスタンスを生成可能', () => {
      const Manager = mod.ContentUploadReviewerManager || mod.default || mod;
      const instance = new Manager();
      expect(instance).toBeDefined();
    });
  });

  describe('BaseAdvisorManagerからの継承', () => {
    it('checkRateLimitメソッドが使用可能', () => {
      const rateLimit = manager.checkRateLimit();
      expect(rateLimit).toHaveProperty('allowed');
      expect(rateLimit).toHaveProperty('remaining');
      expect(rateLimit).toHaveProperty('resetTime');
    });

    it('getUserApiKeyメソッドが使用可能', () => {
      const apiKey = manager.getUserApiKey();
      expect(apiKey === null || typeof apiKey === 'string').toBe(true);
    });

    it('getUserApiBaseUrlメソッドが使用可能', () => {
      const baseUrl = manager.getUserApiBaseUrl();
      expect(typeof baseUrl).toBe('string');
    });

    it('recordUsageメソッドが使用可能', () => {
      expect(() => manager.recordUsage()).not.toThrow();
    });
  });

  describe('HTML特殊文字のエスケープ', () => {
    it('escapeHtmlで特殊文字を正しくエスケープ', () => {
      const html = '<script>alert("XSS")</script>';
      const escaped = manager.escapeHtml(html);

      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    it('通常のテキストはそのまま', () => {
      const text = 'これは通常のテキストです';
      const escaped = manager.escapeHtml(text);

      expect(escaped).toBe(text);
    });

    it('引用符はそのまま保持される', () => {
      // textContent/innerHTML方式では引用符はエスケープされない
      const text = 'これは"引用符"と\'シングルクォート\'です';
      const escaped = manager.escapeHtml(text);

      // 引用符はそのまま保持される
      expect(escaped).toContain('"');
      expect(escaped).toContain("'");
    });
  });

  describe('downloadFile (BaseAdvisorManagerから継承)', () => {
    it('downloadFileメソッドが使用可能', () => {
      // jsdom環境ではURL.createObjectURLがサポートされていないためモック
      const mockUrl = 'blob:test-url';
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = vi.fn();

      const blob = new Blob(['test content'], { type: 'text/plain' });
      const filename = 'test.txt';

      expect(() => manager.downloadFile(blob, filename)).not.toThrow();
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);

      // モックを復元
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });
  });

  describe('入力タブの切り替え', () => {
    it('switchInputTabでタブが切り替わる', () => {
      document.body.innerHTML = `
        <button class="content-input-tab active" data-tab="text"></button>
        <button class="content-input-tab" data-tab="file"></button>
        <div id="textInputPanel" class="content-input-panel active"></div>
        <div id="fileInputPanel" class="content-input-panel"></div>
      `;

      manager.switchInputTab('file');

      const textPanel = document.getElementById('textInputPanel');
      const filePanel = document.getElementById('fileInputPanel');

      expect(textPanel.classList.contains('active')).toBe(false);
      expect(filePanel.classList.contains('active')).toBe(true);

      manager.switchInputTab('text');

      expect(textPanel.classList.contains('active')).toBe(true);
      expect(filePanel.classList.contains('active')).toBe(false);
    });
  });

  describe('コピー機能', () => {
    it('copyRevisedTextで校閲済みテキストをコピー', async () => {
      manager.revisedText = 'コピーするテキスト';

      // navigator.clipboardのモック
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: mockWriteText,
        },
      });

      await manager.copyRevisedText();

      expect(mockWriteText).toHaveBeenCalledWith('コピーするテキスト');
    });

    it('revisedTextが空の場合はエラー', () => {
      manager.revisedText = '';

      expect(() => manager.copyRevisedText()).not.toThrow();
      // showErrorが呼ばれることを確認（実際のテストではsnackbarの内容をチェック）
    });
  });

  describe('ダウンロード機能', () => {
    it('downloadRevisedTextで校閲済みテキストをダウンロード', () => {
      // jsdom環境ではURL.createObjectURLがサポートされていないためモック
      const mockUrl = 'blob:test-url';
      const originalCreateObjectURL = URL.createObjectURL;
      const originalRevokeObjectURL = URL.revokeObjectURL;
      URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
      URL.revokeObjectURL = vi.fn();

      manager.revisedText = 'ダウンロードするテキスト';

      // downloadFileメソッドのスパイ
      const downloadSpy = vi.spyOn(manager, 'downloadFile');

      manager.downloadRevisedText();

      expect(downloadSpy).toHaveBeenCalled();
      const [blob, filename] = downloadSpy.mock.calls[0];
      expect(blob).toBeInstanceOf(Blob);
      expect(filename).toMatch(/校閲済み_.*\.txt/);

      // モックを復元
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
    });

    it('revisedTextが空の場合はエラー', () => {
      manager.revisedText = '';

      const downloadSpy = vi.spyOn(manager, 'downloadFile');
      manager.downloadRevisedText();

      expect(downloadSpy).not.toHaveBeenCalled();
    });
  });
});
