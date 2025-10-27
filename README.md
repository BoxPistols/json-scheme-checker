# JSON-LD Schema Viewer

WebサイトのJSON-LD構造化データを可視化・検証するツール

## 主な機能

- CORS制限を回避してあらゆるURLにアクセス可能
- localhostのサイトも検証可能
- テーブル形式とJSON形式の切り替え表示
- ワンクリックでJSONをコピー
- 画像URLはサムネイル付きで表示
- **AI求人票アドバイザー機能**: JobPostingスキーマ検出→採用側/応募者向け分析
- **AIブログレビュー機能**: Article/BlogPostingスキーマ検出→SEO/EEAT分析
- **🆕 Webアドバイザー機能**: スキーマ無し/WebPageのみ→汎用的なSEO/EEAT/アクセシビリティ分析

## クイックスタート

### ローカル開発

```bash
# 依存関係インストール
pnpm install

# 開発サーバー起動（自動再起動）
pnpm dev

# ブラウザで開く
# http://localhost:3333
```

### 環境変数設定（AI機能を使用する場合）

```bash
cp .env.example .env
# .envを編集してOpenAI APIキーを設定
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

### Vercelへのデプロイ

```bash
vercel --prod
```

Vercelダッシュボードで環境変数を設定してください。

## 技術スタック

- **バックエンド**: Node.js + Express + Axios
- **フロントエンド**: Vanilla JavaScript + CSS3 + HTML5
- **AI機能**: OpenAI GPT-4o mini

## プロジェクト構成

```text
├── server.js           # Express プロキシサーバー
├── public/
│   ├── index.html      # Webアプリケーション
│   ├── styles.css      # スタイルシート
│   ├── app.js          # メインロジック
│   └── modules/        # 機能モジュール
│       ├── base-advisor.js    # AI機能の共通ベース
│       ├── advisor.js         # JobPosting分析
│       ├── blog-reviewer.js   # ブログ記事分析
│       └── web-advisor.js     # 汎用Web分析
├── api/
│   ├── proxy.js        # Vercel サーバーレス関数
│   ├── advisor.js      # JobPosting AI分析
│   ├── blog-reviewer.js # ブログ記事AI分析
│   └── web-advisor.js  # 汎用Web AI分析
├── vercel.json         # Vercel設定
└── .env.example        # 環境変数テンプレート
```

## AI機能の使い方

### 1. 求人票アドバイザー
- JobPostingスキーマが検出されると自動的にボタンが表示
- 採用側視点と応募者視点の2つのモードで分析
- 求人票の改善提案を生成

### 2. ブログレビュー機能
- Article/BlogPostingスキーマが検出されると自動的にボタンが表示
- SEO、EEAT、アクセシビリティの3つの観点で分析
- 記事コンテンツの改善提案を生成

### 3. 🆕 Webアドバイザー（汎用分析）
- スキーマが無い、またはWebPageのみの場合に自動的にボタンが表示
- URL入力だけでAI分析を実行
- 以下の観点で包括的な分析を提供：
  - **SEO**: タイトル、メタタグ、OG/Twitterカード、見出し構造、構造化データ提案
  - **EEAT**: 専門性、経験、権威性、信頼性の評価
  - **アクセシビリティ**: HTML構造、見出し階層、その他の改善点
  - **優先課題**: 上位3つの重要な課題を抽出
  - **総合評価**: スコアと要約、次のステップ

**使い方:**
1. URLを入力して「取得」ボタンをクリック
2. スキーマが無い/WebPageのみの場合、「Webアドバイザーを実行（汎用分析）」ボタンが表示
3. ボタンをクリックして分析を開始
4. タブで各観点の結果を確認
5. 「全文コピー」または「ファイル保存」で結果を保存

**利用回数制限:**
- 通常モード: 10回/24時間
- 関係者モード: 30回/24時間
- MyAPIモード（自分のOpenAI APIキー）: 無制限

## API エンドポイント

### GET /proxy
指定URLのHTMLを取得

```bash
curl "http://localhost:3333/proxy?url=https://example.com"
```

### POST /extract-jsonld
URLからJSON-LDを直接抽出

```bash
curl -X POST http://localhost:3333/extract-jsonld \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### POST /api/advisor
JobPosting分析（ストリーミング）

```bash
curl -X POST http://localhost:3333/api/advisor \
  -H "Content-Type: application/json" \
  -d '{"jobPosting": {...}, "mode": "employer"}'
```

### POST /api/blog-reviewer
ブログ記事分析（ストリーミング）

```bash
curl -X POST http://localhost:3333/api/blog-reviewer \
  -H "Content-Type: application/json" \
  -d '{"article": {...}, "html": "..."}'
```

### POST /api/web-advisor
汎用Web分析（ストリーミング）

```bash
curl -X POST http://localhost:3333/api/web-advisor \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "title": "...", "description": "...", "ogData": {...}, "twitterData": {...}, "headings": [...], "bodyText": "..."}'
```

### GET /health
ヘルスチェック

```bash
curl http://localhost:3333/health
```

## セキュリティに関する注意

### レート制限

AI機能の利用回数制限：
- **通常モード**: 10回/24時間（各AI機能ごと）
- **関係者モード**: 30回/24時間（各AI機能ごと）
- **MyAPIモード**: 無制限（自分のOpenAI APIキーを使用）

**注意**: 
- クライアント側（localStorage）とサーバー側（メモリベース）の両方で制限
- 各AI機能（求人票アドバイザー、ブログレビュー、Webアドバイザー）は独立してカウント
- Vercelサーバーレス環境では再起動時にメモリベースのカウントがリセットされます

### APIキー管理

- サーバーAPIキーは環境変数で保護
- ユーザーが自分のAPIキーを使用することも可能
- `.env`ファイルは`.gitignore`に含まれています

## 制限事項

### Vercel環境

- タイムアウト: 無料プラン10秒、Proプラン60秒
- localhost URLアクセスにはCORS設定が必要
- 同時接続数に制限あり

### 推奨

localhost URLをテストする場合はローカル環境で起動してください。

## トラブルシューティング

| 問題 | 解決方法 |
|------|--------|
| CORSエラー | サーバーが起動していることを確認、`/health`でチェック |
| localhostアクセス不可 | Vercelではなくローカル環境を使用、ポート番号を確認 |
| タイムアウト | 対象サイトのレスポンスが遅い、ネットワークを確認 |
| AI機能が動作しない | OpenAI APIキーを設定、環境変数を確認 |

## ドキュメント

- [Claude Code開発ガイド](./CLAUDE.md) - 開発環境の設定と使用方法

## 参考リンク

- [Schema.org](https://schema.org/)
- [JSON-LD仕様](https://json-ld.org/)
- [OpenAI API](https://platform.openai.com/)

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します。大きな変更の場合はissueで事前に相談してください。
