const OpenAI = require('openai');

// メモリベースのレート制限管理
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24時間
const MAX_REQUESTS_PER_IP = 10; // IP単位での制限

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

const WEB_ADVISOR_PROMPT = `あなたはWebサイト分析の専門家です。構造化データ（JSON-LD）が無い、または最小限のWebページを分析し、SEO・EEAT・アクセシビリティの観点から改善提案を提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください

【分析観点】

1. **SEO観点**
   - タイトルタグの最適化（文字数、キーワード配置）
   - メタディスクリプションの効果性
   - OGタグ・Twitter Cardの設定状況
   - 見出し構造（H1-H6の階層と内容）
   - キーワードの適切な配置
   - URL構造
   - 構造化データの欠如による機会損失

2. **EEAT観点（Expertise, Experience, Authoritativeness, Trustworthiness）**
   - 専門性：コンテンツの専門的な記述
   - 経験：実体験や具体例の有無
   - 権威性：情報源や著者情報の明示
   - 信頼性：更新日時、連絡先、プライバシーポリシーなど

3. **アクセシビリティ観点**
   - 基本的なHTML構造の適切性
   - 見出しの階層構造
   - 代替テキストの必要性（画像が検出された場合）
   - セマンティックHTMLの使用

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## SEO分析

### タイトルとメタ情報
**タイトル:** [現在のタイトル]
**文字数:** [X文字]
**評価:** [★★★☆☆ 3/5]
**問題点:**
- [具体的な問題1]
- [具体的な問題2]
**改善案:**
- [具体的な提案1]
- [具体的な提案2]

### メタディスクリプション
**現状:** [あり/なし]
**内容:** [現在の内容]
**評価:** [★★★☆☆ 3/5]
**問題点:**
- [具体的な問題]
**改善案:**
- [具体的な提案]

### OGタグ・SNS最適化
**設定状況:** [完全/部分的/なし]
**問題点:**
- [具体的な問題]
**改善案:**
- [必要なOGタグの追加提案]

### 見出し構造
**H1:** [内容または「なし」]
**H2-H6:** [構造の評価]
**問題点:**
- [階層の問題]
**改善案:**
- [構造改善の提案]

### 構造化データ
**現状:** [なし/WebPageのみ]
**機会損失:**
- [検索結果でのリッチスニペット表示機会の喪失]
- [特定の業種・コンテンツタイプに適したスキーマの提案]
**推奨スキーマ:**
- [Article/BlogPosting] (ブログ記事の場合)
- [Organization] (企業サイトの場合)
- [LocalBusiness] (店舗サイトの場合)
- [Product] (商品ページの場合)
- [その他適切なスキーマ]

## EEAT分析

### 専門性（Expertise）
**評価:** [★★★☆☆ 3/5]
**現状:**
- [コンテンツの専門性に関する観察]
**改善案:**
- [専門性を高める具体的な提案]

### 経験（Experience）
**評価:** [★★★☆☆ 3/5]
**現状:**
- [実体験や具体例の有無]
**改善案:**
- [経験を示す要素の追加提案]

### 権威性（Authoritativeness）
**評価:** [★★★☆☆ 3/5]
**現状:**
- [著者情報、引用元の明示状況]
**改善案:**
- [権威性を高める提案]

### 信頼性（Trustworthiness）
**評価:** [★★★☆☆ 3/5]
**現状:**
- [更新日時、連絡先、プライバシーポリシーなどの有無]
**改善案:**
- [信頼性を高める要素の追加]

## アクセシビリティ分析

### HTML構造
**評価:** [★★★☆☆ 3/5]
**問題点:**
- [セマンティックHTMLの使用状況]
**改善案:**
- [適切なHTML要素の使用提案]

### 見出し階層
**評価:** [★★★☆☆ 3/5]
**問題点:**
- [階層の飛ばしや不適切な使用]
**改善案:**
- [正しい階層構造の提案]

### その他の改善点
- [言語属性の設定]
- [代替テキストの必要性]
- [フォーカス管理の推奨事項]

## 優先課題（上位3つ）

1. **[課題1のタイトル]**
   - 重要度: 高/中/低
   - 影響範囲: [SEO/EEAT/アクセシビリティ]
   - 対応内容: [具体的なアクション]

2. **[課題2のタイトル]**
   - 重要度: 高/中/低
   - 影響範囲: [SEO/EEAT/アクセシビリティ]
   - 対応内容: [具体的なアクション]

3. **[課題3のタイトル]**
   - 重要度: 高/中/低
   - 影響範囲: [SEO/EEAT/アクセシビリティ]
   - 対応内容: [具体的なアクション]

## 総合評価と要約

### 総合スコア
- SEO: ★★★☆☆ (3/5)
- EEAT: ★★★☆☆ (3/5)
- アクセシビリティ: ★★★☆☆ (3/5)
- 総合: ★★★☆☆ (3/5)

### 総評
[100-150文字程度で、現状の評価と最も重要な改善点をまとめる]

### 次のステップ
1. [最優先で実施すべきアクション]
2. [次に実施すべきアクション]
3. [継続的に改善すべきポイント]`;

/**
 * Web Advisor API Handler (Vercel Serverless Functions & Local Server)
 */
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエスト
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, title, description, ogData, twitterData, headings, bodyText, userApiKey } = req.body;

  console.log('[web-advisor] Request received:', {
    url,
    hasTitle: !!title,
    hasDescription: !!description,
    hasOgData: !!ogData,
    hasTwitterData: !!twitterData,
    hasHeadings: !!headings,
    bodyTextLength: bodyText?.length || 0,
    hasUserApiKey: !!userApiKey,
  });

  // 必須パラメータチェック
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // userApiKeyが指定されていない場合のみレート制限をチェック
  let rateLimitResult = null;
  if (!userApiKey) {
    const clientIp = getClientIp(req);
    rateLimitResult = checkRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      console.log(`[web-advisor] Rate limit exceeded for IP: ${clientIp}`);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `24時間の利用制限（${MAX_REQUESTS_PER_IP}回）に達しました`,
        resetTime: rateLimitResult.resetTime,
        retryAfter: rateLimitResult.retryAfter,
      });
    }
  }

  // OpenAI設定
  const apiKey = userApiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'OpenAI API key not configured',
      message: 'サーバーにAPIキーが設定されていません',
    });
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // 分析用のコンテキストを構築
  const context = buildAnalysisContext(
    url,
    title,
    description,
    ogData,
    twitterData,
    headings,
    bodyText
  );

  console.log('[web-advisor] Starting AI analysis...');
  console.log('[web-advisor] Context length:', context.length);

  try {
    // SSEヘッダーを設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // ストリーミング開始
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: WEB_ADVISOR_PROMPT },
        { role: 'user', content: context },
      ],
      temperature: 0.7,
      stream: true,
    });

    let fullContent = '';
    let tokenCount = 0;

    // 初期レスポンス（レート制限情報）
    if (rateLimitResult) {
      res.write(
        `data: ${JSON.stringify({
          type: 'rate_limit',
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        })}\n\n`
      );
    }

    // ストリーミング処理
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        tokenCount++;

        // クライアントにチャンクを送信
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta })}\n\n`);
      }

      // 完了チェック
      if (chunk.choices[0]?.finish_reason === 'stop') {
        console.log('[web-advisor] Stream completed');
        console.log('[web-advisor] Token count:', tokenCount);
        console.log('[web-advisor] Content length:', fullContent.length);

        // 完了通知
        res.write(
          `data: ${JSON.stringify({
            type: 'done',
            usage: {
              completion_tokens: tokenCount,
              model,
            },
          })}\n\n`
        );
        break;
      }
    }

    res.end();
  } catch (error) {
    console.error('[web-advisor] Error:', error);

    // エラーをSSE形式で送信
    try {
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          error: error.message || 'AI分析中にエラーが発生しました',
        })}\n\n`
      );
      res.end();
    } catch (writeError) {
      console.error('[web-advisor] Error writing error response:', writeError);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal server error',
          message: error.message,
        });
      }
    }
  }
};

/**
 * 分析用のコンテキストを構築
 */
function buildAnalysisContext(url, title, description, ogData, twitterData, headings, bodyText) {
  let context = `## 分析対象URL\n${url}\n\n`;

  // タイトル
  if (title) {
    context += `## ページタイトル\n${title}\n（文字数: ${title.length}文字）\n\n`;
  } else {
    context += `## ページタイトル\n（なし）\n\n`;
  }

  // メタディスクリプション
  if (description) {
    context += `## メタディスクリプション\n${description}\n（文字数: ${description.length}文字）\n\n`;
  } else {
    context += `## メタディスクリプション\n（なし）\n\n`;
  }

  // OGタグ
  if (ogData && Object.keys(ogData).length > 0) {
    context += `## Open Graphタグ\n`;
    for (const [key, value] of Object.entries(ogData)) {
      context += `- ${key}: ${value}\n`;
    }
    context += '\n';
  } else {
    context += `## Open Graphタグ\n（なし）\n\n`;
  }

  // Twitter Card
  if (twitterData && Object.keys(twitterData).length > 0) {
    context += `## Twitter Cardタグ\n`;
    for (const [key, value] of Object.entries(twitterData)) {
      context += `- ${key}: ${value}\n`;
    }
    context += '\n';
  } else {
    context += `## Twitter Cardタグ\n（なし）\n\n`;
  }

  // 見出し構造
  if (headings && headings.length > 0) {
    context += `## 見出し構造\n`;
    headings.forEach(h => {
      context += `${h.level}: ${h.text}\n`;
    });
    context += '\n';
  } else {
    context += `## 見出し構造\n（見出しが検出されませんでした）\n\n`;
  }

  // 本文抜粋
  if (bodyText) {
    const excerpt = bodyText.substring(0, 1000);
    context += `## 本文抜粋（最初の1000文字）\n${excerpt}${bodyText.length > 1000 ? '...' : ''}\n\n`;
    context += `（本文全体の文字数: ${bodyText.length}文字）\n\n`;
  }

  return context;
}
