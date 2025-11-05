/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

class TestChatManager extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'test', actionHandlers: {} });
  }
}

describe('チャットUI改善: フローティングボタン', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestChatManager();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('フローティングチャットボタンがレンダリングされる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderFloatingChatButton('testChatContainer', chatConfig);

    const floatingBtn = container.querySelector('.advisor-floating-chat-btn');
    expect(floatingBtn).toBeTruthy();
    expect(floatingBtn.classList.contains('advisor-floating-chat-btn')).toBe(true);
  });

  it('フローティングボタンにチャットアイコンSVGが含まれる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderFloatingChatButton('testChatContainer', chatConfig);

    const floatingBtn = container.querySelector('.advisor-floating-chat-btn');
    const svg = floatingBtn.querySelector('svg');
    expect(svg).toBeTruthy();
  });
});

describe('チャットUI改善: モーダル質問者選択', () => {
  let mgr;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestChatManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('質問者ペルソナを正しく取得できる（advisor）', () => {
    const personas = mgr.getQuestionerPersonas('advisor');
    expect(personas.length).toBe(3);
    expect(personas[0].id).toBe('employer');
    expect(personas[1].id).toBe('applicant');
    expect(personas[2].id).toBe('agent');
  });

  it('質問者ペルソナを正しく取得できる（blog-reviewer）', () => {
    const personas = mgr.getQuestionerPersonas('blog-reviewer');
    expect(personas.length).toBe(2);
    expect(personas[0].id).toBe('writer');
    expect(personas[1].id).toBe('editor');
  });

  it('質問者ペルソナを正しく取得できる（web-advisor）', () => {
    const personas = mgr.getQuestionerPersonas('web-advisor');
    expect(personas.length).toBe(2);
    expect(personas[0].id).toBe('owner');
    expect(personas[1].id).toBe('marketer');
  });

  it('不明なタイプの場合は空配列を返す', () => {
    const personas = mgr.getQuestionerPersonas('unknown');
    expect(personas.length).toBe(0);
  });
});

describe('チャットUI改善: チャットボックスレンダリング', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestChatManager();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('チャットボックスがレンダリングされる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
      questionerLabel: '採用側',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const chatBox = document.getElementById('advisorChatBox');
    expect(chatBox).toBeTruthy();
    expect(chatBox.classList.contains('advisor-chat-box')).toBe(true);
  });

  it('ドラッグハンドルが存在する', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const dragHandle = document.getElementById('advisorChatDragHandle');
    expect(dragHandle).toBeTruthy();
    expect(dragHandle.classList.contains('advisor-chat-drag-handle')).toBe(true);

    const dragIcon = dragHandle.querySelector('.advisor-chat-drag-icon');
    expect(dragIcon).toBeTruthy();
  });

  it('リサイズハンドルが存在する', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const resizeHandle = document.getElementById('advisorChatResizeHandle');
    expect(resizeHandle).toBeTruthy();
    expect(resizeHandle.classList.contains('advisor-chat-resize-handle')).toBe(true);
  });

  it('閉じるボタンが存在する', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const closeBtn = container.querySelector('.advisor-chat-close-btn');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn.textContent).toBe('×');
  });

  it('ウェルカムメッセージが短縮されている', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const welcome = container.querySelector('.advisor-chat-welcome p');
    expect(welcome).toBeTruthy();
    expect(welcome.textContent).toBe('フォローアップが必要ですか？');
  });

  it('入力エリアのサイズが適切に設定されている', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const input = document.getElementById('testChatInput');
    expect(input).toBeTruthy();
    expect(input.getAttribute('rows')).toBe('4');
    expect(input.style.minHeight).toBe('80px');
    expect(input.style.maxHeight).toBe('300px');
    expect(input.style.resize).toBe('vertical');
  });

  it('質問者バッジが表示される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
      questionerLabel: '採用側（企業担当者）',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const badge = container.querySelector('.advisor-chat-questioner-badge');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('採用側（企業担当者）');
  });
});

describe('チャットUI改善: UI制御機能', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestChatManager();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);

    // モック用のフローティングボタンをコンテナ内に追加
    const floatingBtn = document.createElement('button');
    floatingBtn.className = 'advisor-floating-chat-btn';
    floatingBtn.style.display = 'none';
    container.appendChild(floatingBtn);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('閉じるボタンをクリックするとチャットボックスが消える', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const closeBtn = container.querySelector('.advisor-chat-close-btn');
    closeBtn.click();

    // チャットボックスが削除されたことを確認
    expect(container.querySelector('.advisor-chat-box')).toBe(null);
    // フローティングボタンはまだ存在することを確認
    expect(container.querySelector('.advisor-floating-chat-btn')).toBeTruthy();
  });

  it('閉じるボタンをクリックするとフローティングボタンが再表示される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const floatingBtn = container.querySelector('.advisor-floating-chat-btn');
    floatingBtn.style.display = 'none';

    const closeBtn = container.querySelector('.advisor-chat-close-btn');
    closeBtn.click();

    expect(floatingBtn.style.display).toBe('flex');
  });

  it('折りたたみボタンをクリックするとチャットが折りたたまれる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const chatBox = document.getElementById('advisorChatBox');
    const collapseBtn = container.querySelector('.advisor-chat-collapse-btn');

    expect(chatBox.classList.contains('advisor-chat-collapsed')).toBe(false);
    expect(collapseBtn.textContent).toBe('−');

    collapseBtn.click();

    expect(chatBox.classList.contains('advisor-chat-collapsed')).toBe(true);
    expect(collapseBtn.textContent).toBe('+');

    collapseBtn.click();

    expect(chatBox.classList.contains('advisor-chat-collapsed')).toBe(false);
    expect(collapseBtn.textContent).toBe('−');
  });
});

describe('チャットUI改善: ローカルストレージ', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestChatManager();
    container = document.createElement('div');
    container.id = 'testChatContainer';
    document.body.appendChild(container);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('保存された位置が復元される', () => {
    localStorage.setItem('advisor-chat-position-x', '100');
    localStorage.setItem('advisor-chat-position-y', '200');

    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const chatBox = document.getElementById('advisorChatBox');
    expect(chatBox.style.left).toBe('100px');
    expect(chatBox.style.top).toBe('200px');
    expect(chatBox.style.position).toBe('fixed');
  });

  it('保存されたサイズが復元される', () => {
    localStorage.setItem('advisor-chat-width', '500px');
    localStorage.setItem('advisor-chat-height', '600px');

    const chatConfig = {
      type: 'advisor',
      containerId: 'testChatContainer',
      context: {},
      chatMessagesId: 'testChatMessages',
      chatInputId: 'testChatInput',
      chatSendBtnId: 'testChatSendBtn',
    };

    mgr.renderChatBoxCommon('testChatContainer', chatConfig);

    const chatBox = document.getElementById('advisorChatBox');
    expect(chatBox.style.width).toBe('500px');
    expect(chatBox.style.height).toBe('600px');
  });
});
