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

const EMPLOYER_PROMPT = `あなたは求人票作成の専門家です。以下のJobPosting JSON-LDデータを分析し、採用側向けの改善提案を提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください

【分析観点】
1. 求人タイトルの魅力度と検索されやすさ
2. 職務内容の具体性と説得力
3. 必須スキル・歓迎スキルの明確さ
4. 給与レンジの妥当性と競争力
5. 福利厚生・企業文化のアピール
6. 応募のハードルの適切さ
7. SEO対策（構造化データの充実度）

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[100文字程度の総評]

## 改善提案

### 1. タイトル
**現状:** [現在のタイトル]
**問題点:** [具体的な問題]
**改善案:** [具体的な提案]

### 2. 職務内容
**現状:** [現在の記述]
**問題点:** [具体的な問題]
**改善案:** [具体的な提案]

### 3. スキル要件
**現状:** [現在の要件]
**問題点:** [具体的な問題]
**改善案:** [具体的な提案]

### 4. 待遇条件
**現状:** [現在の記述]
**問題点:** [具体的な問題]
**改善案:** [具体的な提案]

## 追加推奨事項
- [具体的な追加提案1]
- [具体的な追加提案2]
- [具体的な追加提案3]

## 注意点
[法的注意点や避けるべき表現など]`;

const APPLICANT_PROMPT = `あなたはキャリアアドバイザーです。以下のJobPosting JSON-LDデータを分析し、応募者向けの面接対策と要件分析を提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください

【分析観点】
1. 求められるスキルセットと経験レベル
2. 企業文化・働き方の推測
3. 給与レンジから見る市場価値
4. 面接で評価されるポイント
5. アピールすべき経験・スキル
6. 潜在的なリスクや注意点

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## 求人要件分析

### 必須スキル
- [スキル1]: [重要度と理由]
- [スキル2]: [重要度と理由]
- [スキル3]: [重要度と理由]

### 歓迎スキル
- [スキル1]: [優位性]
- [スキル2]: [優位性]

### 経験レベル
[推定される経験年数と根拠]

## 企業・ポジション分析

### 企業文化の推測
[求人内容から読み取れる企業文化]

### 働き方の特徴
[リモート、勤務時間、チーム構成など]

### 給与レンジの評価
[市場価値との比較と妥当性]

## 面接対策

### 想定質問リスト
1. **[質問]**
   - 意図: [なぜこの質問をするか]
   - 回答のポイント: [どう答えるべきか]

2. **[質問]**
   - 意図: [なぜこの質問をするか]
   - 回答のポイント: [どう答えるべきか]

3. **[質問]**
   - 意図: [なぜこの質問をするか]
   - 回答のポイント: [どう答えるべきか]

### 逆質問の例
- [質問1]: [この質問をする意図]
- [質問2]: [この質問をする意図]
- [質問3]: [この質問をする意図]

## アピール戦略

### 強調すべきポイント
1. [ポイント1と具体的なアピール方法]
2. [ポイント2と具体的なアピール方法]
3. [ポイント3と具体的なアピール方法]

### 準備すべき実績
- [実績の種類1]: [どう準備するか]
- [実績の種類2]: [どう準備するか]

## 注意事項とリスク
[応募前に確認すべきこと、潜在的なリスク]`;

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
    const { jobPosting, mode, userApiKey, provider, baseUrl, model } = req.body;
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

    // 入力検証: jobPostingの存在と型チェック
    if (!jobPosting || typeof jobPosting !== 'object') {
      return res.status(400).json({ error: 'jobPosting は有効なオブジェクトである必要があります' });
    }

    // 入力検証: jobPostingオブジェクトのサイズ制限 (100KB)
    if (JSON.stringify(jobPosting).length > 100000) {
      return res.status(400).json({ error: '求人データが大きすぎます' });
    }

    // 入力検証: 最低限の必須フィールド
    if (!jobPosting.title && !jobPosting.description) {
      return res.status(400).json({ error: 'jobPosting には title または description が必要です' });
    }

    // XSS対策: titleの長さ制限
    if (typeof jobPosting.title === 'string') {
      jobPosting.title = jobPosting.title.substring(0, 500);
    }

    // 入力検証: mode
    if (!mode || !['employer', 'applicant'].includes(mode)) {
      return res
        .status(400)
        .json({ error: 'mode は "employer" または "applicant" である必要があります' });
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[Advisor API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'AI分析サービスは現在利用できません' });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

    const systemPrompt = mode === 'employer' ? EMPLOYER_PROMPT : APPLICANT_PROMPT;
    const userContent = JSON.stringify(jobPosting, null, 2);

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      temperature: 0.7,
      stream_options: { include_usage: true },
    });

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
    console.error('Advisor API error:', error.message);

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
