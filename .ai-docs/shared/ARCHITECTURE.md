# アーキテクチャ解説 - なぜWebページへのアクセスが可能なのか？

## 概要

このアプリは「APIもDBも持たない」と思われがちですが、実際には**簡易的なプロキシAPIを持っています**。ただし、従来のバックエンドAPIとは異なる特殊な構造になっています。

## アーキテクチャ全体像

```
ブラウザ（フロントエンド）
    ↓ fetch リクエスト
プロキシサーバー（簡易バックエンド）
    ↓ axios リクエスト
対象Webサイト（任意のURL）
```

このアプリは、**CORS制限を回避する**ために中間プロキシサーバーを経由して対象サイトにアクセスします。

---

## 主要コンポーネント

### 1. フロントエンド

**ファイル構成:**
- `public/index.html` - ユーザーインターフェース
- `public/app.js` - メインロジック（fetch処理、環境判定）
- `public/modules/` - 各種分析モジュール（SEO、OG、Twitterカード等）

**役割:**
- ユーザーからURLを受け取る
- プロキシサーバーにリクエストを送信
- 取得したHTMLからJSON-LDスキーマを抽出・可視化

### 2. バックエンド（プロキシサーバー）

**ファイル構成:**
- `server.js` - ローカル開発用のExpressサーバー（ポート3333）
- `api/proxy.js` - Vercel本番環境用のサーバーレス関数

**役割:**
- CORSヘッダーを付与してリクエストを中継
- Basic認証対応
- ブラウザ風ヘッダーでBot検出を回避

---

## なぜWebページへのアクセスが可能なのか？

### 問題: ブラウザのCORS制限

通常、ブラウザから直接他のWebサイトへ`fetch()`すると、CORS（Cross-Origin Resource Sharing）ポリシーによりブロックされます。

```javascript
// これはCORSエラーになる
fetch('https://example.com')
  .then(res => res.text())
  .catch(err => console.error('CORS Error:', err));
```

### 解決策: プロキシサーバー経由でアクセス

このアプリは、**自社サーバーを経由**することでCORS制限を回避します。

```javascript
// プロキシサーバー経由でアクセス（CORS回避）
fetch('/api/proxy?url=https://example.com')
  .then(res => res.text())
  .then(html => console.log(html)); // 成功
```

---

## 環境判定とプロキシURL

### フロントエンドの環境判定（app.js:1-18）

```javascript
const currentHost = window.location.hostname;
const isVercel = currentHost.includes('vercel.app') || currentHost.includes('vercel.sh');
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

// 環境に応じたプロキシサーバーURL
let PROXY_SERVER;
if (isVercel) {
  PROXY_SERVER = ''; // Vercel環境: 相対パスでAPIを呼び出す
} else if (isLocalhost) {
  PROXY_SERVER = 'http://localhost:3333';
} else {
  PROXY_SERVER = `http://${currentHost}:3333`; // LAN内デバイス
}
```

### 実際のリクエストURL構築（app.js:1105-1115）

```javascript
let proxyUrl;

if (isVercel) {
  // Vercel環境: サーバーレス関数を使用
  proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
} else {
  // ローカル環境: Expressサーバーを使用
  proxyUrl = `${PROXY_SERVER}/proxy?url=${encodeURIComponent(url)}`;
}

// Basic認証情報を追加
if (username && password) {
  proxyUrl += `&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
}

// プロキシサーバーにリクエスト
response = await fetch(proxyUrl);
```

---

## プロキシサーバーの実装

### ローカル開発環境（server.js:17-96）

```javascript
// プロキシエンドポイント
app.get('/proxy', async (req, res) => {
  const { url, username, password } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    };

    // Basic認証が必要な場合
    if (username && password) {
      const auth = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${auth}`;
    }

    // 対象URLにリクエスト（axiosを使用）
    const response = await axios.get(url, {
      headers,
      timeout: 30000,
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 500,
    });

    // HTMLコンテンツを返す
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch the requested URL',
      message: error.message,
    });
  }
});
```

### Vercel本番環境（api/proxy.js:1-94）

Vercelではサーバーレス関数として実装されていますが、ロジックは基本的に同じです。

```javascript
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  const { url, username, password } = req.query;

  // axios でリクエスト実行
  const response = await axios.get(targetUrl, { headers, timeout: 30000 });

  // HTMLを返す
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(response.data);
};
```

---

## なぜDBが不要なのか？

このアプリの特徴：

1. **リアルタイム取得のみ**: ユーザーデータやスキーマデータを保存しない
2. **ステートレス設計**: 各リクエストは独立しており、前回の状態を保持しない
3. **認証情報はクライアント側のみ**: Basic認証情報はブラウザのlocalStorageに保存（サーバーサイドには保存されない）
4. **一時的な分析ツール**: JSON-LDスキーマを抽出して表示するだけで、永続化の必要がない

### データフロー

```
1. ユーザーがURLを入力
2. フロントエンドがプロキシサーバーにリクエスト送信
3. プロキシサーバーが対象サイトにアクセス
4. 対象サイトのHTMLを取得
5. フロントエンドに返却
6. ブラウザ上でJSON-LDを抽出・可視化
7. 終了（データは保存されない）
```

---

## サーバー起動確認の仕組み

### ヘルスチェックエンドポイント（server.js:149-152）

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### フロントエンドでの確認（app.js:941-956）

```javascript
async function checkServerStatus() {
  const statusElement = document.getElementById('serverStatus');
  try {
    // Vercel環境では /api/health、ローカルでは /health
    const healthUrl = isVercel ? '/api/health' : `${PROXY_SERVER}/health`;
    const response = await fetch(healthUrl);

    if (response.ok) {
      statusElement.textContent = isVercel ? 'Vercel API稼働中' : 'サーバー稼働中';
      statusElement.className = 'server-status';
      return true;
    }
  } catch (error) {
    statusElement.textContent = isVercel ? 'API エラー' : 'サーバーオフライン';
    statusElement.className = 'server-status offline';
    return false;
  }
}
```

ページ読み込み時にサーバーステータスをチェックし、画面右上に表示します。

---

## localhost URL へのアクセス

### localhost アクセスの特殊ケース

このアプリは、**localhost上で動作している別のWebアプリケーション**にもアクセス可能です。

#### ブラウザから直接アクセスを試みる（app.js:1069-1079）

```javascript
// localhost URLの場合、まずブラウザから直接アクセスを試みる
if (isDirectAccessibleUrl) {
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      credentials: 'include',
    });
  } catch (error) {
    console.log('Direct access failed, falling back to proxy:', error.message);
    // 失敗した場合はプロキシ経由にフォールバック
  }
}
```

#### IPv6/IPv4の問題を回避（server.js:30-33、api/proxy.js:26-31）

Node.jsサーバーは `localhost` を自動的にIPv6（`::1`）に解決することがありますが、対象のlocalhostサーバーがIPv4のみ対応の場合、接続に失敗します。

そのため、プロキシサーバー側で `localhost` を `127.0.0.1` に変換します：

```javascript
// api/proxy.js
let targetUrl = url;
if (url.includes('localhost:')) {
  targetUrl = url.replace('localhost:', '127.0.0.1:');
  console.log(`Converting localhost to IPv4: ${targetUrl}`);
}
```

---

## まとめ

### 「APIもDBも持たない」は誤解

**正確には:**

- **APIは持っている**: `/proxy` と `/extract-jsonld` エンドポイント
- **DBは持っていない**: データを永続化せず、リアルタイム取得のみ
- **バックエンドの役割**: CORS制限回避のための中継サーバー（プロキシ）

### このアーキテクチャのメリット

1. **シンプルで軽量**: データベースやセッション管理が不要
2. **高速**: サーバー側でのデータ処理が最小限
3. **メンテナンスが容易**: 複雑な状態管理が不要
4. **セキュリティ**: 認証情報をサーバーに保存しない
5. **スケーラブル**: Vercelのサーバーレス関数で自動スケール

### 主要な技術的特徴

- **CORS回避**: プロキシサーバー経由でアクセス
- **環境自動判定**: Vercel/localhost/LANを自動判別
- **Basic認証対応**: ステージング環境などの保護されたサイトにもアクセス可能
- **Bot検出回避**: 実際のブラウザを模倣したヘッダーを送信
- **localhost対応**: ローカル開発環境のサイトもスキャン可能

このシンプルな構成により、**軽量で高速なJSON-LD可視化ツール**を実現しています。
