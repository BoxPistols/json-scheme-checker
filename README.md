# JSON-LD Schema Viewer

WebサイトのJSON-LD構造化データを可視化するツール

## 機能

- CORS制限を回避してあらゆるURLにアクセス可能
- localhostのサイトも検証可能
- テーブル形式とJSON形式の切り替え表示
- ネストされたオブジェクトは初期状態で展開表示
- ワンクリックでJSONをコピー

## ローカルでの使用方法

```bash
# 依存関係をインストール
npm install

# サーバーを起動
npm start
```

ブラウザで http://localhost:3333 を開く

## Vercelへのデプロイ

### 1. Vercel CLIのインストール

```bash
npm i -g vercel
```

### 2. デプロイ

```bash
# プロジェクトディレクトリで実行
vercel

# または本番環境へデプロイ
vercel --prod
```

### 3. 環境変数（必要に応じて）

Vercelダッシュボードで以下の環境変数を設定可能:
- `PORT`: サーバーポート（デフォルト: 3333）

## API エンドポイント

### GET /proxy
指定されたURLのHTMLを取得

```
GET /proxy?url=https://example.com
```

### POST /extract-jsonld
URLからJSON-LDを直接抽出

```
POST /extract-jsonld
Body: { "url": "https://example.com" }
```

### GET /health
ヘルスチェック

## 技術スタック

- Node.js
- Express
- Axios
- CORS

## ライセンス

MIT
