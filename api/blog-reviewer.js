const OpenAI = require('openai');

// メモリベースのレート制限管理
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24時間
const MAX_REQUESTS_PER_IP = 50; // IP単位での制限

/**
 * 古いレート制限エントリをクリーンアップ (リクエスト毎に実行)
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
 * クライアントのIPアドレスを取得 (Vercel環境を優先)
 */
function getClientIp(req) {
  return (
    req.headers['x-vercel-forwarded-for']?.split(',')[0].trim() || // Vercel専用
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
  // リクエスト毎に古いエントリをクリーンアップ
  cleanupRateLimitStore();

  const now = Date.now();
  const entries = rateLimitStore.get(ip) || [];

  // 上限チェック
  if (entries.length >= MAX_REQUESTS_PER_IP) {
    const oldestTimestamp = entries[0];
    const resetTime = new Date(oldestTimestamp + RATE_LIMIT_WINDOW);
    return {
      allowed: false,
      remaining: 0,
      resetTime: resetTime.toISOString(),
      retryAfter: Math.ceil((oldestTimestamp + RATE_LIMIT_WINDOW - now) / 1000),
    };
  }

  // 新しいリクエストを記録
  entries.push(now);
  rateLimitStore.set(ip, entries);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_IP - entries.length,
    resetTime: new Date(now + RATE_LIMIT_WINDOW).toISOString(),
  };
}

const BLOG_REVIEW_PROMPT = `あなたはSEO・コンテンツマーケティングの専門家です。以下のArticle/BlogPosting JSON-LDデータとHTMLコンテンツを分析し、SEO観点、EEAT観点、アクセシビリティ観点でレビューを提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください

【分析観点】

1. **SEO観点**
   - タイトルの最適化（文字数、キーワード配置）
   - メタディスクリプションの効果性
   - 見出し構造（H1-H6の階層）
   - キーワードの適切な配置と密度
   - 内部リンク・外部リンクの戦略
   - 画像のalt属性とファイル名
   - URL構造の最適化
   - 構造化データの充実度

2. **EEAT観点（Expertise, Experience, Authoritativeness, Trustworthiness）**
   - 専門性：著者の専門知識の示し方
   - 経験：実体験や具体例の記載
   - 権威性：引用元や参考文献の信頼性
   - 信頼性：情報の正確性と更新日時の明示

3. **アクセシビリティ観点**
   - 画像のalt属性の適切性
   - 見出しの階層構造
   - リンクテキストの分かりやすさ
   - 色のコントラスト比
   - キーボード操作への対応

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[100文字程度の総評]

## SEO分析

### タイトル最適化
**現状:** [現在のタイトル]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### メタディスクリプション
**現状:** [現在の記述]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### 見出し構造
**現状:** [見出しの構造]
**評価:** [階層の適切性]
**改善案:** [具体的な提案]

### キーワード戦略
**主要キーワード:** [検出されたキーワード]
**評価:** [配置と密度の評価]
**改善案:** [具体的な提案]

## EEAT分析

### 専門性（Expertise）
**現状:** [専門性の示し方]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### 経験（Experience）
**現状:** [実体験の記載状況]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### 権威性（Authoritativeness）
**現状:** [引用元や参考文献の状況]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### 信頼性（Trustworthiness）
**現状:** [情報の正確性と更新状況]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

## アクセシビリティ分析

### 画像のalt属性
**現状:** [alt属性の使用状況]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### 見出しの階層
**現状:** [見出しの階層構造]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

### リンクテキスト
**現状:** [リンクテキストの状況]
**評価:** [良い点・改善点]
**改善案:** [具体的な提案]

## 優先的な改善提案
1. [最優先で改善すべき項目]
2. [次に改善すべき項目]
3. [その次に改善すべき項目]

## 追加推奨事項
- [具体的な追加提案1]
- [具体的な追加提案2]
- [具体的な追加提案3]

## 参考情報
[SEOやEEATに関する有用なリソースや最新のガイドライン]`;

module.exports = async (req, res) => {
  // CORSヘッダー
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // レート制限チェック（ユーザーのAPIキー使用時はスキップ）
    const { article, userApiKey, baseUrl, model } = req.body;
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

      // レート制限情報をレスポンスヘッダーに含める
      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
    }

    // 入力検証: articleの存在と型チェック
    if (!article || typeof article !== 'object') {
      return res.status(400).json({ error: 'article は有効なオブジェクトである必要があります' });
    }

    // 入力検証: articleオブジェクトのサイズ制限 (100KB)
    if (JSON.stringify(article).length > 100000) {
      return res.status(400).json({ error: '記事データが大きすぎます' });
    }

    // 入力検証: 最低限の必須フィールド
    if (!article.headline && !article.name && !article.title) {
      return res
        .status(400)
        .json({ error: 'article には headline, name, または title が必要です' });
    }

    // XSS対策: headlineの長さ制限
    if (typeof article.headline === 'string') {
      article.headline = article.headline.substring(0, 500);
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[BlogReviewer API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'AI分析サービスは現在利用できません' });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

    const userContent = JSON.stringify(article, null, 2);

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-5-nano';
    const isGPT5 = selectedModel.startsWith('gpt-5');

    const requestParams = {
      model: selectedModel,
      messages: [
        { role: 'system', content: BLOG_REVIEW_PROMPT },
        { role: 'user', content: userContent },
      ],
      stream: true,
      stream_options: { include_usage: true },
    };

    // GPT-5では temperature は非対応
    if (!isGPT5) {
      requestParams.temperature = 0.7;
    }

    const stream = await openai.chat.completions.create(requestParams);

    // モデル情報を最初に通知（フロントで料金計算モデル自動選択用）
    res.write(`data: ${JSON.stringify({ model: selectedModel })}\n\n`);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      // usage情報を送信
      if (chunk.usage) {
        res.write(`data: ${JSON.stringify({ usage: chunk.usage })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('BlogReviewer API error:', error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'AI分析に失敗しました',
        details: error.message,
      });
    }

    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
