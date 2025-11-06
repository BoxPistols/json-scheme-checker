const axios = require('axios');
const iconv = require('iconv-lite');
const jschardet = require('jschardet');

/**
 * HTMLからcharsetを検出
 * @param {Buffer} buffer - HTMLのバイナリデータ
 * @returns {string|null} 検出されたcharset
 */
function detectCharsetFromHtml(buffer) {
  // まずASCII互換として読み取る（metaタグ検出用）
  const asciiText = buffer.toString('ascii').substring(0, 2000);

  // <meta charset="..."> パターン
  const charsetMatch = asciiText.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
  if (charsetMatch) {
    return charsetMatch[1].toUpperCase();
  }

  // <meta http-equiv="Content-Type" content="...; charset=..."> パターン
  const httpEquivMatch = asciiText.match(
    /<meta\s+http-equiv=["']?content-type["']?\s+content=["'][^"']*charset=([^"'\s;>]+)/i
  );
  if (httpEquivMatch) {
    return httpEquivMatch[1].toUpperCase();
  }

  return null;
}

/**
 * Content-Typeヘッダーからcharsetを検出
 * @param {string} contentType - Content-Typeヘッダーの値
 * @returns {string|null} 検出されたcharset
 */
function detectCharsetFromContentType(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/charset=([^;,\s]+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * バイナリデータを適切なエンコーディングでUTF-8に変換
 * @param {Buffer} buffer - HTMLのバイナリデータ
 * @param {string} contentType - Content-Typeヘッダー
 * @returns {string} UTF-8に変換されたHTML
 */
function decodeHtmlBuffer(buffer, contentType) {
  let encoding = null;

  // 1. Content-Typeヘッダーから検出
  encoding = detectCharsetFromContentType(contentType);
  if (encoding) {
    console.log(`Charset from Content-Type: ${encoding}`);
    try {
      if (iconv.encodingExists(encoding)) {
        return iconv.decode(buffer, encoding);
      }
    } catch (e) {
      console.warn(`Failed to decode with ${encoding} from Content-Type:`, e.message);
    }
  }

  // 2. HTMLのmetaタグから検出
  encoding = detectCharsetFromHtml(buffer);
  if (encoding) {
    console.log(`Charset from HTML meta: ${encoding}`);
    try {
      if (iconv.encodingExists(encoding)) {
        return iconv.decode(buffer, encoding);
      }
    } catch (e) {
      console.warn(`Failed to decode with ${encoding} from HTML meta:`, e.message);
    }
  }

  // 3. jschardetで自動検出
  const detected = jschardet.detect(buffer);
  if (detected && detected.encoding && detected.confidence > 0.7) {
    encoding = detected.encoding.toUpperCase();
    console.log(`Charset auto-detected: ${encoding} (confidence: ${detected.confidence})`);
    try {
      if (iconv.encodingExists(encoding)) {
        return iconv.decode(buffer, encoding);
      }
    } catch (e) {
      console.warn(`Failed to decode with ${encoding} from auto-detection:`, e.message);
    }
  }

  // 4. 日本語サイトの一般的なエンコーディングを試行
  const fallbackEncodings = ['UTF-8', 'EUC-JP', 'SHIFT_JIS', 'ISO-2022-JP'];
  for (const enc of fallbackEncodings) {
    try {
      const decoded = iconv.decode(buffer, enc);
      // 日本語文字が含まれているか確認
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(decoded)) {
        console.log(`Successfully decoded with fallback encoding: ${enc}`);
        return decoded;
      }
    } catch (e) {
      // 次のエンコーディングを試行
    }
  }

  // 5. 最終フォールバック: UTF-8として扱う
  console.warn('Using UTF-8 as final fallback');
  return iconv.decode(buffer, 'UTF-8');
}

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
