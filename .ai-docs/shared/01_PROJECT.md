# プロジェクト概要

## 一文説明

Webサイトから JSON-LD構造化データを抽出・可視化するツール。CORS制限を回避可能。

**本番URL**: https://json-ld-view.vercel.app/

---

## 技術スタック

| 層             | 技術                                 |
| -------------- | ------------------------------------ |
| フロントエンド | Vanilla JS + HTML5/CSS3              |
| バックエンド   | Node.js + Express.js                 |
| ホスティング   | Vercel（サーバーレス）+ ローカル開発 |
| HTTP           | Axios、DOMParser API                 |

---

## プロジェクト構成

```plaintext
json-ld-viewer/
├── server.js              # ローカル開発用Expressサーバー
├── package.json
├── vercel.json            # Vercelデプロイ設定
├── api/
│   ├── proxy.js           # プロキシエンドポイント
│   ├── health.js          # ヘルスチェック
│   ├── blog-reviewer.js   # Article/BlogPosting分析API
│   └── advisor.js         # JobPosting分析API
├── public/
│   ├── index.html         # Webアプリケーション（SPA）
│   ├── styles.css
│   ├── app.js             # メインロジック
│   ├── utils/             # ユーティリティ層
│   ├── modules/           # 分析モジュール
│   └── components/        # UIコンポーネント
└── .ai-docs/              # AI向けドキュメント
```

---

## 主要機能

1. **CORS回避プロキシ** - サーバーサイドでHTMLを取得
2. **JSON-LD自動抽出** - `<script type="application/ld+json">` を検出
3. **デュアル表示** - テーブルビュー / JSONビュー
4. **Basic認証対応** - ステージング環境へのアクセス
5. **SEO分析** - メタタグ、OGP、構造化データチェック
6. **JobPosting分析** - 採用側/応募者向けアドバイス
7. **Blog分析** - 記事コンテンツのSEO/EEAT評価

---

## サポートするSchema

- JobPosting
- Article / BlogPosting
- BreadcrumbList
- Product
- FAQPage
- HowTo
- Event
- LocalBusiness
- Organization
- WebSite
- VideoObject
- Recipe

---

## 関連ドキュメント

- **[アーキテクチャ](./02_ARCHITECTURE.md)** - CORS回避の仕組み
- **[開発ワークフロー](./03_WORKFLOW.md)** - コマンド・デバッグ方法
- **[セキュリティ](./05_SECURITY.md)** - レート制限・CORS設定

---

**最終更新**: 2025-10-22
