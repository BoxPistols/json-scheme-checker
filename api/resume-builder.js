const OpenAI = require('openai');

// 定数定義
const MAX_MESSAGE_LENGTH = 10 * 1024; // 10KB

// プロジェクト経験作成のシステムプロンプト
const SYSTEM_PROMPT = `あなたはキャリアアドバイザーとして、エンジニアのプロジェクト経験を魅力的な文章にまとめるお手伝いをします。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔で分かりやすい日本語で質問してください
- ユーザーの回答を受け取ったら、次の質問に進んでください
- すべての質問に回答が終わったら、プロジェクト経験の文章を生成してください

【質問の流れ】
1. プロジェクト概要: このプロジェクトは何を目的としたものですか？どのようなサービス・システムでしたか？
2. プロジェクト体制: チーム構成は何名でしたか？あなたの役割は何でしたか？
3. 背景・課題: どのような課題や背景があってプロジェクトが始まりましたか？
4. 取り組み内容: あなたが具体的に取り組んだことは何ですか？技術的な工夫はありましたか？
5. 成果・結果: プロジェクトの成果は何でしたか？数値的な成果があれば教えてください。
6. 使用技術: どのような技術スタック（言語、フレームワーク、インフラ等）を使用しましたか？

【出力形式】
すべての質問に回答が終わったら、以下の構造で日本語のMarkdown形式でプロジェクト経験をまとめてください：

## プロジェクト経験

### プロジェクト概要
[プロジェクトの概要を2-3文で簡潔に記述]

### プロジェクト体制と役割
[チーム構成と自身の役割を記述]

### 背景・課題
[プロジェクトの背景や解決すべき課題を記述]

### 取り組み内容
[自身が取り組んだ具体的な内容を箇条書きで記述]
- 取り組み1
- 取り組み2
- 取り組み3

### 成果・結果
[プロジェクトの成果を記述。可能な限り数値を含める]

### 使用技術
- 言語: [使用した言語]
- フレームワーク: [使用したフレームワーク]
- インフラ: [使用したインフラ]
- その他: [その他の技術]

---

【補足】
- 各質問に対するユーザーの回答が短い場合は、もう少し詳しく教えてもらえるよう促してください
- ユーザーが困っている場合は、具体例を示してサポートしてください`;

// APIハンドラー
module.exports = async (req, res) => {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // POSTメソッドのみ許可
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { messages, userApiKey, baseUrl, model } = req.body;

    // バリデーション
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: '会話履歴が必要です' });
      return;
    }

    // メッセージの長さチェック
    for (const message of messages) {
      if (message.content && message.content.length > MAX_MESSAGE_LENGTH) {
        res.status(400).json({ error: 'メッセージが長すぎます' });
        return;
      }
    }

    // OpenAI APIキーの取得
    let apiKey;
    let apiBaseUrl;

    if (userApiKey && userApiKey.startsWith('sk-')) {
      // ユーザー独自のAPIキーを使用
      apiKey = userApiKey;
      apiBaseUrl = baseUrl || 'https://api.openai.com/v1';
    } else {
      // サーバー側のAPIキーを使用
      apiKey = process.env.OPENAI_API_KEY;
      apiBaseUrl = 'https://api.openai.com/v1';

      if (!apiKey) {
        res.status(500).json({ error: 'OpenAI APIキーが設定されていません' });
        return;
      }
    }

    // OpenAIクライアントの初期化
    const openai = new OpenAI({
      apiKey,
      baseURL: apiBaseUrl,
    });

    // 使用するモデル
    const selectedModel = model || 'gpt-4.1-nano';

    // ストリーミングレスポンスの設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // OpenAI APIストリーミング呼び出し
    const stream = await openai.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    });

    let fullText = '';
    let usage = null;

    // ストリーミングデータを処理
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        fullText += delta.content;
        res.write(
          `data: ${JSON.stringify({
            content: delta.content,
          })}\n\n`
        );
      }

      // 使用量情報を取得（最後のチャンク）
      if (chunk.usage) {
        usage = chunk.usage;
      }
    }

    // 使用量情報を送信
    if (usage) {
      res.write(
        `data: ${JSON.stringify({
          usage: {
            prompt_tokens: usage.prompt_tokens,
            completion_tokens: usage.completion_tokens,
            total_tokens: usage.total_tokens,
          },
          model: selectedModel,
        })}\n\n`
      );
    }

    // ストリーミング終了
    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (error) {
    console.error('Resume Builder API Error:', error);

    // エラーレスポンスをストリーミング形式で送信
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }

    res.write(
      `data: ${JSON.stringify({
        error: error.message || 'AIとの通信中にエラーが発生しました',
      })}\n\n`
    );
    res.end();
  }
};
