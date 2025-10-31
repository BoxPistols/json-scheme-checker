const OpenAI = require('openai');

module.exports = async (req, res) => {
  // CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  try {
    const { userApiKey, provider, baseUrl, model } = req.body || {};
    if (!userApiKey || typeof userApiKey !== 'string') {
      return res.status(400).json({ ok: false, error: 'APIキーが未設定です' });
    }

    // OpenAI互換のエンドポイントを想定
    const client = new OpenAI({ apiKey: userApiKey, baseURL: baseUrl || undefined });

    // 軽量な呼び出し（max_tokens:1）で疎通確認
    const usedModel = model || process.env.OPENAI_MODEL || 'gpt-4o-mini';
    await client.chat.completions.create({
      model: usedModel,
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 1,
      temperature: 0,
    });

    return res.status(200).json({ ok: true, provider: provider || 'openai', model: usedModel });
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ ok: false, error: error.message || '接続に失敗しました' });
  }
};