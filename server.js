require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { decodeHtmlBuffer } = require('./lib/charset-decoder');

const app = express();
const PORT = process.env.PORT || 3333;

// CORS設定 - すべてのオリジンを許可
app.use(cors());
app.use(express.json());

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// プロキシエンドポイント
app.get('/proxy', async (req, res) => {
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
      // IPv6とIPv4の両方を試す（デフォルト動作）
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
});

// JSON-LD抽出エンドポイント
app.post('/extract-jsonld', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Extracting JSON-LD from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 30000,
    });

    const html = response.data;

    // JSON-LDスクリプトタグを抽出
    const jsonLdRegex =
      /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    const matches = [];
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const jsonContent = match[1].trim();
        const parsed = JSON.parse(jsonContent);
        matches.push(parsed);
      } catch (e) {
        console.error('Failed to parse JSON-LD:', e);
      }
    }

    res.json({
      url: url,
      schemas: matches,
      count: matches.length,
    });
  } catch (error) {
    console.error('Error extracting JSON-LD:', error.message);
    res.status(500).json({
      error: 'Failed to extract JSON-LD',
      message: error.message,
    });
  }
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ルートパス
app.get('/', (req, res) => {
  res.send(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <title>JSON-LD Proxy Server</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    max-width: 800px;
                    margin: 50px auto;
                    padding: 20px;
                    background: #f5f7fa;
                }
                h1 { color: #2c3e50; }
                .endpoint {
                    background: white;
                    padding: 15px;
                    margin: 15px 0;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                code {
                    background: #f1f5f9;
                    padding: 2px 6px;
                    border-radius: 3px;
                    font-family: Monaco, Menlo, monospace;
                    font-size: 14px;
                }
                .method {
                    display: inline-block;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-weight: bold;
                    font-size: 12px;
                    margin-right: 8px;
                }
                .get { background: #10b981; color: white; }
                .post { background: #3b82f6; color: white; }
            </style>
        </head>
        <body>
            <h1>JSON-LD Proxy Server</h1>
            <p>CORS制限を回避してWebページからJSON-LDを取得するプロキシサーバー</p>

            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/proxy?url={TARGET_URL}</code>
                <p>指定されたURLのHTMLを取得します</p>
            </div>

            <div class="endpoint">
                <span class="method post">POST</span>
                <code>/extract-jsonld</code>
                <p>URLからJSON-LDを抽出します</p>
                <p>Body: <code>{ "url": "TARGET_URL" }</code></p>
            </div>

            <div class="endpoint">
                <span class="method get">GET</span>
                <code>/health</code>
                <p>サーバーのヘルスチェック</p>
            </div>

            <div class="endpoint">
                <h3>使用例</h3>
                <code>
                    fetch('http://localhost:${PORT}/proxy?url=http://localhost:3002/freelance/jobs/119213')
                    .then(response => response.text())
                    .then(html => console.log(html));
                </code>
            </div>
        </body>
        </html>
    `);
});

// Advisor APIエンドポイント（ローカル開発用）
app.post('/api/advisor', async (req, res) => {
  try {
    const advisorHandler = require('./api/advisor');
    await advisorHandler(req, res);
  } catch (error) {
    console.error('Advisor API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Blog Reviewer APIエンドポイント（ローカル開発用）
app.post('/api/blog-reviewer', async (req, res) => {
  try {
    const blogReviewerHandler = require('./api/blog-reviewer');
    await blogReviewerHandler(req, res);
  } catch (error) {
    console.error('Blog Reviewer API error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Web Advisor APIエンドポイント（ローカル開発用）
app.get('/api/web-advisor', async (req, res) => {
  try {
    const webAdvisorHandler = require('./api/web-advisor');
    await webAdvisorHandler(req, res);
  } catch (error) {
    console.error('Web Advisor API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// Web Advisor セッション発行（APIキー等を安全に受け取る）
app.post('/api/web-advisor/session', express.json(), async (req, res) => {
  try {
    const sessionHandler = require('./api/web-advisor-session');
    await sessionHandler(req, res);
  } catch (error) {
    console.error('Web Advisor Session API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// Chat APIエンドポイント（ローカル開発用）
app.post('/api/chat', async (req, res) => {
  try {
    const chatHandler = require('./api/chat');
    await chatHandler(req, res);
  } catch (error) {
    console.error('Chat API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// Content Upload Reviewer APIエンドポイント（ローカル開発用）
app.post('/api/content-upload-reviewer', async (req, res) => {
  try {
    const contentUploadReviewerHandler = require('./api/content-upload-reviewer');
    await contentUploadReviewerHandler(req, res);
  } catch (error) {
    console.error('Content Upload Reviewer API error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  }
});

// MyAPI 接続テスト（ローカル開発用）
app.post('/api/test-connection', async (req, res) => {
  try {
    const handler = require('./api/test-connection');
    await handler(req, res);
  } catch (error) {
    console.error('Test Connection API error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ベータ機能専用ルート
app.get('/file', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'file.html'));
});

app.get('/skill', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'skill.html'));
});

// ネットワークIPアドレスを取得
// デバッグモード用のルート
app.get('/debug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const os = require('os');
const networkInterfaces = os.networkInterfaces();
let localIP = 'localhost';

// IPv4アドレスを探す
Object.values(networkInterfaces).forEach(interfaces => {
  interfaces.forEach(iface => {
    if (iface.family === 'IPv4' && !iface.internal && iface.address.startsWith('192.168')) {
      localIP = iface.address;
    }
  });
});

// エクスポートしてテスト可能にしつつ、本実行時のみリッスン
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
      ================================
      JSON-LD Proxy Server is running!
      ================================

      [ローカルアクセス]
      http://localhost:${PORT}

      [ローカルネットワークIP]
      http://${localIP}:${PORT}

      Endpoints:
      - GET  /proxy?url={URL}     - Fetch HTML from URL
      - POST /extract-jsonld      - Extract JSON-LD from URL
      - GET  /health              - Health check

      NOTE: モバイルデバイスから外部アクセスする場合は ngrok の使用を推奨します:
      1. ngrok http ${PORT}
      2. 表示されたHTTPS URLを使用
      `);
  });
}

module.exports = app;
