# JSON-LD Schema Viewer

WebサイトのJSON-LD構造化データを可視化・検証するツール

## 主な機能

- CORS制限を回避してあらゆるURLにアクセス可能
- localhostのサイトも検証可能
- テーブル形式とJSON形式の切り替え表示
- ワンクリックでJSONをコピー
- 画像URLはサムネイル付きで表示
- **AI求人票アドバイザー機能**: JobPostingスキーマ検出→採用側/応募者向け分析
- **Webアドバイザー（汎用）機能**: スキーマ無し/WebPageのみのページ向けSEO/EEAT/アクセシビリティ分析

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
├── server.js                    # Express プロキシサーバー
├── public/
│   ├── index.html               # Webアプリケーション
│   ├── web-advisor-demo.html    # Webアドバイザーデモ
│   ├── styles.css               # スタイルシート
│   ├── app.js                   # メインロジック
│   └── modules/                 # 機能モジュール
├── api/
│   ├── proxy.js                 # Vercel サーバーレス関数（プロキシ）
│   ├── advisor.js               # JobPosting AI分析エンドポイント
│   └── web-advisor.js           # Webアドバイザー（汎用）エンドポイント
├── vercel.json                  # Vercel設定
└── .env.example                 # 環境変数テンプレート
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
Webアドバイザー（汎用）- スキーマ無し/WebPageのみのページ向けAI分析（SSE）

```bash
# 基本的な使用
curl -N "http://localhost:3333/api/web-advisor?url=https://example.com"

# 独自のAPIキーを使用（レート制限スキップ）
curl -N "http://localhost:3333/api/web-advisor?url=https://example.com&userApiKey=sk-..."
```

**レスポンス形式**: Server-Sent Events (SSE)

**SSEイベントタイプ**:
- `init`: 初期化（分析開始）
- `progress`: 進捗状況（stage: fetching/parsing/analyzing）
- `meta`: 抽出されたメタ情報（title, description, OG, Twitter, headings, body）
- `token`: ストリーミングされるMarkdownトークン
- `done`: 完了
- `error`: エラー

**レート制限**: 10回/24時間/IP（userApiKeyを指定した場合はスキップ）

**分析内容**:
- SEO（タイトル、メタディスクリプション、見出し構造、構造化データ）
- EEAT（専門性、権威性、信頼性）
- アクセシビリティ（見出し構造、画像alt、コントラスト）
- 優先対応事項
- 総括

### GET /health
ヘルスチェック

```bash
curl http://localhost:3333/health
```

## Webアドバイザー（汎用）

スキーマが検出されないページ、またはWebPageスキーマのみのページに対して、AI駆動の包括的なアドバイスを提供します。

### 主な機能

- **SEO最適化提案**: タイトル、メタディスクリプション、見出し構造、構造化データの改善案
- **EEAT分析**: 専門性・権威性・信頼性の観点から評価とアドバイス
- **アクセシビリティ評価**: スクリーンリーダー対応、コントラスト、代替テキストの提案
- **優先対応事項**: 効果が高い施策を優先度順に提示
- **ストリーミング表示**: リアルタイムでアドバイスを表示

### 使い方

#### 1. デモページで試す

```bash
# サーバー起動
npm run dev

# ブラウザで開く
open http://localhost:3333/web-advisor-demo.html
```

デモページの機能：
- URL入力フィールド
- OpenAI APIキー入力（オプション）
- リアルタイムストリーミング表示
- コピー/保存/再実行機能

#### 2. プログラムから利用

```javascript
// EventSourceを使用したSSE接続
const url = encodeURIComponent('https://example.com');
const eventSource = new EventSource(`/api/web-advisor?url=${url}`);

eventSource.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'init':
      console.log('開始:', data.message);
      break;
    case 'progress':
      console.log('進捗:', data.stage, data.message);
      break;
    case 'meta':
      console.log('メタ情報:', data.data);
      break;
    case 'token':
      // Markdownトークンを画面に追加
      appendContent(data.content);
      break;
    case 'done':
      console.log('完了');
      eventSource.close();
      break;
    case 'error':
      console.error('エラー:', data.message);
      eventSource.close();
      break;
  }
});
```

#### 3. OpenAI APIキーを使用

環境変数で設定（サーバー側）:
```bash
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

またはクエリパラメータで指定（ユーザー側）:
```bash
curl -N "http://localhost:3333/api/web-advisor?url=https://example.com&userApiKey=sk-..."
```

**注意**: APIキーが設定されていない場合は、テンプレートベースのアドバイスが提供されます。

### レート制限

- **制限**: 10回/24時間/IP（メモリベース）
- **スキップ条件**: `userApiKey`パラメータを指定した場合
- **リセット**: 最初のリクエストから24時間後

レート制限を超えた場合:
```json
{
  "error": "レート制限に達しました",
  "remaining": 0,
  "resetTime": "2025-10-28T21:00:00.000Z",
  "retryAfter": 3600
}
```

### タイムアウト設定

- **接続タイムアウト**: 15秒
- **HTML取得タイムアウト**: 25秒
- **AI分析タイムアウト**: 120秒
- **Keepalive**: 15秒ごと

## セキュリティに関する注意

### レート制限

現在の制限：
- **通常モード（クライアント側）**: 10回/24時間（localStorage）
- **関係者モード**: 30回/24時間
- **開発者キー使用時**: 無制限
- **Webアドバイザー（サーバー側）**: 10回/24時間/IP（メモリベース、userApiKey使用時はスキップ）

**注意**: 
- JobPostingアドバイザー: クライアント側レート制限のみ
- Webアドバイザー: サーバー側レート制限（メモリベース）
- Vercel環境でサーバー再起動時にメモリがリセットされます
- 本番で永続的な制限が必要な場合はVercel KVまたはUpstash Redisの導入を推奨

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
