# JSON-LD Schema Viewer

WebサイトのJSON-LD構造化データを可視化するツール

## ドキュメント

- [CORS設定ガイド（Developer/無制限向け）](./CORS_SETUP.md) - localhost URLアクセスに必要なCORS設定
- [Claude開発ガイド](./CLAUDE.md) - Claude Codeでの開発時の参考資料

## 概要

このアプリケーションは、Webサイトに埋め込まれたJSON-LD（Linked Data）形式の構造化データを抽出し、読みやすく可視化するツールです。自前のプロキシサーバーを使用してCORS制限を回避し、あらゆるWebサイトのデータを取得できます。

## 主な機能

- CORS制限を回避してあらゆるURLにアクセス可能
- localhostのサイトも検証可能（開発中のサイトのテストに最適）
- テーブル形式とJSON形式の切り替え表示
- ネストされたオブジェクトは初期状態で展開表示
- ワンクリックでJSONをコピー
- 画像URLはサムネイル付きで表示
- 外部API不要・完全自己完結型
- **✨ NEW: AI求人票アドバイザー機能**
  - JobPostingスキーマを自動検出
  - 採用側向け: 求人票の改善提案
  - 応募者向け: 面接対策と要件分析
  - OpenAI GPT-4o miniによるリアルタイム分析

## 技術スタック

### バックエンド

- **Node.js** - サーバーランタイム
- **Express** - Webフレームワーク
- **Axios** - HTTPクライアント
- **CORS** - クロスオリジン設定

### フロントエンド

- **Vanilla JavaScript** - ライブラリ不要のピュアJS
- **CSS3** - モダンなスタイリング
- **HTML5** - セマンティックマークアップ

## アーキテクチャ

### システム構成図

```text
┌─────────────────────────────────────────────────────────────┐
│                        ユーザー                              │
│                    （Webブラウザ）                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ ① URLを入力
                     ↓
┌─────────────────────────────────────────────────────────────┐
│              フロントエンド（public/index.html）              │
│  - URLフォーム                                               │
│  - JSON-LD抽出・パース機能                                   │
│  - テーブル/JSON表示切替                                     │
│  - コピー機能                                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ ② /proxy エンドポイントに
                     │    リクエスト
                     ↓
┌─────────────────────────────────────────────────────────────┐
│           自社プロキシサーバー（server.js）                   │
│  Endpoints:                                                 │
│  - GET  /proxy?url={URL}     HTMLを取得                     │
│  - POST /extract-jsonld      JSON-LDを直接抽出              │
│  - GET  /health              ヘルスチェック                  │
│                                                             │
│  機能:                                                       │
│  - CORS制限の回避                                            │
│  - localhost URLの自動変換（IPv6 → IPv4）                   │
│  - ブラウザ風ヘッダー付与                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ ③ 対象URLに
                     │    HTTPリクエスト
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   対象Webサイト                              │
│              （任意のURL・localhost含む）                     │
└─────────────────────────────────────────────────────────────┘
```

### データフロー

1. **ユーザー入力** → フロントエンドでURLを入力
2. **プロキシリクエスト** → `/proxy?url={対象URL}` にGETリクエスト
3. **HTML取得** → サーバーが対象URLにアクセスしてHTMLを取得
4. **HTML返却** → フロントエンドにHTMLを返す
5. **JSON-LD抽出** → クライアント側でDOMParserを使用して解析
6. **表示** → テーブル形式またはJSON形式で可視化

### CORS回避の仕組み

通常、ブラウザのJavaScriptから他のドメインにリクエストを送るとCORSエラーが発生します：

```text
[NG] ブラウザ → 他のサイト (CORS Error)
```

このアプリでは自社サーバーを経由することで回避します：

```text
[OK] ブラウザ → 自社サーバー → 他のサイト
```

自社サーバーはNode.jsで動作しているため、CORS制限を受けません。

## プロジェクト構造

```text
json-ld-viewer/
├── server.js              # Node.js/Express プロキシサーバー
├── package.json           # 依存関係定義
├── package-lock.json      # 依存関係ロックファイル
├── vercel.json           # Vercelデプロイ設定
├── README.md             # このファイル
├── CLAUDE.md             # Claude Code用開発ガイド
├── .gitignore            # Git除外設定
└── public/
    └── index.html        # Webアプリケーション
```

### ファイル詳細

#### `server.js`

Express.jsで構築されたプロキシサーバー。主要な機能：

- `/proxy` - 指定URLのHTMLを取得してCORS制限を回避
- `/extract-jsonld` - サーバー側でJSON-LDを抽出して返却
- `/health` - サーバーのヘルスチェック
- IPv6問題の自動解決（localhost → 127.0.0.1）

#### `public/index.html`

Webアプリケーション。クライアントサイドで動作：

- URLフォームとサンプルリンク
- DOMParserでHTML解析
- `<script type="application/ld+json">` タグを検索
- テーブル/JSON表示の切り替え
- 画像URLのサムネイル表示
- クリップボードへのコピー機能

## ローカルでの使用方法

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. 環境変数の設定（AI Advisor機能を使用する場合）

```bash
# .env.exampleをコピー
cp .env.example .env

# .envファイルを編集してOpenAI APIキーを設定
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

**APIキーの取得方法:**

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. API Keysセクションで新しいキーを作成
3. 作成したキーを`.env`ファイルに貼り付け

> **注意:** `.env`ファイルは`.gitignore`に含まれており、コミットされません。

### 3. サーバーの起動

```bash
# 開発モード（自動再起動）
pnpm dev

# 本番モード
pnpm start
```

### 4. ブラウザでアクセス

```text
http://localhost:3333
```

### 5. 使用例

#### 基本的な使い方

1. URLフィールドに対象URLを入力（例: `https://schema.org`）
2. 「取得」ボタンをクリック
3. JSON-LDスキーマがテーブル形式で表示されます
4. 「JSON」タブでJSON形式に切り替え可能
5. 「コピー」ボタンでJSONをクリップボードにコピー

#### AI Advisor機能の使い方（JobPosting限定）

1. 求人票のURLを入力して取得
2. JobPostingスキーマが検出されると「求人/求職アドバイスを受ける」ボタンが表示
3. ボタンをクリックしてモード選択
   - **採用側向け**: 求人票の改善提案を取得
   - **応募者向け**: 面接対策と要件分析を取得
4. AI分析結果が左右分割画面でリアルタイム表示

### localhost サイトのテスト

開発中のWebアプリケーションのJSON-LDをテストする場合：

```text
http://localhost:3000
http://localhost:3002/your-page
http://localhost:8080/api/item/123
```

サーバーが自動的に `localhost` を `127.0.0.1` に変換してIPv6問題を回避します。

## Vercelへのデプロイ

### 前提条件

- GitHubアカウント
- Vercelアカウント

### デプロイ手順

#### 1. Vercel CLIのインストール

```bash
pnpm add -g vercel
```

#### 2. GitHubへのプッシュ

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### 3. Vercelにデプロイ

```bash
# プレビュー環境
vercel

# 本番環境
vercel --prod
```

#### 4. 自動デプロイの設定

GitHubリポジトリと連携すると、`main` ブランチへのプッシュで自動的に本番環境が更新されます。

### 環境変数の設定

#### AI Advisor機能を有効化する場合（必須）

Vercelダッシュボードで以下の環境変数を設定:

1. [Vercel Dashboard](https://vercel.com/dashboard) → プロジェクト選択
2. **Settings** → **Environment Variables**
3. 以下を追加:

| 変数名           | 値               | 説明                   |
| ---------------- | ---------------- | ---------------------- |
| `OPENAI_API_KEY` | `sk-your-key...` | OpenAI APIキー（必須） |
| `OPENAI_MODEL`   | `gpt-4o-mini`    | 使用するモデル（推奨） |

**注意:**

- 環境変数を追加後、再デプロイが必要です
- APIキーは必ず秘密情報として扱ってください
- 無料枠: OpenAI新規アカウントは$5のクレジット付与

#### その他の環境変数（オプション）

- `PORT` - サーバーポート（デフォルト: 3333、Vercelでは不要）

## API エンドポイント

### GET /proxy

指定されたURLのHTMLを取得します。

**リクエスト:**

```http
GET /proxy?url=https://example.com
```

**レスポンス:**

```html
<!DOCTYPE html>
<html>
  <!-- 対象サイトのHTML -->
</html>
```

**エラーハンドリング:**

- `503` - 接続拒否（サーバーダウン）
- `504` - タイムアウト（30秒）
- `500` - その他のエラー

### POST /extract-jsonld

URLからJSON-LDを直接抽出して返却します。

**リクエスト:**

```json
POST /extract-jsonld
Content-Type: application/json

{
  "url": "https://example.com"
}
```

**レスポンス:**

```json
{
  "url": "https://example.com",
  "schemas": [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Example Inc."
    }
  ],
  "count": 1
}
```

### POST /api/advisor

JobPostingスキーマに対してAI分析を実行します（ストリーミング）。

**リクエスト:**

```json
POST /api/advisor
Content-Type: application/json

{
  "jobPosting": {
    "@type": "JobPosting",
    "title": "フロントエンドエンジニア",
    "description": "React/TypeScriptを使った開発...",
    ...
  },
  "mode": "employer" // または "applicant"
}
```

**レスポンス（Server-Sent Events）:**

```
Content-Type: text/event-stream

data: {"content":"## 総合評価\n"}
data: {"content":"★★★★☆\n\n"}
data: {"content":"この求人票は..."}
...
data: [DONE]
```

**パラメータ:**

- `jobPosting` (object, 必須): JobPosting JSON-LDオブジェクト
- `mode` (string, 必須): `employer` (採用側) または `applicant` (応募者)

**エラーレスポンス:**

- `400` - 不正なリクエスト
- `500` - OpenAI API エラー

**使用モデル:** GPT-4o mini (環境変数で変更可能)

### GET /health

サーバーのヘルスチェック。

**リクエスト:**

```http
GET /health
```

**レスポンス:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-12T06:00:00.000Z"
}
```

## 技術的な詳細

### JSON-LD抽出ロジック

フロントエンドでの抽出フロー：

```javascript
// 1. HTMLをDOMParserで解析
const parser = new DOMParser();
const doc = parser.parseFromString(html, 'text/html');

// 2. application/ld+json スクリプトタグを検索
const scripts = doc.querySelectorAll('script[type="application/ld+json"]');

// 3. 各スクリプトをJSONとしてパース
scripts.forEach(script => {
  const json = JSON.parse(script.textContent);
  schemas.push(json);
});
```

### localhost URL変換

IPv6の問題を回避するため、サーバー側で自動変換：

```javascript
let targetUrl = url;
if (url.includes('localhost:')) {
  targetUrl = url.replace('localhost:', '127.0.0.1:');
}
```

### ブラウザ風ヘッダー

Bot検出を回避するため、リアルなブラウザヘッダーを送信：

```javascript
headers: {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8'
}
```

## 制限事項

### Vercel環境での制限

- **localhostアクセスにはCORS設定が必要**: Vercelにデプロイした場合、localhost URLにアクセスするには開発サーバー側でCORSを有効化する必要があります（詳細は下記参照）
- **タイムアウト**: 無料プランでは10秒、Proプランでは60秒のタイムアウト
- **同時接続数**: 無料プランでは制限あり

### localhost開発でのテスト推奨

localhost URLをテストする場合は、ローカル環境で起動してください：

```bash
pnpm start
# http://localhost:3333 でアクセス
```

## Developer/無制限向け：Vercel環境からlocalhost URLにアクセスする方法

**対象：** 同じマシンまたはLAN内で開発サーバーを起動しているDeveloper/無制限

Vercel環境（<https://json-ld-view.vercel.app/）を開いているブラウザから、同じマシンまたは同じLAN内の開発サーバー（localhost）にアクセスできます。>

### 前提条件

1. 開発サーバーが起動している（例: `http://localhost:3000`）
2. Vercelアプリとブラウザが同じマシン、または同じネットワーク上にある

### 必要な設定

開発サーバー側で**CORS を有効化**してください（開発環境のみ）。

**クイック設定例：**

```javascript
// Next.js (next.config.js)
async headers() {
  if (process.env.NODE_ENV === 'development') {
    return [{ source: '/:path*', headers: [
      { key: 'Access-Control-Allow-Origin', value: '*' }
    ]}]
  }
  return []
}

// Nuxt 3 (nuxt.config.ts)
vite: { server: { cors: true } }

// Express (server.js)
app.use(require('cors')())
```

**詳細ガイド：** [CORS_SETUP.md](./CORS_SETUP.md)

設定後、開発サーバーを再起動してください。

### 一般ユーザー向け

一般ユーザー（localhost環境を持たない）は、ローカル環境でプロキシサーバーを起動してください：

```bash
pnpm install && pnpm start
# http://localhost:3333 にアクセス
```

## トラブルシューティング

### CORS エラーが発生する

- サーバーが起動していることを確認
- `/health` エンドポイントでサーバー状態をチェック
- ブラウザのコンソールでエラー詳細を確認

### localhost にアクセスできない

- Vercelではなく、ローカル環境で起動していることを確認
- ポート番号が正しいか確認
- 対象のlocalhostサーバーが起動しているか確認

### タイムアウトエラー

- 対象サイトのレスポンスが遅い可能性
- 30秒以内に応答がない場合はタイムアウト
- ネットワーク接続を確認

## 開発

### 開発サーバーの起動

```bash
pnpm dev
```

nodemonが自動的にファイル変更を検知して再起動します。

### コード構成

- **サーバーサイド**: `server.js`（約220行）
- **クライアントサイド**: `public/index.html`（約1000行、HTML+CSS+JS）

### 拡張のアイデア

- [ ] 抽出したJSON-LDのバリデーション機能
- [ ] 複数URLの一括処理
- [ ] 履歴機能（IndexedDB使用）
- [ ] JSON-LDの編集・再生成機能
- [ ] Schema.orgタイプのビジュアル表示

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## リンク

- [Schema.org](https://schema.org/)
- [JSON-LD仕様](https://json-ld.org/)
