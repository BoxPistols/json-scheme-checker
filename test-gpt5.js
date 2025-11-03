// GPT-5-nano APIテストスクリプト
// Node.js 18以降は組み込みfetchを使用
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('エラー: OPENAI_API_KEYが設定されていません');
  process.exit(1);
}

async function testGpt5Nano(options = {}) {
  const {
    modelName = 'gpt-5-nano-2025-08-07',
    stream = false,
    includeTemperature = false,
  } = options;

  console.log('\n--- テスト開始 ---');
  console.log(`モデル: ${modelName}`);
  console.log(`ストリーミング: ${stream}`);
  console.log(`temperature指定: ${includeTemperature}`);

  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: 'あなたは賢いアシスタントです。' },
      { role: 'user', content: 'こんにちは' },
    ],
    stream,
  };

  if (includeTemperature) {
    body.temperature = 0.7;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    console.log(`ステータスコード: ${response.status}`);

    const data = await response.json();

    if (!response.ok) {
      console.error('エラーレスポンス:', JSON.stringify(data, null, 2));
      return { success: false, error: data };
    }

    console.log('成功:', data.choices[0].message.content);
    return { success: true, data };
  } catch (error) {
    console.error('リクエスト失敗:', error.message);
    return { success: false, error };
  }
}

// 複数のパターンをテスト
async function runAllTests() {
  console.log('=== GPT-5-nano APIテスト ===\n');

  // テスト1: 日付付きモデルID、非ストリーミング
  await testGpt5Nano({
    modelName: 'gpt-5-nano-2025-08-07',
    stream: false,
    includeTemperature: false,
  });

  // テスト2: 日付なしモデルID、非ストリーミング
  await testGpt5Nano({
    modelName: 'gpt-5-nano',
    stream: false,
    includeTemperature: false,
  });

  // テスト3: ストリーミングモード（組織認証が必要）
  await testGpt5Nano({
    modelName: 'gpt-5-nano-2025-08-07',
    stream: true,
    includeTemperature: false,
  });

  // テスト4: temperature指定（エラーになる可能性）
  await testGpt5Nano({
    modelName: 'gpt-5-nano-2025-08-07',
    stream: false,
    includeTemperature: true,
  });

  console.log('\n=== テスト完了 ===');
}

runAllTests();
