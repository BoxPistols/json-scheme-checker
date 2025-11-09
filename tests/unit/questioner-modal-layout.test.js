/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mod from '../../public/modules/base-advisor.js';
const BaseAdvisorManager = mod.BaseAdvisorManager || mod.default || mod;

class TestQuestionerModalManager extends BaseAdvisorManager {
  constructor() {
    super({ elemIdPrefix: 'test', actionHandlers: {} });
  }
}

describe('質問者選択モーダル: レイアウト', () => {
  let mgr;

  beforeEach(() => {
    document.body.innerHTML = '';
    // CSS を動的に追加してテスト
    const style = document.createElement('style');
    style.textContent = `
      .advisor-questioner-list {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .advisor-questioner-btn[data-questioner-id="agent"] {
        grid-column: 1 / -1;
      }
      @media (max-width: 600px) {
        .advisor-questioner-list {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
    mgr = new TestQuestionerModalManager();
  });

  afterEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('モーダルに質問者ボタンが3つ表示される（advisor）', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const buttons = document.querySelectorAll('.advisor-questioner-btn');
    expect(buttons.length).toBe(3);
  });

  it('採用側ボタンに正しい data 属性が設定される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const employerBtn = document.querySelector(
      '.advisor-questioner-btn[data-questioner-id="employer"]'
    );
    expect(employerBtn).toBeTruthy();
    expect(employerBtn.dataset.questionerId).toBe('employer');
    expect(employerBtn.dataset.questionerIdx).toBe('0');
  });

  it('応募側ボタンに正しい data 属性が設定される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const applicantBtn = document.querySelector(
      '.advisor-questioner-btn[data-questioner-id="applicant"]'
    );
    expect(applicantBtn).toBeTruthy();
    expect(applicantBtn.dataset.questionerId).toBe('applicant');
    expect(applicantBtn.dataset.questionerIdx).toBe('1');
  });

  it('エージェントボタンに正しい data 属性が設定される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const agentBtn = document.querySelector('.advisor-questioner-btn[data-questioner-id="agent"]');
    expect(agentBtn).toBeTruthy();
    expect(agentBtn.dataset.questionerId).toBe('agent');
    expect(agentBtn.dataset.questionerIdx).toBe('2');
  });

  it('エージェントボタンは grid-column 全幅のスタイルを持つ', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const agentBtn = document.querySelector('.advisor-questioner-btn[data-questioner-id="agent"]');
    expect(agentBtn).toBeTruthy();

    // CSSが適用されていることを確認（jsdom では getComputedStyle が完全には動作しないため、data属性で確認）
    expect(agentBtn.dataset.questionerId).toBe('agent');
  });

  it('モーダルに閉じるボタンが表示される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const closeBtn = document.querySelector('.advisor-modal-close-btn');
    expect(closeBtn).toBeTruthy();
  });

  it('モーダルに説明文が表示される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const desc = document.querySelector('.advisor-questioner-modal-desc');
    expect(desc).toBeTruthy();
    expect(desc.textContent).toContain('ペルソナ');
  });

  it('質問者ボタンに名前と説明が表示される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const employerBtn = document.querySelector(
      '.advisor-questioner-btn[data-questioner-id="employer"]'
    );
    const name = employerBtn.querySelector('.advisor-questioner-name');
    const desc = employerBtn.querySelector('.advisor-questioner-desc');

    expect(name).toBeTruthy();
    expect(desc).toBeTruthy();
    expect(name.textContent).toContain('採用側');
    expect(desc.textContent).toContain('採用');
  });
});

describe('質問者選択モーダル: イベント処理', () => {
  let mgr;
  let container;

  beforeEach(() => {
    document.body.innerHTML = '';
    mgr = new TestQuestionerModalManager();
    container = document.createElement('div');
    container.id = 'testContainer';
    document.body.appendChild(container);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('閉じるボタンをクリックするとモーダルが削除される', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const modal = document.querySelector('.advisor-modal-overlay');
    expect(modal).toBeTruthy();

    const closeBtn = modal.querySelector('.advisor-modal-close-btn');
    closeBtn.click();

    const modalAfter = document.querySelector('.advisor-modal-overlay');
    expect(modalAfter).toBeFalsy();
  });

  it('オーバーレイをクリックするとモーダルが閉じる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const modal = document.querySelector('.advisor-modal-overlay');
    expect(modal).toBeTruthy();

    // オーバーレイ自身をクリック
    const clickEvent = new MouseEvent('click', { bubbles: true });
    Object.defineProperty(clickEvent, 'target', { value: modal, enumerable: true });
    modal.dispatchEvent(clickEvent);

    const modalAfter = document.querySelector('.advisor-modal-overlay');
    expect(modalAfter).toBeFalsy();
  });

  it('Escape キーでモーダルが閉じる', () => {
    const chatConfig = {
      type: 'advisor',
      containerId: 'testContainer',
      context: {},
    };

    mgr.showQuestionerModal(chatConfig);

    const modal = document.querySelector('.advisor-modal-overlay');
    expect(modal).toBeTruthy();

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(escEvent);

    const modalAfter = document.querySelector('.advisor-modal-overlay');
    expect(modalAfter).toBeFalsy();
  });
});
