const OpenAI = require('openai');

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
    const { article, userApiKey } = req.body;

    // 入力検証: articleの存在と型チェック
    if (!article || typeof article !== 'object') {
      return res.status(400).json({ error: 'article は有効なオブジェクトである必要があります' });
    }

    // 入力検証: 最低限の必須フィールド
    if (!article.headline && !article.name && !article.title) {
      return res
        .status(400)
        .json({ error: 'article には headline, name, または title が必要です' });
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[BlogReviewer API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'AI分析サービスは現在利用できません' });
    }

    const openai = new OpenAI({ apiKey });

    const userContent = JSON.stringify(article, null, 2);

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: BLOG_REVIEW_PROMPT },
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
