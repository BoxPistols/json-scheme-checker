const axios = require('axios');
const { decodeHtmlBuffer } = require('../lib/charset-decoder');

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  try {
    console.log(`\n=== Request Details ===`);
    console.log(`URL: ${url}`);
    console.log(`Username: ${username || '(none)'}`);
    console.log(`Password: ${password ? '***' : '(none)'}`);

    // localhostをIPv4に変換（IPv6の問題を回避）
    let targetUrl = url;
    if (url.includes('localhost:')) {
      targetUrl = url.replace('localhost:', '127.0.0.1:');
      console.log(`Converting localhost to IPv4: ${targetUrl}`);
    }

    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    };

    // Basic認証が必要な場合
    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
      console.log(`Auth header: Basic ${auth.substring(0, 10)}...`);
      console.log('Using Basic Authentication for user:', username);
    } else {
      console.log('No authentication provided');
    }

    const response = await axios.get(targetUrl, {
      headers,
      timeout: 30000,
      maxRedirects: 5,
      responseType: 'arraybuffer', // バイナリデータとして取得
      validateStatus: function (status) {
        return status >= 200 && status < 500;
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);

    // 401エラーの場合は明確なエラーを返す
    if (response.status === 401) {
      console.log('Authentication failed - 401 Unauthorized');
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
    res.status(200).send(decodedHtml);
  } catch (error) {
    console.error('Proxy error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Connection refused. The target server may be down.',
      });
    }

    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: 'Request timeout. The target server took too long to respond.',
      });
    }

    res.status(500).json({
      error: 'Failed to fetch the requested URL',
      message: error.message,
    });
  }
};
