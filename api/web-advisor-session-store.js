// セッションストア（プロセス内メモリ）
// サーバーレスではインスタンスごとに分離される点に注意（短期利用前提）

const { randomUUID } = require('crypto');

const SESSIONS = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5分

function now() {
  return Date.now();
}

function createSession(data = {}, ttlMs = DEFAULT_TTL_MS) {
  const token = randomUUID();
  const expiresAt = now() + ttlMs;
  SESSIONS.set(token, { ...data, expiresAt });
  return token;
}

function getSession(token) {
  if (!token) return null;
  const entry = SESSIONS.get(token);
  if (!entry) return null;
  if (entry.expiresAt && entry.expiresAt < now()) {
    SESSIONS.delete(token);
    return null;
  }
  return entry;
}

function cleanup() {
  const t = now();
  for (const [k, v] of SESSIONS.entries()) {
    if (v.expiresAt && v.expiresAt < t) SESSIONS.delete(k);
  }
}

module.exports = {
  createSession,
  getSession,
  cleanup,
  DEFAULT_TTL_MS,
};
