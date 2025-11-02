# GPT-5-nano 使用ガイド

## 問題の解決

あなたのAPIキーでは**GPT-5-nanoは正常に動作しています**。404/400エラーの原因は以下のパラメータ制限です。

## 重要な制限事項

### ❌ 使用できないパラメータ

GPT-5シリーズ（gpt-5, gpt-5-mini, gpt-5-nano）では、以下のパラメータがサポートされていません：

```javascript
{
  model: "gpt-5-nano",
  temperature: 0.7,           // ❌ デフォルト値（1）以外は使用不可
  top_p: 0.9,                 // ❌ 制限あり
  frequency_penalty: 0.5,     // ❌ 制限あり
  presence_penalty: 0.5,      // ❌ 制限あり
}
```

**エラーメッセージ例**:
```
400 Bad Request: "temperature" does not support 0.7 with this model.
Only the default (1) value is supported.
```

### ✅ 使用できるパラメータ

```javascript
{
  model: "gpt-5-nano",        // または "gpt-5-nano-2025-08-07"
  messages: [...],            // 必須
  stream: true/false,         // オプション（ストリーミングモード）
  max_tokens: 1000,           // オプション（最大トークン数）
  // temperature などは指定しない
}
```

## 実装例

### 1. Fetch APIを使用（最小限）

詳細: `gpt5-nano-example.js`

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  },
  body: JSON.stringify({
    model: 'gpt-5-nano',
    messages: [
      { role: 'system', content: 'あなたは親切なアシスタントです。' },
      { role: 'user', content: 'こんにちは' },
    ],
  }),
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### 2. OpenAI公式SDK（推奨）

詳細: `gpt5-nano-sdk-example.js`

```javascript
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const completion = await openai.chat.completions.create({
  model: 'gpt-5-nano',
  messages: [
    { role: 'system', content: 'あなたは親切なアシスタントです。' },
    { role: 'user', content: 'こんにちは' },
  ],
});

console.log(completion.choices[0].message.content);
```

### 3. ストリーミングモード

詳細: `gpt5-nano-stream-example.js` または `gpt5-nano-sdk-example.js`

```javascript
const stream = await openai.chat.completions.create({
  model: 'gpt-5-nano',
  messages: [...],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

## テスト結果

`test-gpt5.js`を実行した結果：

| テストケース | 結果 | ステータスコード |
|------------|------|---------------|
| `gpt-5-nano-2025-08-07` (非ストリーミング) | ✅ 成功 | 200 |
| `gpt-5-nano` (非ストリーミング) | ✅ 成功 | 200 |
| `gpt-5-nano-2025-08-07` (ストリーミング) | ✅ 成功 | 200 |
| `temperature: 0.7` 指定 | ❌ エラー | 400 |

## よくある質問

### Q1: gpt-4.1-nanoは動くのに、gpt-5-nanoが404/400になる

**A**: パラメータ制限が原因です。gpt-4.1-nanoで動いていたコードに`temperature`などのパラメータが含まれている場合、それらを削除してください。

### Q2: 組織認証（Organization Verification）は必要？

**A**: テスト結果から、あなたのアカウントでは**認証済み**です。ストリーミングモードも正常に動作しています。

### Q3: どのモデルIDを使うべき？

**A**: 以下のどちらでも動作します：
- `gpt-5-nano` （推奨：シンプル）
- `gpt-5-nano-2025-08-07` （明示的にバージョン指定したい場合）

### Q4: Assistants APIで使える？

**A**: **使えません**。GPT-5-nanoはChat Completions APIのみサポートしています。

```javascript
// ❌ Assistants APIでは使用不可
const assistant = await openai.beta.assistants.create({
  model: "gpt-5-nano"  // 400エラー
});

// ✅ Chat Completions APIを使用
const completion = await openai.chat.completions.create({
  model: "gpt-5-nano",
  messages: [...]
});
```

## トラブルシューティング

### 404エラーが出る場合

1. モデル名を確認: `gpt-5-nano` または `gpt-5-nano-2025-08-07`
2. エンドポイントを確認: `https://api.openai.com/v1/chat/completions`
3. Assistants APIを使っていないか確認

### 400エラーが出る場合

1. `temperature`パラメータを削除
2. `top_p`, `frequency_penalty`, `presence_penalty` を削除
3. エラーメッセージの詳細を確認:

```javascript
const response = await fetch(...);
if (!response.ok) {
  const error = await response.json();
  console.error('詳細エラー:', error);
}
```

## 実行方法

```bash
# テストスクリプトを実行（すべてのパターンをテスト）
node test-gpt5.js

# 各サンプルを実行
node examples/gpt5-nano-example.js
node examples/gpt5-nano-stream-example.js
node examples/gpt5-nano-sdk-example.js
```

## モデル仕様

- **コンテキストウィンドウ**: 400K トークン
- **入力料金**: $1.25 / 1M トークン（90%キャッシュ割引あり）
- **出力料金**: $10 / 1M トークン
- **特徴**: 超低レイテンシ、最小限の推論、リアルタイムアプリケーション向け

## 参考リンク

- [OpenAI Platform - GPT-5 Models](https://platform.openai.com/docs/models/gpt-5)
- [OpenAI Agents SDK - Models](https://openai.github.io/openai-agents-python/ja/models/)
- [組織認証ページ](https://platform.openai.com/settings/organization/general)
