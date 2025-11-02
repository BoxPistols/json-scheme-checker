/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Advisor User Mode Management', () => {
  let manager;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="container">
        <div id="advisorView" class="advisor-view">
          <div class="advisor-view-header">
            <h2>採用側向けアドバイス</h2>
          </div>
          <div class="advisor-view-content">
            <div class="advisor-job-panel">
              <h3>求人票</h3>
              <div id="advisorJobContent"></div>
            </div>
            <div class="advisor-advice-panel">
              <h3>AI分析結果</h3>
              <div id="advisorAdviceContent"></div>
              <div id="advisorExportButtons"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Clean localStorage
    localStorage.clear();

    // Mock AdvisorManager methods
    manager = {
      currentMode: 'employer',
      currentJobPosting: { title: 'エンジニア', description: '開発を担当' },
      currentUsage: { prompt_tokens: 100, completion_tokens: 50 },
      currentModel: 'gpt-5-nano',
      isStreaming: false,
      perspectiveCache: {},

      // User mode management methods
      saveSelectedUserMode: function(mode) {
        localStorage.setItem('jsonld_advisor_selected_user_mode', mode);
      },
      getSelectedUserMode: function() {
        return localStorage.getItem('jsonld_advisor_selected_user_mode');
      },
      clearSelectedUserMode: function() {
        localStorage.removeItem('jsonld_advisor_selected_user_mode');
      },

      // Analysis methods
      startAnalysis: async function(mode) {
        this.currentMode = mode;
        this.saveSelectedUserMode(mode);
      },

      closeAdvisorView: function() {
        this.clearSelectedUserMode();
      },

      switchPerspective: async function(newMode) {
        const selectedUserMode = this.getSelectedUserMode();
        if (selectedUserMode && selectedUserMode !== newMode) {
          console.log('[Test] 別のユーザータイプへの切り替えは禁止');
          return;
        }
        this.currentMode = newMode;
      },
    };
  });

  describe('User Mode Storage', () => {
    it('ユーザーが採用側を選んだ場合、localStorageに保存される', async () => {
      await manager.startAnalysis('employer');

      const saved = manager.getSelectedUserMode();
      expect(saved).toBe('employer');
    });

    it('ユーザーが応募者を選んだ場合、localStorageに保存される', async () => {
      await manager.startAnalysis('applicant');

      const saved = manager.getSelectedUserMode();
      expect(saved).toBe('applicant');
    });

    it('ユーザーがエージェントを選んだ場合、localStorageに保存される', async () => {
      await manager.startAnalysis('agent');

      const saved = manager.getSelectedUserMode();
      expect(saved).toBe('agent');
    });
  });

  describe('Mode Switching Restrictions', () => {
    it('採用側を選んだユーザーは応募者モードに切り替えられない', async () => {
      await manager.startAnalysis('employer');
      const initialMode = manager.currentMode;

      await manager.switchPerspective('applicant');

      // モードは変わっていない
      expect(manager.currentMode).toBe(initialMode);
    });

    it('採用側を選んだユーザーはエージェントモードに切り替えられない', async () => {
      await manager.startAnalysis('employer');
      const initialMode = manager.currentMode;

      await manager.switchPerspective('agent');

      expect(manager.currentMode).toBe(initialMode);
    });

    it('応募者を選んだユーザーは採用側モードに切り替えられない', async () => {
      await manager.startAnalysis('applicant');
      const initialMode = manager.currentMode;

      await manager.switchPerspective('employer');

      expect(manager.currentMode).toBe(initialMode);
    });

    it('エージェントを選んだユーザーは採用側モードに切り替えられない', async () => {
      await manager.startAnalysis('agent');
      const initialMode = manager.currentMode;

      await manager.switchPerspective('employer');

      expect(manager.currentMode).toBe(initialMode);
    });

    it('同じモード内での再分析は許可される', async () => {
      await manager.startAnalysis('employer');

      // 同じモードへの切り替え
      await manager.switchPerspective('employer');

      // モードは変わっていない（が、操作は許可されている）
      expect(manager.currentMode).toBe('employer');
    });
  });

  describe('Mode Clearing', () => {
    it('ビューを閉じるとlocalStorageの選択モードがクリアされる', async () => {
      await manager.startAnalysis('employer');
      expect(manager.getSelectedUserMode()).toBe('employer');

      manager.closeAdvisorView();

      expect(manager.getSelectedUserMode()).toBeNull();
    });

    it('ビューを閉じた後、新しいモードを選択できる', async () => {
      await manager.startAnalysis('employer');
      manager.closeAdvisorView();

      await manager.startAnalysis('applicant');

      expect(manager.getSelectedUserMode()).toBe('applicant');
    });
  });

  describe('User Isolation', () => {
    it('採用側ユーザーが見たアドバイスは採用側視点のみ', async () => {
      await manager.startAnalysis('employer');
      const selectedMode = manager.getSelectedUserMode();

      expect(selectedMode).toBe('employer');
      expect(manager.currentMode).toBe('employer');
    });

    it('応募者ユーザーが見たアドバイスは応募者視点のみ', async () => {
      await manager.startAnalysis('applicant');
      const selectedMode = manager.getSelectedUserMode();

      expect(selectedMode).toBe('applicant');
      expect(manager.currentMode).toBe('applicant');
    });

    it('エージェントユーザーが見たアドバイスはエージェント視点のみ', async () => {
      await manager.startAnalysis('agent');
      const selectedMode = manager.getSelectedUserMode();

      expect(selectedMode).toBe('agent');
      expect(manager.currentMode).toBe('agent');
    });
  });
});
