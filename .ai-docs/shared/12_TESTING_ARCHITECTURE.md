# テスト設計アーキテクチャガイド

## 概要

このドキュメントでは、JSON-LD Schema Viewerプロジェクトにおけるテスト設計のアーキテクチャ、戦略、ベストプラクティスを説明します。

---

## テスト戦略

### テストの階層

```
┌─────────────────────────────────────┐
│   E2E テスト（将来実装予定）         │
│   - Playwright / Cypress            │
│   - ユーザージャーニー全体をテスト   │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   統合テスト（将来実装予定）         │
│   - API + フロントエンド連携         │
│   - データフロー検証                 │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│   手動テスト（現在の主要手法）       │
│   - test-admin-mode.html            │
│   - ローカル環境での動作確認         │
│   - ブラウザコンソールでのエラー確認 │
└─────────────────────────────────────┘
```

---

## 現在のテスト手法

### 1. 手動テストページ

#### test-admin-mode.html

隠しモード機能の包括的な手動テストページです。

**テスト対象**:
- 隠しモードパラメータの動作確認
- 各機能ボタンの表示/非表示制御
- URLパラメータの検証

**テストケース**:

| テストケース | URL | 期待される動作 |
|------------|-----|--------------|
| 通常アクセス | `http://localhost:3333/` | すべてのベータ機能ボタンが非表示 |
| user=file | `http://localhost:3333/?user=file` | コンテンツアップロードボタンのみ表示 |
| user=skill | `http://localhost:3333/?user=skill` | My Skill Sheetボタンのみ表示 |
| user=resume | `http://localhost:3333/?user=resume` | レジュメビルダーボタンのみ表示 |
| 無効なパラメータ | `http://localhost:3333/?user=invalid` | すべてのベータ機能ボタンが非表示 |

**実行方法**:
```bash
pnpm dev
# ブラウザで http://localhost:3333/test-admin-mode.html を開く
```

### 2. cURLによるAPIテスト

#### ヘルスチェック

```bash
curl http://localhost:3333/health
# 期待される応答: {"status":"ok","timestamp":"..."}
```

#### プロキシエンドポイント

```bash
curl "http://localhost:3333/proxy?url=https://example.com"
# 期待される応答: HTMLコンテンツ
```

#### JSON-LD抽出

```bash
curl -X POST http://localhost:3333/extract-jsonld \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
# 期待される応答: JSON-LDデータ
```

### 3. ブラウザ開発者ツール

**Console**:
- JavaScriptエラーの確認
- ネットワークエラーの確認
- API応答の確認

**Network**:
- APIリクエストの確認
- レスポンスステータスの確認
- ペイロードの確認

**Application → Local Storage**:
- 認証情報の確認
- レート制限データの確認
- API使用量の確認

---

## レジュメビルダーのテスト設計

### 機能テスト

#### 1. モーダル表示テスト

**手順**:
1. `http://localhost:3333/?user=resume` にアクセス
2. 「レジュメビルダー」ボタンをクリック
3. モーダルが表示されることを確認

**期待される動作**:
- モーダルがフルスクリーンで表示される
- ヘッダーに「レジュメビルダー Beta」と表示される
- 情報ボックスが表示される
- チャットエリアが表示される

#### 2. AI対話テスト

**手順**:
1. モーダルを開く
2. AIの最初の質問が表示されることを確認
3. テキストを入力して「送信」ボタンをクリック
4. AIの応答が表示されることを確認

**期待される動作**:
- AIの質問がチャット形式で表示される
- ユーザーの回答が右側に表示される
- AIの応答が左側にストリーミング表示される
- 応答中はスピナーが表示される

#### 3. 質問フローテスト

**6つの質問**:
1. プロジェクト概要
2. プロジェクト体制
3. 背景・課題
4. 取り組み内容
5. 成果・結果
6. 使用技術

**手順**:
各質問に対して回答を入力し、最終的にプロジェクト経験の文章が生成されることを確認

**期待される動作**:
- すべての質問に順番に回答できる
- 最後にプロジェクト経験の文章が生成される
- 生成された文章がMarkdown形式で表示される

#### 4. エクスポート機能テスト

**手順**:
1. プロジェクト経験の文章が生成された後
2. 「コピー」ボタンをクリック
3. 「ダウンロード」ボタンをクリック

**期待される動作**:
- コピーボタンでクリップボードにコピーされる
- ダウンロードボタンでMarkdownファイルがダウンロードされる
- スナックバーで成功メッセージが表示される

#### 5. レート制限テスト

**手順**:
1. 50回連続でメッセージを送信
2. 51回目のメッセージ送信を試みる

**期待される動作**:
- 50回まで正常に送信できる
- 51回目でレート制限エラーが表示される
- リセット時刻が表示される

#### 6. エラーハンドリングテスト

**テストケース**:

| シナリオ | 期待される動作 |
|---------|--------------|
| 空のメッセージ送信 | エラーメッセージ表示 |
| APIキーが無効 | 認証エラー表示 |
| ネットワークエラー | 接続エラー表示 |
| OpenAI APIエラー | API エラーメッセージ表示 |

---

## モバイルテスト

### テストデバイス

**推奨デバイス**:
- iPhone 12/13/14 (iOS Safari)
- Android スマートフォン (Chrome)
- iPad (Safari)
- Android タブレット (Chrome)

**ブレークポイント**:
- モバイル: 320px - 767px
- タブレット: 768px - 1023px
- デスクトップ: 1024px以上

### モバイル固有のテスト項目

#### 1. レスポンシブレイアウト

**チェック項目**:
- [ ] チャットメッセージが画面幅に収まる
- [ ] 入力エリアが画面下部に固定される
- [ ] ボタンがタップしやすいサイズ（44px以上）
- [ ] テキストが読みやすいサイズ（14px以上）

#### 2. タッチ操作

**チェック項目**:
- [ ] ボタンのタップが正常に動作する
- [ ] スクロールがスムーズに動作する
- [ ] モーダルの開閉が正常に動作する
- [ ] キーボード表示時のレイアウト崩れがない

#### 3. パフォーマンス

**チェック項目**:
- [ ] ページ読み込みが3秒以内
- [ ] チャットメッセージのレンダリングが滑らか
- [ ] スクロールのフレームレートが60fps以上
- [ ] メモリ使用量が適切

---

## 将来のテスト戦略

### 1. 自動テストの導入

#### ユニットテスト（Vitest）

```javascript
// 例: resume-builder.test.js
import { describe, it, expect } from 'vitest';
import { ResumeBuilderManager } from './resume-builder.js';

describe('ResumeBuilderManager', () => {
  it('メッセージ履歴を正しく管理する', () => {
    const manager = new ResumeBuilderManager();
    manager.messages.push({ role: 'user', content: 'テスト' });
    expect(manager.messages.length).toBe(1);
  });

  it('レート制限を正しくチェックする', () => {
    const manager = new ResumeBuilderManager();
    const result = manager.checkRateLimit();
    expect(result.allowed).toBeDefined();
  });
});
```

#### 統合テスト（Supertest）

```javascript
// 例: api.test.js
import request from 'supertest';
import app from '../server.js';

describe('Resume Builder API', () => {
  it('/api/resume-builder にPOSTできる', async () => {
    const response = await request(app)
      .post('/api/resume-builder')
      .send({
        messages: [{ role: 'user', content: 'テスト' }],
      });

    expect(response.status).toBe(200);
  });
});
```

#### E2Eテスト（Playwright）

```javascript
// 例: resume-builder.spec.js
import { test, expect } from '@playwright/test';

test('レジュメビルダーの基本フロー', async ({ page }) => {
  await page.goto('http://localhost:3333/?user=resume');
  await page.click('#resumeBuilderButton');

  // モーダルが表示されることを確認
  await expect(page.locator('#resumeBuilderModal')).toBeVisible();

  // メッセージを入力
  await page.fill('#chatInput', 'テストプロジェクト');
  await page.click('button[data-action="resume-builder-send-message"]');

  // AI応答を待機
  await expect(page.locator('.chat-message--assistant')).toBeVisible();
});
```

### 2. CI/CDパイプライン

#### GitHub Actionsワークフロー例

```yaml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Run linter
        run: pnpm lint

      - name: Run unit tests
        run: pnpm test

      - name: Run E2E tests
        run: pnpm test:e2e
```

---

## テスト実行チェックリスト

### 新機能追加時

- [ ] ローカル環境でテスト (`pnpm dev`)
- [ ] 各ブラウザでテスト（Chrome, Firefox, Safari）
- [ ] モバイルデバイスでテスト
- [ ] エラーハンドリングのテスト
- [ ] レート制限のテスト
- [ ] 認証機能のテスト（該当する場合）
- [ ] レスポンシブデザインの確認

### デプロイ前

- [ ] すべての手動テストケースを実行
- [ ] Vercel環境でテスト (`vercel dev`)
- [ ] 本番環境でスモークテスト
- [ ] コンソールエラーがないことを確認
- [ ] ネットワークエラーがないことを確認
- [ ] パフォーマンスが許容範囲内であることを確認

---

## トラブルシューティング

### よくある問題

#### 1. モーダルが表示されない

**原因**:
- JavaScriptエラー
- CSSファイルが読み込まれていない
- 隠しモードパラメータが正しくない

**解決方法**:
```bash
# ブラウザのコンソールでエラーを確認
# ネットワークタブでCSSファイルの読み込みを確認
# URLパラメータを確認: ?user=resume
```

#### 2. AIが応答しない

**原因**:
- OpenAI APIキーが無効
- ネットワークエラー
- レート制限に達した

**解決方法**:
```bash
# .env ファイルでAPIキーを確認
# ネットワーク接続を確認
# レート制限をリセット（localStorage.clear()）
```

#### 3. チャットが表示されない

**原因**:
- CSS が読み込まれていない
- JavaScriptエラー

**解決方法**:
```bash
# 15-resume-builder.css が読み込まれているか確認
# main.css で @import されているか確認
# ブラウザキャッシュをクリア
```

---

## ベストプラクティス

### テストコードの品質

1. **明確なテスト名**: テストが何を検証しているか一目でわかる名前をつける
2. **独立性**: 各テストは他のテストに依存しない
3. **再現性**: 何度実行しても同じ結果が得られる
4. **可読性**: テストコードは簡潔で理解しやすく書く

### テストデータ

1. **テストデータの分離**: テスト用のデータは本番データと分離する
2. **クリーンアップ**: テスト後は必ずクリーンアップする
3. **Edge Case**: 正常系だけでなく異常系もテストする

### テストの保守

1. **定期的な実行**: CI/CDで自動実行する
2. **失敗時の対応**: テストが失敗したら速やかに修正する
3. **テストの更新**: 機能変更時はテストも更新する

---

## 参考資料

- [Vitest公式ドキュメント](https://vitest.dev/)
- [Playwright公式ドキュメント](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Kent C. Dodds - Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
