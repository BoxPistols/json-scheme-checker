/**
 * ボタンコンポーネントのストーリー
 */

import { expect } from '@storybook/test';
import { within, userEvent } from '@storybook/test';

export default {
  title: 'コンポーネント/ボタン',
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'ボタンのラベル',
    },
    onClick: {
      action: 'clicked',
      description: 'クリックイベント',
    },
    disabled: {
      control: 'boolean',
      description: '無効状態',
    },
  },
};

const createButton = ({ label = 'ボタン', onClick, disabled = false, className = '' }) => {
  const button = document.createElement('button');
  button.textContent = label;
  button.className = className;
  button.disabled = disabled;

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
};

// プライマリボタン（フェッチボタンスタイル）
export const Primary = {
  args: {
    label: '取得',
  },
  render: (args) => {
    const button = createButton(args);
    button.id = 'fetchButton';
    button.style.cssText = `
      padding: 12px 24px;
      background: var(--primary-color);
      color: var(--primary-text-color);
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    return button;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');

    await expect(button).toBeInTheDocument();
    await expect(button).toHaveTextContent('取得');

    // ホバー状態のテスト
    await userEvent.hover(button);
    // クリックテスト
    await userEvent.click(button);
  },
};

// コピーボタン
export const Copy = {
  args: {
    label: 'コピー',
  },
  render: (args) => {
    const button = createButton(args);
    button.className = 'copy-button';
    return button;
  },
};

// モーダル閉じるボタン
export const ModalClose = {
  args: {
    label: '閉じる',
  },
  render: (args) => {
    const button = createButton(args);
    button.className = 'btn-modal-close';
    return button;
  },
};

// APIキー設定ボタン
export const MyAPI = {
  args: {
    label: 'My API',
  },
  render: (args) => {
    const button = createButton(args);
    button.className = 'btn-my-api';
    return button;
  },
};

// ガイドボタン
export const Guide = {
  args: {
    label: 'Help',
  },
  render: (args) => {
    const button = createButton(args);
    button.className = 'btn-guide';
    return button;
  },
};

// テーマ切り替えボタン
export const ThemeToggle = {
  args: {
    label: '',
  },
  render: () => {
    const button = document.createElement('button');
    button.className = 'btn-theme-toggle';
    button.title = 'テーマを切り替え';

    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="5"/>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
      </svg>
    `;

    return button;
  },
};

// 無効化ボタン
export const Disabled = {
  args: {
    label: '無効',
    disabled: true,
  },
  render: (args) => {
    const button = createButton(args);
    button.style.cssText = `
      padding: 12px 24px;
      background: var(--primary-color);
      color: var(--primary-text-color);
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: not-allowed;
      opacity: 0.5;
    `;
    return button;
  },
};

// ボタンバリエーション一覧
export const AllVariants = () => {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  `;

  const variants = [
    { label: 'プライマリボタン', id: 'fetchButton', style: 'padding: 12px 24px; background: var(--primary-color); color: var(--primary-text-color); border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer;' },
    { label: 'コピーボタン', className: 'copy-button' },
    { label: 'My API', className: 'btn-my-api' },
    { label: 'Help', className: 'btn-guide' },
    { label: '閉じる', className: 'btn-modal-close' },
  ];

  variants.forEach(({ label, className, id, style }) => {
    const button = document.createElement('button');
    button.textContent = label;
    if (className) button.className = className;
    if (id) button.id = id;
    if (style) button.style.cssText = style;
    container.appendChild(button);
  });

  return container;
};

AllVariants.storyName = '全バリエーション';
