# 機能詳細

## Advisor機能（JobPosting分析）{#advisor}

### 概要

`POST /api/advisor`

JobPostingスキーマを分析し、採用側（employer）or応募者側（applicant）向けのアドバイスをOpenAI APIで生成

### リクエスト

```javascript
{
  "jobPosting": { /* JSON-LDオブジェクト */ },
  "mode": "employer|applicant",
  "userApiKey": "sk-..." // オプション（ユーザーが提供）
}
```

### 分析項目（Employer Mode）

- タイトル: 魅力度・検索性
- 職務内容: 具体性・説得力
- スキル要件: 明確さ
- 待遇条件: 妥当性・競争力
- 福利厚生: アピール度
- 応募のハードル: 適切さ
- SEO対策: 構造化データ充実度

### 分析項目（Applicant Mode）

- 必須・歓迎スキル分析
- 経験レベル推定
- 企業文化推測
- 給与市場価値評価
- 想定面接質問
- アピール戦略
- リスク・注意事項

### ストリーミング対応

`stream: true` で段階的にテキストを返却

---

## Blog Reviewer機能（Article/BlogPosting分析）{#blog}

### 概要

`POST /api/blog-reviewer`

Article/BlogPostingスキーマを分析し、SEO/EEAT観点でのレビューをOpenAI APIで生成

### リクエスト

```javascript
{
  "article": { /* JSON-LDオブジェクト */ },
  "userApiKey": "sk-..." // オプション
}
```

### 分析観点

#### SEO（検索エンジン最適化）

- タイトル最適化（文字数・キーワード配置）
- メタディスクリプション効果性
- 見出し構造（H1-H6階層）
- キーワード配置・密度
- 内部・外部リンク戦略
- 画像alt属性・ファイル名
- URL構造
- 構造化データ充実度

#### EEAT（専門性・経験・権威性・信頼性）

- **Expertise**: 著者の専門知識の示し方
- **Experience**: 実体験・具体例の記載
- **Authoritativeness**: 引用元・参考文献の信頼性
- **Trustworthiness**: 情報の正確性・更新日時

#### アクセシビリティ

- 画像のalt属性
- 見出し階層
- リンクテキストの分かりやすさ
- 色コントラスト比
- キーボード操作対応

### 出力形式

Markdown形式で以下を含む:
- 総合評価（5段階）
- セクション別評価（現状・評価・改善案）
- 優先的改善提案
- 追加推奨事項

### ストリーミング対応

段階的にMarkdownを返却

---

## OpenAI API連携

### キー管理

**優先順位**:
1. ユーザー提供の `userApiKey`（リクエストボディ）
2. 環境変数 `OPENAI_API_KEY`（サーバー側）

**ユーザー提供時**: レート制限をスキップ（自己責任）

### モデル選択

環境変数 `OPENAI_MODEL` で指定（デフォルト: `gpt-4o-mini`）

### トークン計測

レスポンス終了時に`usage`情報をSSEで返却:

```javascript
{
  "usage": {
    "prompt_tokens": 250,
    "completion_tokens": 150,
    "total_tokens": 400
  }
}
```

---

## 関連ドキュメント

- **[セキュリティ](./05_SECURITY.md)** - API キー管理・レート制限
- **[ワークフロー](./03_WORKFLOW.md)** - ローカルテスト方法
- **[プロジェクト概要](./01_PROJECT.md)** - 全体像

---

**最終更新**: 2025-10-22
