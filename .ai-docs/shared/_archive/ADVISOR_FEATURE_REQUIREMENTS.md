# AI求人票アドバイザー機能 - 要件定義書

## 概要

JSON-LD ViewerにAIアドバイザー機能を追加し、JobPosting（求人票）スキーマに対して以下を提供：

1. **採用側向けアドバイス**: 求人票の内容レビューと改善提案
2. **応募者向けアドバイス**: 面接対策と要件傾向の分析

---

## 機能要件

### 1. トリガー条件

- URLから取得したJSON-LDデータに`@type: "JobPosting"`が含まれる場合
- 求人票データの表示後、「アドバイスを受ける」ボタンを表示

### 2. ユーザーフロー

```
1. ユーザーがURL入力
2. JSON-LD抽出・解析（既存機能）
3. JobPostingスキーマを検出
4. 「アドバイスを受ける」ボタン表示
5. ボタンクリック → モード選択UI表示
   - 採用側向けアドバイス
   - 応募者向けアドバイス
6. モード選択 → AI分析開始
7. 左右分割レイアウトで結果表示
   - 左: 求人票（title + description）
   - 右: AIアドバイス（ストリーミング表示）
```

### 3. UI構成

#### 3.1 初期表示（JSON-LD解析後）

```
┌─────────────────────────────────────┐
│ JSON-LD抽出結果                      │
│ [@type: JobPosting]                 │
│                                     │
│ [アドバイスを受ける] ボタン         │
└─────────────────────────────────────┘
```

#### 3.2 モード選択画面

```
┌─────────────────────────────────────┐
│ どちらの視点でアドバイスしますか？   │
│                                     │
│ [👔 採用側向け]  [📝 応募者向け]    │
│                                     │
│ 採用側: 求人票の改善提案             │
│ 応募者: 面接対策・要件分析           │
└─────────────────────────────────────┘
```

#### 3.3 アドバイス表示画面（左右分割）

```
┌──────────────────┬──────────────────┐
│  求人票          │  AIアドバイス    │
│                  │                  │
│ Title:           │ 分析中...        │
│ ────────────     │ [プログレス]    │
│                  │                  │
│ Description:     │ ## 分析結果      │
│ ────────────     │                  │
│ [求人内容]       │ [アドバイス内容] │
│                  │                  │
│                  │ [新規分析] [戻る]│
└──────────────────┴──────────────────┘
```

---

## AI実装オプション

### オプションA: OpenAI API（推奨）

**メリット:**

- 高品質な回答
- ストリーミング対応
- 日本語対応良好

**コスト:**

- GPT-4.1 nano: $0.150/1M input tokens, $0.600/1M output tokens
- GPT-3.5 Turbo: $0.50/1M input tokens, $2.00/1M output tokens

**推定コスト（1回あたり）:**

- 求人票データ: 約1,000 tokens
- 応答: 約500-1,000 tokens
- 合計: 約$0.001-0.002/回（GPT-4.1 nano使用時）

### オプションB: Anthropic Claude API

**メリット:**

- 長文コンテキストに強い
- 日本語品質高い
- ストリーミング対応

**コスト:**

- Claude 3.5 Haiku: $0.25/1M input tokens, $1.25/1M output tokens
- Claude 3.5 Sonnet: $3/1M input tokens, $15/1M output tokens

### オプションC: Google Gemini API

**メリット:**

- 無料枠が大きい（1日1,500リクエスト）
- Gemini 1.5 Flash: 高速・低コスト
- 日本語対応

**コスト:**

- Gemini 1.5 Flash: $0.075/1M input tokens, $0.30/1M output tokens
- 無料枠: 15 RPM, 1M tokens/day

### オプションD: ローカルLLM（Ollama）

**メリット:**

- 完全無料
- プライバシー保護
- レート制限なし

**デメリット:**

- サーバーリソース必要
- Vercelでは不可（ローカル環境のみ）

---

## 推奨実装プラン

### フェーズ1: OpenAI GPT-4.1 nano（最優先）

**理由:**

- 最もコストパフォーマンスが高い
- 実装が簡単
- ストリーミング対応
- 信頼性が高い

**実装:**

```javascript
// APIキー管理: Vercel環境変数
OPENAI_API_KEY=sk-...

// エンドポイント: /api/advisor
POST /api/advisor
{
  "jobPosting": { /* JSON-LDデータ */ },
  "mode": "employer" | "applicant"
}

// レスポンス: Server-Sent Events (SSE)
```

### フェーズ2: 代替オプション追加（将来）

ユーザーがAPIキーを設定できる機能：

- OpenAI
- Anthropic
- Google Gemini

---

## データ構造

### 入力データ（JobPosting抽出）

```json
{
  "@type": "JobPosting",
  "title": "フロントエンドエンジニア",
  "description": "React/TypeScriptを使った開発...",
  "employmentType": "FULL_TIME",
  "baseSalary": {
    "@type": "MonetaryAmount",
    "currency": "JPY",
    "value": {
      "@type": "QuantitativeValue",
      "minValue": 5000000,
      "maxValue": 8000000
    }
  },
  "jobLocation": {
    "@type": "Place",
    "address": "東京都渋谷区"
  },
  "skills": "React, TypeScript, Next.js"
}
```

### プロンプトテンプレート

#### 採用側向け

```
あなたは求人票作成の専門家です。以下のJobPosting JSON-LDデータを分析し、改善提案を提供してください。

【分析観点】
1. 求人タイトルの魅力度
2. 職務内容の具体性
3. 必須スキル・歓迎スキルの明確さ
4. 給与レンジの妥当性
5. 福利厚生・企業文化のアピール
6. SEO対策（検索されやすさ）

【データ】
{jobPostingData}

【出力形式】
## 総合評価
[5段階評価と総評]

## 改善提案
### 1. タイトル
[具体的な提案]

### 2. 職務内容
[具体的な提案]

...
```

#### 応募者向け

```
あなたはキャリアアドバイザーです。以下のJobPosting JSON-LDデータを分析し、応募者向けの面接対策と要件分析を提供してください。

【分析観点】
1. 求められるスキルセット
2. 経験レベルの推定
3. 企業文化・働き方の推測
4. 面接で聞かれそうな質問
5. アピールすべきポイント
6. 給与交渉のポイント

【データ】
{jobPostingData}

【出力形式】
## 求人要件分析
[要件の詳細分析]

## 必須準備事項
[準備すべきこと]

## 想定面接質問
[質問例とその意図]

## アピールポイント
[強調すべき経験・スキル]

## 注意事項
[気をつけるべきこと]
```

---

## 技術実装

### 1. フロントエンド（public/index.html）

**新規コンポーネント:**

- `AdvisorButton`: アドバイスボタン
- `ModeSelector`: モード選択UI
- `AdvisorView`: 左右分割表示
- `StreamingText`: ストリーミングテキスト表示

### 2. バックエンド（api/advisor.js）

```javascript
// Vercel Serverless Function
module.exports = async (req, res) => {
  const { jobPosting, mode } = req.body;

  // OpenAI API呼び出し
  const stream = await openai.chat.completions.create({
    model: 'gpt-4.1-nano',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(jobPosting) },
    ],
    stream: true,
  });

  // SSEでストリーミング
  res.setHeader('Content-Type', 'text/event-stream');
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  res.end();
};
```

### 3. 環境変数

```bash
# Vercel環境変数
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-nano
```

---

## セキュリティ考慮事項

1. **APIキー保護**
   - サーバーサイドのみで使用
   - クライアントに公開しない

2. **レート制限**
   - 1ユーザーあたり10回/日
   - IPベースの制限

3. **データ保護**
   - 求人データをログに保存しない
   - ユーザーデータを外部に送信しない（OpenAI APIのみ）

---

## パフォーマンス

1. **ストリーミング表示**
   - Server-Sent Events (SSE)使用
   - リアルタイムでテキスト表示

2. **キャッシング**
   - 同一URLの再分析時はキャッシュ利用
   - localStorage保存（24時間）

---

## 今後の拡張案

1. **複数言語対応**
   - 英語の求人票にも対応

2. **比較機能**
   - 複数の求人票を比較分析

3. **レポート出力**
   - PDF/Markdown形式でダウンロード

4. **カスタムプロンプト**
   - ユーザーが独自の分析観点を追加

---

## 実装優先度

### Phase 1 (MVP) - 必須機能

- [ ] OpenAI API統合
- [ ] JobPosting検出
- [ ] モード選択UI
- [ ] 左右分割レイアウト
- [ ] 基本的なアドバイス生成

### Phase 2 - 改善

- [ ] ストリーミング表示
- [ ] キャッシング機能
- [ ] エラーハンドリング
- [ ] レート制限

### Phase 3 - 拡張

- [ ] 複数APIサポート
- [ ] レポート出力
- [ ] カスタムプロンプト

---

## 見積もり

### 開発工数

- Phase 1: 2-3日
- Phase 2: 1-2日
- Phase 3: 3-5日

### 運用コスト（月間1,000回利用）

- OpenAI GPT-4.1 nano: 約$1-2/月
- Vercel Serverless: 無料枠内

---

**作成日**: 2025-10-20
**バージョン**: 1.0
**ステータス**: 要件定義完了
