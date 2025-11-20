# デザイントークン分析

## 現在定義されているデザイントークン

### 1. カラートークン（01-base.css）

#### Light Theme
```css
--bg-color: #f5f7fa
--text-color: #2c3e50
--card-bg-color: #fff
--header-bg-color: #fff
--border-color: #e2e8f0
--primary-color: #5a7ca3
--primary-text-color: #fff
--secondary-bg-color: #f8fafc
--secondary-text-color: #64748b
--accent-color: #3b82f6
--link-color: #3b82f6
--link-visited-color: #3b82f6
--error-color: #ef4444
--error-bg-color: #fef2f2
--success-color: #10b981
--warning-color: #f59e0b
```

#### JSON表示専用カラー
```css
--json-bg: #1e293b
--json-key: #7dd3fc
--json-string: #86efac
--json-number: #fbbf24
--json-boolean: #f472b6
--json-null: #94a3b8
--json-bracket: #cbd5e1
```

#### その他の色
```css
--icon-color: #64748b
--value-number-color: #ea580c
--primary-hover-color: #4a6b8a
--primary-shadow-color: rgba(90, 124, 163, 0.2)
--accent-hover-bg-color: rgba(59, 130, 246, 0.1)
--accent-hover-color: #2563eb
```

### 2. スペーシングトークン（design-tokens.css）

```css
--space-xs: 4px
--space-sm: 8px
--space-md: 12px
--space-lg: 16px
--space-xl: 24px
--space-2xl: 32px
```

### 3. タイポグラフィトークン（design-tokens.css）

```css
--font-size-xs: 0.65rem
--font-size-sm: 0.75rem
--font-size-md: 0.85rem
--font-size-base: 0.95rem
--font-size-lg: 1rem
--font-size-xl: 1.2rem
```

フォントファミリー（01-base.css）:
```css
font-family: Inter, 'Noto Sans JP', -apple-system, BlinkMacSystemFont, ...
```

### 4. ボーダー半径トークン（design-tokens.css）

```css
--radius-sm: 4px
--radius-md: 6px
--radius-lg: 8px
--radius-xl: 12px
```

### 5. コンポーネントサイズトークン（design-tokens.css）

#### ボタンサイズ
```css
--button-size-sm: 28px
--button-size-md: 36px
--button-size-lg: 44px
```

#### アイコンサイズ
```css
--icon-size-xs: 12px
--icon-size-sm: 14px
--icon-size-md: 16px
--icon-size-lg: 20px
--icon-size-xl: 24px
```

#### モーダルサイズ
```css
--modal-width-sm: 400px
--modal-width-md: 600px
--modal-width-lg: 800px
--modal-max-width: 90vw
```

#### チャットサイズ
```css
--chat-width-default: 400px
--chat-width-min: 320px
--chat-width-max: 600px
--chat-height-default: 550px
--chat-height-min: 450px
--chat-height-max: 800px
```

### 6. コンテナサイズトークン（design-tokens.css）

```css
--container-xs: 320px
--container-sm: 400px
--container-md: 600px
--container-lg: 800px
--container-xl: 1200px
```

### 7. グリッドレイアウトトークン（design-tokens.css）

```css
--grid-columns-auto-sm: repeat(auto-fit, minmax(150px, 1fr))
--grid-columns-auto-md: repeat(auto-fit, minmax(200px, 1fr))
--grid-columns-auto-lg: repeat(auto-fit, minmax(250px, 1fr))
--grid-gap-xs: 4px
--grid-gap-sm: 8px
--grid-gap-md: 12px
--grid-gap-lg: 16px
--grid-gap-xl: 24px
```

### 8. Z-Indexトークン（design-tokens.css）

```css
--z-base: 1
--z-dropdown: 100
--z-sticky: 200
--z-modal: 1000
--z-chat: 1000
--z-tooltip: 2000
--z-notification: 3000
```

### 9. トランジショントークン（design-tokens.css）

```css
--transition-fast: 0.15s ease
--transition-base: 0.2s ease
--transition-slow: 0.3s ease
```

### 10. ブレークポイントトークン（design-tokens.css）

```css
--breakpoint-xs: 320px
--breakpoint-sm: 480px
--breakpoint-md: 768px
--breakpoint-lg: 1024px
--breakpoint-xl: 1280px
```

## 改善提案

### 1. カラートークンの統合

現在、カラートークンが `01-base.css` に分散しています。これらを `design-tokens.css` に統合することを推奨します。

### 2. セマンティックトークンの追加

現在は実装レベルのトークンのみですが、以下のセマンティックトークンを追加することを推奨します：

```css
/* セマンティックカラー */
--color-primary: var(--primary-color)
--color-danger: var(--error-color)
--color-success: var(--success-color)
--color-warning: var(--warning-color)
--color-info: var(--accent-color)

/* セマンティックスペーシング */
--spacing-inline: var(--space-md)
--spacing-stack: var(--space-lg)
--spacing-inset: var(--space-md)
```

### 3. シャドウトークンの追加

現在、シャドウがハードコードされています。トークン化を推奨：

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05)
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1)
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.15)
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.2)
```

### 4. フォントウェイトトークンの追加

```css
--font-weight-normal: 400
--font-weight-medium: 500
--font-weight-semibold: 600
--font-weight-bold: 700
```

## インラインスタイルの検出

以下のファイルでインラインスタイルの使用が確認されました：
- `index.html`: SVGアイコンの一部にインラインスタイルが使用されている可能性

次のステップ: HTMLファイルを詳細にスキャンして、インラインスタイルを検出し、置き換え対象をリストアップします。
