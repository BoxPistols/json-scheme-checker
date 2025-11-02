# MultiAnalysisGuard テストシナリオ

## 概要

このドキュメントは、複数の分析（求人解析、ブログ解析、Web分析）が同時に立ち上がるのを防ぐ「MultiAnalysisGuard」機能のテストシナリオです。

## テスト環境

- ブラウザ: Chrome 最新版（開発者ツール F12 必須）
- サーバー: pnpm start で起動したローカル開発サーバー
- URL: http://localhost:3333

## テストシナリオ 1: 単一の分析実行（基本動作）

### 目的
単一の分析が正常に完了することを確認

### 手順
1. ブラウザで http://localhost:3333 にアクセス
2. 求人情報を含むURL（例：Wantedly、Green等）を入力
3. 「検索」をクリック
4. JSON-LDが抽出されるのを待つ
5. 「求人/求職アドバイスを受ける」ボタンをクリック
6. 分析視点を選択（例：採用側向け）

### 期待される動作
- ボタンクリック後、「AI分析中...」ローディング表示
- コンソール（F12 → Console）に以下のログが表示：
  ```
  [MultiAnalysisGuard] advisor 分析を開始
  [Advisor] fetchAdvice started for mode: employer
  [Advisor] Calling API: http://127.0.0.1:3333/api/advisor
  [Advisor] API response status: 200
  [Advisor] Starting streaming loop...
  [Advisor] Received [DONE] signal
  [Advisor] fetchAdvice completed
  [MultiAnalysisGuard] advisor 分析を終了
  ```
- 分析結果が表示される
- ボタンが再度クリック可能になる

### 確認事項
- [ ] ローディング表示が正常に進む
- [ ] コンソールにエラーがない
- [ ] 結果が正常に表示される

---

## テストシナリオ 2: 複数の分析の同時実行防止

### 目的
複数の分析が同時に実行されることを防いでいることを確認

### 手順
1. 求人情報を含むURLで検索
2. 「求人/求職アドバイスを受ける」ボタンをクリック
3. 分析視点を選択
4. **ローディング中に**、別の分析ボタン（ブログ解析、Web分析）をクリック

### 期待される動作
- 2回目のクリック時に、以下の警告アラートが表示される：
  ```
  別の分析が実行中です。しばらくお待ちください。
  ```
- コンソール（F12 → Console）に以下のログが表示：
  ```
  [MultiAnalysisGuard] 分析実行中のため、blog-reviewerの実行をスキップしました。現在実行中：advisor
  ```
- 2番目の分析は実行されない

### 確認事項
- [ ] アラートが表示される
- [ ] ロード中のコンソールログに「スキップしました」メッセージが表示される
- [ ] 2番目の分析結果が表示されない

---

## テストシナリオ 3: 分析完了後の新規分析実行

### 目的
最初の分析が完了した後、新しい分析が正常に実行できることを確認

### 手順
1. テストシナリオ 1 を完了
2. 分析結果が表示された状態で
3. 別のURL（異なる求人サイト等）で検索
4. 別の分析タイプのボタンをクリック

### 期待される動作
- 前の分析結果は表示されたまま
- 新しい分析がすぐに開始される
- コンソールに以下のログが表示：
  ```
  [MultiAnalysisGuard] advisor 分析を終了
  [MultiAnalysisGuard] blog-reviewer 分析を開始
  ```

### 確認事項
- [ ] 新しい分析がすぐに実行される
- [ ] アラートが表示されない

---

## テストシナリオ 4: 分析ビュー閉じ時のクリーンアップ

### 目的
分析ビューを閉じた際に、グローバルな分析状態が正常にクリアされることを確認

### 手順
1. 分析を実行して結果を表示
2. 「×」ボタンまたはモーダルの背景をクリックしてビューを閉じる
3. すぐに別の分析を開始

### 期待される動作
- ビュー閉じ時、コンソールに以下のログが表示：
  ```
  [MultiAnalysisGuard] advisor 分析を終了
  ```
- 別の分析がすぐに実行される

### 確認事項
- [ ] グローバル状態がクリアされた
- [ ] 新しい分析を即座に開始できる

---

## テストシナリオ 5: エラー発生時のクリーンアップ

### 目的
分析がエラーで終了した場合、グローバルな分析状態が正常にクリアされることを確認

### 手順
1. 無効なURLまたはAPI接続を切断した状態で分析を開始
2. エラーが発生するのを待つ
3. エラーメッセージが表示された後、別の分析を実行

### 期待される動作
- エラーメッセージが表示される
- コンソールに以下のログが表示：
  ```
  [Advisor] fetchAdvice error: ...
  [MultiAnalysisGuard] advisor 分析を終了
  ```
- 別の分析がすぐに実行される

### 確認事項
- [ ] エラー後にグローバル状態がクリアされた
- [ ] 新しい分析を即座に開始できる

---

## テストシナリオ 6: キャンセル時のクリーンアップ

### 目的
分析がキャンセルされた場合、グローバルな分析状態が正常にクリアされることを確認

### 手順
1. 分析を開始（ローディング中）
2. ビューを閉じるか、別の分析を開始してキャンセル
3. キャンセルメッセージを確認

### 期待される動作
- 「分析がキャンセルされました」メッセージが表示される
- コンソールに以下のログが表示：
  ```
  [Advisor] 分析がキャンセルされました
  [MultiAnalysisGuard] advisor 分析を終了
  ```

### 確認事項
- [ ] キャンセルメッセージが表示される
- [ ] グローバル状態がクリアされた

---

## デバッグコマンド

### グローバル分析状態を確認
ブラウザコンソールで以下を実行：

```javascript
console.log(window.ANALYSIS_STATE);
```

**出力例（分析実行中）:**
```
{
  activeAnalysis: "advisor",
  abortControllers: { advisor: AbortController },
  isStreaming: true
}
```

**出力例（分析未実行）:**
```
{
  activeAnalysis: null,
  abortControllers: {},
  isStreaming: false
}
```

### 強制的に分析をリセット
ブラウザコンソールで以下を実行（デバッグ目的）：

```javascript
window.ANALYSIS_STATE.activeAnalysis = null;
window.ANALYSIS_STATE.isStreaming = false;
window.ANALYSIS_STATE.abortControllers = {};
```

---

## テスト結果記録

| テスト項目 | 実行日 | 結果 | 備考 |
|-----------|--------|------|-----|
| シナリオ 1: 単一分析 | YYYY-MM-DD | ✅ PASS / ❌ FAIL | |
| シナリオ 2: 同時実行防止 | YYYY-MM-DD | ✅ PASS / ❌ FAIL | |
| シナリオ 3: 完了後の新規分析 | YYYY-MM-DD | ✅ PASS / ❌ FAIL | |
| シナリオ 4: ビュー閉じ時 | YYYY-MM-DD | ✅ PASS / ❌ FAIL | |
| シナリオ 5: エラー時 | YYYY-MM-DD | ✅ PASS / ❌ FAIL | |
| シナリオ 6: キャンセル時 | YYYY-MM-DD | ✅ PASS / ❌ FAIL | |

---

## 既知の問題と改善案

### 現在の制限
- EventSource（Web分析）は AbortController をサポートしていないため、`eventSource.close()` で閉じている
- 複数分析が同時に実行できないため、ユーザーが待機する必要がある

### 将来の改善案
1. キュー機能の追加（複数リクエストを順序付けて実行）
2. UI の改善（ローディング進度表示、キャンセルボタン）
3. ローカルストレージへの分析履歴記録
4. 分析タイムアウトの実装

---

## 参考資料

- MultiAnalysisGuard 実装: `public/modules/base-advisor.js`
- advisor.js 修正: `public/modules/advisor.js` (fetchAdvice メソッド)
- blog-reviewer.js 修正: `public/modules/blog-reviewer.js` (fetchReview メソッド)
- web-advisor.js 修正: `public/modules/web-advisor.js` (fetchAnalysis メソッド)

