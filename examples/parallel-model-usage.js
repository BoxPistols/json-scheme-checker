// gpt-5-nanoを互換ロジックと最新ロジックで並行使用する例
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GPT-5-nano 用の関数（従来ロジック互換）
 * 既存コードの構造を維持しつつ、非対応パラメータは自動で省略
 */
async function useGpt5NanoLegacyMode(userMessage, options = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: 'あなたは親切なアシスタントです。',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      // 旧ロジック由来のパラメータは自動的に省略（gpt-5-nanoは非対応）
      max_tokens: options.max_tokens || 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('GPT-5-nano(互換モード) エラー:', error.message);
    throw error;
  }
}

/**
 * GPT-5-nano 用の関数（新規テスト用）
 * temperatureなどのパラメータは指定しない
 */
async function useGpt5Nano(userMessage, options = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: 'あなたは親切なアシスタントです。',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
      // gpt-5-nanoでは使用可能なパラメータのみ
      max_tokens: options.max_tokens || 1000,
      stream: options.stream || false,
      // ❌ temperature, top_p, frequency_penalty, presence_penalty は使用不可
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('GPT-5-nano エラー:', error.message);
    throw error;
  }
}

/**
 * モデルを切り替えて使用する統一関数
 */
async function useAI(userMessage, modelType = 'legacy', options = {}) {
  if (modelType === 'realtime') {
    return await useGpt5Nano(userMessage, options);
  } else {
    return await useGpt5NanoLegacyMode(userMessage, options);
  }
}

// 使用例：安全に切り替えながらテスト
async function main() {
  const testMessage = 'JavaScriptとTypeScriptの違いを簡潔に説明してください。';

  console.log('=== GPT-5-nano（互換モード） ===');
  try {
    const resultLegacy = await useAI(testMessage, 'legacy', {
      max_tokens: 800,
    });
    console.log('回答:', resultLegacy);
  } catch (error) {
    console.error('エラー:', error.message);
  }

  console.log('\n=== GPT-5-nano（新規テスト版） ===');
  try {
    const resultRealtime = await useAI(testMessage, 'realtime', {
      // temperatureは指定しない
    });
    console.log('回答:', resultRealtime);
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();

// エクスポート（他のファイルから使用可能）
module.exports = {
  useGpt5NanoLegacyMode,
  useGpt5Nano,
  useAI,
};
