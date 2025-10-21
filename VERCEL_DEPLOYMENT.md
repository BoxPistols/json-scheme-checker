# Vercel デプロイメントガイド - AI Advisor 機能

## 概要

AI求人票アドバイザー機能をVercelにデプロイするための手順です。

---

## デプロイ前チェックリスト

- [x] `api/advisor.js` - バックエンドAPI実装済み
- [x] `public/modules/advisor.js` - フロントエンド実装済み
- [x] `vercel.json` - advisor.js のタイムアウト設定済み（60秒）
- [x] `.gitignore` - .env ファイルが除外されている
- [x] `.env.example` - 環境変数テンプレート作成済み
- [ ] **Vercel環境変数の設定**（必須）

---

## デプロイ手順

### ステップ1: ブランチをプッシュ

```bash
# 現在のブランチを確認
git branch

# feature/add-adviser ブランチをリモートにプッシュ
git push origin feature/add-adviser
```

### ステップ2: Pull Request を作成

1. GitHubリポジトリにアクセス
2. 「Pull requests」タブをクリック
3. 「New pull request」をクリック
4. Base: `main` ← Compare: `feature/add-adviser`
5. タイトル: `AI求人票アドバイザー機能を追加`
6. 説明を記入（下記テンプレート参照）
7. 「Create pull request」をクリック

#### PR説明テンプレート

\`\`\`markdown

## 概要

JSON-LD の JobPosting スキーマを検出し、AIによるアドバイスを提供する機能を追加しました。

## 主な機能

- **採用側向けアドバイス**: 求人票の内容をレビューし、改善提案を提供
- **応募者向けアドバイス**: 面接対策と要件分析を提供
- **ストリーミング表示**: OpenAI API からのレスポンスをリアルタイム表示
- **左右分割UI**: 求人票とアドバイスを並べて表示

## 実装内容

### バックエンド

- `api/advisor.js`: OpenAI API 統合（GPT-4.1-mini）
- Server-Sent Events (SSE) でストリーミング対応
- タイムアウト: 60秒

### フロントエンド

- `public/modules/advisor.js`: UI/UXロジック
- JobPosting 自動検出
- モード選択ダイアログ
- HTML変換による見やすい職務内容表示

### スタイル

- 433行の専用CSS追加
- レスポンシブデザイン対応
- ダークテーマ対応

## テスト済み

- [x] ローカル環境での動作確認
- [x] JobPosting 検出機能
- [x] UIレスポンス表示
- [x] ESLint/Prettier チェック

## 必須: Vercel環境変数設定

デプロイ後、以下の環境変数を設定してください：

- \`OPENAI_API_KEY\`: OpenAI API キー
- \`OPENAI_MODEL\`: gpt-4.1-mini

詳細は VERCEL_DEPLOYMENT.md を参照
\`\`\`

### ステップ3: Vercel環境変数を設定

#### 方法A: Vercel Dashboard（推奨）

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. プロジェクトを選択
3. 「Settings」タブ → 「Environment Variables」
4. 以下の変数を追加：

| Key              | Value          | Environment         |
| ---------------- | -------------- | ------------------- |
| `OPENAI_API_KEY` | `sk-proj-...`  | Production, Preview |
| `OPENAI_MODEL`   | `gpt-4.1-mini` | Production, Preview |

**注意**:

- `OPENAI_API_KEY` は必ず **Production** と **Preview** の両方にチェック
- API キーは `.env` ファイルから取得（絶対にGitHubにpushしない）

#### 方法B: Vercel CLI

```bash
# Vercel CLIをインストール（未インストールの場合）
npm i -g vercel

# ログイン
vercel login

# 環境変数を設定
vercel env add OPENAI_API_KEY
# → プロンプトに従って API キーを入力
# → Production と Preview を選択

vercel env add OPENAI_MODEL
# → "gpt-4.1-mini" を入力
# → Production と Preview を選択
```

### ステップ4: PRをマージしてデプロイ

1. PR画面で「Merge pull request」をクリック
2. 「Confirm merge」をクリック
3. Vercelが自動的にデプロイを開始

---

## デプロイ後の確認

### 1. デプロイメント状態の確認

```bash
# Vercel Dashboard または
vercel logs
```

### 2. 本番環境での動作テスト

1. **Vercel デプロイURL にアクセス**
   - 例: `https://json-ld-view.vercel.app/`

2. **テストURL を入力**

   ```
   https://freelance-hub.jp/project/detail/281563/
   ```

3. **「取得」ボタンをクリック**
   - JSON-LD が抽出される
   - JobPosting が検出される
   - 「求人/求職アドバイスを受ける」ボタンが表示される

4. **アドバイスをテスト**
   - ボタンをクリック
   - モード選択（採用側 / 応募者向け）
   - AI分析がストリーミング表示される

### 3. エラーチェック

ブラウザのDeveloper/無制限ツール（F12）→ コンソールでエラーを確認：

```javascript
// 正常時のログ例
[AdvisorManager] JobPosting detected: {...}
[AdvisorManager] Advisor button inserted into DOM
```

```javascript
// エラー時の例
{
  "error": "OpenAI API key not configured"
}
// → Vercel環境変数が設定されていない
```

---

## トラブルシューティング

### エラー1: APIキーが設定されていない

**エラーメッセージ:**

```json
{
  "error": "OpenAI API key not configured"
}
```

**解決方法:**

1. Vercel Dashboard → Settings → Environment Variables
2. `OPENAI_API_KEY` が設定されているか確認
3. Production と Preview の両方にチェックが入っているか確認
4. 設定後、再デプロイ：

   ```bash
   vercel --prod
   ```

### エラー2: タイムアウトエラー

**エラーメッセージ:**

```
Error: Function execution timed out
```

**原因:**

- OpenAI APIのレスポンスが遅い
- Vercelの無料プランは10秒制限（Proプランは60秒）

**解決方法:**

1. `vercel.json` のタイムアウト設定を確認（現在60秒）
2. Vercel プランを確認（HobbyプランではなくProプランが必要）
3. または、モデルを `gpt-4o-mini` に変更（レスポンスが速い）

### エラー3: 401 Unauthorized

**エラーメッセージ:**

```json
{
  "error": "Incorrect API key provided"
}
```

**解決方法:**

1. OpenAI APIキーが有効か確認
2. OpenAI Platform でキーを再生成
3. Vercel環境変数を更新
4. 再デプロイ

### エラー4: モデルが存在しない

**エラーメッセージ:**

```json
{
  "error": "The model 'gpt-4.1-mini' does not exist"
}
```

**解決方法:**

1. OpenAI アカウントで利用可能なモデルを確認
2. `gpt-4.1-mini` が利用できない場合、`gpt-4o-mini` に変更：
   - Vercel環境変数 `OPENAI_MODEL` を `gpt-4o-mini` に更新
   - 再デプロイ

---

## Vercel関数の設定（vercel.json）

```json
{
  "version": 2,
  "functions": {
    "api/advisor.js": {
      "maxDuration": 60
    }
  }
}
```

### 各項目の説明

| 項目          | 値   | 説明                     |
| ------------- | ---- | ------------------------ |
| `maxDuration` | `60` | 関数の最大実行時間（秒） |

**注意:**

- **Hobby（無料）プラン**: maxDuration は最大 10秒
- **Pro プラン**: maxDuration は最大 60秒（デフォルト）
- **Enterprise プラン**: maxDuration は最大 900秒

現在の設定（60秒）を使用するには、**Proプラン以上が必要**です。

---

## コスト見積もり

### OpenAI API コスト（gpt-4.1-mini）

| 項目          | コスト                          |
| ------------- | ------------------------------- |
| Input tokens  | 要確認（OpenAI Platformで確認） |
| Output tokens | 要確認（OpenAI Platformで確認） |

※ `gpt-4.1-mini` の料金は OpenAI Platform で最新情報を確認してください。

### 代替案: gpt-4o-mini（最安値）

| 項目          | コスト          |
| ------------- | --------------- |
| Input tokens  | $0.15/1M tokens |
| Output tokens | $0.60/1M tokens |

**推定コスト（1回あたり）:**

- 求人票データ: 約 1,000 tokens
- AIレスポンス: 約 500-1,000 tokens
- **合計**: 約 $0.001-0.002/回

### Vercel コスト

- **Hobby（無料）プラン**:
  - 100GB bandwidth/月
  - サーバーレス関数実行時間: 100GB-時/月
  - **制限**: maxDuration 10秒

- **Pro プラン**: $20/月
  - 1TB bandwidth/月
  - サーバーレス関数実行時間: 1000GB-時/月
  - **maxDuration 60秒** 対応

---

## セキュリティ

### APIキーの保護

✅ **実施済み:**

- `.env` ファイルは `.gitignore` に登録済み
- APIキーはサーバーサイド（Vercel環境変数）のみに保存
- クライアント側にAPIキーは露出しない

❌ **禁止:**

- APIキーをGitHubにコミット
- APIキーをフロントエンドJavaScriptに記述
- APIキーをURLパラメータに含める

### レート制限（将来的な拡張）

現在は実装されていませんが、以下の対策を検討：

```javascript
// 例: IPベースのレート制限
// api/advisor.js に追加を検討
const rateLimit = {
  windowMs: 24 * 60 * 60 * 1000, // 24時間
  max: 10, // 10リクエスト/日
};
```

---

## 関連ドキュメント

- [要件定義書](.ai-docs/shared/ADVISOR_FEATURE_REQUIREMENTS.md)
- [テスト手順](ADVISOR_TESTING.md)
- [OpenAI API ドキュメント](https://platform.openai.com/docs/api-reference/chat)
- [Vercel サーバーレス関数](https://vercel.com/docs/functions/serverless-functions)

---

## デプロイ後の次のステップ

1. **本番テスト**: 複数の求人URLでアドバイス機能をテスト
2. **監視**: Vercel Analyticsでパフォーマンスを確認
3. **フィードバック**: ユーザーフィードバックを収集
4. **改善**: UIやプロンプトを継続的に改善

---

**作成日**: 2025-10-21
**バージョン**: 1.0
**ステータス**: デプロイ準備完了
