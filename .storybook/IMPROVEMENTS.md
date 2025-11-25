# UI改善提案とロードマップ

## 実施済みの改善

### 1. Storybookの導入

- HTML/Vite版Storybookのセットアップ完了
- 基本コンポーネント（ボタン、カード、フォーム、バッジ、モーダル、タブ、テーブル）のストーリー作成
- インタラクションテスト（Button, Form, Modal, Tab）の実装
- アクセシビリティアドオンの有効化

### 2. デザイントークンの整理

- 既存のデザイントークンを分析・文書化
- カラー、スペーシング、タイポグラフィ、ボーダー半径、コンポーネントサイズを洗い出し
- Storybookでデザイントークンを可視化

### 3. UIテストの基盤構築

- `@storybook/test` によるインタラクションテストの実装
- Play functionsによる自動UIテスト
- A11yアドオンによるアクセシビリティチェック

## 今後の改善提案

### 優先度: 高

#### 1. インラインスタイルの排除

**現状の問題:**

- HTMLに多数のインラインスタイル（`style="..."`）が存在
- デザインの一貫性を保つのが困難
- メンテナンス性が低い

**改善策:**

- インラインスタイルをすべてCSSクラスに置き換え
- デザイントークンを活用したスタイル定義
- ユーティリティクラスの作成（例: `.flex`, `.gap-md`, `.p-lg`）

**実装例:**

```html
<!-- Before -->
<div style="padding: 20px; background: var(--card-bg-color); border-radius: 8px;">コンテンツ</div>

<!-- After -->
<div class="card p-lg">コンテンツ</div>
```

```css
/* CSS */
.card {
  background: var(--card-bg-color);
  border-radius: var(--radius-lg);
}

.p-lg {
  padding: var(--space-xl);
}
```

#### 2. 共通UIコンポーネントの抽出

**現状の問題:**

- 同じUIパターンがHTML内で重複
- DRY原則に違反
- 変更時に複数箇所を修正する必要がある

**改善策:**

- 再利用可能なコンポーネントファイルを作成
- `public/components/` ディレクトリを作成
- コンポーネントファクトリーパターンの活用

**実装例:**

```javascript
// public/components/Button.js
export function createButton({ label, onClick, variant = 'primary', disabled = false }) {
  const button = document.createElement('button');
  button.className = `btn btn--${variant}`;
  button.textContent = label;
  button.disabled = disabled;

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}

// 使用例
import { createButton } from './components/Button.js';

const fetchButton = createButton({
  label: '取得',
  onClick: handleFetch,
  variant: 'primary',
});
```

#### 3. デザイントークンの拡張

**追加すべきトークン:**

```css
/* シャドウ */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.15);
--shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.2);

/* フォントウェイト */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* 行の高さ */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* レター間隔 */
--letter-spacing-tight: -0.02em;
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.025em;
```

### 優先度: 中

#### 4. Storybookストーリーの拡充

**追加すべきストーリー:**

1. **レイアウトコンポーネント**
   - Header
   - Footer
   - Container
   - Grid System

2. **複合コンポーネント**
   - AI Advisor Card（全機能）
   - Chat Window（完全版）
   - Skill Sheet Editor

3. **ステート管理**
   - Loading States
   - Error States
   - Empty States

#### 5. アクセシビリティの向上

**実装すべき改善:**

1. **ARIA属性の追加**
   - `aria-label`, `aria-describedby`
   - `role` 属性の適切な使用
   - `aria-live` による動的コンテンツの通知

2. **キーボード操作の改善**
   - フォーカス管理
   - Escキーでモーダルを閉じる
   - Tab順序の最適化

3. **セマンティックHTML**
   - `<button>` vs `<div onclick>`
   - `<nav>`, `<main>`, `<aside>` の活用
   - 見出しレベルの適切な使用

#### 6. レスポンシブデザインの強化

**改善すべき箇所:**

1. **コンテナクエリの活用**
   - スキーマカード内のレスポンシブ対応
   - チャットウィンドウの可変サイズ対応

2. **ブレークポイントの統一**
   - 現在は複数のブレークポイント定義が混在
   - デザイントークンを使用した統一

3. **タッチデバイス対応**
   - ボタンの最小タップサイズ（44px）
   - スワイプジェスチャー
   - モバイルメニュー

### 優先度: 低

#### 7. ビジュアル回帰テスト

**実装方法:**

1. **Chromatic の導入**
   - Storybookと連携したビジュアル回帰テスト
   - PRごとの自動チェック

2. **Percy の導入（代替案）**
   - スクリーンショット比較
   - CIパイプライン統合

#### 8. コンポーネントドキュメントの自動生成

**実装方法:**

1. **JSDoc の活用**
   - コンポーネント関数にJSDocコメントを追加
   - Storybookで自動表示

2. **MDX ドキュメント**
   - 各コンポーネントに使用ガイドを作成
   - コードサンプルとベストプラクティス

## 実装ロードマップ

### フェーズ1: 基盤整備（完了）

- [x] Storybookのセットアップ
- [x] デザイントークンの洗い出し
- [x] 基本コンポーネントのストーリー作成
- [x] インタラクションテストの基盤構築

### フェーズ2: コード品質向上（推奨: 1-2週間）

- [ ] インラインスタイルの排除（全ファイル）
- [ ] 共通UIコンポーネントの抽出
- [ ] デザイントークンの拡張
- [ ] CSSユーティリティクラスの作成

### フェーズ3: コンポーネントライブラリの充実（推奨: 2-3週間）

- [ ] 残りのコンポーネントのストーリー作成
- [ ] 複合コンポーネントの分割と抽出
- [ ] インタラクションテストの拡充
- [ ] アクセシビリティの改善

### フェーズ4: 品質保証とドキュメント（推奨: 1-2週間）

- [ ] ビジュアル回帰テストの導入
- [ ] JSDocとMDXドキュメントの作成
- [ ] コンポーネント使用ガイドの作成
- [ ] Storybookの本番公開

## メトリクス

### 改善前（現状）

- インラインスタイル数: ~200箇所（推定）
- 再利用可能なコンポーネント: 0
- Storybookストーリー: 0
- UIテスト: 0

### 改善後（目標）

- インラインスタイル数: 0
- 再利用可能なコンポーネント: 20+
- Storybookストーリー: 50+
- UIテスト: 30+

## 成功指標

1. **開発速度の向上**
   - 新しいUIコンポーネント作成時間を50%削減
   - デザイン変更時の修正箇所を80%削減

2. **コード品質の向上**
   - インラインスタイルの完全排除
   - DRY原則の徹底（重複コード0）

3. **メンテナンス性の向上**
   - CSSクラスとデザイントークンの活用
   - コンポーネントの再利用性向上

4. **アクセシビリティの向上**
   - A11yスコア90%以上
   - WCAGレベルAA準拠

## 参考リソース

- [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/)
- [CSS Architecture](https://www.smashingmagazine.com/2018/05/guide-css-layout/)
- [Design Tokens](https://www.designtokens.org/)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
