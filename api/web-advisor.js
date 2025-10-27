const OpenAI = require('openai');
const cheerio = require('cheerio');

// メモリベースのレート制限管理
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24時間
const MAX_REQUESTS_PER_IP = 10;

// レート制限クリーンアップのインターバル（30分ごと）
let cleanupInterval = null;

/**
 * 古いレート制限エントリをクリーンアップ
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entries] of rateLimitStore.entries()) {
    const activeEntries = entries.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    if (activeEntries.length === 0) {
      rateLimitStore.delete(key);
    } else if (activeEntries.length !== entries.length) {
      rateLimitStore.set(key, activeEntries);
    }
  }
}

/**
 * 定期的なクリーンアップを開始
 */
function startPeriodicCleanup() {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(
      () => {
        cleanupRateLimitStore();
      },
      30 * 60 * 1000
    ); // 30分ごと
  }
}

/**
 * 指数バックオフによる再試行機能付きfetch
 */
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || 25000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // 指数バックオフ（1秒、2秒、4秒）
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * クライアントのIPアドレスを取得
 */
function getClientIp(req) {
  return (
    req.headers['x-vercel-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    '0.0.0.0'
  );
}

/**
 * レート制限をチェック
 */
function checkRateLimit(ip) {
  // 定期クリーンアップを開始（初回呼び出し時）
  startPeriodicCleanup();

  const now = Date.now();
  const entries = rateLimitStore.get(ip) || [];

  // 古いエントリをフィルタ（IPごとに個別にクリーンアップ）
  const activeEntries = entries.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  if (activeEntries.length >= MAX_REQUESTS_PER_IP) {
    const oldestTimestamp = activeEntries[0];
    const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW);
    return {
      allowed: false,
      remaining: 0,
      resetTime: resetTime.toISOString(),
      retryAfter: Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW - now) / 1000),
    };
  }

  activeEntries.push(now);
  rateLimitStore.set(ip, activeEntries);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_IP - activeEntries.length,
    resetTime: new Date(now + RATE_LIMIT_WINDOW).toISOString(),
  };
}

/**
 * HTMLからメタ情報を抽出（cheerio使用）
 */
function extractMetadata(html) {
  const $ = cheerio.load(html);
  const metadata = {
    title: '',
    description: '',
    og: {},
    twitter: {},
    headings: { h1: [], h2: [], h3: [] },
    bodySnippet: '',
  };

  // title抽出
  metadata.title = $('title').text().trim();

  // meta description抽出
  metadata.description = $('meta[name="description"]').attr('content') || '';

  // OGタグ抽出
  $('meta[property^="og:"]').each(function () {
    const property = $(this).attr('property');
    const content = $(this).attr('content');
    if (property && content) {
      const key = property.replace('og:', '');
      metadata.og[key] = content;
    }
  });

  // Twitter Cardタグ抽出
  $('meta[name^="twitter:"]').each(function () {
    const name = $(this).attr('name');
    const content = $(this).attr('content');
    if (name && content) {
      const key = name.replace('twitter:', '');
      metadata.twitter[key] = content;
    }
  });

  // 見出し抽出（h1-h3）
  $('h1').each(function () {
    const text = $(this).text().trim();
    if (text) metadata.headings.h1.push(text);
  });

  $('h2')
    .slice(0, 10)
    .each(function () {
      const text = $(this).text().trim();
      if (text) metadata.headings.h2.push(text);
    });

  $('h3')
    .slice(0, 10)
    .each(function () {
      const text = $(this).text().trim();
      if (text) metadata.headings.h3.push(text);
    });

  // body内のテキストスニペット抽出（最初の3000文字）
  // scriptとstyleタグを除外してテキストを取得
  $('script').remove();
  $('style').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  metadata.bodySnippet = bodyText.substring(0, 3000);

  return metadata;
}

/**
 * プロンプトを生成
 */
function buildPrompt(metadata, url) {
  return `あなたは経験豊富なWebアドバイザーです。以下のWebページを分析し、非エンジニアにも理解しやすい日本語で改善提案を提供してください。

【分析対象URL】
${url}

【ページ情報】
タイトル: ${metadata.title || '（未設定）'}
説明: ${metadata.description || '（未設定）'}

OGタグ:
${
  Object.keys(metadata.og).length > 0
    ? Object.entries(metadata.og)
        .map(([k, v]) => `- og:${k}: ${v}`)
        .join('\n')
    : '（未設定）'
}

Twitter Card:
${
  Object.keys(metadata.twitter).length > 0
    ? Object.entries(metadata.twitter)
        .map(([k, v]) => `- twitter:${k}: ${v}`)
        .join('\n')
    : '（未設定）'
}

見出し構造:
H1: ${metadata.headings.h1.join(', ') || '（なし）'}
H2: ${metadata.headings.h2.slice(0, 5).join(', ') || '（なし）'}
H3: ${metadata.headings.h3.slice(0, 5).join(', ') || '（なし）'}

本文スニペット:
${metadata.bodySnippet.substring(0, 500)}...

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください
- 具体的で実行可能な提案を心がけてください

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## SEO（検索エンジン最適化）

### 現状評価
[SEOの観点から現状を簡潔に評価]

### 改善提案
1. **タイトルタグ**: [具体的な改善案]
2. **メタディスクリプション**: [具体的な改善案]
3. **見出し構造**: [具体的な改善案]
4. **構造化データ**: [追加すべきスキーマの提案]

## EEAT（専門性・権威性・信頼性）

### 現状評価
[EEATの観点から現状を簡潔に評価]

### 改善提案
1. **専門性の強化**: [具体的な改善案]
2. **権威性の確立**: [具体的な改善案]
3. **信頼性の向上**: [具体的な改善案]

## アクセシビリティ

### 現状評価
[アクセシビリティの観点から現状を簡潔に評価]

### 改善提案
1. **見出し構造**: [具体的な改善案]
2. **画像の代替テキスト**: [具体的な改善案]
3. **コントラスト・可読性**: [具体的な改善案]

## 優先対応事項

実装の優先度が高い項目を3つ選んで提示してください：

1. **[項目名]**: [なぜ優先すべきか]
2. **[項目名]**: [なぜ優先すべきか]
3. **[項目名]**: [なぜ優先すべきか]

## 総括

[全体的な総評と今後の方向性を2-3文で]`;
}

/**
 * フォールバックテンプレートを生成
 */
function generateFallbackTemplate(metadata, _url) {
  return `## SEO（検索エンジン最適化）

### 現状評価
タイトル: ${metadata.title ? '設定済み' : '未設定'}
メタディスクリプション: ${metadata.description ? '設定済み' : '未設定'}
見出し構造: H1が${metadata.headings.h1.length}個、H2が${metadata.headings.h2.length}個検出されました

### 改善提案
1. **タイトルタグ**: ${metadata.title ? 'タイトルを30-60文字程度に調整し、主要キーワードを含めることを推奨します' : 'タイトルタグを設定してください（30-60文字推奨）'}
2. **メタディスクリプション**: ${metadata.description ? 'メタディスクリプションを120-160文字程度に調整し、ページの価値を明確に伝えることを推奨します' : 'メタディスクリプションを追加してください（120-160文字推奨）'}
3. **見出し構造**: ${metadata.headings.h1.length === 0 ? 'H1見出しを1つ追加してください' : 'H1は1つのみ、H2-H6で階層的な構造を作ることを推奨します'}
4. **構造化データ**: JSON-LD形式でWebPageスキーマを追加することを推奨します

## EEAT（専門性・権威性・信頼性）

### 現状評価
ページの専門性と信頼性を高めるための基本的な要素の確認が必要です

### 改善提案
1. **専門性の強化**: 著者情報や執筆者の専門性を明示することを推奨します
2. **権威性の確立**: 外部の信頼できる情報源へのリンクや引用を追加することを推奨します
3. **信頼性の向上**: 運営者情報、プライバシーポリシー、お問い合わせ先を明記することを推奨します

## アクセシビリティ

### 現状評価
基本的なアクセシビリティ要素の確認が必要です

### 改善提案
1. **見出し構造**: H1-H6を階層的に使用し、スクリーンリーダーでの読み上げを考慮してください
2. **画像の代替テキスト**: すべての画像にalt属性を追加し、内容を説明してください
3. **コントラスト・可読性**: テキストと背景のコントラスト比を4.5:1以上に保つことを推奨します

## 優先対応事項

実装の優先度が高い項目：

1. **タイトルとメタディスクリプションの最適化**: 検索結果での表示とクリック率に直接影響します
2. **見出し構造の改善**: SEOとアクセシビリティの両方に重要です
3. **構造化データの追加**: 検索結果でのリッチスニペット表示に必要です

## 総括

基本的なSEO要素の整備から始め、段階的にEEATとアクセシビリティを向上させることで、検索順位の向上とユーザーエクスペリエンスの改善が期待できます。

---
※ このアドバイスはOpenAI APIが利用できないため、テンプレートベースで生成されました。
より詳細な分析を行うには、OpenAI APIキーを設定してください。`;
}

/**
 * Webアドバイザーエンドポイント（SSE）
 */
module.exports = async (req, res) => {
  // CORSヘッダー（すべてのオリジンを許可）
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Note: userApiKey is intentionally passed via query parameter for SSE compatibility.
  // Users provide their own key and are responsible for its security.
  const { url, userApiKey } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'url parameter is required' });
  }

  // URL検証
  // Note: User-provided URL is by design (web advisor analyzes any URL).
  // Additional safety: only HTTP/HTTPS protocols allowed.
  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.status(400).json({ error: 'HTTP/HTTPS URLのみサポートされています' });
    }
  } catch (error) {
    return res.status(400).json({ error: '無効なURL形式です' });
  }

  // レート制限チェック（userApiKey使用時はスキップ）
  if (!userApiKey) {
    const clientIp = getClientIp(req);
    const rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      res.setHeader('Retry-After', rateLimitResult.retryAfter);
      return res.status(429).json({
        error: 'レート制限に達しました',
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        retryAfter: rateLimitResult.retryAfter,
      });
    }

    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
  }

  // SSEヘッダー設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // keepalive用のインターバル
  const keepaliveInterval = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  const cleanup = () => {
    clearInterval(keepaliveInterval);
  };

  req.on('close', cleanup);
  req.on('error', cleanup);

  try {
    // 初期化イベント送信
    res.write(`data: ${JSON.stringify({ type: 'init', message: '分析を開始します...' })}\n\n`);

    // HTML取得
    res.write(
      `data: ${JSON.stringify({ type: 'progress', stage: 'fetching', message: 'ページを取得中...' })}\n\n`
    );

    const fetchResponse = await fetchWithRetry(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 25000,
      redirect: 'follow',
    });

    const html = await fetchResponse.text();

    // メタ情報解析
    res.write(
      `data: ${JSON.stringify({ type: 'progress', stage: 'parsing', message: 'ページを解析中...' })}\n\n`
    );

    const metadata = extractMetadata(html);

    // メタ情報送信
    res.write(`data: ${JSON.stringify({ type: 'meta', data: metadata })}\n\n`);

    // AI分析開始
    res.write(
      `data: ${JSON.stringify({ type: 'progress', stage: 'analyzing', message: 'AI分析中...' })}\n\n`
    );

    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    if (apiKey) {
      // OpenAI APIによる分析
      const openai = new OpenAI({ apiKey });
      const prompt = buildPrompt(metadata, url);

      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
        }
      }
    } else {
      // フォールバックテンプレート
      console.log('[Web-Advisor] No API key available, using fallback template');
      const fallbackContent = generateFallbackTemplate(metadata, url);

      // チャンク化してストリーミング風に送信
      const chunkSize = 50;
      for (let i = 0; i < fallbackContent.length; i += chunkSize) {
        const chunk = fallbackContent.substring(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    // 完了イベント
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    cleanup();
    res.end();
  } catch (error) {
    console.error('[Web-Advisor] Error:', error.message);
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`);
    cleanup();
    res.end();
  }
};
