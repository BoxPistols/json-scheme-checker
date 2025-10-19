# UI Component Skill

レスポンシブUIコンポーネントの作成を支援するスキル

## 目的

- Material Designに準拠したUIコンポーネント作成
- レスポンシブデザイン実装
- ダークモード対応
- 再利用可能なコンポーネント設計

## 使用方法

```
/ui-component [コンポーネント名] [要件]
```

## デザインシステム

### カラーパレット（Material Design 3準拠）

#### ライトモード
```css
:root {
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-surface: #fef7ff;
  --md-sys-color-on-surface: #1d1b20;
  --md-sys-color-error: #ba1a1a;
}
```

#### ダークモード
```css
[data-theme="dark"] {
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-on-primary: #381e72;
  --md-sys-color-surface: #1d1b20;
  --md-sys-color-on-surface: #e6e0e9;
  --md-sys-color-error: #f2b8b5;
}
```

### タイポグラフィ
```css
.display-large { font-size: 57px; line-height: 64px; }
.headline-large { font-size: 32px; line-height: 40px; }
.title-large { font-size: 22px; line-height: 28px; }
.body-large { font-size: 16px; line-height: 24px; }
.label-large { font-size: 14px; line-height: 20px; }
```

### スペーシング
```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

## コンポーネント例

### ボタン
```html
<button class="md-button md-button--filled">
  <span class="md-button__label">送信</span>
</button>

<button class="md-button md-button--outlined">
  <span class="md-button__label">キャンセル</span>
</button>
```

```css
.md-button {
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.md-button--filled {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border: none;
}

.md-button--outlined {
  background: transparent;
  color: var(--md-sys-color-primary);
  border: 1px solid var(--md-sys-color-outline);
}
```

### カード
```html
<div class="md-card">
  <div class="md-card__content">
    <h3 class="md-card__title">タイトル</h3>
    <p class="md-card__text">説明文</p>
  </div>
</div>
```

```css
.md-card {
  background: var(--md-sys-color-surface-variant);
  border-radius: 12px;
  padding: var(--spacing-md);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.md-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
```

### モーダル
```html
<dialog class="md-dialog" aria-labelledby="dialog-title">
  <div class="md-dialog__header">
    <h2 id="dialog-title" class="md-dialog__title">タイトル</h2>
    <button class="md-dialog__close" aria-label="閉じる">×</button>
  </div>
  <div class="md-dialog__content">
    <!-- コンテンツ -->
  </div>
  <div class="md-dialog__actions">
    <button class="md-button">キャンセル</button>
    <button class="md-button md-button--filled">確認</button>
  </div>
</dialog>
```

## レスポンシブデザイン

### ブレークポイント
```css
/* モバイル */
@media (max-width: 599px) { }

/* タブレット */
@media (min-width: 600px) and (max-width: 1023px) { }

/* デスクトップ */
@media (min-width: 1024px) { }
```

### Flexbox/Grid
```css
/* フレキシブルレイアウト */
.container {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

/* グリッドレイアウト */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-md);
}
```

## アニメーション

### トランジション
```css
.element {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              opacity 0.2s ease-in-out;
}

.element:hover {
  transform: translateY(-2px);
}
```

### キーフレーム
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

## ダークモード実装

### テーマ切り替え
```javascript
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  setTheme(newTheme);
}
```

### システムテーマ検出
```javascript
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    setTheme(prefersDark.matches ? 'dark' : 'light');
  }
}

prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});
```

## SVGアイコン

### インラインSVG（推奨）
```html
<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">
  <path fill="currentColor" d="M..."/>
</svg>
```

### CSSスタイリング
```css
.icon {
  width: 24px;
  height: 24px;
  color: var(--md-sys-color-on-surface);
}
```

## 関連ファイル

- `public/styles.css` - グローバルスタイル
- `public/index.html` - HTMLテンプレート
- `public/modules/ui-renderer.js` - UI描画ロジック

## 参照

- [Material Design 3](https://m3.material.io/)
- [MDN CSS](https://developer.mozilla.org/ja/docs/Web/CSS)
- [Can I Use](https://caniuse.com/)
