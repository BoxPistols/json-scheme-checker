const OpenAI = require('openai');

const CHAT_SYSTEM_PROMPTS = {
  advisor: `あなたは求人票作成の専門家です。ユーザーが提供した求人情報（JobPosting JSON-LD）に基づいて、追加の質問に答えてください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください
- 元の求人情報とあなたが提供したアドバイス内容に基づいて回答してください`,

  'blog-reviewer': `あなたはブログ記事のSEO専門家です。ユーザーが提供したブログ記事のメタデータとコンテンツに基づいて、追加の質問に答えてください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください
- 元の記事情報とあなたが提供したレビュー内容に基づいて回答してください`,

  'web-advisor': `あなたはWebサイトのSEO専門家です。ユーザーが提供したWebサイトのメタデータとコンテンツに基づいて、追加の質問に答えてください。

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 不要な改行や空行を最小限にしてください
- 元のWebサイト情報とあなたが提供したアドバイス内容に基づいて回答してください`,
};

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
    const { type, context, messages, userApiKey, baseUrl, model } = req.body;

    // 入力検証: type
    if (!type || !CHAT_SYSTEM_PROMPTS[type]) {
      return res
        .status(400)
        .json({ error: 'type は "advisor", "blog-reviewer", または "web-advisor" である必要があります' });
    }

    // 入力検証: context
    if (!context || typeof context !== 'object') {
      return res.status(400).json({ error: 'context は有効なオブジェクトである必要があります' });
    }

    // 入力検証: contextのサイズ制限 (500KB)
    if (JSON.stringify(context).length > 500000) {
      return res.status(400).json({ error: 'コンテキストデータが大きすぎます' });
    }

    // 入力検証: messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages は空でない配列である必要があります' });
    }

    // 入力検証: messagesの長さ制限（最大50件）
    if (messages.length > 50) {
      return res.status(400).json({ error: 'メッセージ履歴が多すぎます（最大50件）' });
    }

    // 入力検証: 各メッセージの検証
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        return res.status(400).json({ error: 'メッセージのroleは "user" または "assistant" である必要があります' });
      }
      if (!msg.content || typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'メッセージのcontentは文字列である必要があります' });
      }
      // XSS対策: contentの長さ制限（10KB/メッセージ）
      if (msg.content.length > 10000) {
        return res.status(400).json({ error: 'メッセージが長すぎます（最大10,000文字/メッセージ）' });
      }
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[Chat API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'チャット機能は現在利用できません' });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

    // システムプロンプトの構築
    const systemPrompt = CHAT_SYSTEM_PROMPTS[type];
    const contextSummary = `\n\n【元の分析コンテキスト】\n${JSON.stringify(context, null, 2)}`;

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-5-nano';
    const isGPT5 = selectedModel.startsWith('gpt-5');

    const requestParams = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt + contextSummary },
        ...messages,
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
    console.error('Chat API error:', error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'チャット処理に失敗しました',
        details: error.message,
      });
    }

    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
