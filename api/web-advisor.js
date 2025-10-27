const OpenAI = require('openai');
const axios = require('axios');

// メモリベースのレート制限管理
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24時間
const MAX_REQUESTS_PER_IP = 10; // IP単位での制限

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
  cleanupRateLimitStore();
  const now = Date.now();
  const entries = rateLimitStore.get(ip) || [];

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

  entries.push(now);
  rateLimitStore.set(ip, entries);

  return {
    allowed: true,
    remaining: MAX_REQUESTS_PER_IP - entries.length,
    resetTime: new Date(now + RATE_LIMIT_WINDOW).toISOString(),
  };
}

/**
 * HTMLからメタデータを抽出（軽量実装）
 */
function extractMetadata(html) {
  const metadata = {
    title: '',
    description: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    headings: { h1: [], h2: [], h3: [] },
    bodyText: '',
  };

  // title抽出
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch) metadata.title = titleMatch[1].trim();

  // meta description抽出
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (descMatch) metadata.description = descMatch[1].trim();

  // OG tags
  const ogTitleMatch = html.match(
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i
  );
  if (ogTitleMatch) metadata.ogTitle = ogTitleMatch[1].trim();

  const ogDescMatch = html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i
  );
  if (ogDescMatch) metadata.ogDescription = ogDescMatch[1].trim();

  const ogImageMatch = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i
  );
  if (ogImageMatch) metadata.ogImage = ogImageMatch[1].trim();

  // Twitter tags
  const twTitleMatch = html.match(
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i
  );
  if (twTitleMatch) metadata.twitterTitle = twTitleMatch[1].trim();

  const twDescMatch = html.match(
    /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["']/i
  );
  if (twDescMatch) metadata.twitterDescription = twDescMatch[1].trim();

  const twImageMatch = html.match(
    /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i
  );
  if (twImageMatch) metadata.twitterImage = twImageMatch[1].trim();

  // 見出し抽出（h1-h3）
  const h1Matches = html.match(/<h1[^>]*>(.*?)<\/h1>/gi);
  if (h1Matches) {
    metadata.headings.h1 = h1Matches
      .map(h => h.replace(/<[^>]*>/g, '').trim())
      .filter(h => h.length > 0)
      .slice(0, 5); // 最大5個
  }

  const h2Matches = html.match(/<h2[^>]*>(.*?)<\/h2>/gi);
  if (h2Matches) {
    metadata.headings.h2 = h2Matches
      .map(h => h.replace(/<[^>]*>/g, '').trim())
      .filter(h => h.length > 0)
      .slice(0, 10); // 最大10個
  }

  const h3Matches = html.match(/<h3[^>]*>(.*?)<\/h3>/gi);
  if (h3Matches) {
    metadata.headings.h3 = h3Matches
      .map(h => h.replace(/<[^>]*>/g, '').trim())
      .filter(h => h.length > 0)
      .slice(0, 15); // 最大15個
  }

  // 本文抽出（簡易実装: bodyタグ内のテキストから最初の1000文字程度）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    const bodyContent = bodyMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // scriptタグ除去
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // styleタグ除去
      .replace(/<[^>]*>/g, ' ') // HTMLタグ除去
      .replace(/\s+/g, ' ') // 連続した空白を1つに
      .trim();
    metadata.bodyText = bodyContent.substring(0, 1000);
  }

  return metadata;
}

/**
 * テンプレート出力を擬似ストリーミング
 */
async function streamTemplateResponse(res, metadata, url) {
  const template = `# Webサイト分析レポート

## 基本情報
- **URL**: ${url}
- **タイトル**: ${metadata.title || '（未設定）'}
- **説明文**: ${metadata.description || '（未設定）'}

## SEO評価

### メタタグ
${metadata.title ? '✓' : '✗'} タイトルタグ: ${metadata.title ? '設定済み' : '**未設定** - タイトルタグは必須です'}
${metadata.description ? '✓' : '✗'} ディスクリプション: ${metadata.description ? '設定済み' : '**未設定** - 検索結果に表示される説明文を設定してください'}

### Open Graph（SNSシェア）
${metadata.ogTitle ? '✓' : '✗'} og:title: ${metadata.ogTitle || '未設定'}
${metadata.ogDescription ? '✓' : '✗'} og:description: ${metadata.ogDescription || '未設定'}
${metadata.ogImage ? '✓' : '✗'} og:image: ${metadata.ogImage || '未設定'}

### Twitter Card
${metadata.twitterTitle ? '✓' : '✗'} twitter:title: ${metadata.twitterTitle || '未設定'}
${metadata.twitterDescription ? '✓' : '✗'} twitter:description: ${metadata.twitterDescription || '未設定'}
${metadata.twitterImage ? '✓' : '✗'} twitter:image: ${metadata.twitterImage || '未設定'}

## 見出し構造

### H1見出し（${metadata.headings.h1.length}個）
${metadata.headings.h1.length > 0 ? metadata.headings.h1.map(h => `- ${h}`).join('\n') : '（見出しが見つかりません）'}

### H2見出し（${metadata.headings.h2.length}個）
${metadata.headings.h2.length > 0 ? metadata.headings.h2.map(h => `- ${h}`).join('\n') : '（見出しが見つかりません）'}

### H3見出し（${metadata.headings.h3.length}個）
${
  metadata.headings.h3.length > 0
    ? metadata.headings.h3
        .slice(0, 5)
        .map(h => `- ${h}`)
        .join('\n')
    : '（見出しが見つかりません）'
}

## 優先課題

### 緊急度：高
${!metadata.title ? '- タイトルタグの設定\n' : ''}${!metadata.description ? '- ディスクリプションの設定\n' : ''}${metadata.headings.h1.length === 0 ? '- H1見出しの追加\n' : ''}${metadata.headings.h1.length > 1 ? '- H1見出しが複数あります（1つに統一推奨）\n' : ''}

### 緊急度：中
${!metadata.ogTitle && !metadata.ogDescription ? '- Open Graphタグの設定（SNSシェア対応）\n' : ''}${!metadata.twitterTitle && !metadata.twitterDescription ? '- Twitter Cardの設定\n' : ''}

## EEAT（専門性・権威性・信頼性）分析

### 現状
- コンテンツの専門性: ${metadata.headings.h2.length > 3 ? '構造化されたコンテンツが確認できます' : '見出し構造が不足しています'}
- 情報の信頼性: メタデータから評価が困難（実際のコンテンツの確認が必要）

### 推奨事項
- 著者情報の明記
- 最終更新日の表示
- 参照元・出典の明示
- 専門的な用語の適切な使用

## アクセシビリティ

### 基本項目
- 見出し階層: ${metadata.headings.h1.length > 0 && metadata.headings.h2.length > 0 ? '適切に構造化されています' : '見出し構造の改善が必要です'}
- 画像の代替テキスト: （HTMLの詳細分析が必要）
- リンクテキスト: （HTMLの詳細分析が必要）

### 推奨事項
- 画像にalt属性を設定
- リンクに分かりやすいテキストを使用
- フォームにlabel要素を追加
- 適切な色のコントラストを確保

## まとめ

このレポートは基本的なメタデータ分析に基づいています。より詳細な分析には、実際のコンテンツの確認やユーザビリティテストが必要です。

**注意**: このレポートはAI APIキーが設定されていないため、テンプレートベースの分析結果です。より詳細な分析を行うには、OpenAI APIキーを設定してください。
`;

  // 1文字ずつストリーミング風に送信
  const chars = template.split('');
  for (let i = 0; i < chars.length; i++) {
    res.write(`data: ${JSON.stringify({ token: chars[i] })}\n\n`);
    // 30文字ごとに少し待つ（リアルタイム感を演出）
    if (i % 30 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}

/**
 * AIプロンプトを生成
 */
function generatePrompt(metadata, url) {
  return `あなたはWebサイトのSEO、EEAT（専門性・権威性・信頼性）、アクセシビリティの専門家です。以下のWebページのメタデータを分析し、非エンジニア向けに改善提案を提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 実用的で具体的なアドバイスを提供してください

【分析対象URL】
${url}

【メタデータ】
\`\`\`json
${JSON.stringify(metadata, null, 2)}
\`\`\`

【出力形式】
以下の構造で日本語のMarkdown形式で出力してください：

## 基本情報
- URL、タイトル、説明文を記載

## SEO評価

### メタタグ
- タイトルタグの評価と改善提案
- ディスクリプションの評価と改善提案
- 文字数チェック（タイトル30-60文字、ディスクリプション120-160文字）

### Open Graph（SNSシェア）
- og:title, og:description, og:imageの設定状況
- 改善が必要な場合は具体的な提案

### Twitter Card
- twitter:title, twitter:description, twitter:imageの設定状況
- 改善が必要な場合は具体的な提案

## 見出し構造
- H1, H2, H3の使用状況と階層の適切性
- 見出しの内容から推測されるコンテンツの質
- 改善提案（重複、不足、階層の問題など）

## 優先課題
緊急度順に3-5項目をリストアップ

### 緊急度：高
- 必須の修正項目

### 緊急度：中
- 推奨される改善項目

### 緊急度：低
- より良くするための提案

## EEAT（専門性・権威性・信頼性）分析

### 現状評価
- メタデータから読み取れる専門性
- 情報の信頼性を高めるための要素

### 推奨事項
- 著者情報の追加
- 更新日時の表示
- 参照元・出典の明記
- その他の信頼性向上施策

## アクセシビリティ

### 基本項目の評価
- 見出し階層の適切性
- メタデータの充実度

### 推奨事項
- 画像の代替テキスト
- リンクテキストの明確化
- フォームのラベル
- 色のコントラスト
- その他のアクセシビリティ向上施策

## まとめ
- 総合評価（5段階）
- 最も重要な3つのアクションアイテム
- 次のステップの提案`;
}

module.exports = async (req, res) => {
  // CORSヘッダー
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, userApiKey } = req.query;

    // URL検証
    if (!url) {
      return res.status(400).json({ error: 'url パラメータは必須です' });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch (e) {
      return res.status(400).json({ error: '有効なURL（http/https）を指定してください' });
    }

    // レート制限チェック（userApiKey指定時はスキップ）
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
          message: `24時間あたり${MAX_REQUESTS_PER_IP}回まで利用可能です。${Math.ceil(rateLimitResult.retryAfter / 3600)}時間後に再試行してください。`,
        });
      }

      res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
      res.setHeader('X-RateLimit-Reset', rateLimitResult.resetTime);
    }

    // SSEヘッダー設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 初期イベント（即座に送信）
    res.write(`data: ${JSON.stringify({ event: 'init', message: '分析を開始します' })}\n\n`);

    // Keepalive ping
    const keepaliveInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    // HTML取得
    res.write(
      `data: ${JSON.stringify({ event: 'progress', stage: 'fetching', message: 'HTMLを取得中...' })}\n\n`
    );

    let htmlResponse;
    try {
      htmlResponse = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        },
        timeout: 25000,
        maxRedirects: 5,
      });
    } catch (fetchError) {
      clearInterval(keepaliveInterval);
      res.write(
        `data: ${JSON.stringify({ event: 'error', message: `HTML取得に失敗: ${fetchError.message}` })}\n\n`
      );
      return res.end();
    }

    const html = htmlResponse.data;

    // メタデータ抽出
    res.write(
      `data: ${JSON.stringify({ event: 'progress', stage: 'parsing', message: 'メタデータを抽出中...' })}\n\n`
    );
    const metadata = extractMetadata(html);

    // メタデータ送信
    res.write(`data: ${JSON.stringify({ event: 'meta', data: metadata })}\n\n`);

    // AI分析開始
    res.write(
      `data: ${JSON.stringify({ event: 'progress', stage: 'analyzing', message: 'AI分析中...' })}\n\n`
    );

    const apiKey = userApiKey || process.env.OPENAI_API_KEY;

    // APIキーの有効性チェック
    const hasValidApiKey = apiKey && apiKey.startsWith('sk-') && apiKey.length > 20;

    if (!hasValidApiKey) {
      // APIキーが無い場合はテンプレート出力
      await streamTemplateResponse(res, metadata, url);
      clearInterval(keepaliveInterval);
      res.write(`data: ${JSON.stringify({ event: 'done' })}\n\n`);
      return res.end();
    }

    // OpenAI APIでストリーミング
    try {
      const openai = new OpenAI({ apiKey });
      const prompt = generatePrompt(metadata, url);

      const stream = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ event: 'token', token: content })}\n\n`);
        }
      }

      clearInterval(keepaliveInterval);
      res.write(`data: ${JSON.stringify({ event: 'done' })}\n\n`);
      res.end();
    } catch (aiError) {
      console.error('OpenAI API error:', aiError.message);
      clearInterval(keepaliveInterval);
      res.write(
        `data: ${JSON.stringify({ event: 'error', message: `AI分析に失敗しました: ${aiError.message}` })}\n\n`
      );
      res.end();
    }
  } catch (error) {
    console.error('Web Advisor API error:', error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Web分析に失敗しました',
        details: error.message,
      });
    }

    res.write(`data: ${JSON.stringify({ event: 'error', message: error.message })}\n\n`);
    res.end();
  }
};
