/**
 * ラジオボタングループコンポーネント（Presentational）
 */

/**
 * ラジオボタングループを生成
 * @param {Object} props
 * @param {string} props.name - ラジオボタンのname属性
 * @param {string} props.label - グループラベル
 * @param {Array} props.options - オプション配列 [{value, label}]
 * @param {string} props.value - 選択されている値
 * @param {Function} props.onChange - 変更時のハンドラ
 * @param {string} props.layout - レイアウト（horizontal|vertical|grid）
 * @returns {HTMLElement}
 */
export function RadioGroup({
  name = '',
  label = '',
  options = [],
  value = '',
  onChange,
  layout = 'vertical',
}) {
  const container = document.createElement('div');
  container.className = 'radio-group-container';

  if (label) {
    const labelEl = document.createElement('div');
    labelEl.className = 'radio-group-label';
    labelEl.textContent = label;
    container.appendChild(labelEl);
  }

  const optionsContainer = document.createElement('div');
  optionsContainer.className = `radio-group radio-group-${layout}`;

  options.forEach((option, index) => {
    const optionId = `${name}-${index}`;
    const optionEl = document.createElement('label');
    optionEl.className = 'radio-option';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = name;
    input.value = option.value;
    input.id = optionId;
    input.className = 'radio-input';

    if (option.value === value) {
      input.checked = true;
    }

    if (onChange) {
      input.addEventListener('change', e => {
        if (e.target.checked) {
          onChange(option.value);
        }
      });
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'radio-label';
    labelSpan.textContent = option.label;

    optionEl.appendChild(input);
    optionEl.appendChild(labelSpan);
    optionsContainer.appendChild(optionEl);
  });

  container.appendChild(optionsContainer);

  return container;
}
