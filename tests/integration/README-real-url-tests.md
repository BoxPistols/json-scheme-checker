# 実URL統合テスト - README

## テスト概要

このテストスイート（`real-url-schema-detection.test.js`）は、3種類の実URLを使用してスキーマ判定ロジックが正しく動作することを検証します。

## テスト対象URL

### 1. 求人ページ（JobPosting スキーマ）
- **URL**: https://freelance.levtech.jp/project/detail/28421/
- **期待スキーマ**: `JobPosting`
- **期待ボタン**: 「求人/求職アドバイスを受ける」
- **ID**: `advisorTriggerBtn`

### 2. ブログページ（BlogPosting スキーマ）
- **URL**: https://www.engineer-factory.com/media/skill/4878/
- **期待スキーマ**: `BlogPosting`
- **期待ボタン**: 「ブログ記事レビュー」
- **ID**: `blogReviewerTriggerBtn`

### 3. Webページ（WebPage スキーマ）
- **URL**: https://levtech.jp/media/article/focus/detail_680/
- **期待スキーマ**: `WebPage`
- **期待ボタン**: 「Webページ分析を受ける」
- **ID**: `webAdvisorButton`

## テスト内容

### 各スキーマタイプ別テスト

各ページタイプについて、以下の2つのテストを実施：

1. **スキーマ検出テスト**
   - URLからコンテンツを取得
   - JSON-LD スキーマを抽出
   - スキーマタイプを判定
   - 対応するアドバイザーボタンが表示されることを確認

2. **loading表示テスト**
   - アドバイザーボタンが表示されている状態で、フォーム送信をシミュレート
   - `loading` インジケーターが表示されることを確認
   - レスポンス完了を待たず、loading表示の時点で成功

### URL廃止時のフォールバックテスト

各URLに対して以下を検証：

- URLが **404 Not Found** を返す場合
- テストが自動的にスキップされる
- 開発者向けに **console.warn()** で警告メッセージを出力
- 警告メッセージには、URL廃止またはリダイレクト対応が必要であることを記載

### 複数スキーマの優先度テスト

複数のスキーマが存在する場合の優先度を検証：

- `JobPosting` > `BlogPosting` > `WebPage`
- 優先度の高いスキーマがあれば、そのアドバイザーボタンのみが表示される

## テスト実行

### すべてのテストを実行
```bash
pnpm test
```

### このテストスイートのみ実行
```bash
pnpm test -- tests/integration/real-url-schema-detection.test.js
```

### 特定のテストケースのみ実行
```bash
pnpm test -- tests/integration/real-url-schema-detection.test.js --reporter=verbose
```

## URL廃止時の対応手順

### 1. テスト失敗時の確認

```
[URL廃止警告] 求人ページテスト: https://freelance.levtech.jp/project/detail/28421/ が見つかりません (404)。
URL廃止またはリダイレクト対応が必要です。
```

このようなメッセージが表示される場合：

### 2. 対応策

**オプション A: 新しいURLに更新**

1. 同じサイト内で新しい求人/記事ページを探す
2. `MOCK_RESPONSES` オブジェクトの該当エントリを更新

```javascript
'求人ページ': {
  url: 'https://freelance.levtech.jp/project/detail/NEW_ID/',  // ← 新しいID
  schema: { /* ... */ },
  expectedButton: 'advisorTriggerBtn',
  expectedText: '求人/求職アドバイスを受ける',
}
```

**オプション B: 代替URLに変更**

1. 同じスキーマタイプの代替URLを探す
2. 代替URLのスキーマ内容を確認
3. `MOCK_RESPONSES` を更新

**オプション C: テストスキップ**

一時的にURLが利用不可の場合：

```javascript
// テストケースの先頭に skip を追加
it.skip('求人URLからJobPostingスキーマを検出し、求人アドバイザーボタンを表示', async () => {
  // ...
});
```

### 3. 更新後の確認

```bash
pnpm test -- tests/integration/real-url-schema-detection.test.js
```

すべてのテストが ✓ パスすることを確認してください。

## モックレスポンスの構造

各テストケースは以下の構造を持っています：

```javascript
'ページ名': {
  url: '実URL',                          // テスト対象URL
  schema: { /* @context, @type, ... */ }, // JSON-LD スキーマ
  expectedButton: 'HTML要素ID',           // 表示されるボタンのID
  expectedText: 'ボタンテキスト',         // ボタンの表示テキスト
}
```

## トラブルシューティング

### テストが失敗する場合

1. **ネットワークエラー**
   - プロキシサーバーが起動しているか確認
   - `pnpm dev` でローカルサーバーを起動

2. **スキーマ検出失敗**
   - URLのスキーマ内容が変更されていないか確認
   - 実URLにアクセスして手動でスキーマ確認
   ```bash
   curl "http://localhost:3333/proxy?url=https://example.com" | grep "script type"
   ```

3. **Button表示テスト失敗**
   - 検出ロジック（`detectJobPosting`, `detectBlogPost` など）を確認
   - スキーマ形式が期待値と異なっていないか確認

## 保守性とベストプラクティス

### テストのメンテナンス

- **3ヶ月ごと**: 各URLが利用可能か確認
- **スキーマ変更時**: 対応するテストケースを更新
- **新しいスキーマタイプ追加時**: テストケースを追加

### URL選択の基準

新しいテストURLを追加する場合：

- 本番環境で安定したページを選択
- JSON-LD スキーマが明確に定義されている
- 頻繁な変更がないページ
- 長期間メンテナンスされるサイト

### スキーマ検証

```bash
# Google Rich Results Test を使用
https://search.google.com/test/rich-results
```

## まとめ

このテストは以下を保証します：

✅ 3種類のスキーマ（Job、Blog、WebPage）が正しく検出される
✅ 各スキーマに対応するボタンが表示される
✅ ボタン送信後に loading インジケーターが表示される
✅ URL廃止時に開発者に警告が出力される

---

最終更新: 2024-11-03
作成者: Claude Code
