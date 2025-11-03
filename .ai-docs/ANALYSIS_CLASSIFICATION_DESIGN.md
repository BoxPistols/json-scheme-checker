# 分析分類設計書

## 概要

このドキュメントは、JSON-LD Schema Checker アプリケーションにおける「分析の分類」設計を明確にするためのものです。URLごとのハードコード分岐を排除し、スキーマベースの抽象的な分類を実現します。

## 設計方針

### 1. JobPosting → 求人専用AIアドバイス (Advisor)

**対象スキーマ**: `JobPosting`

**明確な基準**:

- `@type` が `JobPosting` または `JobPosting` を含む配列

**分析内容**:

- 求人票としての品質評価
- 企業側/応募者側/エージェント視点でのアドバイス
- 採用市場における競争力分析

**排他性**: JobPosting スキーマが存在すれば、他の分析タイプを**実行しない**

---

### 2. BlogPosting/Article → AIブログレビュー (BlogReviewer)

**対象スキーマ**: `BlogPosting`, `Article`, `NewsArticle`

**明確な基準**:

- `@type` が `BlogPosting`, `Article`, `NewsArticle` のいずれか、または配列に含まれる

**分析内容**:

- ブログメディアとしての品質評価
- コンテンツの構成、読みやすさ
- SEO最適化、エンゲージメント向上策
- 技術的な改善点（構造化データ、パフォーマンス）

**排他性**: BlogPosting/Article/NewsArticle スキーマが存在すれば、Webページ分析を**実行しない**

---

### 3. その他 → Webページ分析 (WebAdvisor)

**対象スキーマ**:

- `WebPage`, `Organization`, `Product`, `Event`, `Person` など
- **スキーマなし**のページも含む

**明確な基準**:

- JobPosting, BlogPosting, Article, NewsArticle が**存在しない**場合

**分析内容** (2段階判定):

#### 3-1. ページ内容の判定（AIによる自動判断）

AIが以下の要素を確認し、ページの性質を判断する：

- 見出し構造（H1, H2, H3の数と内容）
- 本文の長さと内容
- メタ情報（タイトル、description）
- OGタグの情報

#### 3-2-A. ブログメディアと判断された場合

**BlogPosting同様のレビューを提供**:

- コンテンツ品質評価
- 記事構成、読みやすさ
- SEO最適化
- エンゲージメント向上策
- **構造化データの提案** (BlogPostingスキーマの追加を推奨)

#### 3-2-B. 一般的なWebページと判断された場合

**基本的なSEOレビュー + コンテンツレビュー**:

- SEO基礎要素の評価（title, description, OGタグ）
- ページ構造の分析（見出し階層）
- ユーザビリティの評価
- 技術的な改善点（構造化データ、パフォーマンス）
- コンテンツの明瞭性評価（可能な範囲で）

---

## 実装における重要な原則

### 1. スキーマベースの抽象的な分類

**禁止事項**:

- URLパターンによるハードコード判定
  - 例: `if (url.includes('blog'))` のような実装
  - 例: `if (url.includes('zenn.dev'))` のような実装

**推奨実装**:

- JSON-LD `@type` プロパティによる判定
- スキーマの有無・種類に基づく排他的ルーティング

### 2. 排他的な分析実行（1ページ = 1分析）

```javascript
// app.js での if-else-if 構造
if (detectJobPosting(schemas)) {
  // JobPosting → Advisor のみ実行
  return;
} else if (detectBlogPost(schemas)) {
  // BlogPosting/Article → BlogReviewer のみ実行
  return;
} else if (detectNoSchemaOrWebPageOnly(schemas, url)) {
  // その他 → WebAdvisor のみ実行
  return;
}
```

### 3. Webページ分析の汎用性

Webページ分析は、**ブログかもしれないし、一般的なホームページかもしれない**という前提で設計する。

- AIにページの性質を判断させる
- 判断結果に基づいて適切なレビュー形式を選択
- ブログメディアなら BlogPosting 同様の詳細レビュー
- それ以外なら基本的なSEOレビュー

---

## 実装チェックリスト

### フロントエンド (public/)

- [ ] `app.js`: if-else-if による排他的検出ロジック
- [ ] `advisor.js`: JobPosting 検出メソッド
- [ ] `blog-reviewer.js`: BlogPosting/Article 検出メソッド
- [ ] `web-advisor.js`: その他（exclusiveAdvisorTypes 以外）検出メソッド
- [ ] ボタンクリア機能（重複表示防止）

### バックエンド (api/)

- [ ] `advisor.js`: 求人専用プロンプト
- [ ] `blog-reviewer.js`: ブログ専用プロンプト
- [ ] `web-advisor.js`: **汎用プロンプト**（ページの性質を判断し、適切なレビューを提供）

### 現在の問題点

- [ ] `api/web-advisor.js` の `buildPrompt()` が「ブログ記事として評価してください」と固定されている
  - → **修正必要**: 汎用的なプロンプトに変更し、AIにページの性質を判断させる

---

## 期待される動作例

### ケース1: 求人ページ (freelance.levtech.jp)

1. JSON-LD抽出 → `JobPosting` 検出
2. `advisor.detectJobPosting()` → true
3. 「求人/求職アドバイスを受ける」ボタン**のみ**表示
4. 求人専用AIアドバイス実行

### ケース2: ブログ記事 (zenn.dev/articles/xxx)

1. JSON-LD抽出 → `Article` 検出
2. `blogReviewer.detectBlogPost()` → true
3. 「ブログ記事レビュー」ボタン**のみ**表示
4. ブログ専用レビュー実行

### ケース3: ブログ記事（スキーマなし）

1. JSON-LD抽出 → スキーマなし、または `WebPage` のみ
2. `webAdvisor.detectNoSchemaOrWebPageOnly()` → true
3. 「Webページ分析」ボタン**のみ**表示
4. Webページ分析実行
   - AIが見出し構造・本文を確認
   - 「ブログメディア」と判断
   - → BlogPosting同様の詳細レビューを提供
   - → BlogPostingスキーマの追加を推奨

### ケース4: 企業ホームページ (asagiri-design.carrd.co)

1. JSON-LD抽出 → スキーマなし、または `Organization`
2. `webAdvisor.detectNoSchemaOrWebPageOnly()` → true
3. 「Webページ分析」ボタン**のみ**表示
4. Webページ分析実行
   - AIが見出し構造・本文を確認
   - 「一般的なホームページ」と判断
   - → 基本的なSEOレビュー + コンテンツレビューを提供

---

## 次のステップ

1. **設計の合意**: このドキュメントをユーザーに確認してもらう
2. **プロンプトの修正**: `api/web-advisor.js` の `buildPrompt()` を汎用化
3. **テスト**: 各ケースで期待通りの動作を確認

---

最終更新: 2025-11-03
