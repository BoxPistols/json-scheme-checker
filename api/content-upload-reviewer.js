const OpenAI = require('openai');

// レビュー種類ごとのプロンプト定義
const PROMPTS = {
  blog: `あなたはSEO・コンテンツマーケティングの専門家です。以下のブログコンテンツを分析し、具体的な改善提案と校閲済みバージョンを提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 校閲済みテキストは元のテキストをベースに、具体的な修正を加えたものを提示してください

【出力形式】
以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[100文字程度の総評]

## 主な改善点
1. [改善点1]
2. [改善点2]
3. [改善点3]

## 校閲済みテキスト
[元のテキストを校閲・改善したバージョン]

## 詳細な改善提案
### タイトル
- 現状: [現在のタイトル]
- 改善案: [改善されたタイトル]

### 導入部分
- 現状: [現在の導入]
- 改善案: [改善された導入]

### 本文構造
- [構造的な改善提案]

### SEO最適化
- [SEO観点の改善提案]`,

  job: `あなたは人材採用とキャリアコンサルティングの専門家です。以下の求人票を分析し、応募者を引きつける改善提案と校閲済みバージョンを提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 校閲済みテキストは元のテキストをベースに、具体的な修正を加えたものを提示してください

【出力形式】
以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[100文字程度の総評]

## 主な改善点
1. [改善点1]
2. [改善点2]
3. [改善点3]

## 校閲済みテキスト
[元のテキストを校閲・改善したバージョン]

## 詳細な改善提案
### 職務タイトル
- 現状: [現在のタイトル]
- 改善案: [魅力的なタイトル]

### 職務内容
- 現状: [現在の説明]
- 改善案: [具体的で魅力的な説明]

### 必須スキル・歓迎スキル
- [スキル要件の改善提案]

### 待遇・福利厚生
- [待遇面の記載改善提案]`,

  'skill-sheet': `あなたはエンジニア採用とキャリアアドバイザーの専門家です。以下のスキルシートを分析し、魅力的で採用担当者の目に留まる改善提案と校閲済みバージョンを提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 校閲済みテキストは元のテキストをベースに、具体的な修正を加えたものを提示してください

【出力形式】
以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[100文字程度の総評]

## 主な改善点
1. [改善点1]
2. [改善点2]
3. [改善点3]

## 校閲済みテキスト
[元のテキストを校閲・改善したバージョン]

## 詳細な改善提案
### サマリー
- 現状: [現在のサマリー]
- 改善案: [インパクトのあるサマリー]

### スキルセット
- [スキルの記載方法の改善提案]

### 職務経歴
- [経歴の記載方法の改善提案]

### アピールポイント
- [強みの打ち出し方の改善提案]`,

  matching: `あなたはエンジニア採用とマッチング分析の専門家です。以下の求人票とスキルシートを分析し、マッチング度を評価してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- マッチング度は0-100のスコアで評価してください

【出力形式】
以下の構造で日本語のMarkdown形式で出力してください：

## マッチング総合評価
### マッチング度: XX/100

## スキルマッチング詳細
### 必須スキル
- [スキル1]: ○ マッチ / × 不足
- [スキル2]: ○ マッチ / × 不足

### 歓迎スキル
- [スキル1]: ○ 保有 / × 未保有

### 経験年数
- 求人要件: [X年]
- 候補者: [Y年]
- 評価: [適合/やや不足/十分]

## ギャップ分析
### 不足しているスキル
1. [不足スキル1]
2. [不足スキル2]

### 強みとなるポイント
1. [強み1]
2. [強み2]

## キャリアアップ提案
### 推奨学習項目
1. [学習項目1]
2. [学習項目2]

### スキルシート改善案
- [マッチング率を上げるための改善提案]`,

  general: `あなたはテキスト校閲とライティングの専門家です。以下のテキストを分析し、文章の質を向上させる改善提案と校閲済みバージョンを提供してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 校閲済みテキストは元のテキストをベースに、具体的な修正を加えたものを提示してください

【出力形式】
以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[100文字程度の総評]

## 主な改善点
1. [改善点1]
2. [改善点2]
3. [改善点3]

## 校閲済みテキスト
[元のテキストを校閲・改善したバージョン]

## 詳細な改善提案
### 文章構成
- [構成の改善提案]

### 表現・文体
- [表現の改善提案]

### 読みやすさ
- [読みやすさの改善提案]`,
};

/**
 * レビュー種類に応じたプロンプトを取得
 * @param {string} reviewType - レビュー種類
 * @returns {string} プロンプト
 */
function getPrompt(reviewType) {
  return PROMPTS[reviewType] || PROMPTS.general;
}

/**
 * マッチング分析用のユーザーコンテンツを構築
 * @param {string} jobContent - 求人票
 * @param {string} skillContent - スキルシート
 * @returns {string} 統合されたコンテンツ
 */
function buildMatchingContent(jobContent, skillContent) {
  return `
# 求人票

${jobContent}

---

# スキルシート

${skillContent}
`;
}

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
    const { content, jobContent, reviewType, userApiKey, baseUrl, model } = req.body;

    // 入力検証: contentの存在チェック
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'content は文字列である必要があります' });
    }

    // 入力検証: コンテンツサイズ制限 (500KB)
    if (content.length > 500000) {
      return res.status(400).json({ error: 'コンテンツが大きすぎます（最大500KB）' });
    }

    // 入力検証: reviewTypeのチェック
    const validReviewTypes = ['blog', 'job', 'skill-sheet', 'matching', 'general'];
    if (reviewType && !validReviewTypes.includes(reviewType)) {
      return res.status(400).json({ error: '無効なレビュー種類です' });
    }

    // マッチング分析の場合、jobContentも必要
    if (reviewType === 'matching' && !jobContent) {
      return res
        .status(400)
        .json({ error: 'マッチング分析には求人票（jobContent）が必要です' });
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[ContentUploadReviewer API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'AI分析サービスは現在利用できません' });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

    // プロンプトとユーザーコンテンツを準備
    const systemPrompt = getPrompt(reviewType || 'general');
    let userContent = content;

    if (reviewType === 'matching') {
      userContent = buildMatchingContent(jobContent, content);
    }

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

    // モデル情報を最初に通知
    res.write(`data: ${JSON.stringify({ model: selectedModel })}\n\n`);

    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;
      if (chunkContent) {
        res.write(`data: ${JSON.stringify({ content: chunkContent })}\n\n`);
      }

      // usage情報を送信
      if (chunk.usage) {
        res.write(`data: ${JSON.stringify({ usage: chunk.usage })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('ContentUploadReviewer API error:', error.message);

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
