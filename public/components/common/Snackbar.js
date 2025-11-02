/**
 * スナックバーコンポーネント（Presentational）
 *
 * 一時的な通知メッセージ表示
 */

/**
 * スナックバーを生成
 * @param {Object} props
 * @param {string} props.message - メッセージテキスト
 * @param {string} props.type - タイプ（success|error|warning|info）
 * @param {number} props.duration - 表示時間（ミリ秒）
 * @param {Function} props.onClose - クローズハンドラ
 * @param {Array} props.actions - アクションボタン配列
 * @returns {HTMLElement}
 */
export function Snackbar({ message = '', type = 'info', duration = 4000, onClose, actions = [] }) {
  const snackbar = document.createElement('div');
  snackbar.className = `snackbar snackbar-${type}`;
  snackbar.setAttribute('role', 'alert');

  // メッセージ
  const messageEl = document.createElement('div');
  messageEl.className = 'snackbar-message';
  messageEl.textContent = message;

  snackbar.appendChild(messageEl);

  // アクションボタン
  if (actions.length > 0) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'snackbar-actions';

    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'snackbar-action';
      btn.textContent = action.label;
      if (action.onClick) {
        btn.addEventListener('click', action.onClick);
      }
      actionsContainer.appendChild(btn);
    });

    snackbar.appendChild(actionsContainer);
  }

  // クローズボタン
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'snackbar-close';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;

  const handleClose = () => {
    closeSnackbar(snackbar);
    if (onClose) onClose();
  };

  closeBtn.addEventListener('click', handleClose);
  snackbar.appendChild(closeBtn);

  // 自動クローズ
  if (duration > 0) {
    snackbar._autoCloseTimeout = setTimeout(handleClose, duration);
  }

  return snackbar;
}

/**
 * 複数のスナックバーをキューで管理するコンテナを生成
 * @returns {HTMLElement}
 */
export function SnackbarContainer() {
  const container = document.createElement('div');
  container.className = 'snackbar-container';
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Notifications');
  return container;
}

/**
 * スナックバーをコンテナに追加
 * @param {HTMLElement} container - スナックバーコンテナ
 * @param {HTMLElement} snackbar - スナックバー要素
 */
export function addSnackbar(container, snackbar) {
  if (!container || !snackbar) return;
  container.appendChild(snackbar);

  // アニメーション
  setTimeout(() => {
    snackbar.classList.add('active');
  }, 10);
}

/**
 * スナックバーをクローズ
 * @param {HTMLElement} snackbar - スナックバー要素
 */
export function closeSnackbar(snackbar) {
  if (!snackbar) return;

  // タイムアウトをクリア
  if (snackbar._autoCloseTimeout) {
    clearTimeout(snackbar._autoCloseTimeout);
  }

  snackbar.classList.remove('active');
  setTimeout(() => {
    snackbar.remove();
  }, 300); // アニメーション時間と同期
}

/**
 * コンテナ内のすべてのスナックバーをクローズ
 * @param {HTMLElement} container - スナックバーコンテナ
 */
export function clearAllSnackbars(container) {
  if (!container) return;
  const snackbars = container.querySelectorAll('.snackbar');
  snackbars.forEach(snackbar => {
    closeSnackbar(snackbar);
  });
}

/**
 * ヘルパー: 成功メッセージを表示
 * @param {HTMLElement} container - スナックバーコンテナ
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
export function showSuccess(container, message, duration = 4000) {
  const snackbar = Snackbar({
    message,
    type: 'success',
    duration,
  });
  addSnackbar(container, snackbar);
}

/**
 * ヘルパー: エラーメッセージを表示
 * @param {HTMLElement} container - スナックバーコンテナ
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
export function showError(container, message, duration = 6000) {
  const snackbar = Snackbar({
    message,
    type: 'error',
    duration,
  });
  addSnackbar(container, snackbar);
}

/**
 * ヘルパー: 警告メッセージを表示
 * @param {HTMLElement} container - スナックバーコンテナ
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
export function showWarning(container, message, duration = 5000) {
  const snackbar = Snackbar({
    message,
    type: 'warning',
    duration,
  });
  addSnackbar(container, snackbar);
}

/**
 * ヘルパー: 情報メッセージを表示
 * @param {HTMLElement} container - スナックバーコンテナ
 * @param {string} message - メッセージ
 * @param {number} duration - 表示時間
 */
export function showInfo(container, message, duration = 4000) {
  const snackbar = Snackbar({
    message,
    type: 'info',
    duration,
  });
  addSnackbar(container, snackbar);
}
