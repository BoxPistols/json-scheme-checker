const axios = require('axios');
const { decodeHtmlBuffer } = require('../lib/charset-decoder');
const { getProxyConfig, normalizeLocalhostUrl } = require('../lib/axios-config');
const logger = require('../lib/logger');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
module.exports = async (req, res) => {
  // CORS設定
  const allowedOrigins = IS_PRODUCTION
    ? (process.env.ALLOWED_ORIGINS || 'https://json-ld-view.vercel.app').split(',')
    : ['*'];

  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, username, password } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  // URLバリデーション
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    logger.info(`\n=== Request Details ===`);
    logger.info(`URL: ${url}`);
    logger.info(`Username: ${username || '(none)'}`);
    logger.info(`Password: ${password ? '***' : '(none)'}`);

    // localhostをIPv4に変換（IPv6の問題を回避）
    const targetUrl = normalizeLocalhostUrl(url);
    if (targetUrl !== url) {
      logger.info(`Converting localhost to IPv4: ${targetUrl}`);
    }

    // 共通設定を使用
    const config = getProxyConfig({ username, password });

    if (username && password) {
      logger.info('Using Basic Authentication for user:', username);
    } else {
      logger.info('No authentication provided');
    }

    const response = await axios.get(targetUrl, config);

    logger.info(`Response status: ${response.status}`);
    logger.info(`Content-Type: ${response.headers['content-type']}`);

    // 401エラーの場合は明確なエラーを返す
    if (response.status === 401) {
      logger.info('Authentication failed - 401 Unauthorized');
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Basic認証が失敗しました。ユーザー名とパスワードを確認してください。',
      });
    }

    // バッファを適切なエンコーディングでデコード
    const buffer = Buffer.from(response.data);
    const decodedHtml = decodeHtmlBuffer(buffer, response.headers['content-type']);

    // HTMLコンテンツを返す（UTF-8）
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    // キャッシュ制御ヘッダーを追加
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5分間キャッシュ
    res.status(200).send(decodedHtml);
  } catch (error) {
    logger.error('Proxy error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Connection refused',
        message: IS_PRODUCTION
          ? 'The target server may be down.'
          : `Connection refused: ${error.message}`,
      });
    }

    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timeout',
        message: 'The target server took too long to respond.',
      });
    }

    // 本番環境では詳細なエラーメッセージを隠す
    res.status(500).json({
      error: 'Failed to fetch the requested URL',
      message: IS_PRODUCTION ? 'Internal server error' : error.message,
    });
  }
};
