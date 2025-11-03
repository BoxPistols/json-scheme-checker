/**
 * タブコンポーネント（Presentational）
 */

/**
 * タブセットを生成
 * @param {Object} props
 * @param {Array} props.tabs - タブ配列（{ id, label, content }）
 * @param {string} props.activeTabId - アクティブなタブID
 * @param {Function} props.onTabChange - タブ変更ハンドラ
 * @param {string} props.className - 追加CSSクラス
 * @returns {HTMLElement}
 */
export function Tabs({ tabs = [], activeTabId = '', onTabChange, className = '' }) {
  const container = document.createElement('div');
  container.className = `tabs-container ${className}`.trim();

  // タブリスト
  const tabList = document.createElement('div');
  tabList.className = 'tabs-list';
  tabList.setAttribute('role', 'tablist');

  tabs.forEach((tab, index) => {
    const tabButton = document.createElement('button');
    tabButton.className = `tabs-button${
      activeTabId === tab.id || (!activeTabId && index === 0) ? ' active' : ''
    }`;
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute(
      'aria-selected',
      activeTabId === tab.id || (!activeTabId && index === 0)
    );
    tabButton.setAttribute('aria-controls', `panel-${tab.id}`);
    tabButton.textContent = tab.label;

    tabButton.addEventListener('click', () => {
      // すべてのボタンから active を除去
      tabList.querySelectorAll('.tabs-button').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });

      // クリックされたボタンに active を追加
      tabButton.classList.add('active');
      tabButton.setAttribute('aria-selected', 'true');

      // すべてのパネルを非表示
      container.querySelectorAll('.tabs-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      // 対応するパネルを表示
      const panel = container.querySelector(`#panel-${tab.id}`);
      if (panel) {
        panel.classList.add('active');
      }

      if (onTabChange) {
        onTabChange(tab.id);
      }
    });

    tabList.appendChild(tabButton);
  });

  container.appendChild(tabList);

  // パネルコンテナ
  const panelContainer = document.createElement('div');
  panelContainer.className = 'tabs-panels';

  tabs.forEach((tab, index) => {
    const panel = document.createElement('div');
    panel.id = `panel-${tab.id}`;
    panel.className = `tabs-panel${activeTabId === tab.id || (!activeTabId && index === 0) ? ' active' : ''}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${tab.id}`);

    if (typeof tab.content === 'string') {
      panel.innerHTML = tab.content;
    } else if (tab.content instanceof HTMLElement) {
      panel.appendChild(tab.content);
    }

    panelContainer.appendChild(panel);
  });

  container.appendChild(panelContainer);

  return container;
}

/**
 * アクティブなタブを変更
 * @param {HTMLElement} container - タブコンテナ
 * @param {string} tabId - タブID
 */
export function activateTab(container, tabId) {
  if (!container) return;

  const tabList = container.querySelector('.tabs-list');
  if (!tabList) return;

  const tabButtons = tabList.querySelectorAll('.tabs-button');
  const panels = container.querySelectorAll('.tabs-panel');

  tabButtons.forEach(btn => {
    const isActive = btn.getAttribute('aria-controls') === `panel-${tabId}`;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  panels.forEach(panel => {
    const isActive = panel.id === `panel-${tabId}`;
    panel.classList.toggle('active', isActive);
  });
}
