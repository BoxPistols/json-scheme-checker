// GPT-5-nano OpenAI公式SDK使用例
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 非ストリーミング版
async function useGpt5Nano(userMessage) {
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
      // ❌ temperature, top_p などは指定しない
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('APIエラー:', error.message);
    if (error.response) {
      console.error('エラー詳細:', error.response.data);
    }
    throw error;
  }
}

// ストリーミング版
async function useGpt5NanoStream(userMessage) {
  try {
    const stream = await openai.chat.completions.create({
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
      stream: true,
    });

    console.log('回答: ');
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      process.stdout.write(content);
    }
    console.log('\n');
  } catch (error) {
    console.error('APIエラー:', error.message);
    if (error.response) {
      console.error('エラー詳細:', error.response.data);
    }
    throw error;
  }
}

// 使用例
async function main() {
  console.log('=== 非ストリーミング版 ===');
  const result = await useGpt5Nano('TypeScriptの特徴を簡潔に教えてください。');
  console.log('回答:', result);

  console.log('\n=== ストリーミング版 ===');
  await useGpt5NanoStream('Reactの主な特徴を3つ教えてください。');
}

main();
