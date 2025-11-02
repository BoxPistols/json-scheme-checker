// 4.1-nanoと5-nanoを並行使用する例
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * GPT-4.1-nano 用の関数
 * 既存の安定稼働コードをそのまま維持
 */
async function useGpt41Nano(userMessage, options = {}) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-nano',
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
      // gpt-4.1-nanoでは使用可能なパラメータ
      temperature: options.temperature || 0.7,
      top_p: options.top_p || 1.0,
      max_tokens: options.max_tokens || 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('GPT-4.1-nano エラー:', error.message);
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
async function useAI(userMessage, modelType = '4.1-nano', options = {}) {
  if (modelType === '5-nano') {
    return await useGpt5Nano(userMessage, options);
  } else {
    return await useGpt41Nano(userMessage, options);
  }
}

// 使用例：安全に切り替えながらテスト
async function main() {
  const testMessage = 'JavaScriptとTypeScriptの違いを簡潔に説明してください。';

  console.log('=== GPT-4.1-nano（既存の安定版） ===');
  try {
    const result41 = await useAI(testMessage, '4.1-nano', {
      temperature: 0.7, // 4.1では使用可能
    });
    console.log('回答:', result41);
  } catch (error) {
    console.error('エラー:', error.message);
  }

  console.log('\n=== GPT-5-nano（新規テスト版） ===');
  try {
    const result5 = await useAI(testMessage, '5-nano', {
      // temperatureは指定しない
    });
    console.log('回答:', result5);
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();

// エクスポート（他のファイルから使用可能）
module.exports = {
  useGpt41Nano,
  useGpt5Nano,
  useAI,
};
