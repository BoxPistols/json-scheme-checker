const OpenAI = require('openai');

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobPosting, mode } = req.body;

    if (!jobPosting) {
      return res.status(400).json({ error: 'jobPosting is required' });
    }

    if (!mode || !['employer', 'applicant'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "employer" or "applicant"' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    const openai = new OpenAI({ apiKey });

    const systemPrompt = mode === 'employer' ? EMPLOYER_PROMPT : APPLICANT_PROMPT;
    const userContent = JSON.stringify(jobPosting, null, 2);

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      stream: true,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
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
