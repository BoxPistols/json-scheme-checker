# AI自動修正システム GitHub UI設定ガイド

このドキュメントでは、AI自動修正システムを有効化するためにGitHub UIで実施する必要がある設定を、体系的かつ具体的に説明します。

## 目次

1. [概要](#概要)
2. [前提条件](#前提条件)
3. [設定1: Claude APIキーの設定](#設定1-claude-apiキーの設定)
4. [設定2: GitHub Actionsの権限設定](#設定2-github-actionsの権限設定)
5. [設定完了の確認](#設定完了の確認)
6. [よくある間違いと対処法](#よくある間違いと対処法)
7. [トラブルシューティング](#トラブルシューティング)
8. [次のステップ](#次のステップ)

---

## 概要

AI自動修正システムを有効化するには、以下の2つの設定をGitHub UIで実施する必要があります：

1. **Claude APIキーの設定** - Anthropic Claude APIを使用するための認証情報
2. **GitHub Actionsの権限設定** - ワークフローがリポジトリに書き込み・PRを作成できるようにする権限

所要時間: 約5-10分

---

## 前提条件

### 必要なもの

- [ ] GitHubリポジトリへの管理者権限
- [ ] Anthropicアカウント（なければ作成）
- [ ] 有効なクレジットカード（Anthropic APIの使用に必要）

### 確認事項

```bash
# リポジトリがクローンされていることを確認
pwd
# 出力例: /home/user/json-scheme-checker

# ワークフローファイルが存在することを確認
ls -la .github/workflows/ai-auto-fix.yml
# 存在すればOK
```

---

## 設定1: Claude APIキーの設定

### Phase 1: Anthropic Claude APIキーの取得

#### Step 1-1: Anthropic Consoleにアクセス

```
URL: https://console.anthropic.com/
```

**操作手順:**

1. ブラウザで上記URLを開く
2. 右上の「Sign In」をクリック
   - 既にアカウントがある場合: Googleアカウントまたはメールでログイン
   - アカウントがない場合: 「Sign Up」から新規登録

**新規登録の場合:**

- Googleアカウントでのサインアップを推奨
- メールアドレスと名前を入力
- 利用規約に同意

#### Step 1-2: API Keysページに移動

```
URL: https://console.anthropic.com/settings/keys
```

**操作手順:**

1. ログイン後、左サイドバーの「API Keys」をクリック
2. または上記URLに直接アクセス

**画面の確認事項:**

- ページタイトル: "API Keys"
- 説明文: "Create and manage API keys"
- 「Create Key」ボタンが表示されている

#### Step 1-3: 新しいAPIキーを作成

**操作手順:**

1. 「Create Key」ボタンをクリック

2. モーダルウィンドウが表示される

   ```
   ┌─────────────────────────────────────┐
   │ Create API Key                      │
   ├─────────────────────────────────────┤
   │ Name                                │
   │ ┌─────────────────────────────────┐ │
   │ │                                 │ │
   │ └─────────────────────────────────┘ │
   │                                     │
   │ [Cancel]              [Create Key] │
   └─────────────────────────────────────┘
   ```

3. 「Name」欄に以下を入力:

   ```
   GitHub Actions AI Auto Fix
   ```

   または任意のわかりやすい名前:
   - 例1: `json-scheme-checker-autofix`
   - 例2: `production-ai-autofix`
   - 例3: `github-workflows`

4. 「Create Key」ボタンをクリック

#### Step 1-4: APIキーをコピー

**重要: この手順は一度しか実行できません**

画面に表示される内容:

```
┌─────────────────────────────────────────────┐
│ API Key Created                             │
├─────────────────────────────────────────────┤
│ Your API key has been created.              │
│ Copy it now - you won't be able to see it  │
│ again.                                      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxx   │ │
│ │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   │ │
│ │ xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ [Copy]                          [Done]     │
└─────────────────────────────────────────────┘
```

**操作手順:**

1. 「Copy」ボタンをクリック
   - または、キーを選択してCtrl+C（Mac: Cmd+C）でコピー

2. コピーしたキーを一時的に安全な場所に保存
   - テキストエディタに貼り付け
   - パスワードマネージャーに保存
   - または次のステップですぐにGitHubに貼り付け

**確認事項:**

- キーは `sk-ant-api03-` で始まる
- 長さは約100文字程度
- 英数字とハイフンのみで構成

**注意事項:**

- このキーは二度と表示されません
- 紛失した場合は新しいキーを作成する必要があります
- キーは秘密情報です。公開しないでください

3. 「Done」ボタンをクリック

#### Step 1-5: APIキーの確認

API Keysページに戻ると、作成したキーが表示されます:

```
Name                              Created        Last used
───────────────────────────────────────────────────────────
GitHub Actions AI Auto Fix        Just now       Never
```

確認事項:

- キー名が表示されている
- "Created" が "Just now" または最近の日時
- キーの実際の値は表示されない（これは正常）

---

### Phase 2: GitHub Secretsへの登録

#### Step 2-1: リポジトリのSecretsページにアクセス

```
URL: https://github.com/BoxPistols/json-scheme-checker/settings/secrets/actions
```

**または、手動で移動:**

1. GitHubでリポジトリページを開く

   ```
   https://github.com/BoxPistols/json-scheme-checker
   ```

2. 上部タブの「Settings」をクリック

3. 左サイドバーの「Secrets and variables」を展開

4. 「Actions」をクリック

**画面の確認事項:**

- ページタイトル: "Actions secrets and variables"
- タブ: "Secrets" が選択されている
- 「New repository secret」ボタンが表示されている

#### Step 2-2: 新しいSecretを作成

**操作手順:**

1. 右上の「New repository secret」ボタンをクリック

2. フォームが表示される:
   ```
   ┌──────────────────────────────────────────┐
   │ Actions secrets / New secret             │
   ├──────────────────────────────────────────┤
   │ Name *                                   │
   │ ┌──────────────────────────────────────┐ │
   │ │                                      │ │
   │ └──────────────────────────────────────┘ │
   │                                          │
   │ Secret *                                 │
   │ ┌──────────────────────────────────────┐ │
   │ │                                      │ │
   │ │                                      │ │
   │ │                                      │ │
   │ └──────────────────────────────────────┘ │
   │                                          │
   │ [Cancel]              [Add secret]      │
   └──────────────────────────────────────────┘
   ```

#### Step 2-3: Secretの情報を入力

**Name欄（必須）:**

以下を正確に入力してください（大文字小文字を区別します）:

```
ANTHROPIC_API_KEY
```

**重要な注意事項:**

- 正確にこの通り入力してください
- すべて大文字
- アンダースコア（\_）を含む
- スペースなし

**よくある間違い:**

- ❌ `anthropic_api_key` (小文字)
- ❌ `ANTHROPIC_APIKEY` (アンダースコアなし)
- ❌ `ANTHROPIC-API-KEY` (ハイフンを使用)
- ❌ `ANTHROPIC_API_KEY ` (末尾にスペース)
- ✅ `ANTHROPIC_API_KEY` (正しい)

**Secret欄（必須）:**

Phase 1でコピーしたClaude APIキーを貼り付けます:

```
sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**確認事項:**

- `sk-ant-` で始まっている
- 改行やスペースが含まれていない
- 完全にコピーされている

**入力例:**

```
Name:
ANTHROPIC_API_KEY

Secret:
sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKlMnOpQrStUvWxYz1234567890AbCdEfGhIjKl
```

#### Step 2-4: Secretを保存

**操作手順:**

1. 入力内容を再確認
   - Name: `ANTHROPIC_API_KEY`
   - Secret: コピーしたAPIキー

2. 画面下部の「Add secret」ボタンをクリック

3. ページがリロードされ、Secretsリストに戻る

#### Step 2-5: 登録の確認

**成功した場合の表示:**

```
Repository secrets

Name                    Updated
─────────────────────────────────────
ANTHROPIC_API_KEY       now
```

**確認事項:**

- 「ANTHROPIC_API_KEY」が表示されている
- "Updated" が "now" または最近の時刻
- Secretの値は表示されない（セキュリティのため）

**緑色の成功メッセージが表示される:**

```
✓ Secret "ANTHROPIC_API_KEY" created.
```

---

## 設定2: GitHub Actionsの権限設定

### Phase 1: Actions設定ページにアクセス

#### Step 1-1: GitHub Actions設定ページに移動

```
URL: https://github.com/BoxPistols/json-scheme-checker/settings/actions
```

**または、手動で移動:**

1. GitHubでリポジトリページを開く

   ```
   https://github.com/BoxPistols/json-scheme-checker
   ```

2. 上部タブの「Settings」をクリック

3. 左サイドバーの「Actions」を展開

4. 「General」をクリック

**画面の確認事項:**

- ページタイトル: "Actions permissions"
- 複数のセクションが表示されている
- "Workflow permissions" セクションが存在する

---

### Phase 2: Workflow permissionsの設定

#### Step 2-1: Workflow permissionsセクションを見つける

**操作手順:**

1. ページを下にスクロール

2. 「Workflow permissions」セクションを見つける
   - ページの下部付近にあります
   - "Fork pull request workflows from outside collaborators" セクションの下

**セクションの見た目:**

```
┌────────────────────────────────────────────────┐
│ Workflow permissions                           │
├────────────────────────────────────────────────┤
│ Choose the default permissions granted to the │
│ GITHUB_TOKEN when running workflows in this   │
│ repository. You can specify more granular     │
│ permissions in the workflow using YAML.        │
│                                                │
│ ○ Read repository contents and packages       │
│   permissions                                  │
│                                                │
│ ○ Read and write permissions                  │
│                                                │
│ □ Allow GitHub Actions to create and approve  │
│   pull requests                                │
└────────────────────────────────────────────────┘
```

#### Step 2-2: 権限を選択

**操作手順:**

1. 「Read and write permissions」ラジオボタンを選択

**設定内容の説明:**

```
○ Read repository contents and packages permissions
  - ワークフローはリポジトリを読み取りのみ可能
  - コミット、プッシュはできない
  - AI自動修正では使用不可 ❌

● Read and write permissions
  - ワークフローはリポジトリの読み取りと書き込みが可能
  - コミット、プッシュが可能
  - AI自動修正で必要 ✅
```

**選択後の状態:**

```
○ Read repository contents and packages permissions

● Read and write permissions
  ↑ このラジオボタンが選択されている状態
```

#### Step 2-3: Pull Request作成権限を有効化

**操作手順:**

1. 「Read and write permissions」の下にあるチェックボックスを探す

2. 以下のチェックボックスをクリックしてチェックを入れる:
   ```
   ☑ Allow GitHub Actions to create and approve pull requests
   ```

**設定内容の説明:**

このオプションを有効にすると:

- ワークフローがPRを作成できる
- ワークフローがPRを承認できる（オプション）
- ワークフローがPRにコメントできる
- AI自動修正で必要 ✅

**チェック後の状態:**

```
● Read and write permissions

☑ Allow GitHub Actions to create and approve pull requests
  ↑ チェックが入っている状態
```

#### Step 2-4: 設定を保存

**操作手順:**

1. ページの一番下までスクロール

2. 「Save」ボタンをクリック

**ボタンの位置:**

```
┌────────────────────────────────────┐
│                                    │
│ [Cancel]              [Save]      │
│                                    │
└────────────────────────────────────┘
```

3. ページがリロードされる

#### Step 2-5: 設定の確認

**成功した場合の表示:**

ページ上部に緑色のメッセージが表示されます:

```
✓ Workflow permissions updated.
```

**設定内容の確認:**

「Workflow permissions」セクションを再度確認:

```
● Read and write permissions
☑ Allow GitHub Actions to create and approve pull requests
```

両方が選択/チェックされていることを確認してください。

---

## 設定完了の確認

すべての設定が正しく完了したか、以下の方法で確認してください。

### 確認1: Secretsの確認

```
URL: https://github.com/BoxPistols/json-scheme-checker/settings/secrets/actions
```

**確認事項:**

```
Repository secrets

Name                    Updated
─────────────────────────────────────
ANTHROPIC_API_KEY       X minutes ago
```

- [ ] 「ANTHROPIC_API_KEY」が存在する
- [ ] "Updated" が最近の時刻である
- [ ] 他に不要なSecretsがない

### 確認2: Actions権限の確認

```
URL: https://github.com/BoxPistols/json-scheme-checker/settings/actions
```

「Workflow permissions」セクションで確認:

- [ ] 「Read and write permissions」が選択されている
- [ ] 「Allow GitHub Actions to create and approve pull requests」にチェックが入っている

### 確認3: ワークフローファイルの存在確認

ローカルリポジトリで確認:

```bash
ls -la .github/workflows/ai-auto-fix.yml
```

出力例:

```
-rw-r--r-- 1 user user 15234 Nov 23 12:34 .github/workflows/ai-auto-fix.yml
```

- [ ] ファイルが存在する
- [ ] ファイルサイズが0でない

### 確認4: 最新の変更がプッシュされている

```bash
git log --oneline -5
```

出力に以下のようなコミットが含まれていることを確認:

```
2de593d ドキュメント: AI自動修正システムのセットアップ支援ツールを追加
3c9e0a5 ドキュメント: AI自動修正システムのセットアップ手順書を追加
de339dd 機能: AI自動修正システムを追加
```

- [ ] AI自動修正システム関連のコミットが存在する
- [ ] 最新のコミットがプッシュされている

---

## よくある間違いと対処法

### 間違い1: Secret名のスペルミス

**症状:**

- ワークフローが "ANTHROPIC_API_KEY not found" エラーで失敗する

**原因:**

- Secret名が `ANTHROPIC_API_KEY` と完全一致していない
- 大文字小文字が間違っている
- スペースやタイポがある

**対処法:**

1. Secretsページで既存のSecretを削除

   ```
   https://github.com/BoxPistols/json-scheme-checker/settings/secrets/actions
   ```

   - Secret名の右側の「Delete」をクリック

2. 正しい名前で再作成
   - Name: `ANTHROPIC_API_KEY` （正確に入力）

### 間違い2: APIキーのコピーミス

**症状:**

- ワークフローが "Invalid API key" エラーで失敗する
- Anthropic APIから401エラーが返る

**原因:**

- APIキーの一部がコピーされていない
- 改行やスペースが含まれている
- 間違ったキーをコピーした

**対処法:**

1. Anthropic Consoleで新しいAPIキーを作成

   ```
   https://console.anthropic.com/settings/keys
   ```

2. 古いキーを削除（オプション）

3. 新しいキーをGitHub Secretsに登録
   - 既存のSecretを削除してから再作成

### 間違い3: Actions権限が不足

**症状:**

- ワークフローが "Permission denied" エラーで失敗する
- コミットやプッシュができない

**原因:**

- 「Read and write permissions」が選択されていない
- Saveボタンを押し忘れた

**対処法:**

1. Actions設定ページを再確認

   ```
   https://github.com/BoxPistols/json-scheme-checker/settings/actions
   ```

2. 「Read and write permissions」を選択

3. 必ず「Save」ボタンをクリック

4. ページをリロードして設定が保存されたことを確認

### 間違い4: PRチェックボックスが未チェック

**症状:**

- ワークフローがPRを作成できない
- "Resource not accessible by integration" エラー

**原因:**

- 「Allow GitHub Actions to create and approve pull requests」にチェックが入っていない

**対処法:**

1. Actions設定ページで確認

   ```
   https://github.com/BoxPistols/json-scheme-checker/settings/actions
   ```

2. チェックボックスを有効化

3. 「Save」ボタンをクリック

---

## トラブルシューティング

### 問題1: Secretsページが表示されない

**症状:**

- Settings → Secrets and variables → Actions が存在しない

**原因:**

- リポジトリの管理者権限がない
- リポジトリがプライベートで、権限が制限されている

**対処法:**

1. リポジトリオーナーに管理者権限を依頼
2. または、オーナーに設定を依頼

### 問題2: Claude APIキーが作成できない

**症状:**

- 「Create Key」をクリックしてもエラーになる
- "Billing information required" と表示される

**原因:**

- Anthropicアカウントに支払い情報が登録されていない
- APIクレジットが不足している

**対処法:**

1. Billing設定ページに移動

   ```
   https://console.anthropic.com/settings/billing
   ```

2. クレジットカード情報を登録

3. クレジットを追加（最低5ドル推奨）

4. APIキーを再作成

### 問題3: ワークフローが起動しない

**症状:**

- PRを作成してもワークフローが実行されない

**原因:**

- ワークフローファイルが正しくプッシュされていない
- GitHub Actionsが無効になっている

**対処法:**

1. ワークフローファイルの存在を確認

   ```bash
   git ls-files .github/workflows/ai-auto-fix.yml
   ```

2. GitHub Actionsが有効か確認

   ```
   Settings → Actions → General → Actions permissions
   ```

   「Allow all actions and reusable workflows」を選択

3. リポジトリをリフレッシュして再試行

### 問題4: 設定後もエラーが続く

**症状:**

- すべて設定したのにワークフローがエラーになる

**診断手順:**

1. GitHub Actionsのログを確認

   ```
   https://github.com/BoxPistols/json-scheme-checker/actions
   ```

   - 失敗したワークフローをクリック
   - エラーメッセージを確認

2. 各ステップのログを詳しく確認
   - "Detect Issues" ジョブ
   - "Auto-fix Simple" ジョブ
   - "AI Fix Complex" ジョブ

3. エラーメッセージに基づいて対処

**一般的なエラーメッセージと対処法:**

```
Error: ANTHROPIC_API_KEY not found
→ Secretが正しく設定されているか確認

Error: Invalid API key
→ APIキーが正しいか確認、必要に応じて再作成

Error: Permission denied
→ Actions権限が正しく設定されているか確認

Error: Resource not accessible by integration
→ PRチェックボックスが有効か確認
```

---

## 次のステップ

設定が完了したら、以下の手順で動作テストを実施してください。

### ステップ1: 動作テストの実行

```bash
# テストスクリプトを実行
./test-ai-autofix.sh
```

このスクリプトは自動的に:

1. テストブランチを作成（test/ai-autofix-YYYYMMDD-HHMMSS）
2. わざとエラーを含むファイルを作成
3. コミット＆プッシュ
4. 次の手順を表示

### ステップ2: PRの作成

スクリプト実行後、表示されるURLでPRを作成:

```
https://github.com/BoxPistols/json-scheme-checker/compare/test/ai-autofix-XXXXXX
```

または、GitHub UIで:

1. リポジトリページを開く
2. "Compare & pull request" ボタンをクリック
3. タイトル: "テスト: AI自動修正システムの動作確認"
4. 本文: "AI自動修正システムのテストPRです"
5. "Create pull request" をクリック

### ステップ3: ワークフローの実行を確認

1. Actionsタブを開く

   ```
   https://github.com/BoxPistols/json-scheme-checker/actions
   ```

2. "AI Auto Fix System" ワークフローが実行されることを確認

3. ワークフローが正常に完了することを確認（緑のチェックマーク）

### ステップ4: 自動修正の確認

1. PRページに戻る

2. 以下を確認:
   - [ ] 新しいコミットが自動追加されている
   - [ ] PRにレポートコメントが投稿されている
   - [ ] Filesタブでエラーが修正されている

### ステップ5: テストPRのクローズ

動作確認が完了したら:

1. PRページで「Close pull request」をクリック

2. テストブランチを削除（オプション）:
   ```bash
   git branch -d test/ai-autofix-XXXXXX
   git push origin --delete test/ai-autofix-XXXXXX
   ```

---

## まとめ

### 完了チェックリスト

すべての項目にチェックが入っていることを確認してください:

#### Claude APIキーの設定

- [ ] Anthropic Consoleにアクセスした
- [ ] 新しいAPIキーを作成した
- [ ] APIキーをコピーした
- [ ] GitHub Secretsに登録した
- [ ] Secret名が `ANTHROPIC_API_KEY` と正確に一致している

#### GitHub Actions権限設定

- [ ] Actions設定ページにアクセスした
- [ ] 「Read and write permissions」を選択した
- [ ] 「Allow GitHub Actions to create and approve pull requests」にチェックした
- [ ] 「Save」ボタンをクリックした
- [ ] 設定が保存されたことを確認した

#### 動作確認

- [ ] `./test-ai-autofix.sh` を実行した
- [ ] テストPRを作成した
- [ ] ワークフローが正常に実行された
- [ ] 自動修正が適用された

### 設定完了

すべてのチェック項目が完了していれば、AI自動修正システムは使用可能です。

今後、PRを作成するたびに自動的に:

1. 問題を検出
2. 簡単な修正を自動適用
3. 複雑な問題をClaude AIが分析
4. 修正内容をコミット＆プッシュ
5. PRにレポートを投稿

---

## 参考資料

- **詳細なセットアップガイド**: `.ai-docs/shared/13_AI_AUTO_FIX_SETUP.md`
- **セットアップチェックリスト**: `SETUP_CHECKLIST.md`
- **セットアップ手順書**: `AI_AUTO_FIX_SETUP_STEPS.md`
- **プロジェクトドキュメント**: `CLAUDE.md`

## サポート

問題が解決しない場合:

1. GitHub Actionsのログを確認
2. 本ドキュメントのトラブルシューティングセクションを参照
3. 関連ドキュメントを確認
4. GitHubのIssueで報告

---

**作成日**: 2025-11-23
**対象リポジトリ**: BoxPistols/json-scheme-checker
**ドキュメントバージョン**: 1.0
**最終更新**: 2025-11-23
