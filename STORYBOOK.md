# Storybook - UIコンポーネントライブラリ

このプロジェクトにはStorybookが統合されており、すべてのUIコンポーネントを可視化、テスト、ドキュメント化できます。

## セットアップ済みの内容

### パッケージ

- `@storybook/html@8.6.14` - HTML用Storybook
- `@storybook/html-vite@8.6.14` - Viteビルダー
- `@storybook/addon-essentials@8.6.14` - 基本アドオン
- `@storybook/addon-interactions@8.6.14` - インタラクションテスト
- `@storybook/addon-a11y@8.6.14` - アクセシビリティテスト
- `@storybook/test@8.6.14` - テストユーティリティ

### スクリプト

```bash
pnpm storybook              # Storybookを起動（localhost:6006）
pnpm build-storybook        # 本番用ビルド
pnpm test-storybook         # ストーリーのテストを実行
```

## 使い方

### Storybookの起動

```bash
pnpm storybook
```

ブラウザで http://localhost:6006/ が自動的に開きます。

### ストーリーの構成

```
stories/
├── Introduction.mdx                    # イントロダクション
├── design-tokens/                      # デザイントークン
│   └── Colors.stories.js               # カラートークン
└── components/                         # コンポーネント
    ├── Button.stories.js               # ボタン
    ├── Card.stories.js                 # カード
    ├── Form.stories.js                 # フォーム
    ├── Badge.stories.js                # バッジ
    ├── Modal.stories.js                # モーダル
    ├── Tab.stories.js                  # タブ
    └── Table.stories.js                # テーブル
```

### 作成済みのストーリー

#### デザイントークン

- **カラー**: ライト/ダークテーマ対応の全カラートークン

#### コンポーネント

1. **ボタン**
   - プライマリボタン
   - コピーボタン
   - モーダル閉じるボタン
   - APIキー設定ボタン
   - テーマ切り替えボタン

2. **カード**
   - 基本カード
   - スキーマカード
   - 統計カード
   - 機能カード
   - 情報ボックス

3. **フォーム**
   - URL入力フォーム（インタラクションテスト付き）
   - Basic認証フォーム
   - 検索入力
   - テキストエリア
   - セレクトボックス
   - チェックボックス
   - ラジオボタン

4. **バッジ**
   - スキーマタイプバッジ
   - ドキュメントピル
   - APIステータスチップ
   - ベータバッジ
   - サーバーステータス

5. **モーダル**
   - 基本モーダル（インタラクションテスト付き）
   - ガイドモーダル（Wide）
   - 情報ボックス付きモーダル
   - テーブル付きモーダル
   - ナローモーダル

6. **タブ**
   - 基本タブ（インタラクションテスト付き）
   - 全タブナビゲーション
   - ビュー切り替えタブ
   - レスポンシブタブ

7. **テーブル**
   - データテーブル（スキーマ表示）
   - ネストされたオブジェクト表示
   - モーダル内テーブル
   - コンパクト配列テーブル
   - ストライプテーブル

## インタラクションテスト

一部のストーリーには、`@storybook/test` を使用したインタラクションテストが含まれています。

### テスト付きストーリー

- **Button.stories.js** - Primary: ボタンのホバーとクリック
- **Form.stories.js** - URLInput: フォーム入力とボタンクリック
- **Modal.stories.js** - Basic: モーダル表示の確認
- **Tab.stories.js** - Basic: タブ切り替え

### テストの実行

```bash
pnpm test-storybook
```

## アドオン

### Essentials

- **Controls**: プロパティの動的変更
- **Actions**: イベントのロギング
- **Docs**: 自動ドキュメント生成
- **Viewport**: レスポンシブテスト
- **Backgrounds**: 背景色の切り替え

### Interactions

- **Play functions**: 自動インタラクションテスト
- **Step-by-step debugging**: ステップ実行

### Accessibility

- **A11y checker**: アクセシビリティ問題の検出

## デザイントークン活用

すべてのストーリーで、プロジェクトのデザイントークンを使用しています：

```css
/* カラー */
var(--primary-color)
var(--text-color)
var(--card-bg-color)

/* スペーシング */
var(--space-sm)
var(--space-md)
var(--space-lg)

/* タイポグラフィ */
var(--font-size-md)
var(--font-size-lg)

/* ボーダー半径 */
var(--radius-md)
var(--radius-lg)
```

## 次のステップ

### 今後追加すべきストーリー

1. **レイアウトコンポーネント**
   - ヘッダー
   - フッター
   - サイドバー

2. **機能コンポーネント**
   - AI Advisor UI
   - チャットウィンドウ
   - スキルシートエディタ

3. **ユーティリティ**
   - ローディングスピナー
   - スナックバー通知
   - エラーメッセージ

### 共通コンポーネント化

現在、多くのコンポーネントがHTMLに直接記述されています。以下を推奨します：

1. **コンポーネントファイルの作成**
   - `public/components/Button.js`
   - `public/components/Modal.js`
   - `public/components/Card.js`

2. **インラインスタイルの排除**
   - HTMLのstyle属性をCSSクラスに置き換え
   - デザイントークンを活用

3. **再利用性の向上**
   - 同じUIパターンの統一
   - プロパティによるカスタマイズ

## ビルドと公開

### 静的サイトとしてビルド

```bash
pnpm build-storybook
```

ビルド結果は `storybook-static/` に出力されます。

### Vercelでの公開（オプション）

```bash
# storybook-staticディレクトリをデプロイ
vercel storybook-static --prod
```

## トラブルシューティング

### ブラウザが自動で開かない

環境によっては、`xdg-open`コマンドが利用できないためブラウザが自動で開きません。この場合、手動で http://localhost:6006/ にアクセスしてください。

### CSSが適用されない

`.storybook/preview.js` で `import '../public/styles/main.css'` が正しくインポートされているか確認してください。

### インタラクションテストが動作しない

`@storybook/test` パッケージがインストールされているか確認してください。

```bash
pnpm list @storybook/test
```

## 参考リンク

- [Storybook公式ドキュメント](https://storybook.js.org/)
- [Interaction Tests](https://storybook.js.org/docs/html/writing-tests/interaction-testing)
- [Accessibility Testing](https://storybook.js.org/docs/html/writing-tests/accessibility-testing)
