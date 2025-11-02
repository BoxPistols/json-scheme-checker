# 開発ワークフロー

## クイックコマンド

```bash
# 開発サーバー起動（自動再起動付き）
pnpm dev

# 本番モード起動
pnpm start

# Vercelデプロイ
vercel --prod

# ローカルテスト
curl http://localhost:3333/health
curl "http://localhost:3333/proxy?url=https://example.com"
```

---

## Git ワークフロー

| ステップ         | コマンド                              |
| ---------------- | ------------------------------------- |
| 機能ブランチ作成 | `git checkout -b feature/xxx`         |
| コミット         | `git commit -m "feat: 説明"`          |
| プッシュ         | `git push origin feature/xxx`         |
| 本番マージ       | `git push origin main` → 自動デプロイ |

**コミット規約**: `feat:`, `fix:`, `docs:`, `refactor:` 等で始める

---

## ポート管理

```bash
# ポート3333確認
lsof -i :3333

# プロセスをkill
kill $(lsof -t -i:3333)
```

---

## ローカルデバッグ

### サーバーログ確認

```bash
pnpm dev
# コンソールにログが表示される
```

### ブラウザデバッグ

1. F12で開発者ツール開く
2. **Network** タブでリクエスト確認
3. `/proxy` のリクエスト確認
4. **Response** タブでHTML確認

### 環境判定確認

```javascript
// ブラウザコンソール
console.log('Proxy URL:', PROXY_SERVER);
console.log('Is Vercel:', isVercel);
```

---

## ローカルマルチデバイステスト

### iPhone/Android（同一WiFi）

```bash
# ローカルIP確認
ifconfig | grep "inet " | grep -v 127.0.0.1

# 例: http://192.168.0.89:3333
```

**注意**: ファイアウォール設定でポート3333を許可

---

## コード修正時の注意

| ファイル            | 再起動     | 方法                            |
| ------------------- | ---------- | ------------------------------- |
| `server.js`         | 必須       | `pnpm dev` で自動or手動再起動   |
| `public/index.html` | 不要       | ブラウザリロード                |
| `api/*.js`          | テスト困難 | `vercel dev` または本番デプロイ |

---

## デプロイ前チェック

```bash
# ローカル起動確認
pnpm start

# ヘルスチェック
curl http://localhost:3333/health

# サンプルURL確認
curl "http://localhost:3333/proxy?url=https://example.com"

# エラーがないか確認
# ブラウザコンソールのエラー確認

# モバイル表示確認
# DevTools での F12 → レスポンシブ表示モード
```

---

## トラブルシューティング

| 問題              | 原因               | 解決                      |
| ----------------- | ------------------ | ------------------------- |
| ポート3333使用中  | 別プロセス起動     | `kill $(lsof -t -i:3333)` |
| CORSエラー        | プロキシなし       | `pnpm dev` で起動         |
| API呼び出し失敗   | OpenAI APIキーなし | `.env` で設定             |
| localhost接続失敗 | IPv6問題           | 自動的に127.0.0.1に変換   |

---

## 環境変数

**ローカル（.env）**:

```
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-nano
```

**Vercel**: ダッシュボードで設定

---

## 関連ドキュメント

- **[アーキテクチャ](./02_ARCHITECTURE.md)** - エンドポイント詳細
- **[セキュリティ](./05_SECURITY.md)** - レート制限・CORS設定
- **[機能詳細](./04_FEATURES.md)** - Blog/Advisor分析

---

**最終更新**: 2025-10-22
