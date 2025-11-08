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
│   ├── modules/             # フロントエンド用モジュール
│   │   ├── advisor.js       # JobPosting Advisor
│   │   ├── blog-reviewer.js # Blog Reviewer
│   │   ├── web-advisor.js   # Web Advisor
│   │   ├── content-upload-reviewer.js # Content Upload Reviewer
│   │   └── base-advisor.js  # 共通基底クラス
│   └── utils/               # ユーティリティ
│       └── file-parser.js   # ファイルパース機能
├── api/                      # Vercelサーバーレス関数
│   ├── proxy.js
│   ├── health.js
│   ├── advisor.js           # JobPosting Advisor API
│   ├── blog-reviewer.js     # Blog Reviewer API
│   ├── web-advisor.js       # Web Advisor API
│   └── content-upload-reviewer.js # Content Upload Reviewer API
├── package.json             # 依存関係・スクリプト
├── vercel.json              # Vercelデプロイ設定
├── .eslintrc.json           # ESLint設定
├── .prettierrc.json         # Prettier設定
├── .cursorrules             # Cursor AI設定
└── .ai-docs/                # AIMyAPI向けドキュメント
```

## AI Advisor機能

このプロジェクトには、複数のAI分析機能が統合されています。すべての機能は`BaseAdvisorManager`を継承し、共通のインターフェースと機能を共有しています。

### 利用可能なAdvisor機能

#### 1. JobPosting Advisor

求人票の分析と最適化を行います。

- **対象**: JobPostingスキーマが検出されたページ
- **機能**:
  - 採用側視点での改善提案
  - 応募者視点での評価
  - エージェント視点での技術要件分析
  - 構造化データの最適化
- **実装**: `public/modules/advisor.js`, `api/advisor.js`

#### 2. Blog Reviewer

ブログ記事のSEO最適化とコンテンツ評価を行います。

- **対象**: Article/BlogPostingスキーマが検出されたページ
- **機能**:
  - SEO観点での分析
  - EEAT評価
  - 読者エンゲージメント分析
  - コンテンツの質と深度評価
- **実装**: `public/modules/blog-reviewer.js`, `api/blog-reviewer.js`

#### 3. Web Advisor

汎用Webページの包括的分析を行います。

- **対象**: スキーマなし、またはWebPageのみのページ
- **機能**:
  - SEO最適化提案
  - EEAT評価
  - アクセシビリティ評価
  - 優先対応事項の提示
- **実装**: `public/modules/web-advisor.js`, `api/web-advisor.js`

#### 4. Content Upload Reviewer（新機能）

ファイルやテキストをアップロードして、AIによるレビュー・校閲・マッチング分析を行います。

- **対象**: ユーザーがアップロードしたコンテンツ
- **機能**:
  - **ブログコンテンツレビュー**: 草案ベースの記事テキストの分析、過不足やコンテンツ評価、発展的な内容の提示
  - **求人票レビュー**: 求人票の最適化提案
  - **スキルシートレビュー**: エンジニアのスキルシートの分析と改善提案
  - **求人×スキルシートマッチング**: 求人票とスキルシートのマッチング度評価、ギャップ分析、キャリアアップ提案
  - **汎用テキストレビュー**: あらゆるテキストの校閲と改善提案
- **対応ファイル形式**: PDF, CSV, Excel, Markdown, JSON, TXT、またはテキスト直接入力
- **特徴**:
  - Diff形式での表示（左：元の内容、右：校閲済みの内容）
  - 校閲済みテキストのコピー・ダウンロード機能
  - リアルタイムストリーミング表示
- **実装**: `public/modules/content-upload-reviewer.js`, `api/content-upload-reviewer.js`, `public/utils/file-parser.js`

### 共通機能（BaseAdvisorManager）

すべてのAdvisor機能は`BaseAdvisorManager`を継承し、以下の共通機能を持ちます：

- **レート制限管理**: 無料ユーザーは50回/24時間まで利用可能（各Advisor独立）
- **APIキー管理**: ユーザー独自のOpenAI APIキーを設定可能
- **マークダウンレンダリング**: AI応答をMarkdown形式で表示
- **エクスポート機能**: CSV/HTMLでの分析結果エクスポート
- **使用量トラッキング**: API使用量の表示とトラッキング
- **モデル選択**: GPT-5-nano、GPT-4.1-nano等の選択が可能

### Content Upload Reviewer の使い方

1. **アップロードボタンをクリック**: ヘッダーの「Upload」ボタンをクリック
2. **レビュー種類を選択**: ブログ、求人票、スキルシート、マッチング、汎用から選択
3. **コンテンツ入力**:
   - テキスト入力: テキストエリアに直接貼り付け
   - ファイルアップロード: ドラッグ&ドロップまたはファイル選択
4. **レビュー開始**: 「レビュー開始」ボタンをクリック
5. **結果確認**: Diff形式で元の内容と校閲済みの内容を比較
6. **エクスポート**: 必要に応じて校閲済みテキストをコピーまたはダウンロード

### マッチング機能の使い方

求人票とスキルシートのマッチング分析を行う場合：

1. レビュー種類で「求人×スキルシートマッチング」を選択
2. 求人票を入力（URLまたはテキスト）
3. スキルシートをテキストまたはファイルでアップロード
4. レビュー開始
5. マッチング度スコア、ギャップ分析、キャリアアップ提案を確認

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

### 共通コンポーネント化の原則（必読）

このプロジェクトでは複数の AI 分析ページ（JobPosting Advisor、Blog Reviewer、Web Advisor）があります。**DRY（Don't Repeat Yourself）原則に従い、共通機能は必ず再利用可能な形に抽象化してください。**

#### 共通コンポーネント化すべき機能

1. **マークダウン変換**
   - 各Advisorで `renderMarkdown()` を実装するのではなく、`BaseAdvisorManager.renderMarkdownCommon()` を使用
   - 理由：マークダウン仕様は全Advisorで共通。重複実装は保守性を低下させる

2. **エクスポート機能（CSV/HTML）**
   - `BaseAdvisorManager.showExportButtonsCommon()` でUI生成
   - `BaseAdvisorManager.downloadFile()` でファイル保存
   - 各Advisor固有の処理（CSVデータ生成など）のみ個別実装

3. **API使用量表示**
   - すべてのAdvisorで `renderApiUsagePanel()` を共有（既に実装済み）
   - ストリーミング完了時に同じUI形式で表示

4. **アコーディオン機能**
   - 開閉ロジックは `BaseAdvisorManager.toggleAccordionCommon()` で統一
   - 各Advisorで呼び出すのみ

5. **ユーティリティ関数**
   - `escapeCsvValue()` - CSV値エスケープ
   - `cleanHtmlText()` - HTML除去
   - `escapeHtml()` - HTML特殊文字エスケープ
   - これらは全Advisorで使用可能

#### 実装パターン（アンチパターン vs 正しいパターン）

**アンチパターン：**

```javascript
// Advisor.js
renderMarkdown(markdown) { ... } // 実装A

// BlogReviewer.js
renderMarkdown(markdown) { ... } // 実装Bで若干異なる

// WebAdvisor.js
renderMarkdown(markdown) { ... } // 実装Cで別のバリエーション
```

**正しいパターン：**

```javascript
// base-advisor.js
renderMarkdownCommon(markdown) { ... } // 共通実装（統一）

// 各Advisor.js
md.innerHTML = this.renderMarkdownCommon(fullText);
```

#### 新機能追加時のチェックリスト

新しいAI分析機能を追加する際は、以下を確認してください：

- [ ] **既存の共通メソッドがないか確認** - 他のAdvisorで同じ機能が実装されていないか
- [ ] **BaseAdvisorManagerで共通化可能か確認** - 機能が複数のAdvisorで再利用可能なら共通化
- [ ] **命名規則に統一性があるか確認** - メソッド名が一貫しているか（例：`renderMarkdownCommon`, `showExportButtonsCommon`）
- [ ] **ドキュメント を更新** - CLAUDE.mdの本セクションを更新
- [ ] **Linterで検証** - `pnpm lint` でコード品質を確認

#### 共通メソッドリスト（Base Advisor Manager）

以下のメソッドは全Advisorで利用可能です：

| メソッド                                              | 目的                     | 使用例                                                                    |
| ----------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------- |
| `renderMarkdownCommon(markdown)`                      | マークダウン → HTML 変換 | `md.innerHTML = this.renderMarkdownCommon(text)`                          |
| `toggleAccordionCommon(contentId)`                    | アコーディオン開閉       | `this.toggleAccordionCommon('advisorReviewContent')`                      |
| `showExportButtonsCommon(containerId, onCsv, onHtml)` | エクスポート UI 生成     | `this.showExportButtonsCommon('exportButtons', () => {...}, () => {...})` |
| `downloadFile(blob, filename)`                        | ファイルダウンロード     | `this.downloadFile(blob, 'result.csv')`                                   |
| `escapeCsvValue(value)`                               | CSV値エスケープ          | `csvLine += this.escapeCsvValue(text)`                                    |
| `cleanHtmlText(text)`                                 | HTML除去                 | `plainText = this.cleanHtmlText(htmlContent.innerText)`                   |
| `escapeHtml(text)`                                    | HTML特殊文字エスケープ   | `safe = this.escapeHtml(userInput)`                                       |
| `renderApiUsagePanel(usage, model)`                   | API使用量パネル生成      | `container.innerHTML = this.renderApiUsagePanel(usage, model)`            |

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

## Claude Code Skills

このプロジェクトでは、開発効率を向上させるためのカスタムスキルを提供しています。

### 利用可能なスキル

#### api-check

API仕様の一貫性と品質を包括的にチェックします。

```
api-check
```

**チェック内容**:

- エンドポイント構造の確認
- CORS設定の一貫性
- エラーハンドリングの適切性
- 入力検証の実装状況
- レート制限の設定
- レスポンス形式の統一性

**実行タイミング**:

- 新しいAPIエンドポイントを追加した後
- 既存APIの大規模な変更を行った後
- 定期的な品質チェック

#### deploy-check

Vercelへのデプロイ前に必要な全ての確認を実行します。

```
deploy-check
```

**チェック内容**:

- 環境設定の確認
- 依存関係の確認
- ビルドとテストの実行
- Vercel設定の妥当性
- セキュリティチェック
- ドキュメントの更新確認
- パフォーマンスチェック

**実行タイミング**:

- 本番環境へのデプロイ前（必須）
- プルリクエストのマージ前
- 重要な機能追加後

#### code-review

最近のコード変更に対して包括的なレビューを実行します。

```
code-review
```

**レビュー観点**:

- コード品質（命名規則、可読性、DRY原則）
- エラーハンドリング
- セキュリティ（XSS対策、入力検証）
- パフォーマンス
- テスタビリティ
- ベストプラクティスの遵守
- ドキュメントの適切性

**実行タイミング**:

- プルリクエストを作成した後
- 大きな機能を実装した後
- コードレビューの準備として

### 詳細ドキュメント

スキルの詳細な使用方法、カスタマイズ方法、新しいスキルの作成方法については以下を参照してください：

- [Claude Code Skills ガイド](./.ai-docs/shared/09_CLAUDE_CODE_SKILLS.md)

## MCP (Model Context Protocol)

このプロジェクトでは、Context7とMUI MCPサーバーが利用可能です。これらを活用することで、最新のライブラリドキュメントにすぐアクセスできます。

### よく使うライブラリ

#### Express.js

```
Context7で/expressjs/expressのミドルウェア実装方法を取得
```

#### OpenAI API

```
Context7で/openai/openai-nodeのストリーミング実装を取得
```

#### Axios

```
Context7で/axios/axiosのタイムアウト設定方法を取得
```

#### Vercel

```
Context7で/vercel/vercelのサーバーレス関数の制約を取得
```

### 効果的な使い方

**新機能実装前**:

```
Context7で[ライブラリ名]の[機能名]の実装方法を取得
```

**エラー解決時**:

```
Context7で[ライブラリ名]の[エラー名]の対処法を取得
```

**パフォーマンス改善時**:

```
Context7で[ライブラリ名]のパフォーマンス最適化方法を取得
```

### 詳細ドキュメント

MCPサーバーの詳細な使用方法、ベストプラクティス、トラブルシューティングについては以下を参照してください：

- [MCP使用ガイド](./.ai-docs/shared/10_MCP_USAGE_GUIDE.md)

## 推奨開発ワークフロー

### 1. 機能開発時

```
1. 要件を確認
2. Context7で関連ライブラリのドキュメントを取得
3. 実装
4. code-reviewスキルで品質確認
5. コミット
```

### 2. デプロイ前

```
1. deploy-checkスキルで全体確認
2. 問題があれば修正
3. 再度deploy-checkで確認
4. デプロイ実行
```

### 3. API変更時

```
1. APIを変更
2. api-checkスキルで一貫性確認
3. 問題があれば修正
4. ドキュメントを更新
5. コミット
```

---

最終更新: 2025-11-02
