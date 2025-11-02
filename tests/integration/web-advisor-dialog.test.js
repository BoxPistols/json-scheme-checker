/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Web Advisor Dialog - UI Simplification', () => {
  let mockWebAdvisorManager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="container"></div>
      <div id="aiActions"></div>
    `;

    // Mock WebAdvisorManager
    mockWebAdvisorManager = {
      checkRateLimit: vi.fn(() => ({
        mode: 'normal',
        allowed: true,
        remaining: 5,
        maxRequests: 10,
      })),
      showConfirmDialog: function () {
        const rateLimit = this.checkRateLimit();

        let rateLimitHtml = '';
        if (rateLimit.mode === 'developer') {
          rateLimitHtml =
            '<div class="advisor-rate-info advisor-rate-unlimited">MyAPIモード（無制限）</div>';
        } else {
          if (!rateLimit.allowed) {
            const resetTimeStr = '不明';
            rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
          } else {
            rateLimitHtml = `<div class="advisor-rate-info">残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
          }
        }

        const overlay = document.createElement('div');
        overlay.id = 'webAdvisorConfirmOverlay';
        overlay.className = 'advisor-overlay';
        overlay.innerHTML = `
          <div class="advisor-modal">
            <div class="advisor-modal-header">
              <h2>Webページ分析</h2>
              <button type="button" class="advisor-modal-close" data-action="web-close-confirm-dialog">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="advisor-modal-body">
              ${rateLimitHtml}
              <p class="advisor-modal-text advisor-center advisor-muted">SEO/EEAT/アクセシビリティ観点で対象ページを分析します。</p>
              <div class="advisor-confirm-buttons">
                <button type="button" class="advisor-btn-secondary" data-action="web-close-confirm-dialog">キャンセル</button>
                <button type="button" class="advisor-btn-primary" data-action="web-start-analysis">レビュー開始</button>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(overlay);
      },
    };

    global.webAdvisorManager = mockWebAdvisorManager;
  });

  describe('Dialog UI - No Mode Buttons', () => {
    it('should NOT display mode buttons (通常モード, 関係者, MyAPI) in dialog', () => {
      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');
      expect(overlay).toBeTruthy();

      // Mode buttons should NOT exist
      const modeButtons = overlay.querySelector('.advisor-mode-buttons-small');
      expect(modeButtons).toBeFalsy();

      // Individual mode buttons should NOT exist
      const normalModeBtn = overlay.querySelector('[data-action="web-reset-to-normal-mode"]');
      const stakeholderBtn = overlay.querySelector('[data-action="web-show-stakeholder-prompt"]');
      const developerBtn = overlay.querySelector('[data-action="web-show-developer-prompt"]');

      expect(normalModeBtn).toBeFalsy();
      expect(stakeholderBtn).toBeFalsy();
      expect(developerBtn).toBeFalsy();
    });

    it('should display simple header with title and close button only', () => {
      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');
      const header = overlay.querySelector('.advisor-modal-header');

      expect(header).toBeTruthy();

      // Should have title
      const title = header.querySelector('h2');
      expect(title).toBeTruthy();
      expect(title.textContent).toBe('Webページ分析');

      // Should have close button
      const closeBtn = header.querySelector('.advisor-modal-close');
      expect(closeBtn).toBeTruthy();
      expect(closeBtn.getAttribute('data-action')).toBe('web-close-confirm-dialog');

      // Should NOT have stack class
      expect(header.classList.contains('advisor-modal-header--stack')).toBeFalsy();
    });

    it('should still display rate limit information', () => {
      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');
      const rateInfo = overlay.querySelector('.advisor-rate-info');

      expect(rateInfo).toBeTruthy();
      expect(rateInfo.textContent).toContain('残り 5 回 / 10 回');
    });

    it('should display action buttons (cancel and start)', () => {
      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');

      const cancelBtn = overlay.querySelector('.advisor-btn-secondary');
      expect(cancelBtn).toBeTruthy();
      expect(cancelBtn.textContent).toBe('キャンセル');
      expect(cancelBtn.getAttribute('data-action')).toBe('web-close-confirm-dialog');

      const startBtn = overlay.querySelector('.advisor-btn-primary');
      expect(startBtn).toBeTruthy();
      expect(startBtn.textContent).toBe('レビュー開始');
      expect(startBtn.getAttribute('data-action')).toBe('web-start-analysis');
    });

    it('should display description text', () => {
      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');
      const description = overlay.querySelector('.advisor-modal-text');

      expect(description).toBeTruthy();
      expect(description.textContent).toContain('SEO/EEAT/アクセシビリティ観点で対象ページを分析します');
    });
  });

  describe('Developer Mode Rate Limit Display', () => {
    it('should display MyAPIモード（無制限） when in developer mode', () => {
      mockWebAdvisorManager.checkRateLimit = vi.fn(() => ({
        mode: 'developer',
        allowed: true,
        remaining: null,
        maxRequests: null,
      }));

      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');
      const rateInfo = overlay.querySelector('.advisor-rate-info');

      expect(rateInfo).toBeTruthy();
      expect(rateInfo.classList.contains('advisor-rate-unlimited')).toBeTruthy();
      expect(rateInfo.textContent).toBe('MyAPIモード（無制限）');
    });
  });

  describe('Rate Limit Exceeded Display', () => {
    it('should display rate limit exceeded message when not allowed', () => {
      mockWebAdvisorManager.checkRateLimit = vi.fn(() => ({
        mode: 'normal',
        allowed: false,
        remaining: 0,
        maxRequests: 10,
        resetTime: null,
      }));

      webAdvisorManager.showConfirmDialog();

      const overlay = document.getElementById('webAdvisorConfirmOverlay');
      const rateInfo = overlay.querySelector('.advisor-rate-info');

      expect(rateInfo).toBeTruthy();
      expect(rateInfo.classList.contains('advisor-rate-exceeded')).toBeTruthy();
      expect(rateInfo.textContent).toContain('利用制限に達しました');
    });
  });
});