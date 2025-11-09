/**
 * タブコンポーネント（Presentational）
 */

/**
 * タブを生成
 * @param {Object} props
 * @param {string} props.id - タブコンテナID
 * @param {Array} props.tabs - タブ配列 [{id, label, content}]
 * @param {string} props.activeTab - アクティブなタブID
 * @param {Function} props.onChange - タブ変更時のハンドラ
 * @returns {HTMLElement}
 */
export function Tabs({ id = '', tabs = [], activeTab = '', onChange }) {
  const container = document.createElement('div');
  container.className = 'tabs-container';
  if (id) container.id = id;

  // タブヘッダー
  const tabHeaders = document.createElement('div');
  tabHeaders.className = 'tabs-header';

  tabs.forEach(tab => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `tab-button${tab.id === activeTab ? ' active' : ''}`;
    button.dataset.tabId = tab.id;
    button.textContent = tab.label;

    button.addEventListener('click', () => {
      // すべてのタブを非アクティブ化
      container.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
      });
      container.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      // 選択されたタブをアクティブ化
      button.classList.add('active');
      const panel = container.querySelector(`.tab-panel[data-tab-id="${tab.id}"]`);
      if (panel) panel.classList.add('active');

      if (onChange) onChange(tab.id);
    });

    tabHeaders.appendChild(button);
  });

  // タブパネル
  const tabPanels = document.createElement('div');
  tabPanels.className = 'tabs-panels';

  tabs.forEach(tab => {
    const panel = document.createElement('div');
    panel.className = `tab-panel${tab.id === activeTab ? ' active' : ''}`;
    panel.dataset.tabId = tab.id;

    if (typeof tab.content === 'string') {
      panel.innerHTML = tab.content;
    } else if (tab.content instanceof HTMLElement) {
      panel.appendChild(tab.content);
    }

    tabPanels.appendChild(panel);
  });

  container.appendChild(tabHeaders);
  container.appendChild(tabPanels);

  return container;
}

/**
 * アクティブなタブを変更
 * @param {HTMLElement} tabsContainer - タブコンテナ要素
 * @param {string} tabId - アクティブにするタブID
 */
export function setActiveTab(tabsContainer, tabId) {
  if (!tabsContainer) return;

  // すべてのタブを非アクティブ化
  tabsContainer.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  tabsContainer.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.remove('active');
  });

  // 指定されたタブをアクティブ化
  const button = tabsContainer.querySelector(`.tab-button[data-tab-id="${tabId}"]`);
  const panel = tabsContainer.querySelector(`.tab-panel[data-tab-id="${tabId}"]`);

  if (button) button.classList.add('active');
  if (panel) panel.classList.add('active');
}
