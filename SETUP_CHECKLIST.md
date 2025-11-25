# AI自動修正システム セットアップチェックリスト

このチェックリストを使用して、セットアップが正しく完了したことを確認してください。

## セットアップ前の準備

- [ ] GitHubリポジトリへの管理者権限がある
- [ ] Anthropicアカウントを持っている（または作成済み）
- [ ] Claude APIキーを取得している

## 作業1: Claude APIキーの設定

### 1-1. APIキーの取得

- [ ] https://console.anthropic.com/settings/keys にアクセスした
- [ ] ログインまたはアカウント作成した
- [ ] 「Create Key」をクリックした
- [ ] キーに名前を付けた（例: "GitHub Actions AI Auto Fix"）
- [ ] APIキーをコピーした（sk-ant- で始まる）
- [ ] APIキーを安全な場所に保存した

### 1-2. GitHub Secretsへの登録

- [ ] https://github.com/BoxPistols/json-scheme-checker/settings/secrets/actions にアクセスした
- [ ] 「New repository secret」をクリックした
- [ ] Name欄に「ANTHROPIC_API_KEY」と入力した（正確に）
- [ ] Secret欄にAPIキーを貼り付けた
- [ ] 「Add secret」をクリックした
- [ ] Secretsリストに「ANTHROPIC_API_KEY」が表示されている

## 作業2: GitHub Actionsの権限設定

### 2-1. Workflow permissions設定

- [ ] https://github.com/BoxPistols/json-scheme-checker/settings/actions にアクセスした
- [ ] 「Workflow permissions」セクションを見つけた
- [ ] 「Read and write permissions」を選択した
- [ ] 「Allow GitHub Actions to create and approve pull requests」にチェックを入れた
- [ ] 「Save」ボタンをクリックした
- [ ] 「Workflow permissions updated.」が表示された

## 設定の確認

### Secretsの確認

- [ ] Secretsページで「ANTHROPIC_API_KEY」が表示されている
- [ ] 「Updated」の日付が最近である

### Actions権限の確認

- [ ] 「Read and write permissions」が選択されている
- [ ] 「Allow GitHub Actions to create and approve pull requests」にチェックが入っている

## 動作テスト

### テストPRの作成

- [ ] 以下のコマンドを実行した：

  ```bash
  ./test-ai-autofix.sh
  ```

- [ ] テストブランチが作成された
- [ ] test-error.js ファイルが作成された
- [ ] コミットが作成された
- [ ] リモートにプッシュされた

### GitHubでの確認

- [ ] GitHubでPRを作成した
- [ ] Actionsタブで「AI Auto Fix System」ワークフローが実行されている
- [ ] ワークフローが正常に完了した（緑色のチェックマーク）

### 自動修正の確認

- [ ] 問題検出ジョブが完了した
- [ ] 簡単な修正ジョブが実行された（Lint/Format/CSS）
- [ ] AI修正ジョブが実行された（該当する場合）
- [ ] 修正内容がコミットされた
- [ ] PRにレポートがコメントされた

## トラブルシューティング

もし問題が発生した場合：

### ワークフローが起動しない

- [ ] `.github/workflows/ai-auto-fix.yml` が存在するか確認
- [ ] Settings → Actions → General → 「Allow all actions」が選択されているか確認
- [ ] PRが正しく作成されているか確認

### "ANTHROPIC_API_KEY not found" エラー

- [ ] Secret名が「ANTHROPIC_API_KEY」と正確に一致しているか確認
- [ ] Secretが正しいリポジトリに設定されているか確認
- [ ] APIキーが有効か確認（https://console.anthropic.com/settings/keys）

### "Permission denied" エラー

- [ ] Workflow permissionsが「Read and write permissions」になっているか確認
- [ ] 「Allow GitHub Actions to create and approve pull requests」がチェックされているか確認
- [ ] Saveボタンをクリックして設定を保存したか確認

### Claude APIエラー

- [ ] APIキーが正しくコピーされているか確認
- [ ] APIクレジットが残っているか確認（https://console.anthropic.com/settings/billing）
- [ ] インターネット接続が正常か確認

## 完了確認

すべてのチェックボックスにチェックが入っていれば、セットアップは完了です。

次は実際のPRでシステムを活用してください：

1. 通常通りにコードを変更
2. PRを作成
3. AI自動修正システムが自動的に問題を検出・修正
4. レビューコメントを確認
5. 必要に応じて追加の修正を実施

## 参考ドキュメント

- AI_AUTO_FIX_SETUP_STEPS.md - 詳細なセットアップ手順
- .ai-docs/shared/13_AI_AUTO_FIX_SETUP.md - 包括的なガイド
- CLAUDE.md - AI自動修正システムのセクション

---

セットアップ完了日: \_**\_年\_\_**月\_**\_日
確認者: ******\_\_********
