# Accessibility Skill

Webアクセシビリティの改善提案を行うスキル

## 目的

- WCAG 2.1準拠チェック
- キーボードナビゲーション改善
- ARIA属性の適切な使用
- スクリーンリーダー対応

## 使用方法

```
/accessibility [ファイルパス または 機能名]
```

## チェック項目

### 1. キーボードナビゲーション

- Tab順序の論理性
- フォーカス可視化
- キーボードトラップの回避
- ショートカットキー実装

### 2. ARIA属性

```html
<!-- ボタン -->
<button aria-label="メニューを開く" aria-expanded="false">
  <!-- モーダル -->
  <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <!-- フォーム -->
    <input aria-describedby="help-text" aria-required="true" />

    <!-- 動的コンテンツ -->
    <div aria-live="polite" aria-atomic="true"></div>
  </div>
</button>
```

### 3. セマンティックHTML

- 適切な見出しレベル（h1-h6）
- ランドマークロール（main, nav, aside, footer）
- フォームラベルの関連付け
- リストの適切な使用

### 4. フォーカス管理

```javascript
// モーダル表示時
modal.showModal();
modal.querySelector('input').focus();

// モーダルクローズ時
modal.close();
previousFocusedElement.focus();

// キーボードトラップ
modal.addEventListener('keydown', e => {
  if (e.key === 'Tab') {
    trapFocus(e);
  }
});
```

### 5. 色とコントラスト

- WCAG AA: 4.5:1（通常テキスト）
- WCAG AA: 3:1（大きなテキスト）
- WCAG AAA: 7:1（通常テキスト）

## このプロジェクトの改善ポイント

### 優先度: 高

- [ ] モーダルにaria-modal="true"を追加
- [ ] フォーカストラップの実装
- [ ] ボタンにaria-labelを追加

### 優先度: 中

- [ ] スキップリンクの追加
- [ ] ランドマークロールの適切な使用
- [ ] フォームのエラーメッセージをaria-describedbyで関連付け

### 優先度: 低

- [ ] 動的コンテンツにaria-liveを追加
- [ ] 見出しレベルの見直し
- [ ] カラーコントラストの確認

## テストツール

### 自動テスト

```bash
# axe-core
npm install --save-dev @axe-core/cli
npx axe https://localhost:3333

# Lighthouse
lighthouse https://localhost:3333 --only-categories=accessibility
```

### 手動テスト

- キーボードのみでの操作
- スクリーンリーダー（NVDA, JAWS, VoiceOver）
- ブラウザのアクセシビリティ検証ツール

## 実装例

### モーダルのアクセシビリティ

```javascript
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  const previousFocus = document.activeElement;

  modal.showModal();
  modal.setAttribute('aria-hidden', 'false');
  modal.querySelector('input, button').focus();

  modal.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal(modal, previousFocus);
    }
  });
}

function closeModal(modal, previousFocus) {
  modal.close();
  modal.setAttribute('aria-hidden', 'true');
  previousFocus.focus();
}
```

## 関連ファイル

- `public/index.html` - HTML構造
- `public/app.js` - モーダル・UI制御
- `public/modules/ui-renderer.js` - UI描画

## 参照

- [WCAG 2.1](https://www.w3.org/TR/WCAG21/)
- [WAI-ARIA](https://www.w3.org/TR/wai-aria/)
- [MDN Accessibility](https://developer.mozilla.org/ja/docs/Web/Accessibility)
