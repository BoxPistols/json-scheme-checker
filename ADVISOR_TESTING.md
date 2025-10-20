# AI求人票アドバイザー機能 - テスト手順

## 概要

AI Advisor 機能は、JSON-LD データから JobPosting スキーマを検出し、採用側向けまたは応募者向けのアドバイスを提供します。

## セットアップ

### 1. 環境変数の設定

`.env` ファイルに OpenAI API キーを設定してください：

```bash
cp .env.example .env
# .env を編集して、実際の API キーを入力
OPENAI_API_KEY=sk-your-actual-api-key
OPENAI_MODEL=gpt-4o-mini
```

### 2. ローカルサーバーの起動

```bash
pnpm dev
# または
pnpm start
```

サーバーは http://localhost:3333 で起動します。

## テスト方法

### 方法1: テストサンプルファイル（推奨）

1. ブラウザで http://localhost:3333 にアクセス
2. URL 入力欄に以下を入力：
   ```
   http://localhost:3333/test-jobposting.html
   ```
3. 「取得」ボタンをクリック
4. 「AIアドバイスを受ける」ボタンが表示されるのを確認

### 方法2: 実際の求人サイト（インターネット必須）

1. ブラウザで http://localhost:3333 にアクセス
2. URL 入力欄に求人情報 URL を入力：
   ```
   https://freelance-hub.jp/project/detail/281563/
   ```
3. 「取得」ボタンをクリック
4. JSON-LD が抽出され、JobPosting 検出時に「AIアドバイスを受ける」ボタン表示

## デバッグ方法

### ブラウザのコンソールで確認

1. ブラウザの開発者ツール（F12 または右クリック → 検査）を開く
2. 「コンソール」タブを確認
3. 以下のようなログが表示されます：

```
[AdvisorManager] detectJobPosting called with: [...]
[AdvisorManager] JobPosting detected: {...}
[AdvisorManager] showAdvisorButton - results div: <div id="results">...
[AdvisorManager] Advisor button inserted into DOM
```

### ログメッセージの意味

| ログ                               | 意味                                        |
| ---------------------------------- | ------------------------------------------- |
| `detectJobPosting called with`     | JobPosting 検出関数が呼ばれた               |
| `JobPosting detected:`             | JobPosting スキーマが見つかった（非 null ） |
| `No JobPosting found in schemas`   | JSON-LD に JobPosting が含まれていない      |
| `results div:`                     | DOM の results div を取得できた             |
| `ERROR: results div not found`     | DOM に results div がない（バグ）           |
| `Advisor button inserted into DOM` | ボタンが正常に表示されたボタン              |

## 期待される動作フロー

```
URL 入力
  ↓
「取得」クリック
  ↓
JSON-LD 抽出
  ↓
displaySchemas() 実行
  ↓
advisorManager.detectJobPosting() 実行
  ↓
JobPosting 検出 ✓
  ↓
「AIアドバイスを受ける」ボタン表示
  ↓
ボタンクリック
  ↓
モード選択（採用側 / 応募者向け）
  ↓
OpenAI API へリクエスト
  ↓
ストリーミングで分析結果を表示
```

## トラブルシューティング

### ボタンが表示されない

#### チェックリスト

1. **コンソールエラーを確認**
   - F12 で開発者ツールを開く -「コンソール」タブで赤いエラーが出ていないか確認

2. **JSON-LD が抽出されているか**
   - 「Schema」タブで JSON-LD データが表示されているか確認
   - スキーマ数が 0 でないか確認

3. **JobPosting が含まれているか**
   - Schema タブのデータを確認
   - `@type: "JobPosting"` があるか確認

4. **コンソールログを確認**
   - `[AdvisorManager] detectJobPosting called with:` が表示されているか
   - `No JobPosting found in schemas` が表示されていないか

### API キー関連のエラー

```
{
  "error": "OpenAI API key not configured"
}
```

**解決方法:**

- `.env` ファイルに `OPENAI_API_KEY` が設定されているか確認
- API キーの形式が正しいか確認（`sk-` で始まる必要あり）
- サーバーを再起動（`pnpm dev` を Ctrl+C で停止し、再実行）

### API レスポンスエラー

```
{
  "error": "AI分析に失敗しました"
}
```

**解決方法:**

- OpenAI API キーが有効か確認
- API の月間クォータを確認
- ネットワーク接続を確認
- ブラウザコンソールの詳細エラーを確認

## ファイル構成

```
api/
└── advisor.js              # OpenAI API ハンドラー
public/
├── modules/
│   └── advisor.js          # フロントエンド UI/ロジック
├── test-jobposting.html    # テスト用サンプル
└── styles.css              # スタイル（advisor-* クラス）
server.js                    # ローカル開発サーバー
.env                         # 環境変数（API キー）
.env.example                 # テンプレート
```

## API エンドポイント

### ローカル環境

```
POST http://localhost:3333/api/advisor
Content-Type: application/json

{
  "jobPosting": { /* JSON-LD JobPosting オブジェクト */ },
  "mode": "employer" | "applicant"
}
```

### Vercel 環境

```
POST /api/advisor
```

## 本番デプロイ

### 環境変数の設定（Vercel）

1. Vercel Dashboard にログイン
2. プロジェクト設定 → Environment Variables
3. 以下を追加：
   - `OPENAI_API_KEY`: OpenAI API キー
   - `OPENAI_MODEL`: gpt-4o-mini （オプション）

### デプロイ

```bash
git push origin feature/add-adviser
# → Pull Request を作成
# → main ブランチにマージ
# → 自動デプロイ開始
```

## 参考資料

- [要件定義書](.ai-docs/shared/ADVISOR_FEATURE_REQUIREMENTS.md)
- [OpenAI API ドキュメント](https://platform.openai.com/docs/api-reference/chat)
- [Schema.org JobPosting](https://schema.org/JobPosting)
