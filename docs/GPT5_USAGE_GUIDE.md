# GPT-5-nano 使用ガイド

このドキュメントでは、本サービスでGPT-5-nanoを使用する方法を説明します。

最終更新: 2025-11-02

---

## 対応状況

### バックエンド

すべてのAPIエンドポイントでGPT-5シリーズに対応済みです：

- `api/advisor.js`: 求人票アドバイザー
- `api/web-advisor.js`: Webページアドバイザー
- `api/blog-reviewer.js`: ブログ記事レビュー

GPT-5シリーズの場合、`temperature`パラメータを自動的に除外する実装が完了しています。

### フロントエンド

料金計算ロジック（`public/modules/base-advisor.js`）にGPT-5シリーズの料金情報を追加済みです。

---

## 使用方法

### 方法1: 環境変数でデフォルトモデルを変更

`.env`ファイルでデフォルトモデルを設定できます：

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-5-nano  # デフォルトをGPT-5-nanoに変更
```

この設定により、すべてのAPIリクエストでGPT-5-nanoが使用されます。

### 方法2: リクエストごとにモデルを指定

フロントエンドから個別のリクエストでモデルを指定できます。

#### 例1: Advisor API（求人票アドバイザー）

```javascript
const response = await fetch('/api/advisor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobPosting: { /* 求人データ */ },
    mode: 'employer',
    model: 'gpt-5-nano',  // モデルを指定
  }),
});
```

#### 例2: Web Advisor API（Webページアドバイザー）

```javascript
const response = await fetch('/api/web-advisor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://example.com',
    model: 'gpt-5-nano',  // モデルを指定
  }),
});
```

#### 例3: Blog Reviewer API（ブログ記事レビュー）

```javascript
const response = await fetch('/api/blog-reviewer', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    article: {
      title: '記事タイトル',
      body: '記事本文...',
    },
    model: 'gpt-5-nano',  // モデルを指定
  }),
});
```

### 方法3: ユーザーのAPIキーを使用

フロントエンドからユーザー独自のAPIキーとモデルを指定できます：

```javascript
const response = await fetch('/api/advisor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    jobPosting: { /* 求人データ */ },
    mode: 'employer',
    userApiKey: 'sk-user-api-key',  // ユーザーのAPIキー
    model: 'gpt-5-nano',  // モデルを指定
  }),
});
```

この方法では、レート制限が適用されず、無制限に利用できます。

---

## GPT-5シリーズの特徴

### gpt-5-nano

- **料金**: $1.25/1M 入力トークン、$10/1M 出力トークン
- **特徴**: 超低レイテンシ、リアルタイムアプリケーション向け
- **用途**: チャットボット、自動補完、高速レスポンスが必要な場面

### gpt-5-mini（推定）

- **料金**: $3.00/1M 入力トークン、$15/1M 出力トークン（推定）
- **特徴**: バランス型
- **用途**: 一般的なタスク

### gpt-5（推定）

- **料金**: $10.00/1M 入力トークン、$30/1M 出力トークン（推定）
- **特徴**: 最高品質
- **用途**: 複雑な推論、高品質な文章生成

---

## GPT-5の制限事項

GPT-5シリーズでは、以下のパラメータがサポートされていません：

- `temperature`: デフォルト値（1）のみサポート
- `top_p`: 制限あり
- `frequency_penalty`: 制限あり
- `presence_penalty`: 制限あり

本サービスのバックエンドでは、GPT-5シリーズの場合に自動的に`temperature`を除外しているため、エラーは発生しません。

---

## コスト比較

以下は、10,000トークンの入力と5,000トークンの出力を行った場合のコスト比較です：

| モデル | 入力コスト | 出力コスト | 合計（USD） | 合計（JPY） |
|--------|-----------|-----------|------------|------------|
| gpt-4.1-nano | $0.0015 | $0.003 | $0.0045 | ¥0.675 |
| gpt-5-nano | $0.0125 | $0.05 | $0.0625 | ¥9.375 |
| gpt-4o | $0.025 | $0.05 | $0.075 | ¥11.25 |

（1 USD = 150 JPY で換算）

### コスト面での考察

- **gpt-4.1-nano**: 最もコスト効率が良い（gpt-5-nanoの約1/14）
- **gpt-5-nano**: レイテンシ重視の場合に選択（コストは高め）
- **gpt-4o**: 品質重視の場合に選択

---

## 推奨使用ケース

### gpt-4.1-nanoを推奨

- バッチ処理
- コスト重視のアプリケーション
- 温度調整が必要な場合

### gpt-5-nanoを推奨

- リアルタイムチャット
- 対話型アプリケーション
- 低レイテンシが最優先の場合

---

## テスト例

### ローカルでのテスト

プロジェクトルートに`test-gpt5.js`があります：

```bash
node test-gpt5.js
```

このスクリプトは、複数のパターンでGPT-5-nanoをテストします。

### サーバーでのテスト

サーバーを起動して、実際のAPIエンドポイントをテストします：

```bash
pnpm dev

# 別のターミナルで
curl -X POST http://localhost:3333/api/test-connection \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-5-nano"}'
```

---

## トラブルシューティング

### 404エラーが出る

- モデル名を確認: `gpt-5-nano` または `gpt-5-nano-2025-08-07`
- APIキーが正しいか確認

### 400エラーが出る

- バックエンドのバージョンを確認（GPT-5対応済みか）
- ログを確認して、詳細なエラーメッセージを確認

### 料金が正しく表示されない

- フロントエンドの料金計算ロジック（`public/modules/base-advisor.js`）が最新か確認
- ブラウザのキャッシュをクリア

---

## 参考リンク

- [OpenAI Platform - GPT-5 Models](https://platform.openai.com/docs/models/gpt-5)
- [プロジェクト内の料金ガイド](./MODEL_PRICING.md)
- [テストスクリプト](../test-gpt5.js)
- [使用例](../examples/)
