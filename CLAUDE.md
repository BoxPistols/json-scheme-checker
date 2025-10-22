# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 重要なルール

- **日本語を強制**: すべての応答、コメント、ドキュメント、説明、コミットメッセージは日本語で記述してください。
- **絵文字の使用禁止**: ファイル内のすべての場所（コード、ドキュメント、コミットメッセージ）で絵文字を使用しないでください。

## プロジェクト概要

WebサイトのJSON-LD構造化データを抽出・可視化するツール。CORS制限を回避し、localhost開発環境も含むあらゆるURLにアクセス可能。

- **本番URL**: <https://json-ld-view.vercel.app/>
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
└── .ai-docs/                # AIMyAPI向けドキュメント
```

## アーキテクチャの重要ポイント

### ステートレス設計とCORS回避

このアプリケーションは、サーバー側でセッション情報やユーザーデータを保持しない**ステートレス設計**を採用しています。すべてのリクエストは自己完結しており、スケーラビリティとシンプルさを実現しています。

ブラウザの同一オリジンポリシーによるCORSエラーを回避するため、ユーザーのブラウザは直接ターゲットのWebサイトにアクセスするのではなく、一度アプリケーションのバックエンド（プロキシサーバー）を経由します。

```text
ユーザーのブラウザ → アプリケーションのプロキシサーバー → ターゲットのWebサイト
```

このプロキシサーバーが、ユーザーに代わってターゲットのWebサイトからHTMLコンテンツを取得します。

### 環境判定（フロントエンド）

プロキシサーバーのエンドポイントURLを解決するため、フロントエンドは実行されている環境を判定します。このロジックは `public/index.html` 内の `<script>` タグに記述されています。

```javascript
const isVercel = window.location.hostname.includes('vercel.app');
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
```

- **Vercel環境**: `/api/proxy` （サーバーレス関数）を利用
- **ローカル環境**: `http://localhost:3333/proxy` （ローカルExpressサーバー）を利用
- **LAN/モバイル**: `http://{ローカルIP}:3333/proxy` を利用

### 主要な実装詳細

- **IPv6問題の回避**: プロキシサーバー (`server.js` と `api/proxy.js`) は、`localhost` へのリクエストを `127.0.0.1` に明示的に変換します。これにより、IPv6環境で発生しうる接続の問題を防ぎます。
- **タイムアウト設定**: 30秒に設定されていますが、Vercelの実行時間制限に注意が必要です。Hobby（無料）プランでは10秒、Proプランではデフォルト60秒です。
- **ブラウザ風ヘッダー**: Bot検出を回避するため、プロキシリクエストには一般的なブラウザのUser-Agentなどのヘッダーを付与しています。
- **LAN対応**: ローカル開発サーバーは `0.0.0.0` でリッスンしており、同一ネットワーク内のモバイルデバイスなどからIPアドレスでアクセスできます。
- **認証機能**: Basic認証をサポートしており、認証情報はドメインごとにローカルストレージに保存されます。

### セキュリティに関する考慮事項

- **CORS設定**: 現在、プロキシサーバーのCORS設定は `Access-Control-Allow-Origin: *` となっており、すべてのオリジンからのリクエストを許可しています。これは開発やテストには便利ですが、本番環境ではセキュリティリスクとなり得ます。悪意のあるWebサイトがこのプロキシを不正利用することを防ぐため、本番環境では以下の対策を検討することが推奨されます。
  - **ドメインホワイトリスト**: 許可するオリジンを特定のドメインに限定する。
  - **レート制限**: 同一IPからのリクエスト数を制限する。
- **認証情報**: Basic認証のパスワードはサーバーログに平文で記録されないように配慮されています。認証情報はサーバー側には一切保存されず、クライアントのローカルストレージにのみ保存されます。

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

### api/\*.js 修正時（Vercel関数）

```bash
vercel dev       # ローカルテスト推奨
# または git push で本番デプロイして確認
```

### テスト

本プロジェクトには現在、自動テストは導入されていません。機能の検証は手動テストに依存します。

#### 手動テストの手順

1. **ローカルサーバーの起動**:

    ```bash
    pnpm dev
    ```

2. **ヘルスチェック**: サーバーが正常に起動していることを確認します。

    ```bash
    curl http://localhost:3333/health
    # {"status":"ok",...} が返ってくることを確認
    ```

3. **プロキシ機能のテスト**:
    - **外部サイト**:

      ```bash
      curl "http://localhost:3333/proxy?url=https://example.com"
      ```

    - **ローカルで起動している別のサイト**:

      ```bash
      # 例: ポート8000で別のサーバーが動いている場合
      curl "http://localhost:3333/proxy?url=http://localhost:8000"
      ```

4. **ブラウザでの動作確認**:
    - `http://localhost:3333` にアクセスします。
    - 様々なURL（Basic認証が必要なサイトも含む）を入力し、JSON-LDが正しく抽出・表示されることを確認します。
    - ブラウザのMyAPIツールでコンソールエラーが発生していないか確認します。

#### 将来的な展望

プロジェクトの安定性を高めるため、将来的には以下のような自動テストの導入が考えられます。

- **Jest** や **Vitest** を用いた単体テスト・結合テスト
- プロキシサーバーのエンドポイントに対するAPIテスト

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
