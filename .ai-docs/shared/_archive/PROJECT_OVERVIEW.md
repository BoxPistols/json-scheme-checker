# JSON-LD Schema Viewer - Project Overview

## プロジェクト概要

WebサイトのJSON-LD構造化データを抽出・可視化するツール。CORS制限を回避し、localhost開発環境も含むあらゆるURLにアクセス可能。

**本番URL**: <https://json-ld-view.vercel.app/>

---

## 技術スタック

### バックエンド

- **Node.js** (v18.17.0)
- **Express.js** (v4.18.2) - Webフレームワーク
- **Axios** (v1.6.0) - HTTPクライアント
- **CORS** (v2.8.5) - CORS対応

### フロントエンド

- **Vanilla JavaScript** - フレームワークレス
- **HTML5/CSS3**
- **DOMParser API** - クライアント側JSON-LD解析

### デプロイメント

- **Vercel** - サーバーレス関数
- **ローカル開発** - Express.js サーバー (ポート 3333)

---

## プロジェクト構造

```plaintext
json-ld-viewer/
├── server.js              # ローカル開発用Expressサーバー
├── package.json           # 依存関係とスクリプト
├── vercel.json           # Vercelデプロイ設定
├── api/                  # Vercelサーバーレス関数
│   ├── proxy.js         # プロキシエンドポイント
│   └── health.js        # ヘルスチェック
├── public/
│   └── index.html       # Webアプリケーション（SPA）
└── .ai-docs/            # AIMyAPI向けドキュメント
    ├── shared/          # 共通ドキュメント（SSOT）
    ├── cursor/          # Cursor専用設定
    ├── copilot/         # GitHub Copilot専用設定
    └── claude/          # Claude Code専用設定
```

---

## 主要機能

### コアフィーチャー

1. **CORS回避プロキシ** - サーバー側でHTTPリクエストを実行
2. **JSON-LD抽出** - `<script type="application/ld+json">` を自動検出
3. **デュアル表示モード**
   - テーブルビュー（階層構造）
   - JSONビュー（シンタックスハイライト）
4. **Basic認証対応** - ステージング環境アクセス用
5. **マルチデバイス対応** - PC/iPhone/Android

### 認証機能

- **ローカルストレージ保存** - ブラウザのみに保存
- **ドメイン別管理** - URLごとに認証情報を記憶
- **自動入力** - 保存済みドメインを自動検出
- **プライバシー重視** - サーバー送信なし

---

## アーキテクチャパターン

### CORS回避の仕組み

```bash
❌ ブラウザ → 他サイト (CORS Error)
✅ ブラウザ → プロキシサーバー → 他サイト
```

### 環境判定ロジック

```javascript
const isVercel = hostname.includes('vercel.app');
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// 環境に応じたAPI URL
if (isVercel) {
  proxyUrl = '/api/proxy'; // サーバーレス関数
} else if (isLocalhost) {
  proxyUrl = 'http://localhost:3333/proxy';
} else {
  proxyUrl = `http://${hostname}:3333/proxy`; // LAN内デバイス
}
```

### 主要なエンドポイント

本アプリケーションは、主に2つのサーバーサイドエンドポイントを提供します。

#### 1. プロキシエンドポイント (`/proxy`)

CORSエラーを回避するためのコア機能です。クライアントから受け取ったURLにサーバーサイドでリクエストを送り、取得したHTMLコンテンツをそのままクライアントに返します。Basic認証にも対応しています。

**リクエスト (GET):**
`/api/proxy?url={TARGET_URL}&username={USER}&password={PASS}`

\*\*実装の要点 (`api/proxy.js` / `server.js`):

```javascript
// クエリパラメータで認証情報を受け取る
const { url, username, password } = req.query;

// Basic認証ヘッダーを生成
if (username && password) {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  headers['Authorization'] = `Basic ${auth}`;
}

// AxiosでターゲットURLにリクエスト
const response = await axios.get(targetUrl, { headers });
```

#### 2. JSON-LD抽出エンドポイント (`/extract-jsonld`)

このエンドポイントはローカル開発サーバー (`server.js`) にのみ存在し、指定されたURLから直接JSON-LDを抽出する機能を提供します。主に開発時のテストやデバッグに利用されます。

**リクエスト (POST):**
`Content-Type: application/json`
`{ "url": "https://example.com" }`

\*\*実装の要点 (`server.js`):

```javascript
app.post('/extract-jsonld', async (req, res) => {
  const { url } = req.body;
  // ... AxiosでURLのHTMLを取得 ...
  const html = response.data;

  // 正規表現でJSON-LDスクリプトタグを抽出
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  // ... 抽出したJSONをパースしてレスポンスとして返す ...
});
```

---

## データフロー

1. **ユーザー入力** → URL + 認証情報（オプション）
2. **環境判定** → Vercel/ローカル/LAN を自動判定
3. **プロキシリクエスト** → `/api/proxy?url={URL}`
4. **HTML取得** → ターゲットサイトからHTMLを取得
5. **JSON-LD抽出** → DOMParserで `<script type="application/ld+json">` を検索
6. **パース** → JSON.parse() で構造化データに変換
7. **表示** → テーブル/JSON形式でレンダリング

---

## 開発環境セットアップ

### 必要なツール

- Node.js 18.x以上
- npm または yarn
- Git

### ローカル開発

```bash
pnpm install
pnpm dev  # nodemon自動再起動
```

### 本番ビルド

```bash
pnpm start
```

### Vercelデプロイ

```bash
vercel --prod
```

または、GitHubのmainブランチへのプッシュで自動デプロイ

---

## 重要な技術的詳細

### localhost URLの取り扱い

ローカル開発時に `http://localhost:xxxx` のようなURLを扱う際、環境によってIPv6の解決に問題が発生することがあります。この問題を回避するため、プロキシサーバーは `localhost` を `127.0.0.1` に明示的に変換します。

この処理は、ローカル開発サーバー (`server.js`) とVercel上のサーバーレス関数 (`api/proxy.js`) の両方で一貫して行われ、安定した動作を保証します。

**実装 (`server.js` および `api/proxy.js`):**

```javascript
// 受け取ったURLを取得
const { url, username, password } = req.query;

// ... (中略) ...

// localhostをIPv4に変換（IPv6の問題を回避）
let targetUrl = url;
if (url.includes('localhost:')) {
  targetUrl = url.replace('localhost:', '127.0.0.1:');
  console.log(`Converting localhost to IPv4: ${targetUrl}`);
}

// 変換後の `targetUrl` を使用してリクエスト
const response = await axios.get(targetUrl, {
  /* ... */
});
```

### ブラウザ風ヘッダー

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
}
```

Bot検出を回避するため、実際のブラウザを模倣

### ネストされたオブジェクト表示

- 初期状態で展開表示
- 3階層以上は折りたたみ可能
- 画像URLは48x48pxサムネイル表示
- 外部URLはクリック可能リンク

---

## Schema.org対応

### サポートするタイプ

- JobPosting
- Article
- BreadcrumbList
- Product
- FAQPage
- HowTo
- Event
- LocalBusiness
- Organization
- WebSite
- VideoObject
- Recipe

各タイプにGoogle公式ドキュメントへのリンクを自動生成

---

## パフォーマンス最適化

### タイムアウト設定

- **ローカル**: 30秒
- **Vercel**: 30秒（設定可能、Free: 10s, Pro: 60s）

### エラーハンドリング

- `ECONNREFUSED` → 503 (Connection refused)
- `ETIMEDOUT` → 504 (Request timeout)
- `401` → Basic認証失敗メッセージ

---

## セキュリティ考慮事項

### 認証情報の扱い

- ✅ クライアント側のみ保存（localStorage）
- ✅ サーバーログに記録なし
- ✅ HTTPS通信（Vercel環境）
- ⚠️ ローカルストレージはクリアテキスト

### CORS設定

```javascript
app.use(cors()); // 全オリジン許可（開発用）
```

---

## 制限事項

### Vercelデプロイ時

- ❌ localhost URLにアクセス不可（サーバーがVercel上）
- ⚠️ タイムアウト制限あり
- ⚠️ 同時接続数制限（無料プラン）

### 推奨される使い方

- **本番環境テスト** → Vercelデプロイ版
- **localhost開発** → ローカルサーバー (`pnpm start`)
- **モバイルテスト** → LAN内アクセス (`http://192.168.x.x:3333`)

---

## トラブルシューティング

### サーバーオフライン

1. ローカル: `pnpm start` で起動確認
2. Vercel: デプロイ状態を確認 (`vercel list`)
3. ポート3333が使用中: 別プロセスをkill

### CORS エラー

- プロキシサーバーが起動していることを確認
- `/health` エンドポイントでステータス確認

### Basic認証失敗

- ユーザー名/パスワードを再確認
- サーバーログで送信されたヘッダーを確認
- ターゲットサイトが401を返しているか確認

---

## 将来の拡張アイデア

- [ ] JSON-LDバリデーション機能
- [ ] 複数URL一括処理
- [ ] 履歴機能（IndexedDB）
- [ ] JSON-LD編集・再生成
- [ ] Schema.orgタイプの視覚的表示
- [ ] TypeScript移行
- [ ] ユニットテスト追加

---

## 関連リンク

- [Schema.org 公式](https://schema.org/)
- [JSON-LD 仕様](https://json-ld.org/)
- [Google 構造化データ](https://developers.google.com/search/docs/appearance/structured-data)
- [Vercel ドキュメント](https://vercel.com/docs)
