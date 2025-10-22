/**
 * バリデーション関数
 */

/**
 * 有効なURLかチェック
 * @param {string} string - チェックする文字列
 * @returns {boolean}
 */
export function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

/**
 * 画像URLかチェック
 * @param {string} url - チェックするURL
 * @returns {boolean}
 */
export function isImageUrl(url) {
  if (!url) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext));
}

/**
 * メールアドレスの妥当性をチェック
 * @param {string} email - チェックするメールアドレス
 * @returns {boolean}
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 空文字列・null・undefinedをチェック
 * @param {*} value - チェックする値
 * @returns {boolean}
 */
export function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

/**
 * 文字列の長さが範囲内かチェック
 * @param {string} str - チェックする文字列
 * @param {number} min - 最小長
 * @param {number} max - 最大長
 * @returns {boolean}
 */
export function isLengthInRange(str, min, max) {
  if (typeof str !== 'string') return false;
  const length = str.length;
  return length >= min && length <= max;
}

/**
 * HTML内の<br />タグの存在をチェック
 * @param {string} text - チェックするテキスト
 * @returns {boolean}
 */
export function hasHtmlBr(text) {
  return /<br\s*\/?>/i.test(text);
}

/**
 * OpenAI APIキーの形式をチェック
 * @param {string} apiKey - チェックするAPIキー
 * @returns {boolean}
 */
export function isValidOpenAIKey(apiKey) {
  if (!apiKey) return false;
  // OpenAI APIキーは "sk-" または "sk-proj-" で始まる
  return apiKey.startsWith('sk-') || apiKey.startsWith('sk-proj-');
}

/**
 * JSON文字列の妥当性をチェック
 * @param {string} jsonString - チェックするJSON文字列
 * @returns {boolean}
 */
export function isValidJSON(jsonString) {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * ドメイン名を抽出
 * @param {string} url - URL文字列
 * @returns {string} ドメイン名（抽出失敗時は元のURL）
 */
export function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}
