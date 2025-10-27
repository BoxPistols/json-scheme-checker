# JSON-LD Schema Viewer

WebサイトのJSON-LD構造化データを可視化・検証するツール

## 主な機能

- CORS制限を回避してあらゆるURLにアクセス可能
- localhostのサイトも検証可能
- テーブル形式とJSON形式の切り替え表示
- ワンクリックでJSONをコピー
- 画像URLはサムネイル付きで表示
- **AI求人票アドバイザー機能**: JobPostingスキーマ検出→採用側/応募者向け分析

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
├── api/
│   ├── proxy.js        # Vercel サーバーレス関数
│   └── advisor.js      # AI分析エンドポイント
├── vercel.json         # Vercel設定
└── .env.example        # 環境変数テンプレート
```

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

### GET /api/web-advisor
Webサイト分析（SSE ストリーミング）

```bash
# 基本的な使い方
curl "http://localhost:3333/api/web-advisor?url=https://example.com"

# 自分のAPIキーを使用（レート制限なし）
curl "http://localhost:3333/api/web-advisor?url=https://example.com&userApiKey=sk-..."
```

**イベントタイプ**:
- `init`: 分析開始
- `progress`: 進捗状況（fetching/parsing/analyzing）
- `meta`: メタデータ送信
- `token`: AIレスポンスのトークン（リアルタイム）
- `done`: 分析完了
- `error`: エラー発生

**デモUI**: `/web-advisor-demo.html`

### GET /health
ヘルスチェック

```bash
curl http://localhost:3333/health
```

## セキュリティに関する注意

### レート制限

現在の制限：
- **Web Advisor API**: 10回/24時間（IP単位、メモリベース）
  - 自分のAPIキー使用時: 無制限
- **通常モード**: 10回/24時間（クライアント側、localStorage）
- **関係者モード**: 30回/24時間
- **開発者キー使用時**: 無制限

**注意**: Vercelサーバーレス環境ではメモリベースのレート制限はリクエストごとにリセットされる可能性があります。本番利用時はVercel KVまたはUpstash Redisの導入を推奨します。

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
