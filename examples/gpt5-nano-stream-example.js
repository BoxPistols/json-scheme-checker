// GPT-5-nano ストリーミング版の例
require('dotenv').config();

async function useGpt5NanoStream(userMessage) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  const requestBody = {
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
    stream: true, // ストリーミングモードを有効化
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

    // ストリーミングレスポンスを処理
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    console.log('回答: ');

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.trim() === 'data: [DONE]') continue;

        const dataPrefix = 'data: ';
        if (line.startsWith(dataPrefix)) {
          const jsonStr = line.slice(dataPrefix.length);
          try {
            const data = JSON.parse(jsonStr);
            const content = data.choices[0]?.delta?.content;
            if (content) {
              process.stdout.write(content);
            }
          } catch (e) {
            // JSON パースエラーは無視
          }
        }
      }
    }

    console.log('\n'); // 改行
  } catch (error) {
    console.error('リクエスト失敗:', error);
    throw error;
  }
}

// 使用例
async function main() {
  try {
    await useGpt5NanoStream('日本の有名な観光地を3つ教えてください。');
  } catch (error) {
    console.error('エラー:', error.message);
  }
}

main();
