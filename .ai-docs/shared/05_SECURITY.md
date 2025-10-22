# セキュリティ

## レート制限

### メモリベース制限の制限事項

**重要**: 現在のメモリベース制限は **Vercelサーバーレス環境では完全に機能しません**

#### 問題点

- サーバーレス関数は各リクエストで異なるインスタンスで実行
- Map() はインスタンス間で共有されない
- 悪意のあるユーザーによるAPI濫用のリスク

#### 現在の防御策

- **IP単位の記録**: 24時間で10回まで（メモリに記録）
- **ローカル開発での動作**: 単一インスタンスでのみ機能
- **ユーザーAPIキー**: 提供時はレート制限をスキップ（自己責任）

### 推奨対策（本番環境）

#### Vercel KV（推奨）

```bash
vercel kv create # Redis互換
```

**メリット**: 無料枠あり（100MB、10,000リクエスト/日）

#### Upstash Redis

完全なRedis互換性

### 実装

```javascript
// 現在の実装（server.js / api/advisor.js / api/blog-reviewer.js）
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000;
const MAX_REQUESTS_PER_IP = 10;

function checkRateLimit(ip) {
  // IP単位でチェック
  const entries = rateLimitStore.get(ip) || [];
  if (entries.length >= MAX_REQUESTS_PER_IP) {
    return { allowed: false, retryAfter: ... };
  }
  entries.push(Date.now());
  rateLimitStore.set(ip, entries);
  return { allowed: true, remaining: ... };
}
```

---

## CORS設定

### 現在の設定

```javascript
// 環境変数で制御可能
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
```

### 本番環境での推奨設定

```bash
# .env.production
ALLOWED_ORIGINS=https://json-ld-view.vercel.app,https://yourdomain.com
```

---

## XSS対策

### 入力検証

#### Headline/Title 長さ制限

```javascript
if (typeof article.headline === 'string') {
  article.headline = article.headline.substring(0, 500);
}
```

#### サイズ制限（100KB）

```javascript
if (JSON.stringify(article).length > 100000) {
  return res.status(400).json({ error: '記事データが大きすぎます' });
}
```

### HTMLエスケープ（フロントエンド）

```javascript
// public/utils/htmlHelpers.js
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}
```

---

## APIキー管理

### ユーザー提供キー

```javascript
// リクエストボディで提供
POST /api/blog-reviewer
{
  "article": {...},
  "userApiKey": "sk-proj-..."  // ユーザー責任
}
```

**メリット**: サーバー側では API 使用量が発生しない

### 環境変数キー

```bash
# .env
OPENAI_API_KEY=sk-...  # サーバー側で管理
OPENAI_MODEL=gpt-4o-mini
```

**メリット**: サーバー側で統一管理

### ロギング

```javascript
// パスワード・キーはログに記録しない
console.log(password ? '***' : '(none)');
```

---

## Basic認証

### localStorageに保存

```javascript
// キー: jsonld_auth_{domain}
localStorage.setItem('jsonld_auth_example.com', JSON.stringify({
  username: 'user',
  password: '...'
}));
```

**セキュリティ**: ローカルストレージのみ、サーバーに送信なし

---

## IP取得（Vercel対応）

### ヘッダーの優先順位

```javascript
function getClientIp(req) {
  return (
    req.headers['x-vercel-forwarded-for']?.split(',')[0].trim() || // Vercel専用
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    '0.0.0.0'
  );
}
```

---

## セキュリティチェックリスト

- [ ] 環境変数 `ALLOWED_ORIGINS` を設定したか？
- [ ] OpenAI APIキーをVault管理したか？
- [ ] 本番前にレート制限テストを実施したか？
- [ ] ユーザーに機能制限を伝えたか？
- [ ] ログに機密情報が含まれていないか？

---

## 関連ドキュメント

- **[機能詳細](./04_FEATURES.md)** - API キー使用方法
- **[ワークフロー](./03_WORKFLOW.md)** - ローカルテスト
- **[プロジェクト概要](./01_PROJECT.md)** - 全体像

---

**最終更新**: 2025-10-22
