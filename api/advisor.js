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

const AGENT_PROMPT = `あなたは人材紹介エージェントの戦略アドバイザーです。以下のJobPosting JSON-LDデータを分析し、開発現場の実態とエンジニアのメンタルモデルを詳細に解説してください。エージェントが技術要件を正確に理解し、候補者と企業の間で効果的なマッチングを実現できるよう支援します。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください

【分析観点】
1. 技術スタックと開発環境の実態解説（エンジニアの日常業務）
2. エンジニアのメンタルモデル（技術選択の背景、キャリア観）
3. 開発組織の構造とチーム文化の推測
4. エージェントの戦略的マッチング手法

【出力形式】
必ず以下の構造で日本語のMarkdown形式で出力してください：

## 総合評価
★★★★☆ (5段階評価)
[この求人の市場価値と技術的魅力を100文字程度で総評]

## 開発現場の実態解説

### 技術スタック詳細
**採用技術:**
[求人票に記載された技術を列挙]

**技術選択の背景:**
[なぜこの技術スタックが選ばれたのか、業界トレンドとの関係、ビジネス要件との適合性を解説]

**実際の開発フロー:**
[この技術スタックを使った典型的な開発の流れ - 要件定義からリリースまで]
- 日々のコーディング作業: [具体的な業務内容]
- コードレビュー体制: [推測される品質管理プロセス]
- デプロイ・運用: [CI/CD、モニタリング等の推測]

### 開発組織の構造
**チーム構成の推測:**
[求人内容から推測されるチームサイズ、役割分担、組織階層]

**開発文化の特徴:**
[アジャイル/ウォーターフォール、技術的負債への対応姿勢、新技術導入の積極性など]

**エンジニアの裁量と責任範囲:**
[意思決定権、技術選定の自由度、担当する工程の広さ]

## エンジニアのメンタルモデル解説

### スキル要件の技術的意味
**必須スキルの実務的解釈:**
[各スキルが実際の開発でどう使われるか、どのレベルまで求められるかを具体的に解説]

例:
- [スキル1]: 実務での使用場面 / 求められる習熟度 / 学習コスト
- [スキル2]: 実務での使用場面 / 求められる習熟度 / 学習コスト

**歓迎スキルの戦略的価値:**
[歓迎スキルがあることでどう業務効率が上がるか、キャリアパスにどう影響するか]

### エンジニアが重視する要素
**技術的成長機会:**
[この職場で得られる技術スキル、キャリアへの影響]

**技術的挑戦の内容:**
[どんな技術課題に取り組むか、スケール/パフォーマンス/設計の複雑さ]

**技術コミュニティとの関係:**
[勉強会、OSS活動、技術ブログなどの文化があるか推測]

### キャリアパスの展望
**このポジションでの成長シナリオ:**
[1年後、3年後、5年後にどんなスキルセットとキャリアが見込めるか]

**市場価値の変化:**
[この経験が今後のキャリアにどう影響するか]

## エージェント向け戦略的マッチング

### ターゲット候補者の技術プロフィール
**推奨する候補者像:**
- 技術経験: [年数とレベル感の具体的な目安]
- コアスキル: [最優先で必要な技術3つとその理由]
- プラスアルファ: [あると大幅に評価が上がるスキル]

**候補者との対話で確認すべき技術的要素:**
1. [確認項目1]: なぜこれを確認すべきか
2. [確認項目2]: なぜこれを確認すべきか
3. [確認項目3]: なぜこれを確認すべきか

### 企業への提案ポイント
**求人票の技術的改善案:**
- [改善点1]: より魅力的に見せるための具体的な表現
- [改善点2]: 技術者が知りたい情報の追加提案

**採用成功率を上げる技術的訴求:**
- [訴求1]: エンジニアに響く表現方法
- [訴求2]: 競合との差別化ポイント

### 候補者への効果的なアプローチ
**技術的訴求ポイント:**
1. [ポイント1]: この技術要素がなぜ魅力的か
2. [ポイント2]: キャリアにどう寄与するか
3. [ポイント3]: 市場での希少性と価値

**面接準備サポート:**
- 想定される技術質問: [具体的な質問例]
- 評価ポイント: [企業が何を見ているか]
- 逆質問の推奨例: [技術的深掘りのための質問]

### リスク要因と対処法
**技術的ミスマッチのリスク:**
- [リスク1]: 対処法と事前確認方法
- [リスク2]: 対処法と事前確認方法

**給与・待遇面の注意点:**
[技術レベルと給与の妥当性、市場相場との比較]

## アクションプラン

### 即座に実行（24時間以内）
1. [技術的な候補者スクリーニング基準の設定]
2. [企業への技術的質問リストの準備]

### 短期（1週間以内）
1. [適合する候補者リストの作成と技術レベル評価]
2. [企業との技術要件の詳細すり合わせ]

### 中期（1ヶ月以内）
1. [マッチング実行と技術面接サポート]
2. [フィードバック収集と戦略調整]

## 用語解説

**重要な専門用語・技術キーワードの解説:**
[分析内容に登場した技術用語、開発手法、業界用語について、エージェントが理解しやすいように簡潔に解説。最低3つ、最大5つ程度。]

例:
- **[用語1]**: [わかりやすい説明]
- **[用語2]**: [わかりやすい説明]
- **[用語3]**: [わかりやすい説明]`;

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
    const { jobPosting, mode, userApiKey, baseUrl, model } = req.body;

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
