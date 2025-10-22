# JSON-LD Schema Viewer - ドキュメント

## クイックリンク

| ドキュメント | 対象者 | 概要 |
|---------|------|------|
| **[プロジェクト概要](./01_PROJECT.md)** | 全員 | 機能・技術スタック・構成 |
| **[アーキテクチャ](./02_ARCHITECTURE.md)** | 開発者 | CORSプロキシ・環境判定・データフロー |
| **[開発ワークフロー](./03_WORKFLOW.md)** | 開発者 | コマンド・Git・テスト・デバッグ |
| **[Advisor機能](./04_FEATURES.md#advisor)** | 開発者 | JobPosting分析機能 |
| **[Blog Reviewer機能](./04_FEATURES.md#blog)** | 開発者 | Article/BlogPosting分析機能 |
| **[セキュリティ](./05_SECURITY.md)** | 全員 | レート制限・CORS・XSS対策 |

## よく使うコマンド

```bash
# 開発サーバー起動（自動再起動付き）
pnpm dev

# Vercel本番デプロイ
vercel --prod

# テスト・ログ確認
curl http://localhost:3333/health
```

## この構成について

- **端的かつ簡潔**: 詳細は各ドキュメントで
- **相互リンク**: 必要に応じてドキュメント間でリンク
- **AIエージェント対応**: 自動処理しやすい形式

---

**最終更新**: 2025-10-22
