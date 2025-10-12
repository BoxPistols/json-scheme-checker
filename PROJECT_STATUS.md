# プロジェクト状況: SEO・メタ情報分析ツール

最終更新: 2025-10-13

## 目次

1. [現在の実装状況](#現在の実装状況)
2. [次のステップ](#次のステップ)
3. [アーキテクチャ](#アーキテクチャ)
4. [実装フェーズ詳細](#実装フェーズ詳細)
5. [技術仕様](#技術仕様)

---

## 現在の実装状況

### 完了済み機能

#### Phase 1: 基本メタタグ分析 - **完了**

**ファイル構成:**
- `public/modules/meta-extractor.js` - メタタグ抽出・バリデーション
- `public/modules/og-extractor.js` - Open Graph抽出・バリデーション
- `public/modules/twitter-extractor.js` - Twitter Cards抽出・バリデーション
- `public/modules/ui-renderer.js` - UI描画（サマリーカード、タブ）
- `public/index.html` - メインHTML（タブ構造、SEO分析ロジック）
- `public/styles.css` - スタイル（タブ、ステータスバッジ、プレビューカード）

**実装済み機能:**
- [x] 基本メタタグ抽出・表示
  - title（文字数カウント、推奨範囲チェック）
  - description（文字数カウント、推奨範囲チェック）
  - canonical（URL妥当性チェック）
  - robots（noindexチェック）
  - viewport（設定有無チェック）

- [x] Open Graph タグ
  - 必須タグ抽出（title/description/image/url/type）
  - SNSプレビュー表示（Facebook/LinkedIn風）
  - 画像サムネイル表示

- [x] Twitter Cards
  - 必須タグ抽出（card/title/description/image）
  - Twitterプレビュー表示
  - cardタイプバリデーション

- [x] タブナビゲーション
  - 概要・メタタグ
  - SNS（OG/Twitter）
  - HTML構造
  - Schema（既存のJSON-LD表示）

- [x] SEOスコア計算
  - メタタグスコア（25点満点）
  - SNSスコア（15点満点）
  - 構造化データスコア（20点満点、質ベース）
  - 総合スコア表示（100点満点）

- [x] 問題検出・表示
  - エラー/警告の分類
  - トグル可能な問題セクション
  - ステータスバッジ（成功/警告/エラー）

- [x] UI強化
  - 色彩調整（彩度低減、コントラスト維持）
  - 検出された問題のトグル機能（details要素使用）
  - SEO分析結果の上部余白調整

#### HTML構造タブ（Phase 2の一部を先行実装） - **完了**

**実装済み:**
- [x] Headタグ統計
  - 総Headタグ数
  - Metaタグ数
  - Linkタグ数
  - Scriptタグ数

- [x] 見出しタグ（H1-H6）
  - 各レベルの数をカウント
  - **実際の見出しテキストを表示**（右側列）
  - H1: 全て表示
  - H2/H3: 最大5件表示（超過時「...他X件」）
  - H4-H6: 最大3件表示（超過時「...他X件」）

- [x] その他の要素
  - 画像数（img）
  - リンク数（a）

---

## 次のステップ

### Phase 2: 構造分析の残り（優先度: 高）

#### 見出し階層分析

**実装ファイル: `public/modules/heading-analyzer.js`（新規作成）**

**機能:**
- [ ] H1数のバリデーション（推奨: 1個）
- [ ] 階層スキップ検出（例: H2の後にいきなりH4）
- [ ] 空見出し検出
- [ ] 見出しツリー構造の構築・表示

**表示イメージ:**
```
H1: メインタイトル (20文字)
  H2: セクション1 (12文字)
    H3: サブセクション (15文字)
  H2: セクション2 (10文字)
```

#### リンク分析

**実装ファイル: `public/modules/link-analyzer.js`（新規作成）**

**機能:**
- [ ] 内部リンク数
- [ ] 外部リンク数
- [ ] nofollow/sponsored属性
- [ ] 壊れたリンク検出（href="#"、空のhref）
- [ ] target="_blank"チェック
- [ ] リンク一覧表示（展開可能）

#### 画像分析

**実装ファイル: `public/modules/image-analyzer.js`（新規作成）**

**機能:**
- [ ] 総画像数
- [ ] alt属性なし画像の検出・一覧表示
- [ ] loading属性の使用状況
- [ ] width/height属性の設定状況
- [ ] 画像形式統計（jpg/png/webp/svg）

---

### Phase 3: UI強化（優先度: 中）

- [ ] スコア計算の精緻化
  - 見出し構造スコア（15点）
  - 画像最適化スコア（10点）
  - リンク品質スコア（10点）
  - 技術最適化スコア（5点）

- [ ] エクスポート機能
  - [ ] JSON形式
  - [ ] CSV形式（画像一覧、リンク一覧）
  - [ ] クリップボードコピー

- [ ] レスポンシブデザイン最適化

- [ ] パフォーマンス最適化
  - 大規模HTML（1MB以上）の処理
  - Virtual Scrolling（1000件以上のリスト）

---

### Phase 4: URL比較・差分検出機能（優先度: 中）

**ユースケース:**
- A/Bテスト前後の比較
- リニューアル前後の比較
- 求人ページの差分確認
- 競合サイトとの比較

**実装ファイル:**
- `public/modules/diff-detector.js`（新規作成）
- `public/modules/comparison-renderer.js`（新規作成）

**機能:**
- [ ] 2URL入力UI
- [ ] 差分検出アルゴリズム
  - メタタグの差分
  - OG/Twitterタグの差分
  - JSON-LDの差分
  - 見出し構造の差分
- [ ] 差分ハイライト表示（同一/変更/追加/削除）
- [ ] 求人比較モード（JobPostingスキーマ特化）
- [ ] 差分サマリー表示
- [ ] 比較結果エクスポート

---

## アーキテクチャ

### ファイル構造

```
json-ld-viewer/
├── server.js                    # プロキシサーバー
├── package.json
├── vercel.json
├── PROJECT_STATUS.md            # このファイル
├── README.md
├── public/
│   ├── index.html              # メインHTML
│   ├── styles.css              # スタイル
│   ├── app.js                  # メインJavaScript（今後作成予定）
│   └── modules/                # JavaScriptモジュール
│       ├── meta-extractor.js   # メタタグ抽出
│       ├── og-extractor.js     # OGタグ抽出
│       ├── twitter-extractor.js # Twitter Cards抽出
│       ├── ui-renderer.js      # UI描画
│       ├── heading-analyzer.js # 見出し分析（未実装）
│       ├── link-analyzer.js    # リンク分析（未実装）
│       ├── image-analyzer.js   # 画像分析（未実装）
│       ├── diff-detector.js    # 差分検出（未実装）
│       └── comparison-renderer.js # 比較UI（未実装）
└── api/
    └── proxy.js                 # Vercel Serverless Function
```

### データフロー

```
[ユーザー入力URL]
      ↓
[server.js プロキシ] → HTML取得
      ↓
[DOMParser] → HTMLをパース
      ↓
[各エクストラクター] → データ抽出
  - meta-extractor.js
  - og-extractor.js
  - twitter-extractor.js
      ↓
[バリデーション] → 問題検出
      ↓
[スコア計算] → SEOスコア算出
      ↓
[ui-renderer.js] → UI描画
```

---

## 実装フェーズ詳細

### Phase 1: 基本メタタグ分析 - **完了**

**推定工数: 2-3日** → 実績: 3日

**完了条件:**
- [x] メタタグ（title/description/canonical）の抽出・表示
- [x] Open Graphタグの抽出・SNSプレビュー表示
- [x] Twitter Cardsの抽出・プレビュー表示
- [x] 基本的なバリデーション（文字数チェック等）
- [x] タブナビゲーションの実装
- [x] 簡易SEOスコア表示

---

### Phase 2: 構造分析 - **一部完了**

**推定工数: 2-3日**

**完了条件:**
- [x] 見出し構造（H1-H6）の数と内容表示
- [ ] 見出し階層表示（ツリー構造）
- [ ] リンク分析（内部/外部/nofollow統計）
- [ ] 画像分析（alt属性チェック・形式統計）
- [ ] スコア計算への反映

---

### Phase 3: UI強化とスコアリング

**推定工数: 2-3日**

**実装内容:**
- 総合SEOスコアの精緻化
- 問題検出アラートの強化
- エクスポート機能（JSON/CSV）
- レスポンシブデザイン最適化
- パフォーマンス最適化（Web Worker検討）

---

### Phase 4: URL比較・差分検出機能

**推定工数: 2-3日**

**実装内容:**
- 2URL入力UI
- 差分検出アルゴリズム
- 差分ハイライト表示
- 求人比較モード
- 差分サマリー
- 比較結果エクスポート

---

### Phase 5: 高度な機能

**推定工数: 3-5日**

**実装内容:**
- hreflang分析
- パフォーマンス指標（ページサイズ・リソース数）
- ヒストリー機能（過去の分析結果保存）
- 3つ以上のURL比較機能
- PDFレポート出力
- テキスト差分の詳細表示（diff-match-patch使用）

---

## 技術仕様

### 技術スタック

- **フロントエンド**: Vanilla JavaScript（ES6 Modules）
- **バックエンド**: Node.js + Express
- **プロキシ**: Axios
- **HTMLパース**: DOMParser（ブラウザ標準API）
- **デプロイ**: Vercel

### 新規追加ライブラリ候補

| ライブラリ | 用途 | 優先度 | 状態 |
|-----------|------|--------|------|
| cheerio | サーバーサイドHTML解析 | 中 | 検討中 |
| validator.js | URL・メールバリデーション | 低 | 検討中 |
| chart.js | グラフ表示 | 低 | 検討中 |
| diff-match-patch | テキスト差分検出 | 中 | Phase 4で必要 |
| deep-diff | オブジェクト差分検出 | 中 | Phase 4で必要 |

### SEOスコア計算ロジック

**現在の実装:**

```javascript
// メタタグスコア（25点満点）
let metaScore = 25;
metaScore -= エラー数 * 5;
metaScore -= 警告数 * 2;
metaScore = Math.max(0, metaScore);

// SNSスコア（15点満点）
let snsScore = 15;
const ogRequired = ['title', 'description', 'image', 'url', 'type'];
const ogMissing = ogRequired.filter(field => !og[field]).length;
snsScore -= ogMissing * 1.5;
snsScore = Math.max(0, snsScore);

// 構造化データスコア（20点満点）
let schemaScore = 0;
if (schemas.length > 0) {
    schemaScore = 10; // 基本点
    schemas.forEach(schema => {
        if (schema['@type']) schemaScore += 2; // 最大6点
        if (hasMainProperties(schema)) schemaScore += 1; // 最大4点
    });
    schemaScore = Math.min(20, schemaScore);
}

// 総合スコア
totalScore = metaScore + snsScore + schemaScore; // 最大60点
```

**Phase 2以降の拡張予定:**
- 見出し構造スコア（15点）
- 画像最適化スコア（10点）
- リンク品質スコア（10点）
- 技術最適化スコア（5点）
- **合計: 100点満点**

---

## テスト計画

### テストURL

- https://freelance-hub.jp/project/detail/281563/
- https://developers.google.com/search/docs
- https://detailed.com/extension/
- localhost開発サイト

### Phase 1 テストケース - **完了**

- [x] メタタグ抽出テスト
- [x] OGタグテスト
- [x] Twitter Cardsテスト
- [x] バリデーションテスト

---

## 制約・注意事項

### 技術的制約

- サーバーサイドレンダリング（SSR）サイトのみ対応
- クライアントサイドでレンダリングされるメタタグは取得不可
- Basic認証が必要なサイトは手動入力が必要
- CORS制限のあるサイトはプロキシ経由でも取得できない場合がある

### パフォーマンス制約

- 1MB以上のHTMLは処理に時間がかかる可能性
- 1000件以上のリンク/画像はVirtual Scrolling必須

---

## 参考資料

- [Google Search Central - 構造化データ](https://developers.google.com/search/docs/appearance/structured-data)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Schema.org](https://schema.org/)
- [Detailed SEO Extension](https://detailed.com/extension/)

---

## 変更履歴

- 2025-10-13: プロジェクト統合（REQUIREMENTS.md + IMPLEMENTATION_PLAN.md → PROJECT_STATUS.md）
- 2025-10-13: HTML構造タブに見出しテキスト表示機能を追加
- 2025-10-12: Phase 1完了、HTML構造タブの基本実装完了
