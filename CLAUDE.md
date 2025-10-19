# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要なルール

- **日本語を強制**: すべての応答、コメント、ドキュメント、説明、コミットメッセージは日本語で記述してください。
- **絵文字の使用禁止**: ファイル内のすべての場所（コード、ドキュメント、コミットメッセージ）で絵文字を使用しないでください。

## プロジェクト概要

WebサイトのJSON-LD構造化データを抽出・可視化するツール。CORS制限を回避し、localhost開発環境も含むあらゆるURLにアクセス可能。

- **本番URL**: https://json-ld-view.vercel.app/
- **技術スタック**: Node.js + Express.js + Vanilla JavaScript
- **デプロイメント**: Vercel（サーバーレス関数）+ ローカル開発（Express サーバー）

## 重要なドキュメント

すべての包括的な情報は`.ai-docs/shared/`に保存されています：

- `.ai-docs/shared/PROJECT_OVERVIEW.md` - 完全なアーキテクチャ、技術スタック、技術詳細
- `.ai-docs/shared/DEVELOPMENT_WORKFLOW.md` - コマンド、ワークフロー、トラブルシューティング

その他：
- `.cursorrules` - Cursor AI設定
- `.github/copilot-instructions.md` - GitHub Copilot設定

## よく使うコマンド

### セットアップ・起動

```bash
pnpm install             # 依存関係をインストール
pnpm dev                 # 開発サーバー起動（nodemon自動再起動）
pnpm start               # 本番モード起動
pnpm lint                # ESLint実行
pnpm lint:fix            # ESLint自動修正
pnpm format              # Prettier整形
```

### テスト・確認

```bash
# ヘルスチェック
curl http://localhost:3333/health

# プロキシエンドポイントテスト
curl "http://localhost:3333/proxy?url=https://example.com"

# JSON-LD抽出テスト
curl -X POST http://localhost:3333/extract-jsonld \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### ポート管理

```bash
# ポート3333を使用中のプロセス確認
lsof -i :3333

# プロセスをkill
kill $(lsof -t -i:3333)
```

### Vercelデプロイ

```bash
vercel              # プレビューデプロイ
vercel --prod       # 本番デプロイ
vercel logs         # ログ確認
```

## プロジェクト構造

```plaintext
json-ld-viewer/
├── server.js                 # ローカル開発用Expressサーバー
├── public/
│   ├── index.html           # Webアプリケーション（フロントエンド）
│   ├── styles.css           # スタイルシート
│   └── modules/             # フロントエンド用モジュール
├── api/                      # Vercelサーバーレス関数
│   ├── proxy.js
│   └── health.js
├── package.json             # 依存関係・スクリプト
├── vercel.json              # Vercelデプロイ設定
├── .eslintrc.json           # ESLint設定
├── .prettierrc.json         # Prettier設定
├── .cursorrules             # Cursor AI設定
└── .ai-docs/                # AI開発者向けドキュメント
```

## アーキテクチャの重要ポイント

### CORS回避の仕組み

ブラウザ側でのCORSエラーを回避するため、自社サーバーを経由：

```text
ブラウザ → 自社プロキシサーバー → 対象サイト
```

### 環境判定（フロントエンド）

```javascript
const isVercel = window.location.hostname.includes('vercel.app');
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
```

- **Vercel環境**: `/api/proxy` を使用
- **ローカル環境**: `http://localhost:3333/proxy` を使用
- **LAN/モバイル**: `http://{IP_ADDRESS}:3333/proxy` を使用

### 主要な実装詳細

- **IPv6問題の回避**: localhost は自動的に 127.0.0.1 に変換（`server.js:30-35`）
- **タイムアウト設定**: 30秒（ローカル・Vercel共通）
- **ブラウザ風ヘッダー**: Bot検出回避のため実際のブラウザを模倣
- **LAN対応**: `0.0.0.0` でリッスンしてモバイルデバイスからのアクセスを許可
- **認証機能**: Basic認証をサポート、ローカルストレージにドメイン別保存

## コードスタイル・規約

### JavaScript

- ES6+ の機能を使用（const/let、アロー関数、テンプレートリテラル）
- 説明的な変数名を使用
- 複雑な関数には JSDoc コメントを追加

### HTML/CSS

- セマンティックなHTML5タグを使用
- モバイルファーストのレスポンシブデザイン
- インラインスタイルまたは `public/styles.css` に記述

### アイコン

- **絵文字は使用禁止** - インラインSVG推奨（`fill`/`stroke`は `currentColor` 使用）
- 装飾的なSVGは `aria-hidden="true"` を付与
- 機能ボタンは `aria-label` または `title` を付与

### エラーハンドリング

```javascript
try {
  // リスク含む処理
} catch (error) {
  console.error('Context:', error);
  showError(`ユーザー向けメッセージ: ${error.message}`);
}
```

## 開発時の注意点

### server.js 修正時

```bash
pnpm dev         # nodemonで自動再起動
# または Ctrl+C → pnpm start で手動再起動
```

### public/index.html 修正時

```bash
# 静的ファイルなので再起動不要、ブラウザをリロード
```

### api/*.js 修正時（Vercel関数）

```bash
vercel dev       # ローカルテスト推奨
# または git push で本番デプロイして確認
```

## テスト・デプロイ前チェックリスト

### 新機能追加時

- [ ] ローカル環境でテスト (`pnpm dev`)
- [ ] Vercel環境でテスト (`vercel dev` または本番デプロイ)
- [ ] エラーハンドリング追加
- [ ] コンソールログで動作確認
- [ ] README.md 更新（必要に応じて）

### デプロイ前

- [ ] `pnpm start` でローカル起動確認
- [ ] サンプルURLでJSON-LD抽出成功
- [ ] Basic認証が動作確認
- [ ] モバイル表示確認（レスポンシブ）
- [ ] コンソールエラーがない
- [ ] `vercel.json` が正しい
- [ ] すべてのAPIルートにCORSヘッダーがある

## 認証機能の取り扱い

- パスワードを平文でログに記録しない（ログでは `password ? '***' : '(none)'` 使用）
- ローカルストレージのみに保存（サーバーサイドには保存しない）
- ユーザーの明示的なアクションで削除
- localStorageキー: `jsonld_basic_auth`、`jsonld_auth_{domain}`

## Git ワークフロー

### ブランチ戦略

- **main**: 本番環境（Vercel自動デプロイ）
- 機能開発は直接または feature ブランチ

### コミットメッセージ（日本語）

```bash
# 機能追加
git commit -m "機能: Basic認証のパスワード表示トグルを追加"

# バグ修正
git commit -m "修正: Vercelサーバーレス関数設定を修正"

# ドキュメント
git commit -m "ドキュメント: モバイルアクセス手順を更新"
```

## トラブルシューティング

### ポート3333が使用中

```bash
lsof -i :3333
kill $(lsof -t -i:3333)
```

### CORS エラー

- プロキシサーバーが起動していることを確認
- `/health` エンドポイントでステータス確認
- ブラウザのコンソールでエラー詳細を確認

### Basic認証が通らない

```bash
pnpm dev
# → サーバーログを確認
# → "Using Basic Authentication for user: xxx" を確認
# → "Response status: 401" なら認証情報が誤り
```

### localhost にアクセスできない

- Vercelではなく、ローカル環境で起動していることを確認
- ポート番号が正しいか確認
- 対象のlocalhostサーバーが起動しているか確認
