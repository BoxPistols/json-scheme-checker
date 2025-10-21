# Development Workflow

## コマンドリファレンス

### 開発サーバー起動

```bash
# 自動再起動付き開発サーバー
pnpm dev

# 本番モードで起動
pnpm start
```

### デプロイメント

```bash
# Vercelプレビューデプロイ
vercel

# Vercel本番デプロイ
vercel --prod

# Git経由の自動デプロイ
git push origin main  # mainブランチへのpushで自動デプロイ
```

### テスト・確認

```bash
# ヘルスチェック
curl http://localhost:3333/health

# プロキシ動作確認
curl "http://localhost:3333/proxy?url=https://example.com"

# JSON-LD抽出テスト
curl -X POST http://localhost:3333/extract-jsonld \
  -H "Content-Type: application/json" \
  -d '{"url": "https://schema.org"}'
```

### ポート管理

```bash
# ポート3333を使用中のプロセス確認
lsof -i :3333

# プロセスをkill
lsof -i :3333 | grep LISTEN | awk '{print $2}' | xargs kill
```

---

## Git ワークフロー

### ブランチ戦略

- **main** - 本番環境（Vercel自動デプロイ）
- 機能開発は mainから直接 または feature ブランチ

### コミットメッセージ規約

```bash
# 機能追加
git commit -m "Add password visibility toggle for Basic auth"

# バグ修正
git commit -m "Fix Vercel serverless function configuration"

# ドキュメント
git commit -m "Update README with mobile access instructions"

# リファクタリング
git commit -m "Refactor JSON-LD extraction logic"
```

---

## 開発環境

### ローカル開発

```bash
# 1. 依存関係インストール
pnpm install

# 2. サーバー起動
pnpm dev

# 3. ブラウザでアクセス
open http://localhost:3333
```

### マルチデバイステスト

#### PC（同一マシン）

```plaintext
http://localhost:3333
```

#### iPhone/Android（同じWiFi内）

```bash
# ローカルIPアドレスを確認
ifconfig | grep "inet " | grep -v 127.0.0.1

# 例: http://192.168.0.89:3333
```

**注意**: PCのファイアウォールでポート3333を許可する必要がある場合あり

---

## デバッグ方法

### サーバーログ確認

```bash
# ローカル開発時
pnpm dev
# → コンソールにリクエストログが表示される

# Vercelデプロイ時
vercel logs
```

### クライアントデバッグ

```javascript
// ブラウザのコンソールで
console.log('Environment:', isVercel ? 'Vercel' : 'Local');
console.log('Proxy URL:', PROXY_SERVER);
```

### ネットワークタブ

1. ブラウザのDeveloper/無制限ツールを開く（F12）
2. Networkタブを選択
3. `/api/proxy` または `/proxy` のリクエストを確認
4. Response タブでHTMLを確認
5. Headers タブで認証ヘッダーを確認

---

## コード修正時の注意点

### server.js 修正時

```bash
# nodemon使用時は自動再起動
pnpm dev

# 手動再起動の場合
# Ctrl+C で停止 → pnpm start で再起動
```

### public/index.html 修正時

```bash
# 静的ファイルなので再起動不要
# ブラウザをリロード（Cmd+R / Ctrl+R）
```

### api/\*.js 修正時（Vercel Functions）

```bash
# ローカルテストは不可（Vercel環境専用）
# vercel dev でローカルテスト可能（推奨）
vercel dev

# または git push でデプロイして確認
git push origin main
```

---

## 環境変数

### ローカル用環境変数

```bash
PORT=3333
NODE_ENV=development
```

### Vercel環境

Vercelダッシュボードで設定:

- `NODE_ENV=production` （自動設定）
- カスタム変数は不要

---

## パフォーマンステスト

### レスポンスタイム測定

```bash
# curl でタイミング測定
time curl "http://localhost:3333/proxy?url=https://example.com"

# より詳細な測定
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3333/proxy?url=https://example.com"
```

`curl-format.txt` の内容:

```bash
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
```

---

## トラブルシューティング

### 問題: ポート3333が使用中

```bash
# 原因: 別のプロセスが起動している
lsof -i :3333

# 解決: プロセスをkill
kill $(lsof -t -i:3333)
```

### 問題: CORS エラー

```bash
# 原因: プロキシサーバーが起動していない
# 解決: サーバーを起動
pnpm start
```

### 問題: Basic認証が通らない

```bash
# デバッグ: サーバーログを確認
pnpm dev
# → "Using Basic Authentication for user: xxx" を確認
# → "Response status: 401" なら認証情報が誤り
```

### 問題: Vercelデプロイが失敗

```bash
# ログ確認
vercel logs

# 再デプロイ
vercel --prod --force

# ビルドログ確認
vercel inspect [deployment-url]
```

---

## コードレビューチェックリスト

### 新機能追加時

- [ ] ローカル環境でテスト (`pnpm dev`)
- [ ] Vercel環境でテスト (`vercel dev` または本番デプロイ)
- [ ] エラーハンドリング追加
- [ ] コンソールログで動作確認
- [ ] README.md 更新（必要に応じて）

### バグ修正時

- [ ] 再現手順を確認
- [ ] 修正後に再現しないことを確認
- [ ] 関連する機能が壊れていないか確認
- [ ] エッジケースをテスト

### リファクタリング時

- [ ] 既存の動作が変わっていないことを確認
- [ ] パフォーマンスが悪化していないか確認
- [ ] コードの可読性が向上しているか確認

---

## デプロイ前チェックリスト

- [ ] `pnpm start` でローカル起動確認
- [ ] サンプルURLでJSON-LD抽出成功
- [ ] Basic認証が動作確認
- [ ] エラーメッセージが適切に表示
- [ ] モバイル表示確認（レスポンシブ）
- [ ] コンソールエラーがない
- [ ] Vercelデプロイ後の動作確認

---

## 推奨する開発フロー

1. **機能設計** → 必要な変更を整理
2. **ローカル開発** → `pnpm dev` で開発
3. **動作確認** → サンプルURLでテスト
4. **コミット** → 明確なコミットメッセージ
5. **プッシュ** → `git push origin main`
6. **Vercel確認** → 自動デプロイを確認
7. **本番テスト** → <https://json-ld-view.vercel.app/> で確認

---

## 便利なVSCodeスニペット

### JavaScript関数テンプレート

```javascript
/**
 * 関数の説明
 * @param {Type} paramName - パラメータの説明
 * @returns {Type} 戻り値の説明
 */
function functionName(paramName) {
  // 実装
}
```

### エラーハンドリングテンプレート

```javascript
try {
  // リスク含む処理
} catch (error) {
  console.error('Error in functionName:', error);
  showError(`エラーが発生しました: ${error.message}`);
}
```

---

## パフォーマンス最適化のヒント

1. **画像の遅延読み込み**

   ```html
   <img loading="lazy" src="..." />
   ```

2. **不要なコンソールログを削除**

   ```javascript
   // 本番環境では削除
   if (process.env.NODE_ENV === 'development') {
     console.log('Debug info');
   }
   ```

3. **タイムアウト設定を適切に**

   ```javascript
   // 長時間実行が必要な場合はタイムアウトを調整
   timeout: 30000; // 30秒
   ```
