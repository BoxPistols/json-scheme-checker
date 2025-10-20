# SEO Analyzer Skill

WebページのSEO総合分析とスコアリングを行うスキル

## 目的

- メタタグ分析とスコアリング
- SNS（OGP/Twitterカード）最適化チェック
- 構造化データ評価
- 総合SEO改善ガイダンス生成

## 使用方法

```
/seo-analyzer [URL]
```

## 分析項目

### 1. メタタグスコア（25点満点）

- title（5点）- 存在、長さ（30-60文字推奨）
- description（5点）- 存在、長さ（120-160文字推奨）
- keywords（3点）- 存在
- canonical（4点）- 存在、正しいURL形式
- robots（3点）- 適切な設定
- viewport（3点）- モバイル対応
- charset（2点）- UTF-8指定

### 2. SNSスコア（15点満点）

- OGP（8点）
  - og:title（2点）
  - og:description（2点）
  - og:image（2点）
  - og:url（2点）
- Twitterカード（7点）
  - twitter:card（2点）
  - twitter:title（2点）
  - twitter:description（2点）
  - twitter:image（1点）

### 3. 構造化データスコア（20点満点）

- JSON-LD存在（5点）
- 正しいスキーマタイプ（5点）
- 必須フィールド充足（10点）

### 4. 総合スコア（100点満点）

- メタタグ: 25点
- SNS: 15点
- 構造化データ: 20点
- パフォーマンス: 20点
- アクセシビリティ: 20点

## ガイダンス生成

各項目について、スコアに応じた具体的な改善提案を生成：

- **90点以上**: 優秀 - 微調整のみ
- **70-89点**: 良好 - いくつかの改善推奨
- **50-69点**: 要改善 - 重要な項目を修正
- **50点未満**: 不十分 - 全面的な見直しが必要

## 出力形式

```json
{
  "url": "https://example.com",
  "scores": {
    "meta": 20,
    "sns": 12,
    "structuredData": 15,
    "total": 47
  },
  "meta": {
    "title": { "exists": true, "length": 45, "score": 5 },
    "description": { "exists": true, "length": 150, "score": 5 }
  },
  "guidance": [
    {
      "category": "メタタグ",
      "priority": "高",
      "message": "canonicalタグが不足しています",
      "action": "<link rel=\"canonical\" href=\"...\" /> を追加"
    }
  ]
}
```

## 関連ファイル

- `public/modules/seo-analyzer.js` - SEO分析メインロジック
- `public/modules/guidance-provider.js` - ガイダンス生成
- `public/modules/ui-renderer.js` - UI表示

## 参照

- [Google SEOスターターガイド](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
