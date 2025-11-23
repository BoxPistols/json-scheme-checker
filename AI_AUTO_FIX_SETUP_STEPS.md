# AI自動修正システム セットアップ手順

このファイルは、AI自動修正システムをセットアップするための手順書です。
以下の手順に従って設定してください。

## 前提条件

- GitHubリポジトリへの管理者権限
- Claude APIキー（Anthropic）

## セットアップ手順

### Step 1: Claude APIキーの取得

まだClaude APIキーをお持ちでない場合：

1. https://console.anthropic.com/ にアクセス
2. ログインまたはアカウント作成
3. Settings → API Keys に移動
4. 「Create Key」をクリック
5. APIキーをコピー（sk-ant-で始まる文字列）

注意: APIキーは一度しか表示されないため、安全な場所に保管してください。

### Step 2: GitHub Secretsの設定

1. GitHubリポジトリページを開く
   ```
   https://github.com/BoxPistols/json-scheme-checker
   ```

2. 「Settings」タブをクリック

3. 左サイドバーから「Secrets and variables」→「Actions」を選択

4. 「New repository secret」ボタンをクリック

5. 以下の情報を入力：
   - Name: `ANTHROPIC_API_KEY`
   - Secret: 取得したClaude APIキー（sk-ant-...）

6. 「Add secret」をクリック

確認: Secretsリストに「ANTHROPIC_API_KEY」が表示されていることを確認

### Step 3: GitHub Actionsの権限設定

1. 同じ「Settings」タブ内で、左サイドバーから「Actions」→「General」を選択

2. 「Workflow permissions」セクションまでスクロール

3. 以下を選択：
   - 「Read and write permissions」を選択
   - 「Allow GitHub Actions to create and approve pull requests」にチェック

4. 「Save」ボタンをクリック

確認: 設定が保存されたことを確認

### Step 4: ワークフローファイルの確認

以下のファイルが存在することを確認してください（既に存在しています）：

```
.github/workflows/ai-auto-fix.yml
```

確認方法:
```bash
ls -la .github/workflows/ai-auto-fix.yml
```

### Step 5: 変更をプッシュ（既に完了）

ワークフローファイルは既にプッシュされています。

```
ブランチ: claude/auto-pr-review-responses-01HSYhWicRpV2EqpsC2X3wqV
```

## 動作確認

### 方法1: テストPRで確認

1. テストブランチを作成：
   ```bash
   git checkout -b test/ai-autofix-verification
   ```

2. わざとエラーを含むファイルを作成：
   ```bash
   cat > test-error.js << 'EOF'
   // ESLintエラーのテスト
   const unused = "test";

   function unusedFunc() {
     console.log("unused")
   }

   export default test;
   EOF
   ```

3. コミット＆プッシュ：
   ```bash
   git add test-error.js
   git commit -m "テスト: AI自動修正システムの動作確認"
   git push -u origin test/ai-autofix-verification
   ```

4. PRを作成：
   - GitHub UIでPRを作成
   - または `gh pr create --title "テスト: AI自動修正" --body "AI自動修正システムの動作確認"`

5. GitHub Actionsタブで「AI Auto Fix System」ワークフローが実行されることを確認

6. 自動修正がコミットされることを確認

### 方法2: 手動トリガーで確認

1. GitHubリポジトリの「Actions」タブに移動

2. 左サイドバーから「AI Auto Fix System」を選択

3. 「Run workflow」ボタンをクリック

4. ブランチを選択（例: claude/auto-pr-review-responses-01HSYhWicRpV2EqpsC2X3wqV）

5. 「Run workflow」を実行

6. ワークフローの実行ログを確認

## 期待される動作

### 問題検出フェーズ

ワークフローは以下をチェックします：

- ESLintエラー
- コードフォーマットエラー
- CSSエラー
- テスト失敗
- サーバー起動エラー
- マージコンフリクト
- Geminiレビューコメント

### 自動修正フェーズ

1. 簡単な修正（即座に実行）：
   - `pnpm lint:fix`
   - `pnpm format`
   - `pnpm lint:css:fix`
   - 自動コミット＆プッシュ

2. 複雑な修正（Claude AI分析）：
   - 問題を収集
   - Claude APIで分析
   - 修正プランを作成
   - ファイルを更新
   - PRにレポートをコメント
   - コミット＆プッシュ

## トラブルシューティング

### エラー1: ワークフローが起動しない

確認項目：
- `.github/workflows/ai-auto-fix.yml` が存在するか
- PRが作成または更新されたか
- GitHub Actionsが有効になっているか

対処法：
1. Settings → Actions → General → 「Allow all actions and reusable workflows」を確認

### エラー2: "ANTHROPIC_API_KEY not found"

確認項目：
- SecretがANTHROPIC_API_KEYという名前で設定されているか（大文字小文字に注意）
- Secretの値が正しいか

対処法：
1. Settings → Secrets and variables → Actions で再確認
2. 必要に応じて削除して再作成

### エラー3: "Permission denied"

確認項目：
- Workflow permissionsが「Read and write permissions」になっているか
- 「Allow GitHub Actions to create and approve pull requests」がチェックされているか

対処法：
1. Settings → Actions → General → Workflow permissions で設定を確認

### エラー4: Claude APIエラー

確認項目：
- APIキーが有効か
- API利用制限に達していないか
- インターネット接続は正常か

対処法：
1. https://console.anthropic.com/ でAPIキーとクレジットを確認
2. 必要に応じて新しいAPIキーを生成

## セットアップ完了チェックリスト

- [ ] Claude APIキーを取得した
- [ ] GitHub SecretsにANTHROPIC_API_KEYを設定した
- [ ] GitHub Actionsの権限を「Read and write permissions」に設定した
- [ ] 「Allow GitHub Actions to create and approve pull requests」にチェックした
- [ ] `.github/workflows/ai-auto-fix.yml` が存在することを確認した
- [ ] テストPRで動作確認した
- [ ] ワークフローが正常に実行されることを確認した
- [ ] 自動修正がコミットされることを確認した

## 次のステップ

セットアップが完了したら：

1. このファイル（AI_AUTO_FIX_SETUP_STEPS.md）は削除しても構いません
2. 詳細なドキュメントは `.ai-docs/shared/13_AI_AUTO_FIX_SETUP.md` を参照
3. CLAUDE.mdの「AI自動修正システム」セクションも確認してください

## サポート

問題が解決しない場合：

1. GitHub Actionsのログを確認：
   - Actions タブ → 失敗したワークフロー → 各ステップのログ

2. アーティファクトをダウンロード：
   - Actions タブ → ワークフロー実行 → Artifacts → issue-logs

3. ドキュメントを確認：
   - `.ai-docs/shared/13_AI_AUTO_FIX_SETUP.md`

---

作成日: 2025-11-23
リポジトリ: BoxPistols/json-scheme-checker
