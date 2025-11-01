const OpenAI = require('openai');

module.exports = async (req, res) => {
  // CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')
    return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { userApiKey, provider, baseUrl, model } = req.body || {};
    if (!userApiKey || typeof userApiKey !== 'string') {
      return res.status(400).json({ ok: false, error: 'APIキーが未設定です' });
    }

    // OpenAI互換のエンドポイントを想定
    const client = new OpenAI({ apiKey: userApiKey, baseURL: baseUrl || undefined });

    // 軽量な呼び出しで疎通確認
    const usedModel = model || process.env.OPENAI_MODEL || 'gpt-4.1-nano';

    // GPT-5モデルかどうかを判定
    const isGPT5 = usedModel.startsWith('gpt-5');

    const requestParams = {
      model: usedModel,
      messages: [{ role: 'user', content: 'ping' }],
    };

    // GPT-5の場合は max_completion_tokens を使用、それ以外は max_tokens
    if (isGPT5) {
      requestParams.max_completion_tokens = 1;
      // GPT-5では temperature は非対応
    } else {
      requestParams.max_tokens = 1;
      requestParams.temperature = 0;
    }

    await client.chat.completions.create(requestParams);

    return res.status(200).json({ ok: true, provider: provider || 'openai', model: usedModel });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ ok: false, error: error.message || '接続に失敗しました' });
  }
};
