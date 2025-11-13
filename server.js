require('dotenv').config();

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const compression = require('compression');
const { decodeHtmlBuffer } = require('./lib/charset-decoder');
const {
  getProxyConfig,
  getExtractConfig,
  normalizeLocalhostUrl,
} = require('./lib/axios-config');

const app = express();
const PORT = process.env.PORT || 3333;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// レスポンス圧縮を有効化（パフォーマンス向上）
app.use(compression());

// CORS設定
const corsOptions = IS_PRODUCTION
  ? {
      origin: process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS.trim()
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['https://json-ld-view.vercel.app'],
      credentials: true,
    }
  : {}; // 開発環境ではすべてのオリジンを許可

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // JSONペイロードサイズ制限を追加

// APIハンドラーをキャッシュ（パフォーマンス向上）
const advisorHandler = require('./api/advisor');
const blogReviewerHandler = require('./api/blog-reviewer');
const webAdvisorHandler = require('./api/web-advisor');
const sessionHandler = require('./api/web-advisor-session');
const chatHandler = require('./api/chat');
const contentUploadReviewerHandler = require('./api/content-upload-reviewer');
const testConnectionHandler = require('./api/test-connection');

// ロギングヘルパー
const logger = {
  info: (...args) => {
    if (!IS_PRODUCTION || process.env.ENABLE_LOGGING === 'true') {
      console.log(...args);
    }
  },
  error: (...args) => console.error(...args),
};

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// プロキシエンドポイント
app.get('/proxy', async (req, res) => {
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
    // キャッシュ制御ヘッダーを追加（パフォーマンス向上）
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
});

// JSON-LD抽出エンドポイント
app.post('/extract-jsonld', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // URLバリデーション
  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  try {
    logger.info(`Extracting JSON-LD from: ${url}`);

    const config = getExtractConfig();
    const response = await axios.get(url, config);

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
        logger.error('Failed to parse JSON-LD:', e.message);
      }
    }

    res.json({
      url: url,
      schemas: matches,
      count: matches.length,
    });
  } catch (error) {
    logger.error('Error extracting JSON-LD:', error.message);
    res.status(500).json({
      error: 'Failed to extract JSON-LD',
      message: IS_PRODUCTION ? 'Internal server error' : error.message,
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
    await advisorHandler(req, res);
  } catch (error) {
    logger.error('Advisor API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: IS_PRODUCTION ? undefined : error.message,
      });
    }
  }
});

// Blog Reviewer APIエンドポイント（ローカル開発用）
app.post('/api/blog-reviewer', async (req, res) => {
  try {
    await blogReviewerHandler(req, res);
  } catch (error) {
    logger.error('Blog Reviewer API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: IS_PRODUCTION ? undefined : error.message,
      });
    }
  }
});

// Web Advisor APIエンドポイント（ローカル開発用）
app.get('/api/web-advisor', async (req, res) => {
  try {
    await webAdvisorHandler(req, res);
  } catch (error) {
    logger.error('Web Advisor API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: IS_PRODUCTION ? undefined : error.message,
      });
    }
  }
});

// Web Advisor セッション発行（APIキー等を安全に受け取る）
app.post('/api/web-advisor/session', express.json(), async (req, res) => {
  try {
    await sessionHandler(req, res);
  } catch (error) {
    logger.error('Web Advisor Session API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: IS_PRODUCTION ? undefined : error.message,
      });
    }
  }
});

// Chat APIエンドポイント（ローカル開発用）
app.post('/api/chat', async (req, res) => {
  try {
    await chatHandler(req, res);
  } catch (error) {
    logger.error('Chat API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: IS_PRODUCTION ? undefined : error.message,
      });
    }
  }
});

// Content Upload Reviewer APIエンドポイント（ローカル開発用）
app.post('/api/content-upload-reviewer', async (req, res) => {
  try {
    await contentUploadReviewerHandler(req, res);
  } catch (error) {
    logger.error('Content Upload Reviewer API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        details: IS_PRODUCTION ? undefined : error.message,
      });
    }
  }
});

// MyAPI 接続テスト（ローカル開発用）
app.post('/api/test-connection', async (req, res) => {
  try {
    await testConnectionHandler(req, res);
  } catch (error) {
    logger.error('Test Connection API error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        error: IS_PRODUCTION ? 'Internal server error' : error.message,
      });
    }
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
