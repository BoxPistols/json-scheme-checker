/**
 * 認証ダイアログコンポーネント
 *
 * Modal.jsを利用した再利用可能な認証ダイアログ
 */

import { Modal } from '../common/Modal.js';
import { saveAuthCredentials } from '../../utils/auth.js';

/**
 * 認証ダイアログのコンテンツを作成
 * @returns {HTMLElement}
 */
function createAuthDialogContent() {
  const container = document.createElement('div');
  container.className = 'auth-dialog-content';

  const infoText = document.createElement('p');
  infoText.textContent = 'この機能を使用するには認証が必要です。';
  infoText.style.marginBottom = '1.5rem';
  container.appendChild(infoText);

  // ユーザー名入力
  const usernameGroup = document.createElement('div');
  usernameGroup.style.marginBottom = '1rem';

  const usernameLabel = document.createElement('label');
  usernameLabel.textContent = 'ユーザー名';
  usernameLabel.htmlFor = 'authUsername';
  usernameLabel.style.display = 'block';
  usernameLabel.style.marginBottom = '0.5rem';
  usernameLabel.style.fontWeight = '500';

  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.id = 'authUsername';
  usernameInput.name = 'username';
  usernameInput.className = 'input-field';
  usernameInput.placeholder = 'ユーザー名を入力';
  usernameInput.required = true;
  usernameInput.style.width = '100%';
  usernameInput.style.padding = '0.75rem';
  usernameInput.style.border = '1px solid var(--border-color)';
  usernameInput.style.borderRadius = '4px';
  usernameInput.style.fontSize = '1rem';

  usernameGroup.appendChild(usernameLabel);
  usernameGroup.appendChild(usernameInput);
  container.appendChild(usernameGroup);

  // パスワード入力
  const passwordGroup = document.createElement('div');
  passwordGroup.style.marginBottom = '1.5rem';

  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'パスワード';
  passwordLabel.htmlFor = 'authPassword';
  passwordLabel.style.display = 'block';
  passwordLabel.style.marginBottom = '0.5rem';
  passwordLabel.style.fontWeight = '500';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.id = 'authPassword';
  passwordInput.name = 'password';
  passwordInput.className = 'input-field';
  passwordInput.placeholder = 'パスワードを入力';
  passwordInput.required = true;
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '0.75rem';
  passwordInput.style.border = '1px solid var(--border-color)';
  passwordInput.style.borderRadius = '4px';
  passwordInput.style.fontSize = '1rem';

  passwordGroup.appendChild(passwordLabel);
  passwordGroup.appendChild(passwordInput);
  container.appendChild(passwordGroup);

  // エラーメッセージ表示エリア
  const errorMessage = document.createElement('div');
  errorMessage.id = 'authErrorMessage';
  errorMessage.style.display = 'none';
  errorMessage.style.color = 'var(--error-color, #dc2626)';
  errorMessage.style.marginBottom = '1rem';
  errorMessage.style.padding = '0.75rem';
  errorMessage.style.backgroundColor = 'var(--error-bg, #fee2e2)';
  errorMessage.style.borderRadius = '4px';
  errorMessage.style.fontSize = '0.9rem';
  container.appendChild(errorMessage);

  return container;
}

/**
 * エラーメッセージを表示
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
  const errorEl = document.getElementById('authErrorMessage');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

/**
 * エラーメッセージを非表示
 */
function hideError() {
  const errorEl = document.getElementById('authErrorMessage');
  if (errorEl) {
    errorEl.style.display = 'none';
  }
}

/**
 * 認証ダイアログを表示
 * @returns {Promise<{username: string, password: string}|null>} 認証成功時は認証情報、キャンセル時はnull
 */
export async function showAuthDialog() {
  return new Promise(resolve => {
    const content = createAuthDialogContent();

    let modalElement = null;

    const handleClose = () => {
      if (modalElement && modalElement.parentNode) {
        modalElement.remove();
      }
      resolve(null);
    };

    const handleLogin = () => {
      const usernameInput = document.getElementById('authUsername');
      const passwordInput = document.getElementById('authPassword');

      const username = usernameInput?.value.trim() || '';
      const password = passwordInput?.value || '';

      if (!username || !password) {
        showError('ユーザー名とパスワードを入力してください');
        return;
      }

      // 認証情報を保存
      saveAuthCredentials(username, password);

      if (modalElement && modalElement.parentNode) {
        modalElement.remove();
      }
      resolve({ username, password });
    };

    const actions = [
      {
        label: 'キャンセル',
        variant: 'secondary',
        onClick: handleClose,
      },
      {
        label: 'ログイン',
        variant: 'primary',
        onClick: handleLogin,
      },
    ];

    modalElement = Modal({
      id: 'authDialog',
      title: '認証が必要です',
      content,
      actions,
      onClose: handleClose,
      isOpen: true,
      size: 'small',
    });

    document.body.appendChild(modalElement);

    // Enterキーでログイン
    const usernameInput = document.getElementById('authUsername');
    const passwordInput = document.getElementById('authPassword');

    const handleEnter = e => {
      if (e.key === 'Enter') {
        handleLogin();
      }
    };

    if (usernameInput) {
      usernameInput.addEventListener('keydown', handleEnter);
      usernameInput.focus();
    }
    if (passwordInput) {
      passwordInput.addEventListener('keydown', handleEnter);
    }
  });
}
