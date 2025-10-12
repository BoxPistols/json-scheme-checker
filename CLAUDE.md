# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## 重要なルール

- **絵文字の使用禁止**: すべてのファイル（コード、ドキュメント、コミットメッセージなど）で絵文字の使用を禁止します。テキストのみで表現してください。

## ドキュメント構造（Single Source of Truth）

このプロジェクトは、共有コアドキュメントを持つ**マルチAIドキュメント戦略**に従っています：

- **`.ai-docs/shared/`** - Single Source of Truth（まずこれらを読んでください！）
  - `PROJECT_OVERVIEW.md` - 完全なアーキテクチャ、技術スタック、技術詳細
  - `DEVELOPMENT_WORKFLOW.md` - コマンド、ワークフロー、トラブルシューティング
- **`.cursorrules`** - Cursor AIエディタ設定
- **`.github/copilot-instructions.md`** - GitHub Copilot設定
- **`CLAUDE.md`** - このファイル（Claude Codeクイックリファレンス）

**包括的な理解のため、常に最初に`.ai-docs/shared/PROJECT_OVERVIEW.md`を読んでください。**

## リポジトリ概要

これは、ウェブサイトから構造化データ（JSON-LD）を視覚化するJSON-LDスキーマビューアツールです。このプロジェクトは、以下を提供するNode.js/Expressアプリケーションです：

1. **CORSプロキシサーバー** - localhostサイトを含む任意のURLへアクセスするためのCORS制限バイパス
2. **Webベースビューア** - JSON-LDデータをテーブル形式とJSON形式の両方で視覚化

## プロジェクト構造

```bash
json-ld-viewer/
├── server.js              # プロキシエンドポイント付きExpressサーバー
├── package.json           # 依存関係：express、cors、axios
├── package-lock.json      # ロックファイル
├── vercel.json           # Vercelデプロイ設定
├── README.md             # 日本語ドキュメント
├── CLAUDE.md             # このファイル
└── public/
    └── index.html        # Webアプリケーション
```

## 一般的な開発コマンド

**セットアップ：**

```bash
pnpm install
```

**開発：**

```bash
pnpm dev      # nodemon起動（変更時自動リロード）
pnpm start    # 本番サーバー起動
```

サーバーはデフォルトで`http://localhost:3333`で起動します（`PORT`環境変数で設定可能）。

**テスト：**

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

**Vercelデプロイ：**

```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

## アーキテクチャ

### Node.jsプロキシサーバー（`server.js`）

**技術スタック：** Express.js、Axios、CORSミドルウェア

**APIエンドポイント：**

1. `GET /proxy?url={TARGET_URL}&username={USER}&password={PASS}` - 任意のURLからHTMLを取得、CORSバイパス
   - IPv6問題を避けるためlocalhostをIPv4（127.0.0.1）に変換
   - ボット検出を避けるためブラウザライクなヘッダーを追加
   - オプションの`username`と`password`クエリパラメータでBasic認証をサポート
   - 認証失敗時は明確なエラーメッセージと共に401を返す
   - 30秒タイムアウト、最大5リダイレクト

2. `POST /extract-jsonld` - URLからJSON-LDを直接抽出・パース
   - Body: `{ "url": "https://example.com" }`
   - Returns: `{ url, schemas[], count }`
   - 正規表現を使用してJSON-LDスクリプトタグを抽出

3. `GET /health` - ヘルスチェックエンドポイント
   - Returns: `{ status: "ok", timestamp }`

4. `GET /` - APIドキュメント付きランディングページ

**主要機能：**

- 全オリジンに対してCORS有効化
- パスワード保護サイト用Basic認証サポート
- 適切なステータスコードで接続エラー（ECONNREFUSED、ETIMEDOUT）を処理
- `public/`ディレクトリから静的フロントエンドを配信
- localhost URL正規化（localhost → 127.0.0.1）
- モバイルデバイスからのLANアクセス用に`0.0.0.0`でリッスン

### フロントエンドアーキテクチャ（両ビューア）

**コア関数：**

- `fetchAndDisplay()` - メインオーケストレーション関数
- `extractJsonLd(html)` - DOMParserを使用してHTMLを解析し、JSON-LDスクリプトを検出
- `displaySchemas(schemas, url)` - 統計情報付きスキーマカードをレンダリング
- `createTableView(obj, depth)` - ネストされたオブジェクト用の再帰的テーブル生成
- `formatJson(obj, indent)` - シンタックスハイライト付きJSONフォーマッター
- `toggleView(schemaId, view)` - テーブル/JSONビュー間の切り替え

**表示モード：**

- **テーブルビュー：** プロパティ名、値、型列を持つ階層的テーブル
  - 配列は番号付きリスト項目としてレンダリング
  - ネストされたオブジェクトは展開/折りたたみ可能（デフォルトで展開）
  - URLはクリック可能なリンクとしてレンダリング
  - 説明フィールドにはHTML含有可能（サニタイズ済み）
- **JSONビュー：** 型別に色分けされたシンタックスハイライト（キー、文字列、数値、ブール値、null）

**データ処理：**

- ネストされたオブジェクトは可視性向上のためデフォルトで展開
- 各スキーマカードはクリップボード操作用に`data-raw`属性に生のJSONを保存
- コピー機能は2スペースインデントでJSONをフォーマット
- 画像URLを検出してサムネイル表示
- `@type`に基づいてSchema.orgとGoogleドキュメントリンクを自動生成

**認証機能**（`public/index.html:620-663`）：

- ユーザー名/パスワードフィールド付き折りたたみ可能なBasic認証セクション
- パスワード表示切替（目アイコン）
- "認証を記憶"チェックボックスでブラウザの`localStorage`に認証情報を保存
- ドメイン固有の認証ストレージ - ドメインごとに保存された認証情報を自動ロード
- すべての保存された認証情報を削除する認証クリアボタン
- プライバシー重視：認証情報はローカルのみに保存、サーバーへの送信やログ記録なし
- URLが以前認証されたドメインと一致する場合は認証情報を自動入力

## 開発ノート

### 環境検出（`public/index.html:695-712`）

フロントエンドは環境を自動検出し、それに応じてプロキシURLを設定します：

- **Vercel：** APIルート用の相対パスを使用（`/api/proxy`、`/api/health`）
- **Localhost：** `http://localhost:3333`を使用
- **LAN/モバイル：** `http://{IP_ADDRESS}:3333`を使用

### 主要な実装詳細

- アプリケーション（`public/index.html` + `server.js`）は、特に開発中のlocalhost URLを含む任意のURLへの信頼性の高いアクセスを提供
- localhostサイトをテストする際、プロキシはIPv6解決問題を防ぐため自動的に`localhost`を`127.0.0.1`に変換（`server.js:30-35`）
- Vercelデプロイ設定（`vercel.json`）でサーバーレス関数のタイムアウトを30秒に設定
- フロントエンドは、プロキシサーバーからHTMLを受信後、DOMParserを使用してクライアントサイドでJSON-LDを抽出
- サーバーは、同じWiFiネットワーク上のモバイルデバイスからのアクセスを許可するため`0.0.0.0`でリッスン
- ネットワークIPアドレスが検出され、モバイルテストを容易にするため起動ログに表示

### Vercelデプロイ

Vercelにデプロイした場合：

- APIエンドポイントは直接サーバーエンドポイントではなく`/api/*`ルート経由でアクセス
- `localhost` URLへのアクセス不可（ローカル開発でのみ動作）
- 関数タイムアウトは30秒（`vercel.json`で設定可能）

### モバイルデバイスでのテスト

1. ローカルでサーバーを起動：`npm start`
2. サーバーは`http://localhost:3333`とLAN IP（例：`http://192.168.1.100:3333`）の両方を表示
3. 同じWiFiネットワーク上のモバイルデバイスからLAN IPにアクセス
4. ファイアウォールでポート3333の許可が必要な場合あり
