# 開発環境セットアップガイド

## 前提条件

- Node.js 20以上
- pnpm 8以上
- Git

## 初回セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/BoxPistols/json-scheme-checker.git
cd json-scheme-checker
```

### 2. 依存関係のインストール

```bash
pnpm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集してOpenAI APIキーを設定：

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4.1-nano
```

### 4. Git Hooksの設定

Pre-commit hooksを有効化：

```bash
chmod +x .husky/pre-commit
```

## Git Hooksについて

### Pre-commit Hook

コミット前に自動的に以下を実行します：

1. **ESLint**: JavaScript/JSXファイルの構文チェックと自動修正
2. **Prettier**: コードフォーマットの自動整形

**対象ファイル**:

- JavaScriptファイル: `*.js`, `*.jsx`
- JSONファイル: `*.json`
- Markdownファイル: `*.md`

### Hookをスキップする方法

緊急時のみ、以下のコマンドでhookをスキップできます：

```bash
git commit --no-verify -m "緊急修正"
```

**注意**: 通常はhookをスキップしないでください。コード品質が低下します。

## GitHub Actions

プルリクエストとmainブランチへのプッシュ時に自動的に以下を実行します：

### CI Workflow (.github/workflows/ci.yml)

1. **Lint Check**: ESLintによる構文チェック
2. **Dependency Security Check**: 依存関係の脆弱性チェック
3. **Build Check**: サーバーが正常に起動するかチェック

### ローカルでCIを実行

本番環境にプッシュする前に、ローカルで同じチェックを実行できます：

```bash
# Lintチェック
pnpm lint

# 依存関係の脆弱性チェック
pnpm audit --prod

# サーバー起動チェック
pnpm start
# 別のターミナルで
curl http://localhost:3333/health
```

## トラブルシューティング

### Pre-commit hookが動作しない

**原因**: フックファイルに実行権限がない

**解決方法**:

```bash
chmod +x .husky/pre-commit
```

### lint-stagedが見つからない

**原因**: huskyとlint-stagedがインストールされていない

**解決方法**:

```bash
pnpm add -D husky lint-staged
pnpm exec husky install
```

### ESLintエラーが解決できない

**原因**: 自動修正できないエラーがある

**解決方法**:

1. エラーメッセージを確認
2. 手動で修正
3. または `.eslintrc.json` でルールを調整

### GitHub Actionsが失敗する

**原因**: ローカルでは成功するがCIで失敗する

**解決方法**:

1. `.github/workflows/ci.yml` のログを確認
2. ローカルで同じコマンドを実行
3. 環境変数の違いを確認

## 開発ワークフロー

### 機能開発

```bash
# 1. 新しいブランチを作成
git checkout -b feature/new-feature

# 2. コードを変更

# 3. コミット（pre-commit hookが自動実行）
git add .
git commit -m "機能: 新機能を追加"

# 4. プッシュ
git push origin feature/new-feature

# 5. プルリクエストを作成
gh pr create --title "機能: 新機能を追加" --body "..."
```

### コードレビュー

プルリクエストを作成すると：

1. GitHub ActionsがCIを自動実行
2. レビュアーがコードレビュー
3. 必要に応じて修正
4. Approve後にマージ

### デプロイ

mainブランチにマージすると：

1. Vercelが自動デプロイ
2. 本番環境で動作確認
3. 問題があればロールバック

## ベストプラクティス

### コミット前

1. `pnpm lint` でエラーがないか確認
2. `pnpm start` でサーバーが起動するか確認
3. ブラウザで動作確認

### プルリクエスト前

1. `code-review` スキルを実行
2. CIが通ることを確認
3. 変更内容を説明するドキュメントを更新

### デプロイ前

1. `deploy-check` スキルを実行
2. 全てのチェックがOKであることを確認
3. ステージング環境でテスト（可能な場合）

## 推奨ツール

### エディタ

**VSCode**推奨。以下の拡張機能をインストール：

- ESLint
- Prettier
- GitLens
- Claude Code Extension

### ターミナル

- iTerm2 (macOS)
- Windows Terminal (Windows)
- Warp (モダンなターミナル)

### Gitクライアント

- GitHub CLI (`gh`) - プルリクエスト管理に便利
- GitKraken - ビジュアルなGit操作

## 参考資料

- [Husky公式ドキュメント](https://typicode.github.io/husky/)
- [lint-staged公式ドキュメント](https://github.com/okonet/lint-staged)
- [GitHub Actions公式ドキュメント](https://docs.github.com/en/actions)
- [pnpm公式ドキュメント](https://pnpm.io/)

---

最終更新: 2025-11-02
