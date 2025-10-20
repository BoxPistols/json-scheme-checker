# Schema Validator Skill

JSON-LD構造化データのバリデーションとSchema.org準拠チェックを行うスキル

## 目的

- JSON-LD構造化データの検証
- Schema.orgスキーマタイプごとの必須プロパティチェック
- スキーマのベストプラクティス提案
- エラーと警告の詳細レポート生成

## 使用方法

```
/schema-validator [URL または JSON-LDデータ]
```

## 主な機能

### 1. スキーマタイプ検証
- JobPosting, BlogPosting, Article, Product, Organization, Person, WebPage, WebSite, BreadcrumbList, Event, LocalBusiness, FAQ など

### 2. 必須プロパティチェック
各スキーマタイプの必須フィールドが存在するか確認

### 3. データ型検証
- URL形式
- 日付形式（ISO 8601）
- 数値範囲
- 列挙型の値

### 4. 構造チェック
- @context, @type の存在
- @graph構造のサポート
- ネストされたスキーマの検証

## 出力形式

```json
{
  "valid": true/false,
  "schemaType": "JobPosting",
  "score": 85,
  "errors": [
    {
      "field": "datePosted",
      "message": "必須フィールドが不足しています",
      "severity": "error"
    }
  ],
  "warnings": [
    {
      "field": "salary",
      "message": "推奨フィールドの追加を検討してください",
      "severity": "warning"
    }
  ],
  "suggestions": [
    "baseSalaryフィールドの追加でSEO効果向上",
    "employmentTypeを明示することで検索精度向上"
  ]
}
```

## 関連ファイル

- `public/modules/schema-requirements.js` - スキーマ要件定義
- `public/modules/seo-analyzer.js` - 分析ロジック
- `app.js` - バックエンドAPI

## 参照

- [Schema.org公式ドキュメント](https://schema.org/)
- [Google構造化データガイド](https://developers.google.com/search/docs/appearance/structured-data)
