# アーキテクチャ

## 高レベル構造

```
ブラウザ
    ↓ fetch
プロキシサーバー（Express.js / Vercel関数）
    ↓ axios
対象Webサイト
```

---

## なぜプロキシが必要か？

**ブラウザのCORS制限を回避**

ブラウザから直接他ドメインへのリクエストはCORSブロックされるため、自社サーバーを経由してアクセス。

---

## 環境判定（フロントエンド）

```javascript
// app.js内の環境判定ロジック
const isVercel = hostname.includes('vercel.app');
const isLocalhost = ['localhost', '127.0.0.1'].includes(hostname);

// プロキシURL決定
if (isVercel) {
  proxyUrl = '/api/proxy'; // サーバーレス関数
} else if (isLocalhost) {
  proxyUrl = 'http://localhost:3333/proxy'; // ローカルExpress
} else {
  proxyUrl = `http://{hostname}:3333/proxy`; // LAN内デバイス
}
```

---

## エンドポイント

### 1. プロキシ `/proxy` または `/api/proxy`

**リクエスト**: GET
**パラメータ**: `url`, `username`（オプション）, `password`（オプション）

```bash
GET /proxy?url=https://example.com
GET /proxy?url=https://example.com&username=user&password=pass
```

**動作**: 対象URLのHTMLをそのまま返す

### 2. JSON-LD抽出 `/extract-jsonld`

**リクエスト**: POST
**ボディ**: `{ "url": "..." }`

**動作**: 対象URLからJSON-LDを抽出してJSON形式で返す（ローカル開発用）

### 3. Blog分析 `/api/blog-reviewer`

**リクエスト**: POST
**ボディ**: `{ "article": {...JSON-LDオブジェクト...}, "userApiKey": "sk-..." }`

**動作**: OpenAI APIを使用して記事のSEO/EEAT評価を返す

### 4. Advisor分析 `/api/advisor`

**リクエスト**: POST
**ボディ**: `{ "jobPosting": {...}, "mode": "employer|applicant", "userApiKey": "sk-..." }`

**動作**: OpenAI APIを使用してJobPostingの分析結果をストリーミング返す

---

## データフロー例

**例: https://example.com のJSON-LDを表示**

1. ユーザーが URL入力
2. フロントエンド → プロキシに `GET /proxy?url=https://example.com`
3. プロキシ（サーバー側）→ `https://example.com` にHTML取得リクエスト
4. プロキシ → フロントエンドにHTML返却
5. フロントエンドが DOMParser で `<script type="application/ld+json">` 抽出
6. テーブル/JSONで表示

---

## 重要な技術詳細

### localhost 変換

localhost → 127.0.0.1 に変換（IPv6問題回避）

```javascript
// server.js / api/proxy.js
if (url.includes('localhost:')) {
  targetUrl = url.replace('localhost:', '127.0.0.1:');
}
```

### ブラウザ風ヘッダー

Bot検出を回避するため、実際のブラウザを模倣:

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,...',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
}
```

### タイムアウト

- ローカル: 30秒
- Vercel: 30秒（Free: 10s, Pro: 60s）

---

## なぜDBが不要か？

- **ステートレス設計**: 各リクエストは独立
- **リアルタイム取得のみ**: キャッシュなし
- **クライアント側のみ保存**: 認証情報はlocalStorageのみ
- **一時的な分析ツール**: データ永続化不要

---

## 関連ドキュメント

- **[プロジェクト概要](./01_PROJECT.md)**
- **[開発ワークフロー](./03_WORKFLOW.md)** - ローカルテスト方法
- **[セキュリティ](./05_SECURITY.md)** - IP取得・CORS・XSS対策

---

**最終更新**: 2025-10-22
