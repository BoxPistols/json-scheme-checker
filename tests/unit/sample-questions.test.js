/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

class TestSampleQuestionsManager extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'test', actionHandlers: {} });
  }
}

describe('サンプル質問機能: getSampleQuestions', () => {
  let mgr;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestSampleQuestionsManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('advisor タイプ', () => {
    it('employer 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('advisor', 'employer');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('求人');
      expect(questions[1]).toContain('競合');
      expect(questions[2]).toContain('応募者');
    });

    it('applicant 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('advisor', 'applicant');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('スキル');
      expect(questions[1]).toContain('面接');
      expect(questions[2]).toContain('キャリア');
    });

    it('agent 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('advisor', 'agent');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('候補者');
      expect(questions[1]).toContain('技術');
      expect(questions[2]).toContain('技術要件');
    });
  });

  describe('blog-reviewer タイプ', () => {
    it('writer 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('blog-reviewer', 'writer');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('記事');
      expect(questions[1]).toContain('SEO');
      expect(questions[2]).toContain('読者');
    });

    it('editor 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('blog-reviewer', 'editor');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('品質');
      expect(questions[1]).toContain('読者');
      expect(questions[2]).toContain('コンテンツ戦略');
    });
  });

  describe('web-advisor タイプ', () => {
    it('owner 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('web-advisor', 'owner');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('改善');
      expect(questions[1]).toContain('ユーザー体験');
      expect(questions[2]).toContain('コンバージョン');
    });

    it('marketer 向けサンプル質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('web-advisor', 'marketer');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('SEO');
      expect(questions[1]).toContain('SNS');
      expect(questions[2]).toContain('流入');
    });
  });

  describe('デフォルト（汎用）', () => {
    it('不明なタイプの場合はデフォルト質問を3つ返す', () => {
      const questions = mgr.getSampleQuestions('unknown', 'unknown');
      expect(questions.length).toBe(3);
      expect(questions[0]).toContain('改善');
      expect(questions[1]).toContain('課題');
      expect(questions[2]).toContain('改善提案');
    });

    it('不明な questioner の場合はデフォルト質問を返す', () => {
      const questions = mgr.getSampleQuestions('advisor', 'unknown');
      expect(questions.length).toBe(3);
    });
  });
});

describe('サンプル質問機能: UI レンダリング', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestSampleQuestionsManager();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('サンプル質問ボタンがレンダリングされる（questioner あり）', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
      questioner: { id: 'agent', name: 'エージェント' },
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const sampleButtons = container.querySelectorAll('.advisor-chat-sample-btn');
    expect(sampleButtons.length).toBe(3);
  });

  it('サンプル質問ボタンが表示されない（questioner なし）', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const sampleButtons = container.querySelectorAll('.advisor-chat-sample-btn');
    expect(sampleButtons.length).toBe(0);
  });

  it('サンプル質問ボタンに正しい data 属性が設定される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
      questioner: { id: 'agent', name: 'エージェント' },
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const firstButton = container.querySelector('.advisor-chat-sample-btn');
    expect(firstButton.dataset.sampleQuestion).toBeTruthy();
    expect(firstButton.dataset.sampleQuestion).toContain('候補者');
  });

  it('サンプル質問ラベルが表示される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
      questioner: { id: 'employer', name: '採用側' },
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const label = container.querySelector('.advisor-chat-sample-label');
    expect(label).toBeTruthy();
    expect(label.textContent).toBe('サンプル質問:');
  });
});
