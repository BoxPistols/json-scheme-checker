# Claude Code Skills for JSON-LD Viewer

SEO分析ツールとフロントエンド開発に特化したSkills集

## 利用可能なSkills

### 1. Schema Validator (`/schema-validator`)
JSON-LD構造化データのバリデーションとSchema.org準拠チェック

**主な機能:**
- スキーマタイプ検証（JobPosting, BlogPosting, Article, Product等）
- 必須プロパティチェック
- データ型検証（URL、日付、数値）
- @graph構造のサポート

**使用例:**
```
/schema-validator https://example.com
```

---

### 2. SEO Analyzer (`/seo-analyzer`)
WebページのSEO総合分析とスコアリング

**主な機能:**
- メタタグ分析（title, description, canonical等）
- SNS最適化チェック（OGP, Twitterカード）
- 構造化データ評価
- 総合SEOガイダンス生成

**スコアリング:**
- メタタグ: 25点
- SNS: 15点
- 構造化データ: 20点
- 総合: 100点

**使用例:**
```
/seo-analyzer https://example.com
```

---

### 3. Frontend Module (`/frontend-module`)
Vanilla JavaScriptモジュール開発支援

**主な機能:**
- ES6+モジュールパターン実装
- DOM操作効率化
- イベント管理ベストプラクティス
- シングルトン/IIFEパターン

**プロジェクトの既存モジュール:**
- `seo-analyzer.js` - SEO分析
- `schema-requirements.js` - スキーマ要件
- `guidance-provider.js` - ガイダンス生成
- `ui-renderer.js` - UI描画

**使用例:**
```
/frontend-module SchemaParser "JSON-LDをパースして構造化データを抽出"
```

---

### 4. Accessibility (`/accessibility`)
Webアクセシビリティ改善提案

**主な機能:**
- WCAG 2.1準拠チェック
- キーボードナビゲーション改善
- ARIA属性の適切な使用
- スクリーンリーダー対応

**チェック項目:**
- キーボードナビゲーション
- ARIA属性（aria-label, aria-modal等）
- セマンティックHTML
- フォーカス管理
- 色とコントラスト

**使用例:**
```
/accessibility public/index.html
```

---

### 5. UI Component (`/ui-component`)
レスポンシブUIコンポーネント作成支援

**主な機能:**
- Material Design 3準拠
- ダークモード対応
- レスポンシブデザイン
- 再利用可能なコンポーネント設計

**デザインシステム:**
- カラーパレット（ライト/ダーク）
- タイポグラフィ
- スペーシング
- アニメーション

**コンポーネント例:**
- ボタン（filled, outlined, text）
- カード
- モーダル/ダイアログ
- フォーム要素

**使用例:**
```
/ui-component Modal "SEO分析結果を表示するモーダル"
```

---

## Skillsの使い方

### 基本的な使用方法
```bash
# Skillを呼び出す
/skill-name [引数]

# 例: Schema Validatorでスキーマ検証
/schema-validator https://example.com/job

# 例: SEO Analyzerで総合分析
/seo-analyzer https://example.com
```

### 組み合わせ使用
```bash
# 1. SEO分析を実行
/seo-analyzer https://example.com

# 2. 問題があればアクセシビリティチェック
/accessibility public/index.html

# 3. 新しいUIコンポーネントが必要なら作成
/ui-component ResultCard "分析結果を表示するカード"
```

---

## プロジェクト固有の最適化

### SEO分析ツールの開発フロー

#### 1. スキーマ追加時
```
/schema-validator [新しいスキーマタイプ]
→ schema-requirements.js に要件を追加
→ seo-analyzer.js でスコアリング実装
```

#### 2. UI改善時
```
/accessibility [対象ファイル]
→ 問題点の特定
→ /ui-component [コンポーネント名]
→ アクセシブルなUIを実装
```

#### 3. モジュール追加時
```
/frontend-module [モジュール名] [機能]
→ public/modules/ にファイル作成
→ 単一責任の原則に従う
→ 既存モジュールとの統合
```

---

## ベストプラクティス

### コードスタイル
- ES6+の機能を使用
- 説明的な変数名
- JSDocコメント追加
- エラーハンドリング必須

### モジュール設計
- 単一責任の原則
- 明確なAPI設計
- 依存関係の最小化
- テスタビリティ確保

### UI/UX
- Material Design 3準拠
- レスポンシブデザイン
- ダークモード対応
- アクセシビリティ配慮

### SEO
- Schema.org最新仕様に準拠
- Google推奨のベストプラクティス
- リッチリザルト対応
- Core Web Vitals最適化

---

## 参考リンク

### 公式ドキュメント
- [Schema.org](https://schema.org/)
- [Google構造化データガイド](https://developers.google.com/search/docs/appearance/structured-data)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)

### プロジェクト関連
- [CLAUDE.md](../../CLAUDE.md) - プロジェクトガイド
- [.ai-docs/shared/PROJECT_OVERVIEW.md](../../.ai-docs/shared/PROJECT_OVERVIEW.md)
- [.ai-docs/shared/DEVELOPMENT_WORKFLOW.md](../../.ai-docs/shared/DEVELOPMENT_WORKFLOW.md)

---

## 貢献

新しいSkillの追加や既存Skillの改善は歓迎します。

### Skillファイルの構造
```markdown
# Skill Name

簡潔な説明

## 目的
- 箇条書きで目的を列挙

## 使用方法
コマンド例

## 主な機能
具体的な機能説明

## 関連ファイル
プロジェクト内の関連ファイル

## 参照
外部リンク
```

---

最終更新: 2025-10-20
