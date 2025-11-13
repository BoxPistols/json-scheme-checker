
/**
 * 共通のaxios設定を提供する
 * タイムアウトやヘッダーの設定を一元管理
 */

// 環境変数から設定値を取得（デフォルト値付き）
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT, 10) || 30000;
const MAX_REDIRECTS = parseInt(process.env.MAX_REDIRECTS, 10) || 5;

/**
 * ブラウザ風のヘッダーを生成
 */
function getBrowserHeaders() {
  return {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
  };
}

/**
 * プロキシリクエスト用の設定を取得
 * @param {Object} options - オプション設定
 * @param {string} options.username - Basic認証ユーザー名
 * @param {string} options.password - Basic認証パスワード
 * @param {number} options.timeout - タイムアウト（ミリ秒）
 * @returns {Object} axios設定オブジェクト
 */
function getProxyConfig(options = {}) {
  const { username, password, timeout = REQUEST_TIMEOUT } = options;

  const headers = getBrowserHeaders();

  // Basic認証が必要な場合
  if (username && password) {
    const auth = Buffer.from(`${username}:${password}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  return {
    headers,
    timeout,
    maxRedirects: MAX_REDIRECTS,
    responseType: 'arraybuffer', // バイナリデータとして取得
    validateStatus: function (status) {
      return status >= 200 && status < 500;
    },
    // Keep-Aliveを有効化してパフォーマンス向上
    httpAgent: new (require('http').Agent)({ keepAlive: true }),
    httpsAgent: new (require('https').Agent)({ keepAlive: true }),
  };
}

/**
 * JSON-LD抽出用の設定を取得
 * @param {Object} options - オプション設定
 * @param {number} options.timeout - タイムアウト（ミリ秒）
 * @returns {Object} axios設定オブジェクト
 */
function getExtractConfig(options = {}) {
  const { timeout = REQUEST_TIMEOUT } = options;

  return {
    headers: getBrowserHeaders(),
    timeout,
    maxRedirects: MAX_REDIRECTS,
    // Keep-Aliveを有効化
    httpAgent: new (require('http').Agent)({ keepAlive: true }),
    httpsAgent: new (require('https').Agent)({ keepAlive: true }),
  };
}

/**
 * localhostをIPv4に変換（IPv6の問題を回避）
 * @param {string} url - 変換対象のURL
 * @returns {string} 変換後のURL
 */
function normalizeLocalhostUrl(url) {
  if (url.includes('localhost:')) {
    return url.replace('localhost:', '127.0.0.1:');
  }
  return url;
}

module.exports = {
  getBrowserHeaders,
  getProxyConfig,
  getExtractConfig,
  normalizeLocalhostUrl,
  REQUEST_TIMEOUT,
  MAX_REDIRECTS,
};
