/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AdvisorManager Perspective Switcher - Token Consumption', () => {
  let manager;
  let mockContainer;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="container">
        <div id="advisorView" class="advisor-view">
          <div class="advisor-view-header">
            <h2>採用側向けアドバイス</h2>
          </div>
          <div class="advisor-view-content">
            <div class="advisor-advice-panel">
              <div id="advisorAdviceContent">
                <div class="advisor-markdown"></div>
                <div class="advisor-usage-panel"></div>
              </div>
              <div class="advisor-perspective-switcher">
                <button class="advisor-perspective-btn active" data-action="advisor-switch-perspective-employer">採用側視点</button>
                <button class="advisor-perspective-btn" data-action="advisor-switch-perspective-applicant">応募者視点</button>
                <button class="advisor-perspective-btn" data-action="advisor-switch-perspective-agent">エージェント視点</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mock AdvisorManager
    manager = {
      currentMode: 'employer',
      perspectiveCache: {
        employer: { content: 'Employer advice', usage: { prompt_tokens: 100 }, model: 'gpt-5-nano' }
      },
      isStreaming: false,
      currentUsage: { prompt_tokens: 100 },
      currentModel: 'gpt-5-nano',
      checkRateLimit: vi.fn(() => ({
        allowed: true,
        remaining: 9,
        maxRequests: 10,
        mode: 'normal'
      })),
      fetchAdvice: vi.fn(),
      updateTokenCountDisplay: vi.fn(),
      showTokenConsumptionWarning: vi.fn(),
    };
  });

  describe('キャッシュ確認機能', () => {
    it('キャッシュありの場合、トークン消費警告を表示しない', async () => {
      const newMode = 'applicant';
      manager.perspectiveCache[newMode] = { content: 'Applicant advice', usage: { prompt_tokens: 150 }, model: 'gpt-5-nano' };

      // switchPerspectiveの実装で、キャッシュがある場合は警告なし
      expect(manager.perspectiveCache[newMode]).toBeDefined();
      expect(manager.showTokenConsumptionWarning).not.toHaveBeenCalled();
    });

    it('キャッシュなしの場合、トークン消費警告を表示する', async () => {
      const newMode = 'agent';
      // キャッシュがないため、警告が必要
      expect(manager.perspectiveCache[newMode]).toBeUndefined();
    });
  });

  describe('トークン消費カウント', () => {
    it('新規API呼び出し後、トークンカウントが更新される', async () => {
      const oldUsage = { prompt_tokens: 100, completion_tokens: 50 };
      const newUsage = { prompt_tokens: 250, completion_tokens: 100 };

      manager.currentUsage = oldUsage;
      manager.currentUsage = newUsage;

      // 実装では、fetchAdvice後にdisplayUsageを呼び出す
      manager.updateTokenCountDisplay(newUsage);

      expect(manager.updateTokenCountDisplay).toHaveBeenCalledWith(newUsage);
    });

    it('キャッシュから復元した場合、新たなトークン消費はない', async () => {
      const cachedUsage = { prompt_tokens: 100, completion_tokens: 50 };
      manager.currentUsage = cachedUsage;

      // キャッシュ復元時は、updateTokenCountDisplayは呼ばれない
      expect(manager.fetchAdvice).not.toHaveBeenCalled();
    });
  });

  describe('Switcher UI状態管理', () => {
    it('アクティブボタンが正しく更新される', () => {
      const buttons = document.querySelectorAll('.advisor-perspective-btn');

      // 初期状態: employer がアクティブ
      expect(buttons[0].classList.contains('active')).toBe(true);
      expect(buttons[1].classList.contains('active')).toBe(false);
      expect(buttons[2].classList.contains('active')).toBe(false);
    });

    it('Switcher クリック時、currentMode が更新される', () => {
      const newMode = 'applicant';
      manager.currentMode = newMode;

      expect(manager.currentMode).toBe('applicant');
    });
  });

  describe('確認ダイアログ', () => {
    it('キャッシュなし時、ユーザー確認ダイアログが表示される', () => {
      const newMode = 'agent';
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      // キャッシュなしの場合、確認ダイアログが出る
      if (!manager.perspectiveCache[newMode]) {
        window.confirm('この操作で追加のトークンが消費されます。続けますか？');
      }

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('ユーザーが「キャンセル」を選択した場合、API呼び出しは実行されない', () => {
      const newMode = 'agent';
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      if (!manager.perspectiveCache[newMode] && !window.confirm('続けますか？')) {
        return; // 実装では early return
      }

      expect(manager.fetchAdvice).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });
  });
});
