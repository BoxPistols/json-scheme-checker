# GitHub Copilot 設定 - JSON-LD Schema Viewer

## プロジェクトコンテキスト

まず以下を読んでください：

- `.ai-docs/shared/PROJECT_OVERVIEW.md` - プロジェクト全体の理解
- `.ai-docs/shared/DEVELOPMENT_WORKFLOW.md` - 開発コマンドとワークフロー

## 主要技術スタック

- **バックエンド**: Node.js + Express.js（ローカル）、Vercel Serverless Functions（本番）
- **フロントエンド**: Vanilla JavaScript（フレームワークなし）、HTML5、CSS3
- **デプロイ**: Vercel（GitHub自動デプロイ）

## 推奨コードパターン

### 環境検出パターン

```javascript
const isVercel = window.location.hostname.includes('vercel.app');
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const proxyUrl = isVercel
  ? `/api/proxy?url=${encodeURIComponent(url)}`
  : `${PROXY_SERVER}/proxy?url=${encodeURIComponent(url)}`;
```

### エラーハンドリングパターン

```javascript
try {
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  // レスポンス処理
} catch (error) {
  console.error('操作に失敗:', error);
  showError(`エラー: ${error.message}`);
}
```

### Basic認証パターン

```javascript
// クライアントサイド
const params = new URLSearchParams({
  url: targetUrl,
  ...(username && password && { username, password }),
});

// サーバーサイド
if (username && password) {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');
  headers['Authorization'] = `Basic ${auth}`;
}
```

### localStorageパターン

```javascript
// 保存
const auth = { username, password, timestamp: Date.now() };
localStorage.setItem(`jsonld_auth_${domain}`, JSON.stringify(auth));

// 読み込み
const stored = localStorage.getItem(`jsonld_auth_${domain}`);
const auth = stored ? JSON.parse(stored) : null;

// 削除
localStorage.removeItem(`jsonld_auth_${domain}`);
```

## ファイル別ガイドライン

### `/server.js` - ローカル開発サーバー

- `localhost`ではなく`0.0.0.0`でリッスン（モバイルアクセス用）
- IPv6問題回避のため`localhost:`を`127.0.0.1:`に変換
- タイムアウトを30秒に設定
- 認証情報をサニタイズしてログ出力（`password ? '***' : null`）

### `/api/proxy.js` - Vercel サーバーレス関数

- `module.exports = async (req, res) => {...}`としてエクスポート
- CORSヘッダーを手動処理（ミドルウェアなし）
- プリフライト用にOPTIONSリクエストを処理
- `vercel.json`のmaxDurationと一致させる

### `/public/index.html` - シングルページアプリケーション

- すべてのコードを単一ファイルに保持（ビルドステップなし）
- API URLの環境検出を使用
- 認証をlocalStorageに保存（cookieは使わない）
- HTML解析にDOMParserを使用（外部コンテンツで`innerHTML`は使わない）

## 禁止パターン

❌ **ダメな例**:

```javascript
// 外部フレームワークを使わない
import React from 'react';
import axios from 'axios'; // server.jsでは可、index.htmlでは不可

// jQueryを使わない
$('#element').text('value');

// パスワードをログに出力しない
console.log('Password:', password); // 'Password: ***'を使用

// document.writeを使わない
document.write('<script>...</script>');

// localhostバインディングをブロックしない
app.listen(3333, 'localhost'); // '0.0.0.0'にすべき
```

✅ **良い例**:

```javascript
// Vanilla JavaScriptを使用
document.getElementById('element').textContent = 'value';

// ログで機密データをサニタイズ
console.log('Auth:', username, password ? '***' : 'none');

// 安全なDOM操作
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');

// ネットワークアクセスを許可
app.listen(3333, '0.0.0.0');
```

## よくあるCopilotプロンプト

### 関数生成

```javascript
// HTMLからJSON-LDを抽出する関数を生成
// DOMParserとquerySelectorAllを使用すること
// パースされたJSONオブジェクトの配列を返す
```

### 機能追加

```javascript
// ドメイン固有の認証ストレージを追加
// jsonld_auth_{hostname}というキーでlocalStorageに保存
// ホスト名が一致したら自動入力
```

### リファクタリング

```javascript
// コールバックの代わりにasync/awaitを使うようリファクタリング
// try/catchでエラーハンドリングを維持
// 既存の機能を保持
```

## テストガイドライン

### コミット前

```bash
# ローカルサーバー起動
pnpm dev

# ブラウザでテスト
open http://localhost:3333

# サンプルURLでテスト
# - https://schema.org
# - https://developers.google.com/
```

### Vercelテスト

```bash
# Vercel CLIでローカルテスト
vercel dev

# プレビューデプロイ
vercel

# デプロイ確認
vercel list
```

## ドキュメント規約

### JSDocコメント

```javascript
/**
 * HTMLからJSON-LD構造化データを抽出
 * @param {string} html - 生のHTMLコンテンツ
 * @returns {Array<Object>} パースされたJSON-LDオブジェクトの配列
 * @throws {Error} HTML解析に失敗した場合
 */
function extractJsonLd(html) {
  // 実装
}
```

### インラインコメント

```javascript
// 良い例：理由を説明（何をしているかではなく）
// IPv6解決問題を避けるためlocalhostを127.0.0.1に変換
if (url.includes('localhost:')) {
  url = url.replace('localhost:', '127.0.0.1:');
}

// 悪い例：コードと冗長
// urlにlocalhostが含まれているかチェック
if (url.includes('localhost:')) {
  // localhostを127.0.0.1に置換
  url = url.replace('localhost:', '127.0.0.1:');
}
```

## Vercel固有の考慮事項

### 関数設定

```json
// vercel.json
{
  "functions": {
    "api/*.js": {
      "maxDuration": 30
    }
  }
}
```

### 環境変数

現在は使用していません。追加する場合：

```bash
# Vercel CLIで設定
vercel env add VARIABLE_NAME

# またはダッシュボード: Settings > Environment Variables
```

### コールドスタート最適化

- 関数ファイルを小さく保つ（<1MB）
- サーバーレス関数で重い依存関係を避ける
- 可能な場合は静的データをキャッシュ

## セキュリティベストプラクティス

### 認証

- ✅ localStorageに保存（クライアントサイドのみ）
- ❌ サーバーログに保存しない
- ❌ Gitにクレデンシャルをコミットしない
- ✅ クエリパラメータまたはヘッダーで渡す

### CORS

```javascript
// APIルートでCORSヘッダーを設定
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

### 入力検証

```javascript
// 常にURLを検証
try {
  new URL(userInput); // 無効な場合は例外発生
  // リクエスト実行
} catch {
  showError('無効なURL形式');
  return;
}
```

## パフォーマンス最適化

### 遅延読み込み

```html
<img src="..." loading="lazy" />
```

### ユーザー入力のデバウンス

```javascript
let timeout;
function handleInput(value) {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    // 入力処理
  }, 300);
}
```

### APIレスポンスのキャッシュ

```javascript
const cache = new Map();
async function fetchWithCache(url) {
  if (cache.has(url)) return cache.get(url);
  const data = await fetch(url).then(r => r.text());
  cache.set(url, data);
  return data;
}
```

## アクセシビリティ

- セマンティックなHTMLを使用（`<div onclick>`ではなく`<button>`）
- アイコンボタンにARIAラベルを追加
- キーボードナビゲーションが動作することを確認
- 十分な色のコントラストを維持

## ブラウザ互換性

対象：モダンブラウザ（Chrome、Firefox、Safari、Edge）

- ES6+機能を使用
- IE11サポート不要
- DOMParser API（十分にサポートされている）
- LocalStorage API（十分にサポートされている）
- Fetch API（十分にサポートされている）

## Gitワークフロー

### コミットメッセージ形式

```bash
<type>: <subject>

<body>

Co-Authored-By: GitHub Copilot <noreply@github.com>
```

タイプ：feat、fix、docs、refactor、test、chore

### 例

```bash
feat: パスワード表示切替を追加

UXを改善するため、パスワードフィールドのタイプを
'password'と'text'の間で切り替える目アイコンボタンを追加

Co-Authored-By: GitHub Copilot <noreply@github.com>
```

## 関連ドキュメント

- [プロジェクト概要](.ai-docs/shared/PROJECT_OVERVIEW.md)
- [開発ワークフロー](.ai-docs/shared/DEVELOPMENT_WORKFLOW.md)
- [Cursorルール](.cursorrules)
- [Claude設定](CLAUDE.md)

---

**最終更新日**: 2025-10-12
**Copilotバージョン**: GitHub Copilot Chatでテスト済み
