/**
 * スピナーコンポーネント（Presentational）
 *
 * ローディング表示用の回転スピナー
 */

/**
 * スピナーを生成
 * @param {Object} props
 * @param {string} props.size - サイズ（small|medium|large）
 * @param {string} props.color - 色クラス
 * @param {string} props.className - 追加CSSクラス
 * @returns {HTMLElement}
 */
export function Spinner({
  size = 'medium',
  color = '',
  className = '',
}) {
  const spinner = document.createElement('div');
  spinner.className = `spinner spinner-${size} ${color} ${className}`.trim();
  spinner.setAttribute('aria-label', 'Loading');
  spinner.setAttribute('role', 'status');

  // SVGスピナー
  spinner.innerHTML = `
    <svg class="spinner-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <circle class="spinner-circle" cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
    </svg>
  `;

  return spinner;
}

/**
 * フルスクリーンスピナーを生成
 * @param {Object} props
 * @param {string} props.message - ローディングメッセージ
 * @param {string} props.size - スピナーサイズ
 * @returns {HTMLElement}
 */
export function FullScreenSpinner({
  message = '',
  size = 'large',
}) {
  const overlay = document.createElement('div');
  overlay.className = 'spinner-overlay';

  const container = document.createElement('div');
  container.className = 'spinner-container';

  const spinner = Spinner({ size });
  container.appendChild(spinner);

  if (message) {
    const text = document.createElement('p');
    text.className = 'spinner-message';
    text.textContent = message;
    container.appendChild(text);
  }

  overlay.appendChild(container);

  return overlay;
}

/**
 * スピナーの表示・非表示を制御
 * @param {HTMLElement} spinner - スピナー要素
 * @param {boolean} isVisible - 表示フラグ
 */
export function toggleSpinner(spinner, isVisible = true) {
  if (!spinner) return;
  if (isVisible) {
    spinner.classList.add('active');
  } else {
    spinner.classList.remove('active');
  }
}

/**
 * スピナーのメッセージを更新
 * @param {HTMLElement} spinner - スピナー要素
 * @param {string} message - 新しいメッセージ
 */
export function updateSpinnerMessage(spinner, message) {
  if (!spinner) return;
  const messageEl = spinner.querySelector('.spinner-message');
  if (messageEl) {
    messageEl.textContent = message;
  }
}
