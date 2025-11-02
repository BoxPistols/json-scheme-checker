/**
 * モーダルコンポーネント（Presentational）
 *
 * 再利用可能なモーダルダイアログUI
 * データ取得やビジネスロジックを持たず、propsのみでレンダリング
 */

import { createElement } from '../../utils/htmlHelpers.js';

/**
 * モーダルを生成
 * @param {Object} props
 * @param {string} props.id - モーダルID
 * @param {string} props.title - モーダルタイトル
 * @param {string|HTMLElement} props.content - モーダルコンテンツ
 * @param {Array} props.actions - アクションボタン配列
 * @param {Function} props.onClose - クローズハンドラ
 * @param {boolean} props.isOpen - 表示フラグ
 * @param {string} props.size - サイズ（small|medium|large）
 * @returns {HTMLElement}
 */
export function Modal({
  id = '',
  title = '',
  content = '',
  actions = [],
  onClose,
  isOpen = false,
  size = 'medium',
}) {
  const modal = document.createElement('div');
  modal.className = `modal modal-${size}${isOpen ? ' active' : ''}`;
  if (id) modal.id = id;

  // バックドロップ（クローズボタン）
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  if (onClose) backdrop.addEventListener('click', onClose);

  // モーダル内容
  const dialogBox = document.createElement('div');
  dialogBox.className = 'modal-dialog';

  // ヘッダー
  const header = document.createElement('div');
  header.className = 'modal-header';
  header.innerHTML = `
    <h2 class="modal-title">${title}</h2>
    <button type="button" class="modal-close" aria-label="Close">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  // クローズボタンイベント
  const closeBtn = header.querySelector('.modal-close');
  if (onClose && closeBtn) {
    closeBtn.addEventListener('click', onClose);
  }

  // Escキーでクローズ
  const handleKeydown = e => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  // ボディ
  const body = document.createElement('div');
  body.className = 'modal-body';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  // フッター（アクションボタン）
  const footer = document.createElement('div');
  footer.className = 'modal-footer';
  actions.forEach(action => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `btn btn-${action.variant || 'primary'}`;
    btn.textContent = action.label;
    if (action.onClick) btn.addEventListener('click', action.onClick);
    footer.appendChild(btn);
  });

  // モーダル構築
  dialogBox.appendChild(header);
  dialogBox.appendChild(body);
  if (actions.length > 0) {
    dialogBox.appendChild(footer);
  }

  modal.appendChild(backdrop);
  modal.appendChild(dialogBox);

  // キーボード制御
  setTimeout(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
    }
  }, 0);

  // クローズ時にイベントリスナー削除
  const originalOnClose = onClose;
  if (originalOnClose) {
    const wrappedOnClose = () => {
      document.removeEventListener('keydown', handleKeydown);
      originalOnClose();
    };
    modal._removeKeyListener = wrappedOnClose;
  }

  return modal;
}

/**
 * モーダルの表示・非表示を制御
 * @param {HTMLElement} modal - モーダル要素
 * @param {boolean} isOpen - 表示フラグ
 */
export function toggleModal(modal, isOpen = true) {
  if (!modal) return;
  if (isOpen) {
    modal.classList.add('active');
  } else {
    modal.classList.remove('active');
    if (modal._removeKeyListener) {
      modal._removeKeyListener();
    }
  }
}

/**
 * モーダルのコンテンツを更新
 * @param {HTMLElement} modal - モーダル要素
 * @param {string|HTMLElement} content - 新しいコンテンツ
 */
export function updateModalContent(modal, content) {
  if (!modal) return;
  const body = modal.querySelector('.modal-body');
  if (!body) return;

  body.innerHTML = '';
  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }
}
