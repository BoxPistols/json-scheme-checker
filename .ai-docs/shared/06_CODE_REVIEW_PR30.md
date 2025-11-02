# コードレビュー: PR #30 - ブログメディア記事レビュー機能

## 総合評価

**4.5/5.0** - マージ可能な品質。セキュリティ・エラーハンドリング・UXに多くの良い実装。軽微な改善推奨。

---

## セキュリティ

### 良い点

- ✅ 入力検証: 100KBサイズ制限（XSS対策）
- ✅ XSS対策: headline 500文字制限
- ✅ レート制限: IP単位の24時間10回制限
- ✅ CORS: 環境変数`ALLOWED_ORIGINS`で制御可能

### 重大な問題

#### Vercelでのレート制限が機能しない

メモリベース`Map`はインスタンス間で共有されない。トラフィック増加時は要対応。

**推奨**: Vercel KV または Upstash Redis の導入

```javascript
// 代替案: 環境変数で強制
if (process.env.VERCEL && !userApiKey) {
  return res.status(403).json({
    error: 'ユーザー自身のAPIキーが必要です',
  });
}
```

#### APIキーの露出リスク

`public/modules/blog-reviewer.js:911-915`でHTTPボディで送信。HTTPS前提のため、コメント注釈を追加すること。

### 中程度の問題

- エラーメッセージの詳細情報を本番環境では隠すべき
- ボディパース前にレート制限チェックを実行すべき（DoS対策）

---

## コード品質

### 良い点

- ✅ 既存パターン踏襲（求人アドバイザー機能と統一）
- ✅ イベント委譲パターン使用
- ✅ JSDocコメント充実
- ✅ HTML抽出ロジックが堅牢（フォールバック多数）
- ✅ ストリーミングレスポンス実装

### 改善が必要な項目

#### 1. マジックナンバーの定数化

```javascript
// 現在（分散）
if (JSON.stringify(article).length > 100000) article.headline = article.headline.substring(0, 500);

// 推奨（一元化）
const MAX_ARTICLE_SIZE = 100000;
const MAX_HEADLINE_LENGTH = 500;
```

#### 2. レート制限ロジックの重複

`api/blog-reviewer.js`と`api/advisor.js`が完全に重複。

**推奨**: `api/utils/rateLimit.js`として共通化

```javascript
class RateLimiter {
  checkRateLimit(ip) {
    /* ... */
  }
}
module.exports = new RateLimiter();
```

#### 3. モデル選択ロジックが未実装

`public/modules/blog-reviewer.js:821-822`で呼び出している`getSelectedModel()`メソッドが存在しない。

#### 4. HTMLパース検証の誤り

`public/modules/blog-reviewer.js:26-34`の`try-catch`は不要（DOMParserは例外をスローしない）。

**推奨**:

```javascript
const parserError = this.remoteDoc.querySelector('parsererror');
if (parserError) {
  console.warn('パースエラー:', parserError.textContent);
  this.remoteDoc = null;
}
```

#### 5. JSDocコメントの形式エラー

`public/modules/blog-reviewer.js:1041-1042`で不正な形式。正しい形式に修正。

---

## パフォーマンス

### 問題点

#### 本文抽出の最適化不足

複数セレクタで`querySelectorAll`を繰り返し実行。

**推奨**:

```javascript
const combinedSelector = contentSelectors.join(',');
const elements = root.querySelectorAll(combinedSelector);
```

#### ストリーミング中断処理

`reader.cancel()`のエラーハンドリングが不足。ユーザーへのフィードバックを追加すること。

---

## テストカバレッジ

**現状**: なし

**推奨**:

1. ユニットテスト：入力検証・文本抽出・レート制限
2. 統合テスト：API エンドポイント・認証・レート制限
3. E2Eテスト：検出フロー・モーダル操作

---

## 優先度別アクション

### 🔴 高優先度（マージ前に対応推奨）

1. **Vercel KV導入検討**: レート制限の本番対応
2. **モデル選択メソッド実装**: `getSelectedModel()`, `setSelectedModel()`
3. **エラーメッセージの本番調整**: 詳細情報を隠す処理

### 🟡 中優先度（次イテレーション）

1. マジックナンバーの定数化
2. レート制限ロジックの共通化
3. ボディパース前のレート制限チェック
4. テストの追加

### 🟢 低優先度（将来改善）

1. HTMLパース検証の改善
2. 本文抽出のパフォーマンス最適化
3. JSDocコメント形式の統一

---

## 関連ドキュメント

- **[セキュリティ](./05_SECURITY.md)** - レート制限・CORS詳細
- **[機能詳細](./04_FEATURES.md)** - Blog Reviewer機能説明
- **[ワークフロー](./03_WORKFLOW.md)** - テスト・デバッグ方法

---

**最終更新**: 2025-10-22
