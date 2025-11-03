# テスト実行ガイド

## クイックスタート

### テストを実行する

```bash
# 標準的なテスト実行
pnpm test

# テスト結果の詳細サマリー表示（推奨）
pnpm test:summary

# テスト監視モード（ファイル変更時に自動再実行）
pnpm test:watch
```

## テスト結果の詳細サマリー

`pnpm test:summary` コマンドを使用すると、以下の内容が表示されます：

```
======================================================================
テスト結果の詳細サマリー
======================================================================

新規テスト（求人・Blog・Webページのloading確認）:
──────────────────────────────────────────────────────────────────────
✓ ai-advisor-button-submit.test.js: 12 テスト成功
  - 求人ページ: ボタン表示 + loading確認
  - ブログページ: ボタン表示 + loading確認
  - Webページ: ボタン表示 + loading確認

✓ real-url-schema-detection.test.js: 11 テスト成功
  - 求人URL (JobPosting) スキーマ検出 + loading
  - ブログURL (BlogPosting) スキーマ検出 + loading
  - WebページURL (WebPage) スキーマ検出 + loading
  - URL廃止時のフォールバック対応
  - 複数スキーマの優先度テスト
```

## テストの構成

### 1. ユニットテスト (tests/unit/)

シンプルな機能や判定ロジックの確認：

- `ai-advisor-button-submit.test.js` (12 テスト)
  - 3つのアドバイザーボタン（求人、ブログ、Web分析）の表示確認
  - submit後のloading表示確認

- `app-schema-detection.test.js` (20 テスト)
  - スキーマ型の自動判定ロジック
  - 複数スキーマがある場合の優先度判定

- その他多数（advisor、modal、export等）

### 2. 統合テスト (tests/integration/)

実際のサーバー動作を確認：

- `real-url-schema-detection.test.js` (11 テスト) **[新規]**
  - 求人、ブログ、Webページの3つのURL例を使用
  - スキーマ抽出とボタン表示の確認
  - URL廃止時の警告機能

- `web-advisor-security.test.js` (3 テスト)
  - SSRF対策（プライベートIPブロック）
  - sessionToken検証

- その他（proxy、cors、extract等）

## テスト対象URL

### 新規テスト（3パターン）

| タイプ | URL | スキーマ | ボタン |
|-------|-----|---------|-------|
| 求人 | https://freelance.levtech.jp/project/detail/28421/ | JobPosting | 求人/求職アドバイスを受ける |
| ブログ | https://www.engineer-factory.com/media/skill/4878/ | BlogPosting | ブログ記事レビュー |
| Web | https://levtech.jp/media/article/focus/detail_680/ | WebPage | Webページ分析を受ける |

## セキュリティテストの詳細

### SSRF対策（Server-Side Request Forgery）

以下のアクセスは **403 Forbidden** で拒否されます：

- localhost (127.0.0.1, ::1)
- AWS EC2メタデータサーバー (169.254.169.254)
- プライベートIPレンジ:
  - 10.0.0.0 ~ 10.255.255.255
  - 192.168.0.0 ~ 192.168.255.255
  - 172.16.0.0 ~ 172.31.255.255

**実装箇所**: `api/web-advisor.js:568-589`

### sessionToken検証

無効な sessionToken を指定すると **400 Bad Request** で拒否：

```javascript
// 例: 無効なトークン
curl "http://localhost:3333/api/web-advisor?url=https://example.com&sessionToken=invalid"

// レスポンス
400: Invalid or expired sessionToken
```

### レート制限

認証なしの場合、24時間で10リクエスト制限：

```
Status: 429 Too Many Requests
Headers:
  - Retry-After: (秒数)
  - X-RateLimit-Remaining: 0
  - X-RateLimit-Reset: (リセット時刻)
```

認証あり（有効なAPIキー）の場合は制限なし。

## テスト結果の見方

### テストパス結果

```
✓ tests/integration/real-url-schema-detection.test.js (11 tests) 33ms
```

- ✓: テストが成功
- `(11 tests)`: 11個のテストケースすべてが成功
- `33ms`: 実行時間

### テスト失敗時

```
✗ tests/unit/example.test.js > Test Name
  AssertionError: expected true to equal false
```

- ✗: テストが失敗
- エラーメッセージが表示されるため、確認して修正

## URL廃止時の対応

### 状況1: テストが失敗する場合

```bash
pnpm test
```

実行時に以下のエラーが表示される場合、URLが廃止された可能性：

```
[URL廃止警告] 求人ページテスト: https://freelance.levtech.jp/project/detail/28421/ が見つかりません (404)。
URL廃止またはリダイレクト対応が必要です。
```

### 対応手順

1. **新しいURLを見つける**
   - 同じサイトで新しい案件/記事を探す
   - または同等の代替サイトを選択

2. **テストファイルを更新**
   - `tests/integration/real-url-schema-detection.test.js` の `MOCK_RESPONSES` を編集
   - 新しいURLとスキーマ情報に置き換え

3. **テストを再実行**
   ```bash
   pnpm test:summary
   ```

4. **すべてのテストがパスすることを確認**

## 日常的なテスト実行

### 開発中

```bash
# 監視モードでテストを実行（ファイル保存時に自動再実行）
pnpm test:watch
```

### コミット前

```bash
# すべてのテストが成功することを確認
pnpm test:summary
```

### デプロイ前

```bash
# テストとリント両方を実行
pnpm test && pnpm lint
```

## トラブルシューティング

### テストが失敗する場合

1. **エラーメッセージを確認**
   ```bash
   pnpm test 2>&1 | head -50
   ```

2. **特定のテストのみ実行**
   ```bash
   pnpm test -- tests/unit/ai-advisor-button-submit.test.js
   ```

3. **詳細ログを表示**
   ```bash
   pnpm test -- --reporter=verbose
   ```

### セキュリティテストが失敗する場合

開発サーバーが起動しているか確認：

```bash
# 別のターミナルで
pnpm dev

# 別のターミナルでテスト実行
pnpm test
```

### URL関連のテストが失敗する場合

URLの状態を確認：

```bash
# ブラウザで直接アクセス
https://freelance.levtech.jp/project/detail/28421/

# または cURL で確認
curl -I https://freelance.levtech.jp/project/detail/28421/
# 期待: HTTP/1.1 200 OK
# エラー: 404 Not Found → URL更新が必要
```

## テストの追加・修正

### 新しいテストを追加する場合

1. **テストファイルを作成**
   ```bash
   tests/unit/my-feature.test.js
   ```

2. **テストコードを記述**
   ```javascript
   describe('My Feature', () => {
     it('should do something', () => {
       // テストロジック
     });
   });
   ```

3. **テストを実行**
   ```bash
   pnpm test:watch
   ```

### 既存テストを修正する場合

テストコードの変更後、自動的に再実行されます（`test:watch` モード）。

## 参考資料

- [Vitest ドキュメント](https://vitest.dev/)
- テストの詳細: `tests/integration/README-real-url-tests.md`
- 手動テスト方法: `tests/integration/MANUAL-TEST-GUIDE.md`

---

最終更新: 2024-11-03
