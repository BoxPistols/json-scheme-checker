/**
 * フォームコンポーネントのストーリー
 */

import { expect, userEvent, within } from '@storybook/test';

export default {
  title: 'コンポーネント/フォーム',
  parameters: {
    layout: 'padded',
  },
};

// URL入力フォーム
export const URLInput = {
  render: () => {
    const container = document.createElement('div');
    container.className = 'input-section';
    container.style.maxWidth = '800px';

    container.innerHTML = `
      <div class="input-group">
        <input
          type="url"
          id="urlInput"
          placeholder="URLを入力してください (例: https://example.com/page.html)"
          value=""
          style="flex: 1; padding: 12px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 14px;"
        />
        <button
          id="fetchButton"
          style="padding: 12px 24px; background: var(--primary-color); color: var(--primary-text-color); border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;"
        >
          取得
        </button>
      </div>
      <div class="input-actions-row" style="margin-top: 8px; color: var(--secondary-text-color); font-size: 12px;">
        Cmd+K / Ctrl+K でURL入力欄にフォーカス
      </div>
    `;

    return container;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText(/URLを入力してください/);
    const button = canvas.getByRole('button');

    await expect(input).toBeInTheDocument();
    await expect(button).toBeInTheDocument();

    // 入力テスト
    await userEvent.type(input, 'https://example.com');
    await expect(input).toHaveValue('https://example.com');

    // ボタンクリックテスト
    await userEvent.click(button);
  },
};

URLInput.storyName = 'URL入力フォーム';

// Basic認証フォーム
export const BasicAuthForm = () => {
  const container = document.createElement('div');
  container.style.maxWidth = '600px';

  container.innerHTML = `
    <details class="auth-details" open>
      <summary class="auth-summary">
        Basic認証が必要な場合
        <span class="auth-status"></span>
      </summary>
      <div class="auth-content">
        <div class="auth-grid">
          <input type="text" placeholder="ユーザー名" class="auth-input" />
          <div class="auth-password-wrapper">
            <input type="password" placeholder="パスワード" class="auth-password-input" />
            <button type="button" class="auth-toggle-btn" aria-label="パスワードを表示/非表示">
              <span aria-hidden="true">👁</span>
            </button>
          </div>
        </div>

        <div class="auth-section-header" style="margin-top: 16px;">
          <label class="auth-label">認証情報の保存方法</label>
          <div class="auth-radio-group">
            <label class="auth-radio-label">
              <input type="radio" name="authStorage" value="none" checked class="auth-radio-input" />
              <span>保存しない（最もセキュア）</span>
            </label>
            <label class="auth-radio-label">
              <input type="radio" name="authStorage" value="session" class="auth-radio-input" />
              <span>タブを閉じるまで保存（推奨）</span>
            </label>
            <label class="auth-radio-label">
              <input type="radio" name="authStorage" value="persistent" class="auth-radio-input" />
              <span>24時間保存（利便性重視）</span>
            </label>
          </div>
        </div>

        <div class="auth-actions" style="margin-top: 16px;">
          <button type="button" class="auth-clear-btn">すべてクリア</button>
        </div>
      </div>
    </details>
  `;

  return container;
};

BasicAuthForm.storyName = 'Basic認証フォーム';

// 検索フォーム
export const SearchInput = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 400px;';

  const input = document.createElement('input');
  input.type = 'search';
  input.placeholder = '検索...';
  input.style.cssText = `
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    background: var(--card-bg-color);
    color: var(--text-color);
  `;

  container.appendChild(input);
  return container;
};

SearchInput.storyName = '検索入力';

// テキストエリア
export const TextArea = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 600px;';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'テキストを入力してください...';
  textarea.rows = 6;
  textarea.style.cssText = `
    width: 100%;
    padding: 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    font-family: inherit;
    background: var(--card-bg-color);
    color: var(--text-color);
    resize: vertical;
  `;

  container.appendChild(textarea);
  return container;
};

TextArea.storyName = 'テキストエリア';

// セレクトボックス
export const Select = () => {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 300px;';

  const select = document.createElement('select');
  select.style.cssText = `
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    background: var(--card-bg-color);
    color: var(--text-color);
    cursor: pointer;
  `;

  const options = ['オプション1', 'オプション2', 'オプション3'];
  options.forEach((optionText, index) => {
    const option = document.createElement('option');
    option.value = `option${index + 1}`;
    option.textContent = optionText;
    select.appendChild(option);
  });

  container.appendChild(select);
  return container;
};

Select.storyName = 'セレクトボックス';

// チェックボックス
export const Checkbox = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

  const items = ['オプション1', 'オプション2', 'オプション3'];
  items.forEach(item => {
    const label = document.createElement('label');
    label.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-color);
    `;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(item));
    container.appendChild(label);
  });

  return container;
};

Checkbox.storyName = 'チェックボックス';

// ラジオボタン
export const Radio = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

  const items = ['選択肢1', '選択肢2', '選択肢3'];
  items.forEach((item, index) => {
    const label = document.createElement('label');
    label.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-color);
    `;

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'radioGroup';
    radio.value = `option${index + 1}`;
    radio.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';
    if (index === 0) radio.checked = true;

    label.appendChild(radio);
    label.appendChild(document.createTextNode(item));
    container.appendChild(label);
  });

  return container;
};

Radio.storyName = 'ラジオボタン';
