# 手動テスト実行ガイド - 実URL統合テスト

## 概要

自動テストがスキップされた場合や、新しいURLを検証する場合の手動テスト手順です。

## セットアップ

### 前提条件

```bash
# 開発サーバーが起動していることを確認
pnpm dev

# ヘルスチェック
curl http://localhost:3333/health
# 期待結果: {"status":"ok","timestamp":"..."}
```

## テスト手順

### 1. 求人ページテスト (JobPosting)

#### 目的
求人ページから `JobPosting` スキーマを正しく抽出し、「求人/求職アドバイスを受ける」ボタンが表示されることを確認

#### 手順

1. **ブラウザでアプリを開く**
   ```
   http://localhost:3333
   ```

2. **求人URL を入力**
   ```
   https://freelance.levtech.jp/project/detail/28421/
   ```

3. **「分析」または「送信」をクリック**

4. **以下を確認**
   - [ ] ページが正常に読み込まれる
   - [ ] コンソールエラーがない
   - [ ] 抽出されたスキーマに `"@type": "JobPosting"` が含まれている
   - [ ] **「求人/求職アドバイスを受ける」** ボタンが画面に表示される
   - [ ] ボタンクリック後、**loading インジケーター**が表示される

5. **ブラウザコンソル確認**
   ```
   F12 → Console タブ
   以下のような正常なログが出力されていること：
   [BaseAdvisor] handleSubmit: start
   [Loading] Display loading indicator
   ```

6. **結果チェック**
   ```
   期待: 求人関連のアドバイスが表示される（またはloading中）
   ```

---

### 2. ブログページテスト (BlogPosting)

#### 目的
ブログページから `BlogPosting` スキーマを正しく抽出し、「ブログ記事レビュー」ボタンが表示されることを確認

#### 手順

1. **同じアプリで新しいURLを入力**
   ```
   https://www.engineer-factory.com/media/skill/4878/
   ```

2. **「分析」または「送信」をクリック**

3. **以下を確認**
   - [ ] ページが正常に読み込まれる
   - [ ] コンソールエラーがない
   - [ ] 抽出されたスキーマに `"@type": "BlogPosting"` が含まれている
   - [ ] **「ブログ記事レビュー」** ボタンが画面に表示される
   - [ ] ボタンクリック後、**loading インジケーター**が表示される

4. **ブラウザコンソル確認**
   ```
   以下のようなスキーマ抽出ログ：
   [Schema Detection] Extracted schemas: [BlogPosting]
   ```

5. **結果チェック**
   ```
   期待: ブログ分析関連のアドバイスが表示される（またはloading中）
   ```

---

### 3. Webページテスト (WebPage)

#### 目的
一般的なWebページから `WebPage` スキーマを検出し、「Webページ分析を受ける」ボタンが表示されることを確認

#### 手順

1. **同じアプリで新しいURLを入力**
   ```
   https://levtech.jp/media/article/focus/detail_680/
   ```

2. **「分析」または「送信」をクリック**

3. **以下を確認**
   - [ ] ページが正常に読み込まれる
   - [ ] コンソールエラーがない
   - [ ] 抽出されたスキーマに `"@type": "WebPage"` が含まれている
   - [ ] **「Webページ分析を受ける」** ボタンが画面に表示される
   - [ ] ボタンクリック後、**loading インジケーター**が表示される

4. **ブラウザコンソル確認**
   ```
   以下のようなログ：
   [Web Advisor] Detection: WebPage schema detected
   ```

5. **結果チェック**
   ```
   期待: Web分析関連のアドバイスが表示される（またはloading中）
   ```

---

## URLが廃止された場合の確認手順

### 1. URL廃止の確認

```bash
# コマンドラインで確認
curl -I https://freelance.levtech.jp/project/detail/28421/

# 期待: 200 OK
# 実際: 404 Not Found または 301 Moved Permanently
```

### 2. テスト実行時の警告確認

```bash
pnpm test -- tests/integration/real-url-schema-detection.test.js 2>&1 | grep "URL廃止警告"
```

出力例：
```
[URL廃止警告] 求人ページテスト: https://freelance.levtech.jp/project/detail/28421/ が見つかりません (404)。
URL廃止またはリダイレクト対応が必要です。
```

### 3. 新しいURLを見つける

**同一サイト内で代替URLを探す**

1. https://freelance.levtech.jp にアクセス
2. 新しい求人案件を探す
3. URLを確認（例: `/project/detail/12345/`）

**代替サイトから探す**

- JobPosting: Indeed, LinkedIn, リクルート系サイト
- BlogPosting: Medium, Qiita, Zenn など技術ブログ
- WebPage: 任意のメディアサイト

### 4. URLを更新する

テストファイル: `tests/integration/real-url-schema-detection.test.js`

```javascript
const MOCK_RESPONSES = {
  '求人ページ': {
    url: 'https://NEW_SITE.jp/job/detail/NEW_ID/',  // ← ここを更新
    schema: { /* ... */ },
    expectedButton: 'advisorTriggerBtn',
    expectedText: '求人/求職アドバイスを受ける',
  },
  // ...
};
```

---

## トラブルシューティング

### 症状 1: "プロキシエラー" が表示される

**原因**: ローカル開発サーバーが起動していない

**対応**:
```bash
pnpm dev
# サーバーが localhost:3333 で起動するまで待つ
```

### 症状 2: 「ボタンが表示されない」

**原因**: スキーマが検出されていない

**確認手順**:
1. ブラウザコンソールを開く (F12)
2. Network タブで `/proxy?url=...` リクエストを確認
3. Response に `<script type="application/ld+json">` が含まれているか確認
4. JSON-LD が正しく formatted されているか確認

**対応**:
```bash
# コマンドで直接確認
curl "http://localhost:3333/proxy?url=https://example.com" | grep -A 5 "application/ld+json"
```

### 症状 3: "loading が表示されない"

**原因**: JavaScript エラーまたはボタン実装の問題

**確認手順**:
1. ブラウザコンソールでエラーメッセージを確認
2. 以下のログが表示されているか確認:
   ```
   [Loading] Display loading indicator
   ```
3. HTML に `id="loadingIndicator"` 要素が存在しているか確認

---

## 期待される挙動まとめ

| ページタイプ | URL | スキーマ | ボタンテキスト | アクション |
|-----------|-----|---------|--------------|-----------|
| 求人 | freelance.levtech.jp | JobPosting | 「求人/求職アドバイスを受ける」 | 送信 → Loading表示 |
| ブログ | engineer-factory.com | BlogPosting | 「ブログ記事レビュー」 | 送信 → Loading表示 |
| Webページ | levtech.jp | WebPage | 「Webページ分析を受ける」 | 送信 → Loading表示 |

---

## ログの見方

### 正常なログ例

```
[BaseAdvisor] handleSubmit: start
[Schema Detection] Extracted schemas: [JobPosting]
[Advisor] Job advisor button displayed
[Loading] Display loading indicator
[Loading] Show 分析中...
```

### エラーログ例

```
❌ [Error] Failed to fetch proxy: 404 Not Found
❌ [Error] Schema extraction failed
❌ [Error] Advisor button not found
```

---

## よく使うコマンド

```bash
# テスト実行（自動）
pnpm test

# 特定のテストファイルのみ
pnpm test -- tests/integration/real-url-schema-detection.test.js

# 詳細ログ付きで実行
pnpm test -- --reporter=verbose

# サーバーログの確認
tail -f /tmp/server.log

# プロキシ機能の手動テスト
curl "http://localhost:3333/proxy?url=https://example.com"
```

---

## 質問・問題がある場合

テストが失敗した場合は、以下の情報をまとめて報告してください：

1. **失敗した URL**: `https://example.com`
2. **実際のスキーマ型**: (コンソールで確認)
3. **期待されたボタン**: (何が表示されるべきだったか)
4. **実際の挙動**: (何が表示されたか)
5. **ブラウザコンソールのエラー**
6. **サーバーログ**: `pnpm dev` のコンソール出力

---

最終更新: 2024-11-03
