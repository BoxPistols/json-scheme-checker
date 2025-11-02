// GPT-5-nano 正しい使用例
require('dotenv').config();

async function useGpt5Nano(userMessage) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  // ✅ 正しい設定
  const requestBody = {
    model: 'gpt-5-nano', // または 'gpt-5-nano-2025-08-07'
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
    // ❌ temperature, top_p, frequency_penalty, presence_penalty は指定しない
    // GPT-5シリーズはこれらのパラメータをサポートしていません
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('APIエラー:', errorData);
      throw new Error(`API Error: ${response.status} - ${errorData.error?.message}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('リクエスト失敗:', error);
    throw error;
  }
}

// 使用例
async function main() {
  try {
    const result = await useGpt5Nano('日本の首都はどこですか？');
    console.log('回答:', result);
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();
