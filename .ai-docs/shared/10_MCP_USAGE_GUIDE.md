# MCP (Model Context Protocol) 使用ガイド

## 概要

このプロジェクトでは、Context7とMUI MCPサーバーが利用可能です。これらを活用することで、最新のライブラリドキュメントにすぐアクセスでき、開発効率が大幅に向上します。

## 利用可能なMCPサーバー

### 1. Context7

最新のライブラリドキュメントとコード例を取得できます。

**使用例**:

```
Context7でExpressの最新ドキュメントを取得して
```

**対象ライブラリ**:

- Express.js
- OpenAI API
- Axios
- Vercel
- その他npm上のほぼすべてのライブラリ

### 2. MUI MCP

Material-UIの公式ドキュメントを取得できます（将来的にUIを追加する場合）。

**使用例**:

```
MUIのButtonコンポーネントの使用方法を教えて
```

## このプロジェクトでよく使うライブラリ

### バックエンド

#### Express.js

**Context7 ID**: `/expressjs/express`

**よくある質問**:

- ミドルウェアの実装方法
- エラーハンドリングのベストプラクティス
- CORSの設定方法
- ストリーミングレスポンスの実装

**使用例**:

```
Context7で/expressjs/expressのミドルウェア実装方法を取得
```

#### OpenAI API

**Context7 ID**: `/openai/openai-node`

**よくある質問**:

- ストリーミングの実装方法
- エラーハンドリング
- レート制限の扱い方
- 最新モデル（GPT-4.1, GPT-5）の使用方法

**使用例**:

```
Context7で/openai/openai-nodeのストリーミング実装を取得
```

#### Axios

**Context7 ID**: `/axios/axios`

**よくある質問**:

- タイムアウト設定
- エラーハンドリング
- リトライロジックの実装
- プロキシ設定

**使用例**:

```
Context7で/axios/axiosのタイムアウト設定方法を取得
```

### デプロイ

#### Vercel

**Context7 ID**: `/vercel/vercel`

**よくある質問**:

- サーバーレス関数の制約
- 環境変数の設定
- ビルド設定
- カスタムドメイン設定

**使用例**:

```
Context7で/vercel/vercelのサーバーレス関数の制約を取得
```

## 効果的な使い方

### 1. 新機能実装時

```
Context7で/expressjs/expressのServer-Sent Events実装方法を取得
```

実装前に最新のベストプラクティスを確認できます。

### 2. エラー解決時

```
Context7で/openai/openai-nodeのRateLimitErrorの対処法を取得
```

エラーメッセージを元に、公式ドキュメントから解決策を検索できます。

### 3. パフォーマンス改善時

```
Context7で/axios/axiosのコネクションプール設定を取得
```

パフォーマンス最適化のための情報をすぐに取得できます。

### 4. セキュリティ強化時

```
Context7で/expressjs/expressのセキュリティベストプラクティスを取得
```

セキュリティに関する最新情報を確認できます。

## ワークフロー統合

### コーディング時

1. 機能要件を確認
2. Context7で関連ライブラリのドキュメントを取得
3. 実装
4. code-reviewスキルで品質確認

### トラブルシューティング時

1. エラーメッセージを確認
2. Context7で該当ライブラリのエラーハンドリングを取得
3. 修正実装
4. api-checkスキルで一貫性確認

### デプロイ前

1. deploy-checkスキルで全体確認
2. Context7で/vercel/vercelのデプロイチェックリストを取得
3. 問題があれば修正
4. デプロイ実行

## ベストプラクティス

### DO

- 実装前にContext7でドキュメントを確認
- 最新のAPIリファレンスを参照
- コード例を参考にしながら実装
- セキュリティ関連の情報は必ず確認

### DON'T

- 古いバージョンのドキュメントを参照しない
- 非公式の情報源に頼らない
- ドキュメントを読まずに推測で実装しない

## トラブルシューティング

### MCPサーバーが応答しない

1. Claude Codeを再起動
2. インターネット接続を確認
3. Context7のステータスページを確認

### ライブラリが見つからない

1. Context7 IDを確認（組織名/プロジェクト名形式）
2. npmパッケージ名で検索
3. 代替のドキュメントソースを探す

## 参考資料

### Context7

- [Context7公式サイト](https://context7.com/)
- 使用可能なライブラリ一覧は自動更新されます

### MCP プロトコル

- [Model Context Protocol仕様](https://modelcontextprotocol.io/)

### Chrome DevTools (MCP)

- [AI エージェント用の Chrome DevTools（MCP） | Blog | Chrome for Developers](https://developer.chrome.com/blog/chrome-devtools-mcp?hl=ja)

## 次のステップ

### フェーズ3: 開発ワークフロー改善

- GitHub Actionsの設定
- pre-commit hooksの追加
- 自動テストの導入

### 将来的な拡張

- カスタムMCPサーバーの作成
- プロジェクト固有のドキュメントサーバー
- 社内APIドキュメントの統合

---

最終更新: 2025-11-02
