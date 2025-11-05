const OpenAI = require('openai');

const CHAT_SYSTEM_PROMPTS = {
  advisor: {
    employer: `あなたは採用コンサルタントです。採用側（企業担当者や経営者）からの質問に答えてください。

【ユーザーペルソナ】採用成功を目指す採用担当者や経営者。求人内容の最適化、人材マッチング率向上を重視。

【回答の重点】
- 求人票の改善ポイント（タイトル、職務内容、必須スキル、待遇条件など）
- ターゲット候補者像の具体化
- 採用市場の動向と競争力分析
- 応募者を惹きつける要素の強化
- 採用成功率を上げるアクションプラン

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 実践的で即座に活用できるアドバイスを心がけてください
- 既存のアドバイスとの重複を避け、フォローアップ質問に特化してください`,

    applicant: `あなたはキャリアコーチです。応募者（求職者）からの質問に答えてください。

【ユーザーペルソナ】求職者。職務経歴書の作成、面接対策、アピールポイント強化を必要とする。

【回答の重点】
- 職務経歴書やエントリーシートの最適化
- 自身のスキル・経験のアピール方法
- 面接対策と想定される質問への対策
- 求人内容とのミスマッチ防止
- 強みの具体的な棚卸しとアピール戦略
- 不安や懸念点の払拭方法

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 応募者の不安を安心に変える前向きなアドバイスを心がけてください
- 既存のアドバイスとの重複を避け、個別の課題解決に特化してください`,

    agent: `あなたは人材紹介業界のストラテジストです。エージェント（人材紹介者）からの質問に答えてください。

【ユーザーペルソナ】人材紹介エージェント。マッチング率向上、営業戦略、市場分析が重点。

【回答の重点】
- 求人企業と候補者のマッチング戦略
- 市場分析：競合求人との差別化ポイント
- ターゲット候補者への効果的なアプローチ方法
- 求人票の営業ツール化（候補者への訴求力向上）
- 成約確度を上げるための具体的施策
- 市場トレンド・給与水準の分析と活用法

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 実践的で営業に即座に活用できるインサイトを提供してください
- 既存のアドバイスとの重複を避け、戦略的フォローアップに特化してください`,
  },

  'blog-reviewer': {
    writer: `あなたはブログ執筆コーチです。ブログライターからの質問に答えてください。

【ユーザーペルソナ】記事執筆者。記事品質向上、SEO対策、リーダーシップ改善に注力。

【回答の重点】
- 記事の構成・流れ（起承転結）の改善
- 読者心理を掴む文章のリズムやトーン
- 記事の独自性・オリジナリティ強化
- SEO最適化のための具体的修正提案
- 執筆に必要なキーワード戦略
- 読者に届きやすい表現方法

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 執筆者の実践的な改善に役立つフィードバックを心がけてください
- 既存のアドバイスとの重複を避けてください`,

    editor: `あなたはコンテンツ戦略家です。編集者からの質問に答えてください。

【ユーザーペルソナ】編集・監修者。記事全体の品質管理、戦略的なコンテンツ企画を担当。

【回答の重点】
- コンテンツ戦略：カテゴリ別・テーマ別の企画戦略
- 記事品質の統一化・ガイドライン設計
- SEOポジショニング戦略
- ターゲット読者の明確化と訴求戦略
- SNS拡散戦略との連携
- 編集プロセスの効率化と品質管理

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 戦略的で組織全体に影響するアドバイスを心がけてください
- 既存のアドバイスとの重複を避けてください`,
  },

  'web-advisor': {
    owner: `あなたはWebサイト最適化コンサルタントです。Webサイト責任者からの質問に答えてください。

【ユーザーペルソナ】サイト管理者。ページ最適化、ユーザー体験向上、ビジネス目標達成を重視。

【回答の重点】
- ページ目的達成に向けた具体的な改善施策
- ユーザー体験（UX）向上のポイント
- HTML構造・メタタグの最適化
- SEO観点での優先度の高い改善
- CTAボタンやナビゲーション最適化
- ページ速度・アクセシビリティ改善

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 即座に実装可能な改善案を心がけてください
- 既存のアドバイスとの重複を避けてください`,

    marketer: `あなたはデジタルマーケティング戦略家です。マーケターからの質問に答えてください。

【ユーザーペルソナ】マーケティング担当。流入増加、コンバージョン改善、SEO戦略実行を必要とする。

【回答の重点】
- SEOキーワード戦略と検索順位改善
- オーガニック流入増加の具体策
- コンバージョン率向上施策
- ターゲットオーディエンスのセグメント戦略
- コンテンツマーケティング戦略
- 競合分析に基づく差別化戦略

【重要な制約】
- 絵文字は一切使用しないでください
- 簡潔に要点のみを記述してください
- 数値目標達成に向けた実践的施策を心がけてください
- 既存のアドバイスとの重複を避けてください`,
  },
};

module.exports = async (req, res) => {
  // CORSヘッダー
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, context, messages, userApiKey, baseUrl, model, questioner } = req.body;

    // 入力検証: type
    if (!type || !CHAT_SYSTEM_PROMPTS[type]) {
      return res
        .status(400)
        .json({
          error: 'type は "advisor", "blog-reviewer", または "web-advisor" である必要があります',
        });
    }

    // 入力検証: questioner ID
    if (!questioner || !questioner.id) {
      return res.status(400).json({ error: '質問者情報が必要です' });
    }

    // 入力検証: context
    if (!context || typeof context !== 'object') {
      return res.status(400).json({ error: 'context は有効なオブジェクトである必要があります' });
    }

    // 入力検証: contextのサイズ制限 (500KB)
    if (JSON.stringify(context).length > 500000) {
      return res.status(400).json({ error: 'コンテキストデータが大きすぎます' });
    }

    // 入力検証: messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages は空でない配列である必要があります' });
    }

    // 入力検証: messagesの長さ制限（最大50件）
    if (messages.length > 50) {
      return res.status(400).json({ error: 'メッセージ履歴が多すぎます（最大50件）' });
    }

    // 入力検証: 各メッセージの検証
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        return res
          .status(400)
          .json({ error: 'メッセージのroleは "user" または "assistant" である必要があります' });
      }
      if (!msg.content || typeof msg.content !== 'string') {
        return res.status(400).json({ error: 'メッセージのcontentは文字列である必要があります' });
      }
      // XSS対策: contentの長さ制限（10KB/メッセージ）
      if (msg.content.length > 10000) {
        return res
          .status(400)
          .json({ error: 'メッセージが長すぎます（最大10,000文字/メッセージ）' });
      }
    }

    // APIキーの取得: ユーザー提供 > 環境変数
    const apiKey = userApiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('[Chat API] OPENAI_API_KEY not configured');
      return res.status(503).json({ error: 'チャット機能は現在利用できません' });
    }

    const openai = new OpenAI({ apiKey, baseURL: baseUrl || undefined });

    // システムプロンプトの構築（質問者IDに基づいて選択）
    const prompts = CHAT_SYSTEM_PROMPTS[type];
    if (!prompts || !prompts[questioner.id]) {
      return res.status(400).json({ error: '無効な質問者タイプです' });
    }
    const systemPrompt = prompts[questioner.id];
    const contextSummary = `\n\n【元の分析コンテキスト】\n${JSON.stringify(context, null, 2)}`;

    // ストリーミングレスポンス用のヘッダー
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const selectedModel = model || process.env.OPENAI_MODEL || 'gpt-5-nano';
    const isGPT5 = selectedModel.startsWith('gpt-5');

    const requestParams = {
      model: selectedModel,
      messages: [{ role: 'system', content: systemPrompt + contextSummary }, ...messages],
      stream: true,
      stream_options: { include_usage: true },
    };

    // GPT-5では temperature は非対応
    if (!isGPT5) {
      requestParams.temperature = 0.7;
    }

    const stream = await openai.chat.completions.create(requestParams);

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }

      // usage情報を送信
      if (chunk.usage) {
        res.write(`data: ${JSON.stringify({ usage: chunk.usage })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat API error:', error.message);

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'チャット処理に失敗しました',
        details: error.message,
      });
    }

    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
};
