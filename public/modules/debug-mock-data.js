/**
 * デバッグ用モックデータ
 * AIアドバイスを毎回呼び出さなくても、アドバイザー画面の動作確認ができる
 */

const DEBUG_MOCK_DATA = {
  // JobPosting Advisor用モックデータ
  jobPosting: {
    sample1: {
      name: 'フロントエンドエンジニア募集',
      data: {
        '@type': 'JobPosting',
        title: 'フロントエンドエンジニア',
        description:
          'React/TypeScriptを使用したWebアプリケーション開発。モダンなフロントエンド技術を活用し、ユーザー体験の向上に貢献していただきます。',
        hiringOrganization: {
          '@type': 'Organization',
          name: 'テクノロジー株式会社',
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: '東京都渋谷区',
            addressCountry: 'JP',
          },
        },
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: 'JPY',
          value: {
            '@type': 'QuantitativeValue',
            value: 6000000,
            unitText: 'YEAR',
          },
        },
        employmentType: 'FULL_TIME',
      },
      mockAnalysis: {
        employer: `## 採用成功のための分析

### 強み
- **モダン技術スタック**: React/TypeScriptは人気の高い技術
- **明確な年収提示**: 600万円と具体的な金額を提示

### 改善ポイント
1. **職務内容の具体化**
   - プロジェクトの規模や担当範囲を明記
   - 使用する具体的なツールやライブラリを列挙

2. **キャリアパスの提示**
   - 成長機会やスキルアップの支援制度を追加
   - チームの規模や開発体制を説明

3. **企業文化のアピール**
   - リモートワークの可否
   - フレックスタイム制度の有無
   - チームの雰囲気や働き方

### 推奨アクション
- 「ユーザー体験の向上」の具体例を3つ以上追加
- 福利厚生の詳細を記載
- 応募方法と選考フローを明確化`,
        applicant: `## 応募者視点での分析

### この求人の魅力
- **人気技術**: React/TypeScriptは市場価値の高いスキル
- **年収水準**: 600万円は経験次第では妥当な水準

### 確認すべきポイント
1. **技術スタック**
   - React/TypeScript以外に何を使うか？
   - テスト環境は整っているか？
   - CI/CDは導入されているか？

2. **働き方**
   - リモートワーク可能か？
   - 勤務時間の柔軟性は？
   - 残業時間の実態は？

3. **キャリア**
   - 技術的な成長機会はあるか？
   - 評価制度は明確か？
   - 昇給・昇格の仕組みは？

### 面接で質問すべきこと
- プロジェクトの技術的な課題
- チームの開発プロセス
- コードレビューの文化`,
      },
    },
    sample2: {
      name: 'バックエンドエンジニア募集',
      data: {
        '@type': 'JobPosting',
        title: 'バックエンドエンジニア（Node.js）',
        description:
          'Node.js/Express.jsを使用したAPIサーバー開発。大規模トラフィックに対応できるスケーラブルなシステムの設計・実装を担当していただきます。',
        hiringOrganization: {
          '@type': 'Organization',
          name: 'スタートアップ株式会社',
        },
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: '東京都港区',
            addressCountry: 'JP',
          },
        },
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: 'JPY',
          value: {
            '@type': 'QuantitativeValue',
            minValue: 7000000,
            maxValue: 10000000,
            unitText: 'YEAR',
          },
        },
        employmentType: 'FULL_TIME',
      },
      mockAnalysis: {
        employer: `## 採用成功のための分析

### 強み
- **給与レンジの明示**: 700-1000万円と幅を持たせた提示
- **技術的チャレンジ**: 大規模トラフィック対応は魅力的

### 改善ポイント
1. **具体的な技術要件**
   - 必須スキルと歓迎スキルを分けて記載
   - 経験年数の目安を提示

2. **開発環境の詳細**
   - インフラ構成（AWS/GCP等）
   - データベース（PostgreSQL/MongoDB等）
   - 監視・ログ基盤

3. **チーム情報**
   - エンジニア数
   - 開発手法（スクラム/カンバン等）
   - オンボーディング体制`,
        agent: `## エージェント視点での分析

### マッチング戦略
1. **ターゲット候補者**
   - Node.js経験3年以上のエンジニア
   - スタートアップ経験者
   - スケーラビリティに関心がある人材

2. **訴求ポイント**
   - 給与レンジの上限が高い（1000万円）
   - 技術的チャレンジの機会
   - スタートアップの成長性

3. **懸念事項**
   - 開発環境の詳細が不明
   - チーム規模が不明
   - オンコール対応の有無が不明

### 推奨改善
- 技術スタックの全体像を図示
- チームメンバーのプロフィール公開
- 1日のスケジュール例を提示`,
      },
    },
  },

  // Blog Reviewer用モックデータ
  blog: {
    sample1: {
      name: 'React Hooksの使い方',
      data: {
        '@type': 'BlogPosting',
        headline: 'React Hooksの基本的な使い方',
        articleBody:
          'React Hooksは関数コンポーネントで状態管理や副作用を扱うための機能です。useStateやuseEffectなどの基本的なHooksの使い方を解説します。',
        author: {
          '@type': 'Person',
          name: '山田太郎',
        },
        datePublished: '2024-01-15',
      },
      mockAnalysis: `## ブログ記事レビュー

### 良い点
- **タイムリーなトピック**: React Hooksは現在の主流
- **基本に焦点**: 初心者向けとして適切

### 改善ポイント

#### 1. SEO最適化
- タイトルに年度を追加：「2024年版 React Hooksの基本的な使い方」
- メタディスクリプションを追加
- 内部リンクを増やす

#### 2. コンテンツの充実
- **コード例を追加**: 最低3つの実践的な例
- **図解を追加**: Hooksのライフサイクルを視覚化
- **よくある間違い**: アンチパターンを解説

#### 3. 構成の改善
- 目次を追加
- セクションを明確に分ける
- まとめセクションを追加

#### 4. エンゲージメント向上
- 読者へのQ&A追加
- 関連記事へのリンク
- SNSシェアボタン

### 推奨追加コンテンツ
1. useStateの詳細な使い方
2. useEffectのクリーンアップ
3. カスタムHooksの作り方
4. パフォーマンス最適化のヒント`,
    },
    sample2: {
      name: 'TypeScript入門',
      data: {
        '@type': 'BlogPosting',
        headline: 'TypeScript入門：型安全なJavaScript開発',
        articleBody:
          'TypeScriptは型システムを持つJavaScriptのスーパーセットです。静的型付けによるコードの品質向上と開発効率の改善について解説します。',
        author: {
          '@type': 'Person',
          name: '佐藤花子',
        },
        datePublished: '2024-02-01',
      },
      mockAnalysis: `## ブログ記事レビュー

### 強み
- **重要トピック**: TypeScriptは需要が高い
- **実用的**: 開発効率の改善に焦点

### 改善提案

#### SEO戦略
- **キーワード最適化**
  - 「TypeScript 入門」
  - 「型安全 JavaScript」
  - 「TypeScript メリット」

#### コンテンツ強化
1. **実例を追加**
   - ビフォー・アフター比較
   - 型エラーの具体例
   - リファクタリング事例

2. **ツール紹介**
   - エディタ設定（VS Code）
   - tsconfig.jsonの解説
   - デバッグ方法

3. **学習リソース**
   - 公式ドキュメント
   - おすすめチュートリアル
   - 練習問題

#### 読者エンゲージメント
- コメント欄での質問受付
- Twitter/GitHubでのフォローアップ
- 次回記事の予告`,
    },
  },

  // Web Advisor用モックデータ
  web: {
    sample1: {
      name: 'ECサイトのページ',
      data: {
        url: 'https://example-shop.com/products/123',
        title: '商品詳細ページ - Example Shop',
        ogTitle: '【公式】高品質Tシャツ | Example Shop',
        ogDescription: '肌触りの良い高品質なTシャツ。送料無料、即日発送対応。',
        twitterCard: 'summary_large_image',
        schemas: [
          {
            '@type': 'Product',
            name: '高品質Tシャツ',
            offers: {
              '@type': 'Offer',
              price: 2980,
              priceCurrency: 'JPY',
            },
          },
        ],
      },
      mockAnalysis: `## Webページ分析レポート

### メタデータ評価

#### Open Graph（OG）タグ
- **og:title**: ✅ 適切（ブランド名含む）
- **og:description**: ✅ 魅力的（送料無料を強調）
- **og:image**: ⚠️ 要確認（設定されているか不明）

#### Twitter Card
- **card type**: ✅ summary_large_image（推奨）
- **twitter:title**: ❌ 未設定（OGとは別に設定推奨）
- **twitter:description**: ❌ 未設定

### JSON-LD構造化データ

#### Product Schema
- **価格情報**: ✅ 正しく設定
- **在庫状況**: ❌ 未設定（追加推奨）
- **レビュー**: ❌ 未設定（信頼性向上のため推奨）

### 改善提案

#### 1. メタデータ強化
\`\`\`html
<meta property="og:image" content="https://example-shop.com/images/tshirt-main.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:title" content="高品質Tシャツ｜肌触り抜群">
<meta name="twitter:description" content="送料無料・即日発送。レビュー★4.8">
\`\`\`

#### 2. 構造化データ拡張
\`\`\`json
{
  "@type": "Product",
  "name": "高品質Tシャツ",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "127"
  },
  "offers": {
    "@type": "Offer",
    "price": "2980",
    "priceCurrency": "JPY",
    "availability": "https://schema.org/InStock"
  }
}
\`\`\`

#### 3. SEO最適化
- レビュースキーマの追加
- FAQ schemaの検討
- Breadcrumb schemaの実装`,
    },
  },
};

// デバッグモードが有効かどうかを判定
function isDebugMode() {
  // localhost環境で /debug パスにアクセスした場合のみデバッグモードを有効化
  const isLocalhost =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const isDebugPath = window.location.pathname === '/debug';
  return isLocalhost && isDebugPath;
}

// デバッグ用のログ出力
function debugLog(...args) {
  if (isDebugMode()) {
    console.log('[DEBUG]', ...args);
  }
}

// グローバルに公開
window.DEBUG_MOCK_DATA = DEBUG_MOCK_DATA;
window.isDebugMode = isDebugMode;
window.debugLog = debugLog;
