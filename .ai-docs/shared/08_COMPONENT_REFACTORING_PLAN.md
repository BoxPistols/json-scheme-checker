# コンポーネント化計画 - Modal UI 統一

## 現在の問題点

### 1. Modal UI の重複実装

Advisor と Blog Reviewer の両モジュールで、以下の要素が重複実装されている：

```
- モーダルオーバーレイ
- ヘッダー（タイトル + 閉じるボタン）
- モード選択ボタン（3つの統一されたボタングループ）
- コンテンツエリア
- フッター（アクション）
```

### 2. Hover スタイルの不統一

**before**:

- `advisor-mode-btn-small`: 背景色で表現 (background: var(--secondary-bg-color))
- `advisor-mode-btn`: border + background変更
- 統一されていない

**after** (修正済み):

- すべてのモード選択ボタン: 背景なし、border + 文字色のみ
- 統一された hover 体験

### 3. モーダル閉じるボタン

**問題**:

- Advisor: `onclick="this.closest('.advisor-overlay').remove()"` (インライン)
- Blog Reviewer: `data-action="close-confirm-dialog"` (イベントデリゲーション)
- 統一されていない

**解決** (修正済み):

- 両方とも `data-action` ベースに統一

---

## 修正内容（本コミット）

### ✅ CSS 修正

`.advisor-mode-btn-small` の hover スタイル統一：

```css
/* before */
.advisor-mode-btn-small:hover {
  opacity: 0.8;
  border-color: var(--accent-color);
  color: var(--text-color);
  background: var(--secondary-bg-color);  // 背景色が変わる
}

/* after */
.advisor-mode-btn-small:hover {
  border-color: var(--accent-color);
  color: var(--text-color);
  /* 背景色なし */
}
```

### ✅ JavaScript 修正

Advisor モーダルの閉じるボタン：

```javascript
// before
<button class="advisor-modal-close" onclick="this.closest('.advisor-overlay').remove()">

// after
<button class="advisor-modal-close" data-action="advisor-close-view">
```

Blog Reviewer モーダルの閉じるボタン：

```javascript
// before
<button class="advisor-modal-close" data-action="close-confirm-dialog">

// after
<button class="advisor-modal-close" data-action="blog-close-confirm-dialog">
```

---

## 次のステップ（推奨）

### Phase 2: Modal コンポーネント化

現在のモーダルUIを汎用 Dialog/Modal コンポーネントに統一：

```javascript
// 使用例
const modal = ConfirmDialog({
  title: 'どちらの視点でアドバイスしますか？',
  content: renderModeButtons(),
  actions: [
    { label: '採用側向け', onClick: () => startAnalysis('employer') },
    { label: '応募者向け', onClick: () => startAnalysis('applicant') },
  ],
  onClose: () => closeModal(),
});

document.body.appendChild(modal);
```

### 利点

1. **コード削減**: 200+ 行の HTML テンプレートを削減
2. **保守性向上**: モーダルロジックが一元化
3. **一貫性**: 複数モジュール間でデザインが統一
4. **再利用性**: 他の機能でも同じコンポーネント使用可能

### 実装タスク

```
Phase 2a: Dialog コンポーネント作成
  - ConfirmDialog.js（yes/no）
  - ChoiceDialog.js（複数選択）
  - InfoDialog.js（情報表示）

Phase 2b: 既存モーダル置き換え
  - AdvisorManager.js: ConfirmDialog に移行
  - BlogReviewerManager.js: ConfirmDialog に移行

Phase 2c: CSS クリーンアップ
  - advisor-modal-* クラス群を削除
  - Dialog コンポーネント用 CSS に統一
```

---

## 関連ドキュメント

- **[Components](./04_FEATURES.md#components)** - 既存コンポーネント一覧
- **[アーキテクチャ](./02_ARCHITECTURE.md)** - Presentational パターン

---

**最終更新**: 2025-10-22
