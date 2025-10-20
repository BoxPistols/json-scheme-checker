# Frontend Module Skill

Vanilla JavaScriptモジュール開発を支援するスキル

## 目的

- ES6+モジュールパターンの実装支援
- DOM操作の効率化
- イベント管理のベストプラクティス
- コードの再利用性と保守性向上

## 使用方法

```
/frontend-module [モジュール名] [機能説明]
```

## モジュール設計原則

### 1. IIFE（即時実行関数）パターン

```javascript
const ModuleName = (() => {
  // プライベート変数・関数
  const privateVar = 'private';

  function privateFunction() {
    // ...
  }

  // パブリックAPI
  return {
    publicMethod() {
      // ...
    },
  };
})();
```

### 2. シングルトンパターン

```javascript
const Singleton = (() => {
  let instance;

  function createInstance() {
    return {
      // インスタンスプロパティ
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    },
  };
})();
```

### 3. モジュール分離

- `public/modules/` に配置
- 単一責任の原則
- 明確なAPI設計
- 依存関係の最小化

## このプロジェクトの既存モジュール

### seo-analyzer.js

- SEO分析のメインロジック
- スコア計算
- JSON-LD抽出

### schema-requirements.js

- スキーマタイプごとの要件定義
- 必須フィールド管理

### guidance-provider.js

- ガイダンスメッセージ生成
- スコアベースの提案

### ui-renderer.js

- 分析結果の表示
- モーダル管理
- DOM操作

## コーディング規約

### 命名規則

- 関数: キャメルケース `calculateScore()`
- 定数: アッパースネークケース `MAX_SCORE`
- プライベート: アンダースコアプレフィックス `_privateMethod()`

### エラーハンドリング

```javascript
try {
  // リスク含む処理
} catch (error) {
  console.error('Context:', error);
  showError(`ユーザー向けメッセージ: ${error.message}`);
}
```

### 非同期処理

```javascript
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
```

## パフォーマンス最適化

- DOMクエリのキャッシング
- イベントデリゲーション活用
- デバウンス/スロットル実装
- 不要な再描画回避

## 関連ファイル

- `public/modules/*.js` - 既存モジュール
- `public/app.js` - メインアプリケーション
- `public/index.html` - モジュール読み込み

## 参照

- [MDN JavaScript Modules](https://developer.mozilla.org/ja/docs/Web/JavaScript/Guide/Modules)
- [JavaScript Design Patterns](https://www.patterns.dev/posts/classic-design-patterns)
