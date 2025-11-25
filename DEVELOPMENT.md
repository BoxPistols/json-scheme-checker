# 開発者向け運用マニュアル

このドキュメントは、JSON-LD Schema Viewerの開発・運用を担当する開発者向けのマニュアルです。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [日常的な開発タスク](#日常的な開発タスク)
- [新機能追加のワークフロー](#新機能追加のワークフロー)
- [コード品質管理](#コード品質管理)
- [デプロイメント](#デプロイメント)
- [トラブルシューティング](#トラブルシューティング)
- [リリースプロセス](#リリースプロセス)
- [緊急時の対応](#緊急時の対応)
- [監視とメンテナンス](#監視とメンテナンス)

## 開発環境のセットアップ

### 必須ツール

以下のツールがインストールされていることを確認してください：

- **Node.js**: v18以上（推奨: v20 LTS）
- **pnpm**: v8以上
- **Git**: 最新版
- **Vercel CLI**: グローバルインストール推奨

```bash
# Node.jsバージョン確認
node --version

# pnpmのインストール（未インストールの場合）
npm install -g pnpm

# Vercel CLIのインストール
npm install -g vercel
```

### 初期セットアップ

```bash
# リポジトリのクローン
git clone <repository-url>
cd json-scheme-checker

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してOpenAI APIキーを設定
```

### 環境変数の設定

`.env`ファイルに以下を設定：

```bash
# OpenAI API設定（AI機能を使用する場合）
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-5-nano

# サーバー設定（オプション）
PORT=3333
```

### ローカルサーバーの起動

```bash
# 開発サーバー起動（nodemon自動再起動）
pnpm dev

# 本番モード起動
pnpm start

# Vercelローカル環境でテスト
vercel dev
```

### 動作確認

```bash
# ヘルスチェック
curl http://localhost:3333/health

# プロキシ機能テスト
curl "http://localhost:3333/proxy?url=https://example.com"

# ブラウザで開く
open http://localhost:3333
```

## 日常的な開発タスク

### コード編集のワークフロー

```bash
# 1. 最新のmainブランチを取得
git checkout main
git pull origin main

# 2. 新しいブランチを作成（機能追加の場合）
git checkout -b feature/new-feature-name

# 3. 開発サーバーを起動
pnpm dev

# 4. コードを編集
# - public/index.html: フロントエンドHTML
# - public/styles.css: スタイルシート
# - public/modules/*.js: フロントエンド機能モジュール
# - server.js: ローカル開発サーバー
# - api/*.js: Vercelサーバーレス関数

# 5. コード品質チェック
pnpm validate

# 6. 変更をコミット
git add .
git commit -m "機能: 新機能の説明"

# 7. プッシュ
git push origin feature/new-feature-name
```

### よく使うコマンド

```bash
# コード品質チェック（すべて）
pnpm validate

# ESLintチェック
pnpm lint

# ESLint自動修正
pnpm lint:fix

# Prettier整形
pnpm format

# Stylelintチェック
pnpm lint:css

# Stylelint自動修正
pnpm lint:css:fix

# CSS整合性チェック
pnpm check-css

# 未使用CSS削除（本番用）
pnpm purge-css
```

## 新機能追加のワークフロー

### 1. 計画フェーズ

新機能を追加する前に、以下を確認：

- 機能の目的と要件を明確化
- 既存機能への影響を評価
- 技術的な実装方法を決定
- 必要なAPIエンドポイントを設計

### 2. 実装フェーズ

#### フロントエンド機能の追加

```bash
# 新しいモジュールファイルを作成
touch public/modules/new-feature.js

# BaseAdvisorManagerを継承する場合
# public/modules/base-advisor.js を参考に実装
```

**重要なポイント**：

- DRY原則を守り、既存の共通機能を再利用
- `BaseAdvisorManager`を継承して共通メソッドを活用
- マークダウンレンダリングは`renderMarkdownCommon()`を使用
- エクスポート機能は`showExportButtonsCommon()`を使用

#### バックエンド機能の追加

```bash
# 新しいAPIエンドポイントを作成
touch api/new-feature.js
```

**APIエンドポイントのテンプレート**：

```javascript
export default async function handler(req, res) {
  // CORSヘッダーの設定（必須）
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // 実装内容
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

#### ローカルサーバー側の追加

`server.js`にエンドポイントを追加する場合：

```javascript
app.post('/api/new-feature', async (req, res) => {
  // 実装内容
});
```

### 3. テストフェーズ

```bash
# ローカル環境でテスト
pnpm dev

# Vercel環境でテスト（サーバーレス関数のテスト）
vercel dev

# 手動テスト
curl -X POST http://localhost:3333/api/new-feature \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

**テストチェックリスト**：

- [ ] 正常系の動作確認
- [ ] エラーハンドリングの確認
- [ ] CORS設定の確認
- [ ] レスポンス形式の確認
- [ ] ブラウザコンソールにエラーがないか確認
- [ ] モバイル表示の確認

### 4. コード品質チェック

```bash
# すべてのチェックを実行
pnpm validate

# Claude Code Skillを使用（推奨）
# code-review スキルで包括的なレビュー
# api-check スキルでAPI品質チェック
```

### 5. ドキュメント更新

新機能を追加したら、以下のドキュメントを更新：

- [ ] README.md - ユーザー向けの使い方を追加
- [ ] CLAUDE.md - 開発者向けの技術情報を更新
- [ ] このDEVELOPMENT.md - 運用手順を更新（必要に応じて）

## コード品質管理

### CSS品質管理

このプロジェクトでは、3つのツールでCSS品質を管理しています。

#### 1. カスタムCSS整合性チェック

```bash
pnpm check-css
```

**チェック内容**：

- HTMLで使用されているがCSSで未定義のクラス
- CSSで定義されているがHTMLで未使用のセレクタ

**実行タイミング**：

- 新しいコンポーネントを追加した後
- CSSファイルを大規模に変更した後
- コミット前

#### 2. Stylelint

```bash
pnpm lint:css       # チェックのみ
pnpm lint:css:fix   # 自動修正
```

**チェック内容**：

- クラス名の命名規則（kebab-case）
- セレクタの特異性
- プロパティの並び順
- 無効な構文

#### 3. PurgeCSS

```bash
pnpm purge-css
```

未使用のCSSを自動削除し、本番ビルドのファイルサイズを最小化します。

**注意**: 本番デプロイ前にのみ実行してください。セーフリストは`purgecss.config.js`で設定。

### ESLint

```bash
pnpm lint           # チェックのみ
pnpm lint:fix       # 自動修正
```

**チェック内容**：

- JavaScript構文エラー
- コーディング規約違反
- 潜在的なバグ

### Prettier

```bash
pnpm format
```

コードの自動整形を実行します。

### 品質管理のワークフロー

```bash
# 開発時
pnpm check-css      # CSS整合性確認

# コミット前
pnpm validate       # すべてのチェック実行

# 本番デプロイ前
pnpm purge-css      # 未使用CSS削除
pnpm validate       # 最終チェック
```

## デプロイメント

### Vercelへのデプロイ

#### 初回デプロイ

```bash
# Vercelにログイン
vercel login

# プロジェクトをリンク
vercel link

# 環境変数を設定
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL

# デプロイ
vercel --prod
```

#### 継続的デプロイ

```bash
# プレビューデプロイ（テスト用）
vercel

# 本番デプロイ
vercel --prod
```

#### Gitプッシュによる自動デプロイ

mainブランチにマージすると、Vercelが自動的にデプロイします。

```bash
# mainブランチにマージ
git checkout main
git merge feature/new-feature-name
git push origin main

# Vercelが自動的にデプロイを開始
```

### デプロイ前チェックリスト

```bash
# deploy-check スキルを使用（推奨）
# 包括的なチェックリストを実行
```

手動チェック項目：

- [ ] `pnpm validate` がすべて成功
- [ ] ローカル環境で動作確認済み
- [ ] `vercel dev` でVercel環境の動作確認済み
- [ ] 環境変数が正しく設定されている
- [ ] `vercel.json` の設定が正しい
- [ ] CORSヘッダーが全エンドポイントに設定されている
- [ ] ドキュメントが更新されている

### デプロイ後の確認

```bash
# デプロイされたサイトの確認
vercel inspect <deployment-url>

# ログの確認
vercel logs <deployment-url>

# ヘルスチェック
curl https://your-domain.vercel.app/health
```

**動作確認項目**：

- [ ] トップページが正常に表示される
- [ ] JSON-LD抽出機能が動作する
- [ ] AI機能が動作する（APIキーが設定されている場合）
- [ ] エラーがコンソールに出力されていない

## トラブルシューティング

### よくある問題と解決方法

#### ポート3333が使用中

```bash
# 使用中のプロセスを確認
lsof -i :3333

# プロセスを強制終了
kill $(lsof -t -i:3333)

# または別のポートを使用
PORT=3334 pnpm dev
```

#### CORSエラー

**原因**: CORSヘッダーが正しく設定されていない

**解決方法**:

1. APIエンドポイントにCORSヘッダーが設定されているか確認
2. `Access-Control-Allow-Origin: *` が含まれているか確認
3. OPTIONSリクエストが正しく処理されているか確認

```javascript
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Access-Control-Allow-Origin', '*');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
```

#### AI機能が動作しない

**原因1**: OpenAI APIキーが設定されていない

**解決方法**:

```bash
# 環境変数を確認
cat .env | grep OPENAI_API_KEY

# 設定されていない場合は追加
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# サーバーを再起動
```

**原因2**: APIキーの権限が不足している

**解決方法**: OpenAIダッシュボードでAPIキーの権限を確認

**原因3**: レート制限に達している

**解決方法**: ユーザーに独自のAPIキーを使用してもらう（My API機能）

#### Vercelデプロイが失敗する

**原因1**: ビルドエラー

**解決方法**:

```bash
# ローカルでビルドテスト
pnpm validate

# ログを確認
vercel logs
```

**原因2**: 環境変数が設定されていない

**解決方法**:

```bash
# Vercelダッシュボードで環境変数を設定
# または
vercel env add OPENAI_API_KEY
```

**原因3**: タイムアウト

**解決方法**: Vercel Proプランにアップグレード、またはタイムアウト設定を調整

#### localhostにアクセスできない

**原因**: VercelのサーバーレスMyAPIからlocalhostにアクセスしようとしている

**解決方法**: ローカル環境でサーバーを起動して使用

```bash
pnpm dev
# http://localhost:3333 でアクセス
```

### ログの確認方法

#### ローカル環境

```bash
# サーバーログ（ターミナルに出力）
pnpm dev

# ブラウザのコンソールログ
# ブラウザのMyAPI Tools → Console
```

#### Vercel環境

```bash
# リアルタイムログ
vercel logs --follow

# 過去のログ
vercel logs <deployment-url>

# Vercelダッシュボード
# https://vercel.com/dashboard → プロジェクト → Logs
```

## リリースプロセス

### バージョン管理

セマンティックバージョニング（Semantic Versioning）に従います：

- **MAJOR**: 互換性のない変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

### リリース手順

#### 1. リリース準備

```bash
# mainブランチに切り替え
git checkout main
git pull origin main

# すべてのテストが通ることを確認
pnpm validate
```

#### 2. package.jsonのバージョン更新

```bash
# バージョンを更新（自動的にgit tagが作成されます）
npm version patch   # バグ修正の場合
npm version minor   # 機能追加の場合
npm version major   # 破壊的変更の場合
```

#### 3. CHANGELOG.mdの更新

```markdown
## [1.2.0] - 2025-11-12

### 追加

- 新機能の説明

### 変更

- 変更内容の説明

### 修正

- バグ修正の説明
```

#### 4. コミットとプッシュ

```bash
# 変更をコミット
git add .
git commit -m "リリース: v1.2.0"

# タグとともにプッシュ
git push origin main --tags
```

#### 5. Vercelに本番デプロイ

```bash
vercel --prod
```

#### 6. リリースノートの作成

GitHubのReleaseページで新しいリリースを作成：

1. https://github.com/your-repo/releases にアクセス
2. "Create a new release" をクリック
3. タグを選択（例: v1.2.0）
4. リリースノートを記載
5. "Publish release" をクリック

### ホットフィックス手順

緊急のバグ修正が必要な場合：

```bash
# 現在の本番バージョンからブランチを作成
git checkout main
git checkout -b hotfix/fix-critical-bug

# バグを修正
# ...

# コード品質チェック
pnpm validate

# コミット
git add .
git commit -m "修正: 緊急バグの修正"

# mainにマージ
git checkout main
git merge hotfix/fix-critical-bug

# バージョンをパッチアップ
npm version patch

# プッシュ
git push origin main --tags

# 本番デプロイ
vercel --prod
```

## 緊急時の対応

### サービスダウン時

#### 1. 状況確認

```bash
# Vercelのステータス確認
curl https://your-domain.vercel.app/health

# Vercelログ確認
vercel logs --follow
```

#### 2. 原因特定

- Vercelのサービス障害か？ → https://www.vercel-status.com/
- デプロイエラーか？ → Vercelダッシュボードで確認
- APIキーの問題か？ → 環境変数を確認
- タイムアウトか？ → ログでタイムアウトエラーを確認

#### 3. 緊急対応

**ロールバック**:

```bash
# Vercelダッシュボードから前のデプロイに戻す
# または
vercel rollback <previous-deployment-url>
```

**環境変数の修正**:

```bash
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production
```

#### 4. 復旧後の確認

```bash
# ヘルスチェック
curl https://your-domain.vercel.app/health

# 主要機能の動作確認
curl "https://your-domain.vercel.app/proxy?url=https://example.com"
```

### レート制限超過時

**ユーザー側**:

- My API機能で独自のAPIキーを使用してもらう
- 24時間待ってから再度利用してもらう

**サーバー側**:

```bash
# OpenAI APIの使用量を確認
# https://platform.openai.com/usage

# 必要に応じてAPIキーをローテーション
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production
```

## 監視とメンテナンス

### 定期的なメンテナンスタスク

#### 毎週

- [ ] Vercelログを確認してエラーをチェック
- [ ] OpenAI APIの使用量を確認
- [ ] 依存関係のセキュリティアラートを確認

```bash
# セキュリティ脆弱性チェック
pnpm audit

# 修正可能な脆弱性を自動修正
pnpm audit --fix
```

#### 毎月

- [ ] 依存関係を最新版に更新

```bash
# 古い依存関係を確認
pnpm outdated

# 更新（メジャーバージョンは慎重に）
pnpm update

# テスト
pnpm validate
```

- [ ] コードベースのリファクタリング検討
- [ ] パフォーマンス最適化の検討

#### 四半期ごと

- [ ] アーキテクチャの見直し
- [ ] セキュリティ監査
- [ ] パフォーマンス監査
- [ ] ドキュメントの全体見直し

### パフォーマンス監視

#### Webページのパフォーマンス

```bash
# Lighthouse監査
npx lighthouse https://your-domain.vercel.app --view

# Core Web Vitalsの確認
# Vercelダッシュボード → Analytics → Speed Insights
```

#### APIエンドポイントのパフォーマンス

```bash
# レスポンスタイムの測定
curl -w "@curl-format.txt" -o /dev/null -s "https://your-domain.vercel.app/proxy?url=https://example.com"

# curl-format.txt の内容:
# time_namelookup: %{time_namelookup}\n
# time_connect: %{time_connect}\n
# time_appconnect: %{time_appconnect}\n
# time_pretransfer: %{time_pretransfer}\n
# time_redirect: %{time_redirect}\n
# time_starttransfer: %{time_starttransfer}\n
# time_total: %{time_total}\n
```

### セキュリティ

#### 定期的なセキュリティチェック

```bash
# 依存関係のセキュリティ脆弱性チェック
pnpm audit

# Snykでスキャン（推奨）
npx snyk test

# GitHubのセキュリティアラートを確認
# https://github.com/your-repo/security
```

#### APIキーのローテーション

定期的にAPIキーをローテーションすることを推奨：

```bash
# 新しいAPIキーを取得
# https://platform.openai.com/api-keys

# Vercelで環境変数を更新
vercel env rm OPENAI_API_KEY production
vercel env add OPENAI_API_KEY production

# 再デプロイ
vercel --prod
```

## さらなる情報

- [README.md](./README.md) - ユーザー向けの使い方
- [CLAUDE.md](./CLAUDE.md) - Claude Code開発ガイド
- [Claude Code Skills ガイド](./.ai-docs/shared/09_CLAUDE_CODE_SKILLS.md) - カスタムスキルの詳細
- [MCP使用ガイド](./.ai-docs/shared/10_MCP_USAGE_GUIDE.md) - MCPサーバーの活用

## 質問・サポート

問題が発生した場合や質問がある場合は、以下の方法で対応してください：

1. このドキュメントのトラブルシューティングセクションを確認
2. CLAUDE.mdの該当セクションを確認
3. GitHubのIssuesで既存の問題を検索
4. 新しいIssueを作成して質問

---

最終更新: 2025-11-12
