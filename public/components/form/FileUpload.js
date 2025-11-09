/**
 * ファイルアップロードコンポーネント（Presentational）
 */

/**
 * ファイルアップロード領域を生成
 * @param {Object} props
 * @param {string} props.id - 要素ID
 * @param {string} props.label - ラベルテキスト
 * @param {string} props.accept - 受け入れるファイル形式（例: ".pdf,.csv,.xlsx"）
 * @param {Function} props.onChange - ファイル選択時のハンドラ
 * @param {Function} props.onDrop - ドロップ時のハンドラ
 * @param {boolean} props.multiple - 複数ファイル選択を許可
 * @param {string} props.helpText - ヘルプテキスト
 * @returns {HTMLElement}
 */
export function FileUpload({
  id = '',
  label = '',
  accept = '',
  onChange,
  onDrop,
  multiple = false,
  helpText = '',
}) {
  const container = document.createElement('div');
  container.className = 'file-upload-container';

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  const uploadArea = document.createElement('div');
  uploadArea.className = 'file-upload-area';
  if (id) uploadArea.id = `${id}-area`;

  // 隠しファイル入力
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.className = 'file-upload-input';
  fileInput.style.display = 'none';
  if (id) fileInput.id = id;
  if (accept) fileInput.accept = accept;
  if (multiple) fileInput.multiple = true;

  // プレースホルダー
  const placeholder = document.createElement('div');
  placeholder.className = 'file-upload-placeholder';
  placeholder.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
    <p>クリックしてファイルを選択、またはドラッグ&ドロップ</p>
    ${helpText ? `<p class="file-upload-help">${helpText}</p>` : ''}
  `;

  // ファイル情報表示エリア
  const fileInfo = document.createElement('div');
  fileInfo.className = 'file-upload-info';
  fileInfo.style.display = 'none';

  uploadArea.appendChild(placeholder);
  uploadArea.appendChild(fileInfo);
  container.appendChild(fileInput);
  container.appendChild(uploadArea);

  // クリックでファイル選択
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // ファイル選択時
  fileInput.addEventListener('change', e => {
    const files = e.target.files;
    if (files.length > 0) {
      updateFileInfo(fileInfo, placeholder, files);
      if (onChange) onChange(files);
    }
  });

  // ドラッグ&ドロップ
  uploadArea.addEventListener('dragover', e => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', e => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      updateFileInfo(fileInfo, placeholder, files);
      if (onDrop) onDrop(files);
      if (onChange) onChange(files);
    }
  });

  // ファイル削除機能
  container._clearFiles = () => {
    fileInput.value = '';
    placeholder.style.display = 'block';
    fileInfo.style.display = 'none';
    fileInfo.innerHTML = '';
  };

  return container;
}

/**
 * ファイル情報を更新
 * @param {HTMLElement} fileInfo - ファイル情報表示要素
 * @param {HTMLElement} placeholder - プレースホルダー要素
 * @param {FileList} files - ファイルリスト
 */
function updateFileInfo(fileInfo, placeholder, files) {
  placeholder.style.display = 'none';
  fileInfo.style.display = 'block';

  fileInfo.innerHTML = '';

  Array.from(files).forEach(file => {
    const item = document.createElement('div');
    item.className = 'file-upload-item';
    item.innerHTML = `
      <div class="file-upload-item-info">
        <div class="file-upload-item-name">${escapeHtml(file.name)}</div>
        <div class="file-upload-item-meta">${formatFileSize(file.size)}</div>
      </div>
    `;
    fileInfo.appendChild(item);
  });
}

/**
 * ファイルサイズをフォーマット
 * @param {number} bytes - バイト数
 * @returns {string} フォーマット済みサイズ
 */
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
