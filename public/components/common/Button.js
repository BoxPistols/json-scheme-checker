/**
 * ボタンコンポーネント（Presentational）
 *
 * 再利用可能なボタンUI
 * データ取得やビジネスロジックを持たず、propsのみでレンダリング
 */

import { createSVGIcon } from '../../utils/htmlHelpers.js';

/**
 * ボタンを生成
 * @param {Object} props
 * @param {string} props.label - ボタンラベル
 * @param {string} props.variant - primary|secondary|danger|success（デフォルト: primary）
 * @param {boolean} props.disabled - 無効化フラグ
 * @param {Function} props.onClick - クリックハンドラ
 * @param {string} props.icon - SVGアイコンパス（オプション）
 * @param {number} props.iconSize - アイコンサイズ（デフォルト: 20）
 * @param {string} props.className - 追加CSSクラス
 * @param {string} props.id - 要素ID
 * @param {string} props.type - ボタンタイプ（デフォルト: button）
 * @returns {HTMLElement}
 */
export function Button({
  label,
  variant = 'primary',
  disabled = false,
  onClick,
  icon,
  iconSize = 20,
  className = '',
  id = '',
  type = 'button',
}) {
  const button = document.createElement('button');
  button.type = type;
  button.className = `btn btn-${variant} ${className}`.trim();

  if (id) button.id = id;
  if (disabled) button.disabled = true;
  if (onClick) button.addEventListener('click', onClick);

  // アイコン + ラベル
  const iconHtml = icon ? createSVGIcon(icon, iconSize) : '';
  button.innerHTML = `
    ${iconHtml ? `<span class="btn-icon">${iconHtml}</span>` : ''}
    ${label}
  `;

  return button;
}

/**
 * ボタンをHTML文字列として生成
 * @param {Object} props - Buttonと同じprops
 * @param {string} props.onClickHandler - onclick属性の文字列
 * @returns {string} HTML文字列
 */
export function ButtonHTML({
  label,
  variant = 'primary',
  disabled = false,
  onClickHandler = '',
  icon,
  iconSize = 20,
  className = '',
  id = '',
  type = 'button',
}) {
  const iconHtml = icon ? createSVGIcon(icon, iconSize) : '';
  const disabledAttr = disabled ? 'disabled' : '';
  const onclickAttr = onClickHandler ? `onclick="${onClickHandler}"` : '';
  const idAttr = id ? `id="${id}"` : '';

  return `
    <button
      type="${type}"
      class="btn btn-${variant} ${className}"
      ${idAttr}
      ${disabledAttr}
      ${onclickAttr}
    >
      ${iconHtml ? `<span class="btn-icon">${iconHtml}</span>` : ''}
      ${label}
    </button>
  `;
}

/**
 * アイコンのみのボタンを生成
 * @param {Object} props
 * @param {string} props.icon - SVGアイコンパス
 * @param {string} props.ariaLabel - アクセシビリティラベル
 * @param {Function} props.onClick - クリックハンドラ
 * @param {string} props.title - ツールチップテキスト
 * @param {string} props.className - 追加CSSクラス
 * @param {number} props.iconSize - アイコンサイズ（デフォルト: 24）
 * @returns {HTMLElement}
 */
export function IconButton({
  icon,
  ariaLabel,
  onClick,
  title = '',
  className = '',
  iconSize = 24,
}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn-icon ${className}`.trim();
  button.setAttribute('aria-label', ariaLabel);

  if (title) button.title = title;
  if (onClick) button.addEventListener('click', onClick);

  button.innerHTML = createSVGIcon(icon, iconSize);

  return button;
}

/**
 * アイコンボタンをHTML文字列として生成
 * @param {Object} props
 * @param {string} props.icon - SVGアイコンパス
 * @param {string} props.ariaLabel - アクセシビリティラベル
 * @param {string} props.onClickHandler - onclick属性の文字列
 * @param {string} props.title - ツールチップテキスト
 * @param {string} props.className - 追加CSSクラス
 * @param {number} props.iconSize - アイコンサイズ
 * @returns {string} HTML文字列
 */
export function IconButtonHTML({
  icon,
  ariaLabel,
  onClickHandler = '',
  title = '',
  className = '',
  iconSize = 24,
}) {
  const onclickAttr = onClickHandler ? `onclick="${onClickHandler}"` : '';
  const titleAttr = title ? `title="${title}"` : '';

  return `
    <button
      type="button"
      class="btn-icon ${className}"
      aria-label="${ariaLabel}"
      ${titleAttr}
      ${onclickAttr}
    >
      ${createSVGIcon(icon, iconSize)}
    </button>
  `;
}
