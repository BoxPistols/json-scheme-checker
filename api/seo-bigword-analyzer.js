const OpenAI = require('openai');

const BIGWORD_ANALYSIS_PROMPT = `あなたはSEOとコンテンツ戦略の専門家です。
ユーザーが指定した「Bigワード」に対して、記事が上位表示される要件を満たしているか分析してください。

【重要な制約】
- 絵文字は一切使用しないでください
- 日本語で出力してください
- 具体的で実践的な提案をしてください
- 実際の検索順位データはありませんが、一般的な上位記事の特徴をもとに分析してください

【分析対象】
メインキーワード（Bigワード）: {main_keyword}
サブキーワード: {sub_keywords}
分析対象URL: {url}

【記事のメタデータ】
- タイトル: {title}
- メタディスクリプション: {description}
- H1タグ: {h1_tags}
- H2タグ: {h2_tags}

【記事の本文（抜粋）】
{body_excerpt}

【分析タスク】

1. **一般的な上位記事の特徴を推定**
   - このBigワードで検索する人の検索意図（情報型、ナビゲーション型、トランザクション型、商業型）
   - 上位記事が一般的にカバーしているトピック
   - 推奨される文字数・構成
   - 必須の要素（図解、コード例、データ等）

2. **現在の記事との差分分析**
   - 網羅できているトピック
   - 不足しているトピック
   - 深掘りが足りない部分
   - 過剰な部分（もしあれば）

3. **達成度スコアリング（0-100）**
   以下の4項目を各25点満点で評価し、合計100点満点で算出してください。

   a) コンテンツ網羅性（0-25点）
      - 必須トピックのカバー率
      - 関連キーワードの含有
      - コンテンツの完全性

   b) 専門性・深度（0-25点）
      - 内容の深さ（表面的か、深掘りしているか）
      - 実体験や独自データの有無
      - 専門用語の適切な使用

   c) 構造・可読性（0-25点）
      - 見出し構造の適切性
      - 目次の有無
      - 段落の読みやすさ
      - コード例や図解の充実度

   d) 独自性（0-25点）
      - 他の記事にない視点
      - オリジナルの事例やデータ
      - 実践的な価値

   スコアリング基準:
   - 80-100点: Bigワード達成済み（上位表示の可能性が高い）
   - 60-79点: 改善が必要（中位表示レベル）
   - 40-59点: 大幅改善が必要（下位表示レベル）
   - 0-39点: 達成困難（ほぼ圏外）

4. **優先改善事項**
   - High Priority: 今すぐ実施すべき改善（効果が大きく、スコアへの影響が+5点以上）
   - Medium Priority: 次に実施すべき改善（効果が中程度、スコアへの影響が+3-5点）
   - Low Priority: 時間があれば実施（効果が小さい、スコアへの影響が+1-3点）

5. **競合との差別化ポイント**
   - 一般的な記事との差をつけるための独自要素
   - 実体験、データ、事例の追加提案
   - ストーリーテリングの活用方法

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## Bigワード達成度分析: {main_keyword}

### 総合達成度
**スコア: XX/100**
評価: [達成済み/改善が必要/大幅改善が必要/達成困難]

このスコアは以下をもとに算出:
- 一般的な上位記事の特徴（AIの知識ベース）
- コンテンツの網羅性・深度・構造の分析
- 実際の順位を保証するものではありません

---

### 検索意図の分析
**推定される検索意図**: [情報型/ナビゲーション型/トランザクション型/商業型]
**ユーザーが求めている情報**:
- [箇条書きで3-5個]

**現在の記事との適合度**: XX%
[簡潔な説明]

---

### 項目別スコア

#### 1. コンテンツ網羅性: XX/25
**必須トピック（一般的な上位記事の特徴）**:
- [チェックマーク] 網羅できているトピック
- [バツ] 不足しているトピック
- [三角] 浅いトピック

**改善提案**:
1. [具体的な追加すべきセクション]
2. [具体的な追加すべき内容]
3. [具体的な深掘りすべきポイント]

#### 2. 専門性・深度: XX/25
**現状**:
[記事の深さと専門性の評価]

**上位記事との差分**:
- 上位記事: [一般的な特徴]
- あなたの記事: [現状]

**改善提案**:
1. [深掘りすべきポイント]
2. [追加すべき専門的な視点]
3. [実体験や独自データの追加方法]

#### 3. 構造・可読性: XX/25
**良い点**:
- [箇条書き]

**改善点**:
- [箇条書き]

**改善提案**:
1. [見出し構造の改善]
2. [可読性向上の具体策]
3. [視覚要素の追加提案]

#### 4. 独自性: XX/25
**現状**:
[独自性の評価]

**競合との差別化に必要な要素**:
- [具体的な差別化ポイント1]
- [具体的な差別化ポイント2]
- [具体的な差別化ポイント3]

---

### Bigワード達成のための優先改善事項

**今すぐ実施（High Priority）**:
1. [改善項目1]（予想効果: +X点）
2. [改善項目2]（予想効果: +X点）
3. [改善項目3]（予想効果: +X点）

**次に実施（Medium Priority）**:
4. [改善項目4]（予想効果: +X点）
5. [改善項目5]（予想効果: +X点）

**時間があれば（Low Priority）**:
6. [改善項目6]（予想効果: +X点）

**予想される効果**:
改善後スコア: XX → YY-ZZ/100（上位表示の可能性が[大幅に/やや]向上）

---

### 競合分析（AI推定）

**「{main_keyword}」で上位表示される記事の特徴**:
- 文字数: XXXX-YYYY字
- 見出し数: XX-YY個
- [その他の特徴]

**あなたの記事**:
- 文字数: XXXX字（[充分/やや不足/不足]）
- 見出し数: XX個（[充分/やや不足/不足]）
- [その他の状況]

**ギャップ**:
[具体的な差分の説明]

---

### 次のステップ

1. 上記の「今すぐ実施」項目を優先的に改善
2. 2-4週間後に再分析（改善効果の確認）
3. Google Search Consoleで実際の順位を確認（推奨）
4. [その他の推奨アクション]

---

### 補足: 独自性を高めるアイデア

このBigワードで差をつけるための具体的なアイデア:
1. [アイデア1]
2. [アイデア2]
3. [アイデア3]
`;

/**
 * HTMLからメタデータを抽出
 */
function extractMetadata(html) {
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);

  // タイトルを取得
  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';

  // メタディスクリプションを取得
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  // H1タグを取得
  const h1Tags = [];
  $('h1').each((i, elem) => {
    h1Tags.push($(elem).text().trim());
  });

  // H2タグを取得（最初の5個まで）
  const h2Tags = [];
  $('h2')
    .slice(0, 5)
    .each((i, elem) => {
      h2Tags.push($(elem).text().trim());
    });

  // 本文を取得（最初の3000文字まで）
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);

  return {
    title,
    description,
    h1Tags,
    h2Tags,
    bodyText,
  };
}

/**
 * プロンプトを構築
 */
function buildPrompt(mainKeyword, subKeywords, url, metadata) {
  let prompt = BIGWORD_ANALYSIS_PROMPT;

  prompt = prompt.replace(/{main_keyword}/g, mainKeyword);
  prompt = prompt.replace(/{sub_keywords}/g, subKeywords || 'なし');
  prompt = prompt.replace(/{url}/g, url);
  prompt = prompt.replace(/{title}/g, metadata.title || '未設定');
  prompt = prompt.replace(/{description}/g, metadata.description || '未設定');
  prompt = prompt.replace(
    /{h1_tags}/g,
    metadata.h1Tags.length > 0 ? metadata.h1Tags.join(', ') : '未設定'
  );
  prompt = prompt.replace(
    /{h2_tags}/g,
    metadata.h2Tags.length > 0 ? metadata.h2Tags.slice(0, 5).join(', ') : '未設定'
  );
  prompt = prompt.replace(/{body_excerpt}/g, metadata.bodyText || '本文が取得できませんでした');

  return prompt;
}

/**
 * Vercel Serverless Function
 */
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { mainKeyword, subKeywords, html, url, apiKey, model, provider, baseUrl } = req.body;

  // バリデーション
  if (!mainKeyword || !html || !url) {
    return res.status(400).json({ error: 'mainKeyword, html, url are required' });
  }

  // デフォルトのAPIキーを使用（本番環境では環境変数から取得）
  const openaiApiKey = apiKey || process.env.OPENAI_API_KEY;

  if (!openaiApiKey) {
    return res.status(400).json({ error: 'OpenAI API key is required' });
  }

  try {
    // HTMLからメタデータを抽出
    const metadata = extractMetadata(html);

    // プロンプトを構築
    const prompt = buildPrompt(mainKeyword, subKeywords, url, metadata);

    // OpenAI設定
    const openaiConfig = { apiKey: openaiApiKey };
    if (baseUrl) {
      openaiConfig.baseURL = baseUrl;
    }

    const openai = new OpenAI(openaiConfig);

    // モデルの決定
    const selectedModel = model || 'gpt-4o-mini';

    console.log('[BigwordAnalyzer] Starting analysis:', {
      mainKeyword,
      subKeywords,
      url,
      model: selectedModel,
      provider: provider || 'openai',
    });

    // ストリーミングレスポンスの設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // OpenAI APIでストリーミング分析
    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content:
            'あなたはSEOとコンテンツ戦略の専門家です。Bigワード（重要キーワード）に対する記事の達成度を分析し、具体的な改善提案を提供します。',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    });

    let totalTokens = 0;
    let promptTokens = 0;
    let completionTokens = 0;

    // ストリーミングデータを送信
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';

      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
        completionTokens += 1; // 概算
      }

      // usage情報があれば記録
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens || 0;
        completionTokens = chunk.usage.completion_tokens || 0;
        totalTokens = chunk.usage.total_tokens || 0;
      }
    }

    // 使用量情報を送信
    const usage = {
      promptTokens: promptTokens || Math.floor(prompt.length / 4),
      completionTokens: completionTokens || 500,
      totalTokens: totalTokens || promptTokens + completionTokens,
    };

    res.write(`data: ${JSON.stringify({ usage })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();

    console.log('[BigwordAnalyzer] Analysis completed:', {
      mainKeyword,
      usage,
    });
  } catch (error) {
    console.error('[BigwordAnalyzer] Error:', error);

    // エラー情報を送信
    res.write(`data: ${JSON.stringify({ error: error.message || 'Unknown error occurred' })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
};
