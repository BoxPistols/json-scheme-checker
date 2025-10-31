// POST /api/web-advisor/session
// ユーザー提供のAPI設定を短期セッションに保存し、トークンを返す

const { createSession, DEFAULT_TTL_MS } = require('./web-advisor-session-store');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userApiKey, provider, baseUrl, model } = req.body || {};

    // 機密保持のため、値はメモリにのみ保持（TTL付き）
    const token = createSession({ userApiKey, provider, baseUrl, model }, DEFAULT_TTL_MS);

    res.status(200).json({ sessionToken: token, expiresInSec: Math.floor(DEFAULT_TTL_MS / 1000) });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create session', details: e.message });
  }
};
