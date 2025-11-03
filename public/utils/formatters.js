/**
 * フォーマット関数
 */

/**
 * 数値をカンマ区切りでフォーマット
 * @param {number} num - フォーマットする数値
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return num.toLocaleString('ja-JP');
}

/**
 * 日付をフォーマット
 * @param {Date|string} date - フォーマットする日付
 * @param {string} format - フォーマット形式（デフォルト: 'YYYY-MM-DD HH:mm:ss'）
 * @returns {string}
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 日本語の日時フォーマット
 * @param {Date|string} date - フォーマットする日付
 * @returns {string}
 */
export function formatDateJa(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('ja-JP');
}

/**
 * 相対時間を表示（〜前）
 * @param {Date|string} date - 基準日時
 * @returns {string}
 */
export function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diff = now - d;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}秒前`;
  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  if (days < 30) return `${days}日前`;

  return formatDateJa(d);
}

/**
 * バイト数を人間が読みやすい形式にフォーマット
 * @param {number} bytes - バイト数
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string}
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * テキストを指定文字数で切り詰め
 * @param {string} text - 切り詰めるテキスト
 * @param {number} maxLength - 最大文字数
 * @param {string} ellipsis - 省略記号（デフォルト: '...'）
 * @returns {string}
 */
export function truncate(text, maxLength, ellipsis = '...') {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + ellipsis;
}

/**
 * URLを短縮表示
 * @param {string} url - URL文字列
 * @param {number} maxLength - 最大文字数
 * @returns {string}
 */
export function formatUrl(url, maxLength = 50) {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    const displayUrl = urlObj.hostname + urlObj.pathname;
    return truncate(displayUrl, maxLength);
  } catch (e) {
    return truncate(url, maxLength);
  }
}

/**
 * 価格をフォーマット（USD）
 * @param {number} amount - 金額
 * @param {number} decimals - 小数点以下の桁数
 * @returns {string}
 */
export function formatPrice(amount, decimals = 2) {
  if (amount === null || amount === undefined) return '$0.00';
  return '$' + amount.toFixed(decimals);
}

/**
 * パーセンテージをフォーマット
 * @param {number} value - 値（0-1または0-100）
 * @param {boolean} isDecimal - 小数形式か（0-1）
 * @returns {string}
 */
export function formatPercentage(value, isDecimal = true) {
  const percent = isDecimal ? value * 100 : value;
  return percent.toFixed(1) + '%';
}

/**
 * JSONを整形して表示
 * @param {Object} obj - JSONオブジェクト
 * @param {number} indent - インデント幅
 * @returns {string}
 */
export function formatJson(obj, indent = 2) {
  try {
    return JSON.stringify(obj, null, indent);
  } catch (e) {
    return String(obj);
  }
}

/**
 * スネークケースをキャメルケースに変換
 * @param {string} str - スネークケース文字列
 * @returns {string}
 */
export function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, g => g[1].toUpperCase());
}

/**
 * キャメルケースをスネークケースに変換
 * @param {string} str - キャメルケース文字列
 * @returns {string}
 */
export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
