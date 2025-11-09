/**
 * プレビューコンポーネント（Presentational）
 */

/**
 * プレビューモーダルを生成
 * @param {Object} props
 * @param {string} props.id - モーダルID
 * @param {string} props.title - プレビュータイトル
 * @param {string} props.content - プレビューコンテンツ
 * @param {Function} props.onDownload - ダウンロードハンドラ
 * @param {Function} props.onClose - クローズハンドラ
 * @param {string} props.format - ファイル形式（text|markdown|html|json）
 * @returns {HTMLElement}
 */
export function Preview({ id = '', title = '', content = '', onDownload, onClose, format = 'text' }) {
  const modal = document.createElement('div');
  modal.className = 'modal modal-large active';
  if (id) modal.id = id;

  // バックドロップ
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  if (onClose) backdrop.addEventListener('click', onClose);

  // ダイアログボックス
  const dialogBox = document.createElement('div');
  dialogBox.className = 'modal-dialog preview-dialog';

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

  const closeBtn = header.querySelector('.modal-close');
  if (onClose && closeBtn) {
    closeBtn.addEventListener('click', onClose);
  }

  // ボディ（プレビューエリア）
  const body = document.createElement('div');
  body.className = 'modal-body preview-body';

  const previewContent = document.createElement('div');
  previewContent.className = `preview-content preview-content-${format}`;

  if (format === 'json') {
    previewContent.innerHTML = `<pre><code>${escapeHtml(JSON.stringify(JSON.parse(content), null, 2))}</code></pre>`;
  } else if (format === 'markdown' || format === 'html') {
    previewContent.innerHTML = content;
  } else {
    previewContent.innerHTML = `<pre>${escapeHtml(content)}</pre>`;
  }

  body.appendChild(previewContent);

  // フッター
  const footer = document.createElement('div');
  footer.className = 'modal-footer';

  if (onClose) {
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', onClose);
    footer.appendChild(cancelBtn);
  }

  if (onDownload) {
    const downloadBtn = document.createElement('button');
    downloadBtn.type = 'button';
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      ダウンロード
    `;
    downloadBtn.addEventListener('click', onDownload);
    footer.appendChild(downloadBtn);
  }

  // モーダル構築
  dialogBox.appendChild(header);
  dialogBox.appendChild(body);
  dialogBox.appendChild(footer);

  modal.appendChild(backdrop);
  modal.appendChild(dialogBox);

  // Escキーでクローズ
  const handleKeydown = e => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  };

  setTimeout(() => {
    document.addEventListener('keydown', handleKeydown);
  }, 0);

  modal._removeKeyListener = () => {
    document.removeEventListener('keydown', handleKeydown);
  };

  return modal;
}

/**
 * HTML特殊文字をエスケープ
 * @param {string} text - エスケープするテキスト
 * @returns {string} エスケープ済みテキスト
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
