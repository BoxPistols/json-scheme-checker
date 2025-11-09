/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

class TestSampleQuestionsIntegration extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'test', actionHandlers: {} });
  }
}

describe('サンプル質問機能: 統合テスト', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestSampleQuestionsIntegration();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);

    // sendChatMessageCommon をモック化
    mgr.sendChatMessageCommon = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('サンプル質問ボタンをクリックすると sendChatMessageCommon が呼ばれる', () => {
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

    // サンプル質問ボタンを取得
    const sampleBtn = container.querySelector('.advisor-chat-sample-btn');
    expect(sampleBtn).toBeTruthy();

    // ボタンをクリック
    sampleBtn.click();

    // sendChatMessageCommon が呼ばれたことを確認
    expect(mgr.sendChatMessageCommon).toHaveBeenCalled();
    expect(mgr.sendChatMessageCommon).toHaveBeenCalledWith(
      expect.stringContaining('候補者'),
      chatConfig
    );
  });

  it('サンプル質問ボタンをクリックすると正しい質問が送信される', () => {
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

    const sampleBtn = container.querySelector('.advisor-chat-sample-btn');
    const expectedQuestion = sampleBtn.dataset.sampleQuestion;

    sampleBtn.click();

    expect(mgr.sendChatMessageCommon).toHaveBeenCalledWith(expectedQuestion, chatConfig);
  });

  it('複数のサンプル質問ボタンがそれぞれ異なる質問を送信する', () => {
    const chatConfig = {
      type: 'blog-reviewer',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
      questioner: { id: 'writer', name: 'ブログライター' },
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const sampleBtns = container.querySelectorAll('.advisor-chat-sample-btn');
    expect(sampleBtns.length).toBe(3);

    // 各ボタンをクリック
    sampleBtns.forEach((btn, _idx) => {
      mgr.sendChatMessageCommon.mockClear();
      btn.click();

      expect(mgr.sendChatMessageCommon).toHaveBeenCalledTimes(1);
      expect(mgr.sendChatMessageCommon).toHaveBeenCalledWith(
        btn.dataset.sampleQuestion,
        chatConfig
      );
    });
  });

  it('サンプル質問ボタンをクリック後、入力欄がクリアされる', () => {
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

    const inputEl = document.getElementById('testChatInput');
    const sampleBtn = container.querySelector('.advisor-chat-sample-btn');

    // 事前に入力欄に何か入力
    inputEl.value = 'test input';

    // ボタンをクリック
    sampleBtn.click();

    // 入力欄がクリアされることを確認
    expect(inputEl.value).toBe('');
  });
});

describe('質問者選択からチャット開始までの統合フロー', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestSampleQuestionsIntegration();
    container = document.createElement('div');
    container.id = 'testContainer';
    document.body.appendChild(container);

    // renderChatBoxCommon をモック化してコンテナIDを保存
    const originalRenderChatBoxCommon = mgr.renderChatBoxCommon.bind(mgr);
    mgr.renderChatBoxCommon = vi.fn((containerId, config) => {
      originalRenderChatBoxCommon(containerId, config);
    });
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('質問者を選択すると適切なサンプル質問が表示されるチャットボックスがレンダリングされる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    // 質問者選択モーダルを表示
    mgr.showQuestionerModal(chatConfig);

    // エージェントボタンをクリック
    const agentBtn = document.querySelector('.advisor-questioner-btn[data-questioner-id="agent"]');
    agentBtn.click();

    // renderChatBoxCommon が呼ばれたことを確認
    expect(mgr.renderChatBoxCommon).toHaveBeenCalled();

    // コンフィグに questioner が設定されたことを確認
    const callArgs = mgr.renderChatBoxCommon.mock.calls[0];
    expect(callArgs[1].questioner).toBeTruthy();
    expect(callArgs[1].questioner.id).toBe('agent');
  });
});

describe('エスケープ処理の統合テスト', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestSampleQuestionsIntegration();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('サンプル質問に特殊文字が含まれていても正しくエスケープされる', () => {
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

    const sampleBtns = container.querySelectorAll('.advisor-chat-sample-btn');

    sampleBtns.forEach(btn => {
      const question = btn.dataset.sampleQuestion;

      // data属性に特殊文字が正しくエスケープされていることを確認
      expect(question).not.toContain('<');
      expect(question).not.toContain('>');
      expect(question).not.toContain('&lt;');
      expect(question).not.toContain('&gt;');

      // テキストコンテンツに特殊文字が含まれていないことを確認
      expect(btn.innerHTML).not.toContain('<script>');
    });
  });
});
