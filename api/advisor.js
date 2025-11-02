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

const AGENT_PROMPT = `あなたは人材紹介エージェントの戦略アドバイザーです。以下のJobPosting JSON-LDデータを、求人企業と求職者の両方の視点から総合的に分析し、エージェントの営業戦略を提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください

【分析観点】
1. エージェントの営業戦略（この求人をどう活用するか）
2. 市場分析（競合他社との比較、給与水準、市場での位置づけ）
3. 求人企業へのアドバイス（求人票の改善提案）
4. 求職者へのアドバイス（マッチング時の注意点）

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[この求人の市場価値と活用可能性を100文字程度で総評]

## エージェント営業戦略

### ターゲット候補者像
**推奨プロフィール:**
- 経験年数: [年数と理由]
- 必須スキル: [スキルセット]
- 業界経験: [業界と理由]

**アプローチ戦略:**
- [具体的な候補者へのアプローチ方法1]
- [具体的な候補者へのアプローチ方法2]
- [具体的な候補者へのアプローチ方法3]

### 売り込みポイント
**候補者への訴求:**
1. [訴求ポイント1]: [理由と効果]
2. [訴求ポイント2]: [理由と効果]
3. [訴求ポイント3]: [理由と効果]

**成約確度を上げるポイント:**
- [ポイント1]
- [ポイント2]
- [ポイント3]

### リスク要因と対策
**想定される課題:**
- [課題1]: [対策]
- [課題2]: [対策]
- [課題3]: [対策]

## 市場分析

### 給与水準の評価
**市場との比較:**
[同業種・同職種との比較分析]

**競争力:**
[この給与レンジの競争力評価]

### 業界・職種トレンド
[この求人が属する業界・職種の市場動向]

### 競合求人との差別化
**強み:**
- [差別化ポイント1]
- [差別化ポイント2]

**弱み:**
- [改善が必要な点1]
- [改善が必要な点2]

## 求人企業へのアドバイス

### 求人票の改善提案
**優先度高:**
1. [改善項目1]: [具体的な提案]
2. [改善項目2]: [具体的な提案]

**優先度中:**
- [改善項目3]: [具体的な提案]
- [改善項目4]: [具体的な提案]

### 採用成功率を上げるために
- [提案1]
- [提案2]
- [提案3]

## 求職者へのアドバイス

### マッチング時の注意点
**確認すべき項目:**
- [項目1]: [理由]
- [項目2]: [理由]
- [項目3]: [理由]

### 面接準備のポイント
1. **[ポイント1]**
   - [具体的な準備内容]
2. **[ポイント2]**
   - [具体的な準備内容]
3. **[ポイント3]**
   - [具体的な準備内容]

### 想定される懸念事項
- [懸念1]: [対処法]
- [懸念2]: [対処法]

## アクションプラン

### 短期（1週間以内）
1. [アクション1]
2. [アクション2]

### 中期（1ヶ月以内）
1. [アクション1]
2. [アクション2]

### 長期（3ヶ月以内）
1. [アクション1]
2. [アクション2]`;

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
    if (!mode || !['employer', 'applicant', 'agent'].includes(mode)) {
      return res
        .status(400)
        .json({ error: 'mode は "employer", "applicant", または "agent" である必要があります' });
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[Advisor API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'AI分析サービスは現在利用できません' });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

    let systemPrompt;
    if (mode === 'employer') {
      systemPrompt = EMPLOYER_PROMPT;
    } else if (mode === 'applicant') {
      systemPrompt = APPLICANT_PROMPT;
    } else {
      systemPrompt = AGENT_PROMPT;
    }
    const userContent = JSON.stringify(jobPosting, null, 2);

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-5-nano';
    const isGPT5 = selectedModel.startsWith('gpt-5');

    const requestParams = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
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
