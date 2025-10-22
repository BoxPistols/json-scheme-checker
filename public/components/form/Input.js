/**
 * 入力フィールドコンポーネント（Presentational）
 */

/**
 * テキスト入力フィールドを生成
 * @param {Object} props
 * @param {string} props.id - input要素のID
 * @param {string} props.name - input要素のname属性
 * @param {string} props.type - input type（text|email|password|number|url）
 * @param {string} props.label - ラベルテキスト
 * @param {string} props.placeholder - プレースホルダー
 * @param {string} props.value - 現在の値
 * @param {boolean} props.required - 必須フラグ
 * @param {boolean} props.disabled - 無効化フラグ
 * @param {string} props.error - エラーメッセージ
 * @param {Function} props.onChange - change イベントハンドラ
 * @returns {HTMLElement}
 */
export function Input({
  id = '',
  name = '',
  type = 'text',
  label = '',
  placeholder = '',
  value = '',
  required = false,
  disabled = false,
  error = '',
  onChange,
}) {
  const container = document.createElement('div');
  container.className = `form-group${error ? ' form-group-error' : ''}`;

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    if (id) labelEl.setAttribute('for', id);
    labelEl.innerHTML = label;
    if (required) {
      const req = document.createElement('span');
      req.className = 'form-required';
      req.textContent = '*';
      labelEl.appendChild(req);
    }
    container.appendChild(labelEl);
  }

  const input = document.createElement('input');
  input.type = type;
  input.className = 'form-input';
  if (id) input.id = id;
  if (name) input.name = name;
  if (placeholder) input.placeholder = placeholder;
  if (value) input.value = value;
  if (required) input.required = true;
  if (disabled) input.disabled = true;
  if (onChange) input.addEventListener('change', onChange);

  container.appendChild(input);

  if (error) {
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error-message';
    errorEl.textContent = error;
    container.appendChild(errorEl);
  }

  return container;
}

/**
 * テキストエリアを生成
 * @param {Object} props
 * @param {string} props.id - textarea要素のID
 * @param {string} props.name - textarea要素のname属性
 * @param {string} props.label - ラベルテキスト
 * @param {string} props.placeholder - プレースホルダー
 * @param {string} props.value - 現在の値
 * @param {number} props.rows - 行数
 * @param {boolean} props.required - 必須フラグ
 * @param {boolean} props.disabled - 無効化フラグ
 * @param {string} props.error - エラーメッセージ
 * @param {Function} props.onChange - change イベントハンドラ
 * @returns {HTMLElement}
 */
export function Textarea({
  id = '',
  name = '',
  label = '',
  placeholder = '',
  value = '',
  rows = 4,
  required = false,
  disabled = false,
  error = '',
  onChange,
}) {
  const container = document.createElement('div');
  container.className = `form-group${error ? ' form-group-error' : ''}`;

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    if (id) labelEl.setAttribute('for', id);
    labelEl.innerHTML = label;
    if (required) {
      const req = document.createElement('span');
      req.className = 'form-required';
      req.textContent = '*';
      labelEl.appendChild(req);
    }
    container.appendChild(labelEl);
  }

  const textarea = document.createElement('textarea');
  textarea.className = 'form-input form-textarea';
  if (id) textarea.id = id;
  if (name) textarea.name = name;
  if (placeholder) textarea.placeholder = placeholder;
  if (value) textarea.value = value;
  textarea.rows = rows;
  if (required) textarea.required = true;
  if (disabled) textarea.disabled = true;
  if (onChange) textarea.addEventListener('change', onChange);

  container.appendChild(textarea);

  if (error) {
    const errorEl = document.createElement('div');
    errorEl.className = 'form-error-message';
    errorEl.textContent = error;
    container.appendChild(errorEl);
  }

  return container;
}

/**
 * チェックボックスを生成
 * @param {Object} props
 * @param {string} props.id - input要素のID
 * @param {string} props.name - input要素のname属性
 * @param {string} props.label - ラベルテキスト
 * @param {boolean} props.checked - チェック状態
 * @param {boolean} props.disabled - 無効化フラグ
 * @param {Function} props.onChange - change イベントハンドラ
 * @returns {HTMLElement}
 */
export function Checkbox({
  id = '',
  name = '',
  label = '',
  checked = false,
  disabled = false,
  onChange,
}) {
  const container = document.createElement('div');
  container.className = 'form-group form-group-checkbox';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.className = 'form-checkbox';
  if (id) input.id = id;
  if (name) input.name = name;
  if (checked) input.checked = true;
  if (disabled) input.disabled = true;
  if (onChange) input.addEventListener('change', onChange);

  container.appendChild(input);

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label form-label-checkbox';
    if (id) labelEl.setAttribute('for', id);
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  return container;
}

/**
 * セレクトボックスを生成
 * @param {Object} props
 * @param {string} props.id - select要素のID
 * @param {string} props.name - select要素のname属性
 * @param {string} props.label - ラベルテキスト
 * @param {Array} props.options - オプション配列（{ value, label }）
 * @param {string} props.value - 現在の値
 * @param {boolean} props.required - 必須フラグ
 * @param {boolean} props.disabled - 無効化フラグ
 * @param {Function} props.onChange - change イベントハンドラ
 * @returns {HTMLElement}
 */
export function Select({
  id = '',
  name = '',
  label = '',
  options = [],
  value = '',
  required = false,
  disabled = false,
  onChange,
}) {
  const container = document.createElement('div');
  container.className = 'form-group';

  if (label) {
    const labelEl = document.createElement('label');
    labelEl.className = 'form-label';
    if (id) labelEl.setAttribute('for', id);
    labelEl.innerHTML = label;
    if (required) {
      const req = document.createElement('span');
      req.className = 'form-required';
      req.textContent = '*';
      labelEl.appendChild(req);
    }
    container.appendChild(labelEl);
  }

  const select = document.createElement('select');
  select.className = 'form-select';
  if (id) select.id = id;
  if (name) select.name = name;
  if (required) select.required = true;
  if (disabled) select.disabled = true;

  options.forEach((option) => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    if (value === option.value) opt.selected = true;
    select.appendChild(opt);
  });

  if (onChange) select.addEventListener('change', onChange);

  container.appendChild(select);

  return container;
}
