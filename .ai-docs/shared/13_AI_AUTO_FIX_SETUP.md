# AI自動修正システム セットアップガイド

このドキュメントでは、GitHub PRレビューの自動対応システムのセットアップと使用方法について説明します。

## 概要

AI自動修正システムは、GitHub ActionsとClaude AIを使用して、PRの問題を自動的に検出し修正するシステムです。

### 主な機能

1. 問題の自動検出
   - ESLintエラー
   - コードフォーマットエラー
   - CSSエラー
   - テスト失敗
   - サーバー起動エラー
   - マージコンフリクト
   - Geminiレビューコメント（優先度高）

2. 段階的な自動修正
   - 簡単な修正（Lint/Format/CSS）は自動適用
   - 複雑な修正はClaude AIが分析して修正プランを作成
   - 不確実な修正は別Issueとして切り出し

3. レポート機能
   - 修正内容をPRにコメント
   - 詳細なログをアーティファクトとして保存
   - 修正後の検証結果を表示

## セットアップ手順

### Step 1: ワークフローファイルの確認

`.github/workflows/ai-auto-fix.yml` が存在することを確認してください。このファイルには、AI自動修正システムのすべてのロジックが含まれています。

### Step 2: GitHub Secretsの設定

1. GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** に移動
2. **New repository secret** をクリック
3. 以下のシークレットを追加：

```
Name: ANTHROPIC_API_KEY
Secret: sk-ant-... (あなたのClaude APIキー)
```

Claude APIキーは以下から取得できます：
https://console.anthropic.com/settings/keys

### Step 3: GitHub Actionsの権限設定

1. リポジトリの **Settings** → **Actions** → **General** に移動
2. **Workflow permissions** セクションで以下を選択：
   - "Read and write permissions" を選択
   - "Allow GitHub Actions to create and approve pull requests" をチェック

### Step 4: package.jsonの確認

以下のスクリプトが存在することを確認してください（このプロジェクトには既に存在しています）：

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier --write \"**/*.{js,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,json,md}\"",
    "lint:css": "stylelint 'public/styles/**/*.css'",
    "lint:css:fix": "stylelint 'public/styles/**/*.css' --fix",
    "test": "vitest run",
    "validate": "npm run lint && npm run lint:css && npm run check-css"
  }
}
```

## 使用方法

### 自動実行

AI自動修正システムは以下のタイミングで自動的に実行されます：

1. PRが作成されたとき
2. PRが更新されたとき（新しいコミットがプッシュされたとき）
3. PRにレビューが投稿されたとき

### 手動実行

GitHub UIから手動で実行することもできます：

1. リポジトリの **Actions** タブに移動
2. **AI Auto Fix System** ワークフローを選択
3. **Run workflow** ボタンをクリック
4. 実行したいブランチを選択して実行

## 動作フロー

```
1. PR作成/更新
   ↓
2. 問題検出（並行実行）
   ├─ ESLintチェック
   ├─ フォーマットチェック
   ├─ CSSチェック
   ├─ テスト実行
   ├─ サーバー起動チェック
   ├─ マージコンフリクトチェック
   └─ Geminiレビュー確認
   ↓
3. 修正が必要か判定
   ↓
4. 簡単な自動修正（Lint/Format/CSS）
   ├─ 自動修正実行
   └─ コミット＆プッシュ
   ↓
5. 複雑な問題の分析（Claude AI）
   ├─ コンテキスト収集（PR diff、パッケージ情報など）
   ├─ Geminiコメント収集
   ├─ Claude AIによる分析
   └─ 修正プラン作成
   ↓
6. 修正適用
   ├─ ファイル変更
   ├─ Issue作成（不確実な修正）
   └─ PRにレポートをコメント
   ↓
7. 検証
   ├─ Lint再実行
   ├─ フォーマット再実行
   ├─ テスト再実行
   └─ サーバー起動再確認
   ↓
8. コミット＆プッシュ
   ↓
9. レビュー再リクエスト
```

## 修正の優先順位

AI自動修正システムは以下の優先順位で問題に対応します：

### 高優先度
- Gemini Priority Highのレビューコメント
- サーバー起動エラー
- テスト失敗
- マージコンフリクト

### 中優先度
- ESLintエラー
- CSSエラー

### 低優先度
- フォーマットエラー

## レポートの見方

AI自動修正システムは、修正完了後にPRに以下の形式でコメントを投稿します：

```
## AI自動修正レポート

### 分析結果
[問題の分析と診断]

### 修正戦略
[採用した修正アプローチの説明]

### 実施した修正
- 確認: 更新: src/example.js
- 確認: 作成: tests/new-test.js
- 情報: Issue #123: 後で対応すべきタスク

### 要約
[何を修正したか、なぜそうしたかの要約]

### 注意事項
[この修正に関する潜在的なリスクや注意点]

### 作成されたIssue
- 後で対応すべきタスクのタイトル

---
Powered by Claude Sonnet 4
```

## トラブルシューティング

### 問題1: ワークフローが起動しない

**確認事項：**
1. `.github/workflows/ai-auto-fix.yml` が正しい場所に配置されているか
2. GitHub Actionsの権限が正しく設定されているか（Settings → Actions → General）
3. PRを作成または更新したか

### 問題2: Claude APIエラー

**確認事項：**
1. `ANTHROPIC_API_KEY` シークレットが正しく設定されているか
2. APIキーが有効で、使用制限に達していないか
3. APIキーの権限が正しいか

**検証方法（ローカル）：**
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"test"}]}'
```

### 問題3: 修正が適用されない

**確認事項：**
1. GitHub Actions → 失敗したワークフロー → 各ステップのログを確認
2. "Apply AI Fixes" ステップでエラーがないか確認
3. Claudeのレスポンスが正しいJSON形式か確認

**デバッグ方法：**
- ワークフローの実行ログをダウンロード
- `issue-logs` アーティファクトをダウンロードして内容を確認
- Claude APIレスポンスの内容を確認

### 問題4: サーバー起動チェックの失敗

**原因：**
- ポート3333が使用中
- 依存関係のインストールに失敗
- 環境変数が設定されていない

**対処法：**
1. ローカルで `pnpm install` を実行して依存関係を確認
2. ローカルで `pnpm start` を実行してサーバーが起動するか確認
3. 必要な環境変数がGitHub Secretsに設定されているか確認

### 問題5: テスト失敗

**対処法：**
1. ローカルで `pnpm test` を実行してテストが通るか確認
2. テストコードに問題がないか確認
3. テストに必要な依存関係がインストールされているか確認

## カスタマイズ

### トリガー条件の変更

`.github/workflows/ai-auto-fix.yml` の `on` セクションを編集：

```yaml
on:
  pull_request:
    types: [opened, synchronize, reopened]
  pull_request_review:
    types: [submitted]
  workflow_dispatch:  # 手動実行
  # 特定のラベルが付いた時だけ実行する例
  # pull_request:
  #   types: [labeled]
  #   labels: [auto-fix]
```

### Claudeモデルの変更

`.github/workflows/ai-auto-fix.yml` の `AI Analysis and Fix with Claude` ステップで：

```yaml
"model": "claude-sonnet-4-20250514",  # ← ここを変更
```

利用可能なモデル：
- `claude-sonnet-4-20250514` (推奨、最新)
- `claude-3-5-sonnet-20241022` (高速)
- `claude-opus-4-20250514` (最高品質、低速)

### 自動コミットの無効化

修正案だけ提示してコミットしたくない場合は、`Commit and Push` ステップをコメントアウト：

```yaml
# - name: Commit and Push
#   if: steps.apply-fixes.outputs.fixes_applied == 'true'
#   run: |
#     ...
```

## ベストプラクティス

1. **段階的な導入**
   - 最初は `workflow_dispatch`（手動実行）のみで試す
   - 動作を確認してから自動実行を有効化

2. **レビューの確認**
   - AI修正後も必ず人間がレビューする
   - 修正内容が適切か確認してからマージ

3. **Issue管理**
   - 自動作成されたIssueは定期的にレビュー
   - 不要なIssueはクローズ

4. **コスト管理**
   - Claude APIの使用量を定期的に確認
   - 必要に応じてトリガー条件を調整

5. **ログの活用**
   - アーティファクトに保存されたログを活用
   - 問題のパターンを分析して改善

## 関連ドキュメント

- [09_CLAUDE_CODE_SKILLS.md](./09_CLAUDE_CODE_SKILLS.md) - Claude Codeスキルの使用方法
- [12_TESTING_ARCHITECTURE.md](./12_TESTING_ARCHITECTURE.md) - テストアーキテクチャ
- [03_WORKFLOW.md](./03_WORKFLOW.md) - 開発ワークフロー
- [05_SECURITY.md](./05_SECURITY.md) - セキュリティガイド

## 参考リンク

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Claude API Documentation](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Anthropic Console](https://console.anthropic.com/)

---

最終更新: 2025-11-23
