/**
 * HTML操作・生成ヘルパー関数
 */

/**
 * HTMLエスケープ
 * @param {string} text - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
export function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

/**
 * 要素を作成してDOMに追加
 * @param {string} tag - タグ名
 * @param {Object} attributes - 属性オブジェクト
 * @param {string|HTMLElement} content - コンテンツ
 * @returns {HTMLElement}
 */
export function createElement(tag, attributes = {}, content = '') {
  const element = document.createElement(tag);

  // 属性を設定
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      // イベントリスナー
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, value);
    } else {
      element.setAttribute(key, value);
    }
  });

  // コンテンツを設定
  if (typeof content === 'string') {
    element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  }

  return element;
}

/**
 * HTMLテンプレート文字列をDOMに変換
 * @param {string} html - HTML文字列
 * @returns {HTMLElement}
 */
export function htmlToElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

/**
 * HTMLテンプレート文字列を複数のDOMノードに変換
 * @param {string} html - HTML文字列
 * @returns {NodeList}
 */
export function htmlToElements(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.childNodes;
}

/**
 * 要素を削除（アニメーション付き）
 * @param {HTMLElement} element - 削除する要素
 * @param {number} duration - アニメーション時間（ミリ秒）
 */
export function removeElementWithAnimation(element, duration = 300) {
  if (!element) return;

  element.classList.remove('active');
  setTimeout(() => {
    element.remove();
  }, duration);
}

/**
 * 要素を表示（アニメーション付き）
 * @param {HTMLElement} element - 表示する要素
 * @param {number} delay - 遅延時間（ミリ秒）
 */
export function showElementWithAnimation(element, delay = 10) {
  if (!element) return;

  setTimeout(() => {
    element.classList.add('active');
  }, delay);
}

/**
 * クラスをトグル
 * @param {HTMLElement} element - 対象要素
 * @param {string} className - クラス名
 */
export function toggleClass(element, className) {
  if (!element) return;
  element.classList.toggle(className);
}

/**
 * 複数の要素に同じイベントリスナーを追加
 * @param {string} selector - CSSセレクタ
 * @param {string} event - イベント名
 * @param {Function} handler - ハンドラ関数
 * @param {HTMLElement} parent - 親要素（デフォルト: document）
 */
export function addEventListenerAll(selector, event, handler, parent = document) {
  parent.querySelectorAll(selector).forEach(element => {
    element.addEventListener(event, handler);
  });
}

/**
 * SVGアイコンを生成
 * @param {string} path - SVGパス
 * @param {number} size - サイズ（デフォルト: 24）
 * @returns {string} SVG HTML文字列
 */
export function createSVGIcon(path, size = 24) {
  return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      ${path}
    </svg>
  `;
}
