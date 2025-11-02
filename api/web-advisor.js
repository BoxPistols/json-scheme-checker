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

  // body内のテキストスニペット抽出
  // scriptとstyleタグを除外してテキストを取得
  $('script').remove();
  $('style').remove();
  $('nav').remove();
  $('footer').remove();
  let bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  // トークン制限対策：テキスト長を制限（約8000文字 = 約2000トークン）
  // これでも OpenAI のプロンプト内のトークンと合わせると一定のバッファが残る
  const MAX_BODY_LENGTH = 8000;
  if (bodyText.length > MAX_BODY_LENGTH) {
    bodyText = bodyText.substring(0, MAX_BODY_LENGTH) + '...\n（以降省略）';
  }

  metadata.bodySnippet = bodyText;

  return metadata;
}

/**
 * プロンプトを生成（汎用Webページ分析）
 * ページの性質を判定して、ブログメディアまたは一般的なWebページとしてレビューを提供
 */
function buildPrompt(metadata, url) {
  return `あなたは経験豊富なWebサイト分析家です。以下のページ情報を分析し、ページの性質を判定した上で、適切な観点からコンテンツ品質、SEO、ユーザビリティについて具体的な改善提案を日本語で提供してください。

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

見出し構造:
H1: ${metadata.headings.h1.join(', ') || '（なし）'}
H2: ${metadata.headings.h2.slice(0, 8).join(', ') || '（なし）'}
H3: ${metadata.headings.h3.slice(0, 5).join(', ') || '（なし）'}

本文抜粋:
${metadata.bodySnippet}

【重要な制約】
- 絵文字は使用しないでください
- 簡潔で実践的な提案をしてください
- **ページの性質を判定してから分析してください**
  - ブログメディア: 長めの本文、複数のH2見出し、記事らしいタイトルを含むページ
  - 一般的なWebページ: 企業サイト、ポートフォリオ、ランディングページ、製品紹介など

【判定基準】
- **ブログメディア**と判定: 本文が1000文字以上、H2見出しが3個以上、記事的なタイトルと説明
- **一般的なWebページ**と判定: 上記の条件を満たさない場合

【出力形式】

## ページの性質判定

[このページがブログメディアか一般的なWebページかを判定し、その理由を1-2文で説明してください]

## 総合評価

### 評価スコア
[★★★☆☆ のように5段階で評価]

### 強み
- [このページの良い点を3つ]

### 改善が必要な点
- [改善すべき点を3つ]

## コンテンツ品質

### ページ構成の評価
[ページ構成、見出し階層、コンテンツボリュームについて]

### 読みやすさと明瞭性
- 見出し構造: [評価]
- 段落構成: [評価]
- 情報の整理度: [評価]

### 改善提案
1. [具体的な改善案]
2. [具体的な改善案]

## SEOとディスカバリー

### 現状の評価
- タイトルの魅力度: [評価]
- メタディスクリプション: [評価]
- 見出し階層の最適性: [評価]

### 改善提案
1. **タイトル改善案**: [具体的な代替案]
2. **メタディスクリプション改善案**: [具体的な代替案]
3. **見出し最適化**: [改善案]

## ユーザビリティとエンゲージメント

### 現状分析
[ページの目的に応じたユーザー体験について]

### 改善提案
1. **最初の印象**: [ユーザーを引き込む方法]
2. **情報の流れ**: [ナビゲーション改善提案]
3. **視覚的要素**: [レイアウト・デザイン改善提案]

## 技術的な改善点

### 構造化データ
[追加すべきスキーマタイプと理由（例：LocalBusiness, BlogPosting など）]

### ページ最適化
[ページ速度、アクセシビリティ、技術的な観点からの提案]

## 優先度の高い改善項目（TOP3）

1. **[最重要項目]**: [理由と期待効果]
2. **[重要項目]**: [理由と期待効果]
3. **[推奨項目]**: [理由と期待効果]

## まとめ

[このページの目的達成度と、改善による期待効果を2-3文で]`;
}

/**
 * フォールバックテンプレートを生成（汎用Webページ分析）
 * ページの性質を判定して、ブログメディアまたは一般的なWebページとしてテンプレートを生成
 */
function generateFallbackTemplate(metadata, _url) {
  const h1Count = metadata.headings.h1.length;
  const h2Count = metadata.headings.h2.length;
  const h3Count = metadata.headings.h3.length;
  const hasTitle = !!metadata.title;
  const hasDescription = !!metadata.description;
  const bodyLength = metadata.bodySnippet.length;

  // ページの性質を判定（ブログメディア vs 一般的なWebページ）
  const isBlogLike = bodyLength > 1000 && h2Count >= 3 && hasTitle;

  if (isBlogLike) {
    // ブログメディアの場合
    return `## ページの性質判定

このページはブログメディアの特徴を持っています。十分なコンテンツボリュームと複数の見出し構造が確認されます。

## 総合評価

### 評価スコア
${h1Count === 1 && h2Count > 0 && hasTitle ? '★★★☆☆' : '★★☆☆☆'}

### 強み
- ${h2Count > 3 ? '充実した見出し構造による明確な記事構成' : 'コンテンツが構成されている'}
- ${bodyLength > 2000 ? '十分なコンテンツボリュームがある' : 'ある程度のコンテンツが存在する'}
- ${hasDescription ? 'メタディスクリプションが設定されている' : '基本的なページ構成がある'}

### 改善が必要な点
- ${h1Count === 0 ? 'H1見出しが設定されていない' : h1Count > 1 ? 'H1見出しが複数存在する' : '見出し階層の最適化'}
- ${!hasDescription ? 'メタディスクリプションが未設定' : 'メタディスクリプションの改善'}
- ${!metadata.og.image ? 'OGイメージタグが未設定' : 'OGタグの最適化'}

## コンテンツ品質

### ページ構成の評価
見出し構造: H1(${h1Count}個)、H2(${h2Count}個)、H3(${h3Count}個)
コンテンツボリュームは${bodyLength > 2000 ? '充分' : bodyLength > 1000 ? 'まあまあ' : '限定的'}です。

### 読みやすさと明瞭性
- 見出し構造: ${h2Count >= 3 ? '適切に構成されている' : '改善の余地あり'}
- 段落構成: 見出しで${h2Count > 3 ? 'しっかり' : 'まあまあ'}区切られています
- 情報の整理度: 詳細な分析にはAI解析が必要です

### 改善提案
1. ${h1Count !== 1 ? 'H1見出しを1つだけ設定し、ページのメインテーマを明確にする' : 'H2見出しの内容を記事の構成に合わせて最適化する'}
2. ${!hasDescription ? 'メタディスクリプションを追加して検索結果での表示を改善する' : '見出し階層を整理してSEOを向上させる'}

## SEOとディスカバリー

### 現状の評価
- タイトルの魅力度: ${hasTitle ? '設定済み（改善可能）' : '未設定'}
- メタディスクリプション: ${hasDescription ? '設定済み（改善可能）' : '未設定'}
- 見出し階層の最適性: ${h2Count >= 3 ? '良好' : '改善が必要'}

### 改善提案
1. **タイトル改善案**: ${hasTitle ? '検索キーワードを含めて具体的にする' : 'ページの内容を反映したタイトルを設定する'}
2. **メタディスクリプション改善案**: ${hasDescription ? '120-160文字でコンテンツの価値を明確に伝える' : 'メタディスクリプションを追加（120-160文字）'}
3. **見出し最適化**: キーワードを含む見出しに改善し、検索向けに最適化する

## ユーザビリティとエンゲージメント

### 現状分析
ブログメディアとして、読者の関心を引き、理解しやすいコンテンツ構成が重要です。

### 改善提案
1. **最初の印象**: 導入文で読者の関心や課題を明確に示す
2. **情報の流れ**: 見出しの順序を論理的に整理し、読者が迷わないようにする
3. **視覚的要素**: 見出しのスタイルやマークアップを適切に活用する

## 技術的な改善点

### 構造化データ
BlogPostingスキーマの追加を推奨します（著者、公開日、更新日などの情報を含める）

### ページ最適化
ページ速度の測定と、モバイル対応を確認してください。

## 優先度の高い改善項目（TOP3）

1. **${h1Count !== 1 ? 'H1見出しの最適化' : 'BlogPostingスキーマの追加'}**: 検索エンジン対策の基本
2. **メタディスクリプションの最適化**: 検索結果でのクリック率向上
3. **見出し構造の最終確認**: ユーザー体験とSEOの改善

## まとめ

このページはブログメディアとしてのポテンシャルを持っています。基本的なSEO要素（タイトル、メタディスクリプション）の最適化とBlogPostingスキーマの追加により、検索順位とユーザー体験をさらに向上させることができます。
より詳細な分析と具体的な改善提案には、AI分析（OpenAI API）の利用を推奨します。

---
※ このアドバイスはテンプレートベースで生成されました。
より詳細な分析にはOpenAI APIキーの設定が必要です。`;
  } else {
    // 一般的なWebページの場合
    return `## ページの性質判定

このページは企業サイト、ポートフォリオ、ランディングページなど、一般的なWebページと判定されます。

## 総合評価

### 評価スコア
${h1Count === 1 && hasTitle && hasDescription ? '★★★☆☆' : '★★☆☆☆'}

### 強み
- ${hasTitle ? 'タイトルが設定されている' : 'ページが存在する'}
- ${hasDescription ? 'メタディスクリプションが設定されている' : 'ページ構造がある'}
- ${h1Count > 0 ? 'H1見出しが設定されている' : 'コンテンツが存在する'}

### 改善が必要な点
- ${h1Count === 0 ? 'H1見出しが設定されていない' : h1Count > 1 ? 'H1見出しが複数存在する' : '見出し階層の最適化'}
- ${!hasDescription ? 'メタディスクリプションが未設定' : 'メタディスクリプションの改善'}
- ${h2Count === 0 ? '見出し構造が不足している' : 'ページ構造の最適化'}

## コンテンツ品質

### ページ構成の評価
見出し構造: H1(${h1Count}個)、H2(${h2Count}個)、H3(${h3Count}個)
ページは${bodyLength > 1000 ? 'まあまあ充実' : 'コンパクト'}な内容になっています。

### 読みやすさと明瞭性
- 見出し構造: ${h2Count > 0 ? 'ある程度構成されている' : '改善が必要'}
- 段落構成: ${h2Count > 0 ? '見出しで区切られている' : 'フラットな構成'}
- 情報の整理度: 詳細な分析にはAI解析が必要です

### 改善提案
1. ${h1Count !== 1 ? 'H1見出しを1つだけ設定し、ページの主題を明確にする' : '見出し階層をチェックして情報構造を最適化する'}
2. ${!hasDescription ? 'メタディスクリプションを追加して検索結果での表示を改善する' : '見出しの数を増やしてページ構造を明確にする'}

## SEOとディスカバリー

### 現状の評価
- タイトルの魅力度: ${hasTitle ? '設定済み（改善可能）' : '未設定'}
- メタディスクリプション: ${hasDescription ? '設定済み（改善可能）' : '未設定'}
- 見出し階層の最適性: ${h2Count > 0 ? '基本的に対応' : '改善が必要'}

### 改善提案
1. **タイトル改善案**: ${hasTitle ? 'ページの主要キーワードを含めて改善する' : 'ページの内容を反映したタイトルを設定する'}
2. **メタディスクリプション改善案**: ${hasDescription ? '120-160文字でページの価値を明確に伝える' : 'メタディスクリプションを追加（120-160文字）'}
3. **見出し最適化**: ${h2Count === 0 ? 'コンテンツに見出しを追加して構造化する' : '見出しにキーワードを含める'}

## ユーザビリティとエンゲージメント

### 現状分析
ページの目的（販売、情報提供、お問い合わせなど）に応じた、わかりやすい構成が重要です。

### 改善提案
1. **最初の印象**: ファーストビューでページの目的と価値を明確に示す
2. **情報の流れ**: ユーザーが求める情報に容易にアクセスできるナビゲーション
3. **視覚的要素**: ボタン、セクション分け、カラーを活用した見やすさの向上

## 技術的な改善点

### 構造化データ
ページの目的に応じた適切なスキーマ（Organization、LocalBusiness、Productなど）の追加を推奨します。

### ページ最適化
ページ速度、モバイル対応、アクセシビリティの確認をお勧めします。

## 優先度の高い改善項目（TOP3）

1. **${h1Count !== 1 ? 'H1見出しの最適化' : 'タイトル・メタディスクリプション改善'}**: SEO基礎要素
2. **${h2Count === 0 ? '見出しの追加' : 'ページ構造の最適化'}**: ユーザビリティとSEO向上
3. **適切なスキーマの追加**: 検索結果でのリッチスニペット表示

## まとめ

基本的なSEO要素（タイトル、メタディスクリプション、H1見出し）の最適化から始めることで、検索順位とユーザー体験を向上させることができます。
より詳細な分析と具体的な改善提案には、AI分析（OpenAI API）の利用を推奨します。

---
※ このアドバイスはテンプレートベースで生成されました。
より詳細な分析にはOpenAI APIキーの設定が必要です。`;
  }
}

/**
 * Webアドバイザーエンドポイント（SSE）
 */
module.exports = async (req, res) => {
  console.log('[Web-Advisor-Endpoint] Request started');

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

  // セキュア化: sessionToken を優先（POSTで発行）
  const {
    url,
    sessionToken,
    userApiKey: userApiKeyQuery,
    provider: providerQ,
    baseUrl: baseUrlQ,
    model: modelQ,
  } = req.query;

  console.log('[Web-Advisor-Endpoint] URL:', url);
  console.log('[Web-Advisor-Endpoint] Has sessionToken:', !!sessionToken);

  // セッション取得（存在すればこちらを優先）
  let userApiKey = null;
  let provider = null;
  let baseUrl = null;
  let model = null;
  if (sessionToken) {
    try {
      const { getSession } = require('./web-advisor-session-store');
      const s = getSession(sessionToken);
      if (!s) {
        console.log('[Web-Advisor-Endpoint] Invalid sessionToken');
        return res.status(400).json({ error: 'Invalid or expired sessionToken' });
      }
      userApiKey = s.userApiKey || null;
      provider = s.provider || null;
      baseUrl = s.baseUrl || null;
      model = s.model || null;
      console.log('[Web-Advisor-Endpoint] Session retrieved, hasApiKey:', !!userApiKey);
    } catch (err) {
      console.log('[Web-Advisor-Endpoint] Session error:', err.message);
      // 無視してフォールバック
    }
  }

  // 後方互換（非推奨）: クエリでの指定を許容
  if (!userApiKey && userApiKeyQuery) userApiKey = userApiKeyQuery;
  if (!provider && providerQ) provider = providerQ;
  if (!baseUrl && baseUrlQ) baseUrl = baseUrlQ;
  if (!model && modelQ) model = modelQ;

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
    // SSRF対策: 既定でプライベート/メタデータ範囲を拒否（本番有効、開発はWEB_ADVISOR_SSRF_PROTECT=0で無効化可能）
    const protect =
      process.env.WEB_ADVISOR_SSRF_PROTECT !== '0' || process.env.NODE_ENV === 'production';
    if (protect) {
      const host = parsedUrl.hostname;
      const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host);
      const blocked =
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '::1' ||
        host === '169.254.169.254' ||
        (isIp &&
          (host.startsWith('10.') ||
            host.startsWith('192.168.') ||
            (host.startsWith('172.') &&
              (() => {
                const n = parseInt(host.split('.')[1], 10);
                return n >= 16 && n <= 31;
              })())));
      if (blocked) {
        return res.status(403).json({ error: 'Private/metadata network is not allowed' });
      }
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

    console.log('[Web-Advisor] Fetching URL:', url);

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
    console.log('[Web-Advisor] HTML fetched, length:', html.length);

    // メタ情報解析
    res.write(
      `data: ${JSON.stringify({ type: 'progress', stage: 'parsing', message: 'ページを解析中...' })}\n\n`
    );

    const metadata = extractMetadata(html);
    console.log('[Web-Advisor] Metadata extracted, title:', metadata.title?.substring(0, 50));

    // メタ情報送信
    res.write(`data: ${JSON.stringify({ type: 'meta', data: metadata })}\n\n`);

    // AI分析開始
    res.write(
      `data: ${JSON.stringify({ type: 'progress', stage: 'analyzing', message: 'AI分析中...' })}\n\n`
    );

    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    console.log('[Web-Advisor] Has API key:', !!apiKey);

    if (apiKey) {
      // OpenAI APIによる分析（baseUrlがあればOpenAI互換エンドポイントとして利用）
      const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });
      const prompt = buildPrompt(metadata, url);

      const usingServerKey = !userApiKey && !!process.env.OPENAI_API_KEY;
      const PUBLIC_ALLOWED_MODELS = (process.env.PUBLIC_ALLOWED_MODELS || 'gpt-5-nano,gpt-4.1-nano')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      let selectedModel = model || process.env.OPENAI_MODEL || 'gpt-5-nano';

      // サーバー既定キー使用時はモデルとbaseUrlを強制（エンドユーザーの上書きを無効化）
      if (usingServerKey) {
        if (!PUBLIC_ALLOWED_MODELS.includes(selectedModel)) {
          if (
            process.env.OPENAI_MODEL &&
            PUBLIC_ALLOWED_MODELS.includes(process.env.OPENAI_MODEL)
          ) {
            selectedModel = process.env.OPENAI_MODEL;
          } else {
            selectedModel = PUBLIC_ALLOWED_MODELS[0];
          }
        }
        baseUrl = undefined; // 既定キー利用時は独自ベースURLを禁止
      }

      const isGPT5 = selectedModel.startsWith('gpt-5');

      const requestParams = {
        model: selectedModel,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      };

      // GPT-5では temperature は非対応
      if (!isGPT5) {
        requestParams.temperature = 0.7;
      }

      try {
        const stream = await openai.chat.completions.create(requestParams);

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`);
          }
        }
      } catch (apiError) {
        console.error('[Web-Advisor] OpenAI API Error:', {
          message: apiError.message,
          status: apiError.status,
          code: apiError.code,
          error: apiError.error?.message || apiError.error,
        });
        // API エラーが発生した場合は error イベント送信
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            message: `API分析に失敗しました: ${apiError.message}`,
          })}\n\n`
        );
        cleanup();
        res.end();
        return;
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
