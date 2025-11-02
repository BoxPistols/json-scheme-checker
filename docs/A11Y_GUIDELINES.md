# アクセシビリティガイドライン

最終更新: 2025-11-02

## 概要

このドキュメントでは、JSON-LD Schema Viewerのアクセシビリティ向上のためのガイドラインとチェック方法を説明します。

---

## コントラスト比のガイドライン

WCAG 2.1の基準に従い、以下のコントラスト比を維持します：

### レベルAA（推奨）
- **通常テキスト**: 4.5:1以上
- **大きいテキスト**（18pt以上、または太字14pt以上）: 3:1以上
- **UI コンポーネント**: 3:1以上

### レベルAAA（理想）
- **通常テキスト**: 7:1以上
- **大きいテキスト**: 4.5:1以上

---

## 現在の実装

### ボタンのコントラスト

#### Helpボタン
- **色**: `var(--accent-color)` (通常は青系)
- **背景**: transparent
- **ホバー**: `var(--accent-hover-bg-color)`

#### My APIボタン
- **色**: `#ff6b35` (オレンジ)
- **背景**: transparent
- **ホバー**: 背景 `#ff6b35`、文字色 white

#### セカンダリボタン（接続テスト、クリア）
- **色**: `var(--text-color)`
- **背景**: `var(--secondary-bg-color)`
- **境界**: `var(--border-color)`

#### プライマリボタン（保存）
- **色**: white
- **背景**: `var(--accent-color)`

### モーダルのコントラスト

#### モーダルヘッダー
- **タイトル**: `var(--text-color)`
- **サブタイトル**: `var(--secondary-text-color)`
- **閉じるボタン**: `var(--secondary-text-color)`（ホバー時: `var(--text-color)`）

---

## 推奨されるa11yテストツール

### 1. axe-core（自動テスト）

**インストール**:
```bash
pnpm add -D axe-core
```

**テストコード例** (`tests/a11y/contrast.test.js`):
```javascript
import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

describe('Accessibility - Contrast', () => {
  it('should have sufficient color contrast', async () => {
    const dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><link rel="stylesheet" href="/styles.css"></head>
        <body>
          <button class="btn-guide">Help</button>
          <button class="btn-my-api">My API</button>
        </body>
      </html>
    `);

    const results = await axe.run(dom.window.document);
    expect(results.violations).toHaveLength(0);
  });
});
```

### 2. pa11y（CI統合）

**インストール**:
```bash
pnpm add -D pa11y pa11y-ci
```

**設定ファイル** (`.pa11yrc.json`):
```json
{
  "standard": "WCAG2AA",
  "runners": ["axe"],
  "ignore": []
}
```

**package.json**:
```json
{
  "scripts": {
    "test:a11y": "pa11y-ci http://localhost:3333"
  }
}
```

### 3. lighthouse-ci（総合テスト）

**インストール**:
```bash
pnpm add -D @lhci/cli
```

**設定ファイル** (`lighthouserc.json`):
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3333"],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "color-contrast": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

---

## 手動チェック方法

### 1. ブラウザの開発者ツール

#### Chrome DevTools
1. 要素を右クリック → 「検証」
2. Styles タブで色を確認
3. コントラスト比が表示される

#### Firefox Developer Tools
1. アクセシビリティタブを開く
2. コントラストチェッカーを使用

### 2. オンラインツール

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)

---

## 今後の改善提案

### 短期（1-2週間）

1. **axe-coreの統合**
   - vitestにaxe-coreを追加
   - 基本的なコントラストチェックを自動化

2. **CSSカスタムプロパティの整理**
   - コントラスト比を考慮したカラーパレットの定義
   - Light/Darkモードでの統一

### 中期（1ヶ月）

1. **pa11y-ciの統合**
   - CI/CDパイプラインにa11yテストを追加
   - PRごとに自動チェック

2. **lighthouse-ciの統合**
   - パフォーマンスとa11yの総合スコアを測定

### 長期（3ヶ月）

1. **キーボードナビゲーションの改善**
   - Tab順序の最適化
   - フォーカスインジケータの強化

2. **スクリーンリーダー対応**
   - ARIA属性の適切な使用
   - alt属性の充実

---

## チェックリスト

### 新しいコンポーネント追加時

- [ ] テキストと背景のコントラスト比が4.5:1以上
- [ ] ボタンのホバー/フォーカス状態が明確
- [ ] キーボードでアクセス可能
- [ ] aria-label または aria-labelledby が適切に設定
- [ ] エラーメッセージが視覚的にもテキストでも伝わる

### デプロイ前

- [ ] `pnpm test:a11y` が成功（将来実装予定）
- [ ] lighthouse スコアが90以上
- [ ] 手動でキーボードナビゲーションをテスト

---

## 参考リンク

- [WCAG 2.1 ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs - Accessibility](https://developer.mozilla.org/ja/docs/Web/Accessibility)
- [axe-core GitHub](https://github.com/dequelabs/axe-core)
- [pa11y GitHub](https://github.com/pa11y/pa11y)
