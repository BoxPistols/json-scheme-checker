/**
 * タブコンポーネントのストーリー
 */

import { expect, userEvent, within } from '@storybook/test';

export default {
  title: 'コンポーネント/タブ',
  parameters: {
    layout: 'padded',
  },
};

// 基本タブ
export const Basic = {
  render: () => {
    const container = document.createElement('div');
    container.style.maxWidth = '900px';

    const navigation = document.createElement('div');
    navigation.className = 'tab-navigation';

    const tabs = [
      { id: 'tab-schema', label: 'Schema', active: true },
      { id: 'tab-html', label: 'HTML構造', active: false },
      { id: 'tab-overview', label: '概要・メタタグ', active: false },
      { id: 'tab-sns', label: 'SNS', active: false },
    ];

    tabs.forEach(({ id, label, active }) => {
      const button = document.createElement('button');
      button.className = `tab-button ${active ? 'active' : ''}`;
      button.dataset.tab = id;
      button.textContent = label;
      button.addEventListener('click', () => {
        // アクティブ状態を切り替え
        container.querySelectorAll('.tab-button').forEach((btn) => {
          btn.classList.remove('active');
        });
        button.classList.add('active');

        container.querySelectorAll('.tab-content').forEach((content) => {
          content.classList.remove('active');
        });
        const targetContent = container.querySelector(`#${id}`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
      navigation.appendChild(button);
    });

    const contents = document.createElement('div');
    contents.className = 'tab-contents';

    tabs.forEach(({ id, label, active }) => {
      const content = document.createElement('div');
      content.id = id;
      content.className = `tab-content ${active ? 'active' : ''}`;
      content.innerHTML = `
        <div style="padding: 20px; background: var(--card-bg-color); border-radius: 8px; margin-top: 16px;">
          <h3 style="margin: 0 0 12px 0; color: var(--text-color);">${label}</h3>
          <p style="margin: 0; color: var(--secondary-text-color);">
            ${label}タブのコンテンツがここに表示されます。
          </p>
        </div>
      `;
      contents.appendChild(content);
    });

    container.appendChild(navigation);
    container.appendChild(contents);

    return container;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 最初のタブがアクティブであることを確認
    const firstTab = canvas.getByRole('button', { name: 'Schema' });
    await expect(firstTab).toHaveClass('active');

    // 2番目のタブをクリック
    const secondTab = canvas.getByRole('button', { name: 'HTML構造' });
    await userEvent.click(secondTab);

    // 2番目のタブがアクティブになったことを確認
    await expect(secondTab).toHaveClass('active');
    await expect(firstTab).not.toHaveClass('active');
  },
};

// 全タブ
export const AllTabs = () => {
  const container = document.createElement('div');
  container.style.maxWidth = '1200px';

  const navigation = document.createElement('div');
  navigation.className = 'tab-navigation';

  const tabs = [
    { id: 'tab-schema', label: 'Schema' },
    { id: 'tab-html', label: 'HTML構造' },
    { id: 'tab-overview', label: '概要・メタタグ' },
    { id: 'tab-sns', label: 'SNS' },
    { id: 'tab-guidance', label: '改善ガイダンス' },
    { id: 'tab-learning', label: 'スキーマ学習' },
  ];

  tabs.forEach(({ id, label }, index) => {
    const button = document.createElement('button');
    button.className = `tab-button ${index === 0 ? 'active' : ''}`;
    button.dataset.tab = id;
    button.textContent = label;
    navigation.appendChild(button);
  });

  container.appendChild(navigation);

  return container;
};

AllTabs.storyName = '全タブナビゲーション';

// ビュー切り替えタブ（スキーマカード内）
export const ViewToggle = () => {
  const container = document.createElement('div');

  const toggle = document.createElement('div');
  toggle.className = 'view-toggle';

  const views = [
    { label: 'テーブル', active: true },
    { label: 'JSON', active: false },
  ];

  views.forEach(({ label, active }) => {
    const button = document.createElement('button');
    button.className = active ? 'active' : '';
    button.textContent = label;
    button.addEventListener('click', () => {
      container.querySelectorAll('.view-toggle button').forEach((btn) => {
        btn.classList.remove('active');
      });
      button.classList.add('active');
    });
    toggle.appendChild(button);
  });

  container.appendChild(toggle);

  return container;
};

ViewToggle.storyName = 'ビュー切り替えタブ';

// レスポンシブタブ（モバイル）
export const ResponsiveTabs = () => {
  const container = document.createElement('div');
  container.style.maxWidth = '375px';

  const navigation = document.createElement('div');
  navigation.className = 'tab-navigation';
  navigation.style.cssText = `
    display: flex;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  `;

  const tabs = [
    'Schema',
    'HTML構造',
    '概要・メタタグ',
    'SNS',
    '改善ガイダンス',
    'スキーマ学習',
  ];

  tabs.forEach((label, index) => {
    const button = document.createElement('button');
    button.className = `tab-button ${index === 0 ? 'active' : ''}`;
    button.textContent = label;
    button.style.whiteSpace = 'nowrap';
    button.style.flex = '0 0 auto';
    navigation.appendChild(button);
  });

  container.appendChild(navigation);

  return container;
};

ResponsiveTabs.storyName = 'レスポンシブタブ（モバイル）';
