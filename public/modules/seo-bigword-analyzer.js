// SEO Bigword Analyzer Module - ビッグワード達成度分析

class SeoBigwordAnalyzer extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_bigword_analyzer_usage',
      USER_API_KEY: 'jsonld_bigword_analyzer_openai_key',
      USAGE_TOTAL_KEY: 'jsonld_usage_bigword_analyzer_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
      MAX_REQUESTS_PER_DAY: 50,
      elemIdPrefix: 'bigwordAnalyzer',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'bigword-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'bigword-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'bigword-save-developer-key': () => this.saveDeveloperKey(),
        'bigword-test-developer-connection': () => this.testDeveloperConnection(),
        'bigword-reset-developer-settings': () => this.resetDeveloperSettings(),
        'bigword-show-developer-prompt': () => this.showDeveloperPrompt(),
        'bigword-reset-to-free-mode': () => this.resetToFreeMode(),
        'bigword-close-confirm-dialog': () => this.closeConfirmDialog(),
        'bigword-start-analysis': () => this.startAnalysis(),
        'bigword-close-modal': () => this.closeAnalysisModal(),
        'bigword-show-analysis-modal': () => this.showAnalysisModal(),
        'bigword-toggle-result-section': () => this.toggleAccordion('result'),
      },
      actions: {
        closeDeveloperPrompt: 'bigword-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'bigword-toggle-developer-key-visibility',
        saveDeveloperKey: 'bigword-save-developer-key',
        testDeveloperConnection: 'bigword-test-developer-connection',
        resetDeveloperSettings: 'bigword-reset-developer-settings',
      },
    };
    super(config);
    this.currentUrl = null;
    this.currentHtml = null;
    this.isStreaming = false;
    this.currentUsage = null;
    this.model = this.getSelectedModel();
  }

  getSelectedModel() {
    return (
      localStorage.getItem('jsonld_bigword_analyzer_model') || window.ADVISOR_CONST.DEFAULT_MODEL
    );
  }

  setSelectedModel(model) {
    this.model = model;
    localStorage.setItem('jsonld_bigword_analyzer_model', model);
    console.log(`[BigwordAnalyzer] Model set to: ${model}`);
  }

  /**
   * 分析ボタンを表示（Article/BlogPostingの時のみ）
   */
  showAnalysisButton(url, schemas) {
    // Article/BlogPostingが存在する場合のみ表示
    const hasArticle = schemas?.some(
      item =>
        item['@type'] === 'Article' ||
        item['@type'] === 'BlogPosting' ||
        item['@type']?.includes('Article') ||
        item['@type']?.includes('BlogPosting')
    );

    if (!hasArticle) {
      this.hideAnalysisButton();
      return;
    }

    this.currentUrl = url;
    let container = document.getElementById('bigwordAnalyzerButtonContainer');

    if (!container) {
      const newContainer = document.createElement('div');
      newContainer.id = 'bigwordAnalyzerButtonContainer';
      newContainer.style.cssText = 'margin-top: 1rem;';
      newContainer.innerHTML = `
        <button type="button" class="btn-advisor" data-action="bigword-show-analysis-modal" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 0.9375rem; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9"/>
            <path d="M13 17V5"/>
            <path d="M8 17v-3"/>
          </svg>
          Bigワード達成度分析
        </button>
      `;

      // Blog Reviewerボタンの後に挿入
      const blogReviewerContainer = document.getElementById('blogReviewerButtonContainer');
      if (blogReviewerContainer) {
        blogReviewerContainer.insertAdjacentElement('afterend', newContainer);
      } else {
        const seoSection = document.getElementById('seoSummarySection');
        if (seoSection) {
          seoSection.insertAdjacentElement('afterend', newContainer);
        }
      }

      container = newContainer;
    }

    container.style.display = 'block';
  }

  hideAnalysisButton() {
    const container = document.getElementById('bigwordAnalyzerButtonContainer');
    if (container) {
      container.style.display = 'none';
    }
  }

  /**
   * 分析モーダルを表示
   */
  showAnalysisModal() {
    console.log('[BigwordAnalyzer] showAnalysisModal called');
    const rateLimit = this.checkRateLimit();

    const modal = document.createElement('div');
    modal.id = 'bigwordAnalyzerModal';
    modal.className = 'modal-overlay';
    modal.style.cssText =
      'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;';
    modal.innerHTML = `
      <div class="modal-container" style="background: var(--bg-primary, white); border-radius: 12px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color, #e5e7eb);">
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600;">Bigワード達成度分析</h2>
          <button type="button" class="modal-close" data-action="bigword-close-modal" aria-label="閉じる" style="background: none; border: none; cursor: pointer; padding: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <p style="margin-bottom: 1rem; color: var(--text-secondary, #6b7280);">
            あなたの記事が特定のBigワード（重要キーワード）で上位表示される要件を満たしているか分析します。
          </p>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px;">
            <strong>注意:</strong> この分析は実際の検索順位データではなく、AIによる「Bigワード達成度の推定」です。実際の順位確認には Google Search Console を併用してください。
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label for="bigwordMainKeyword" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
              メインキーワード（Bigワード）
              <span style="color: #ef4444; margin-left: 0.25rem;">*</span>
            </label>
            <input
              type="text"
              id="bigwordMainKeyword"
              placeholder="例: React Hooks"
              autocomplete="off"
              style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #d1d5db); border-radius: 6px; font-size: 0.9375rem;"
            />
            <small style="display: block; margin-top: 0.25rem; color: var(--text-secondary, #6b7280); font-size: 0.875rem;">狙っている重要なキーワードを入力してください</small>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label for="bigwordSubKeywords" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">
              サブキーワード
              <span style="color: var(--text-secondary, #6b7280); font-size: 0.875rem; margin-left: 0.25rem;">（任意）</span>
            </label>
            <input
              type="text"
              id="bigwordSubKeywords"
              placeholder="例: useEffect, useState, カスタムフック"
              autocomplete="off"
              style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #d1d5db); border-radius: 6px; font-size: 0.9375rem;"
            />
            <small style="display: block; margin-top: 0.25rem; color: var(--text-secondary, #6b7280); font-size: 0.875rem;">関連キーワードをカンマ区切りで入力（省略可）</small>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <label for="bigwordTargetUrl" style="display: block; font-weight: 500; margin-bottom: 0.5rem;">分析対象URL</label>
            <input
              type="url"
              id="bigwordTargetUrl"
              value="${this.escapeHtml(this.currentUrl || '')}"
              readonly
              style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #d1d5db); border-radius: 6px; font-size: 0.9375rem; background: var(--bg-secondary, #f9fafb);"
            />
          </div>

          <div style="background: ${rateLimit.usingUserKey ? '#dcfce7' : '#f3f4f6'}; padding: 1rem; border-radius: 6px; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 500;">${rateLimit.usingUserKey ? 'Developer Mode' : 'Free Mode'}</span>
              ${
                !rateLimit.usingUserKey
                  ? `<span>${rateLimit.remaining}/${rateLimit.maxRequests}回残り</span>`
                  : '<span>無制限</span>'
              }
            </div>
            ${
              !rateLimit.usingUserKey
                ? `
              <div style="margin-top: 0.5rem;">
                <small style="color: var(--text-secondary, #6b7280);">
                  ${rateLimit.resetTime ? `リセット: ${rateLimit.resetTime.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}` : ''}
                  <button type="button" data-action="bigword-show-developer-prompt" style="background: none; border: none; color: #3b82f6; text-decoration: underline; cursor: pointer; padding: 0; margin-left: 0.5rem;">
                    無制限にする
                  </button>
                </small>
              </div>
            `
                : ''
            }
          </div>

          <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button
              type="button"
              class="btn-secondary"
              data-action="bigword-close-modal"
              style="padding: 0.75rem 1.5rem; border: 1px solid var(--border-color, #d1d5db); background: white; border-radius: 6px; font-size: 0.9375rem; cursor: pointer;"
            >
              キャンセル
            </button>
            <button
              type="button"
              class="btn-primary"
              data-action="bigword-start-analysis"
              ${!rateLimit.allowed ? 'disabled' : ''}
              style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-size: 0.9375rem; font-weight: 500; cursor: pointer;"
            >
              分析開始
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.addEscapeKeyListener(modal, this.closeAnalysisModal);

    // モーダル背景クリックで閉じる
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeAnalysisModal();
      }
    });

    // フォーカスをメインキーワード入力に設定
    setTimeout(() => {
      document.getElementById('bigwordMainKeyword')?.focus();
    }, 100);
  }

  closeAnalysisModal() {
    const modal = document.getElementById('bigwordAnalyzerModal');
    if (modal) {
      if (modal.handleEscape) {
        document.removeEventListener('keydown', modal.handleEscape);
      }
      modal.remove();
    }
  }

  /**
   * 分析を開始
   */
  async startAnalysis() {
    const mainKeyword = document.getElementById('bigwordMainKeyword')?.value.trim();
    const subKeywords = document.getElementById('bigwordSubKeywords')?.value.trim();
    const targetUrl = document.getElementById('bigwordTargetUrl')?.value.trim();

    if (!mainKeyword) {
      alert('メインキーワードを入力してください');
      return;
    }

    if (!targetUrl) {
      alert('分析対象URLが設定されていません');
      return;
    }

    // レート制限チェック
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      alert('本日の無料利用回数を超過しました。明日以降に再度お試しください。');
      return;
    }

    // 複数分析の同時実行を防ぐ
    if (!canStartAnalysis('bigword-analyzer')) {
      alert('他の分析が実行中です。完了後に再度お試しください。');
      return;
    }

    try {
      this.closeAnalysisModal();
      this.showResultModal(mainKeyword, subKeywords);

      // プロキシ経由でHTMLを取得
      const html = await this.fetchPageHtml(targetUrl);
      this.currentHtml = html;

      // OpenAI APIで分析（ストリーミング）
      await this.streamBigwordAnalysis({
        mainKeyword,
        subKeywords,
        html,
        url: targetUrl,
      });
    } catch (error) {
      console.error('[BigwordAnalyzer] Analysis failed:', error);
      alert('分析中にエラーが発生しました: ' + error.message);
      setAnalysisInactive('bigword-analyzer');
    }
  }

  /**
   * ページのHTMLを取得
   */
  async fetchPageHtml(url) {
    const proxyUrl = this.getApiUrl('proxy');
    const response = await fetch(`${proxyUrl}?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      throw new Error(`HTMLの取得に失敗しました: ${response.statusText}`);
    }

    return await response.text();
  }

  /**
   * 結果表示モーダルを表示
   */
  showResultModal(mainKeyword, subKeywords) {
    // 既存の結果モーダルがあれば削除
    const existingModal = document.getElementById('bigwordResultModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'bigwordResultModal';
    modal.className = 'modal-overlay';
    modal.style.cssText =
      'display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center;';
    modal.innerHTML = `
      <div class="modal-container" style="background: var(--bg-primary, white); border-radius: 12px; max-width: 900px; width: 95%; max-height: 90vh; overflow-y: auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
        <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--border-color, #e5e7eb); position: sticky; top: 0; background: var(--bg-primary, white); z-index: 10;">
          <div>
            <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600;">Bigワード達成度分析結果</h2>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary, #6b7280);">メインキーワード: ${this.escapeHtml(mainKeyword)}${subKeywords ? ` | サブ: ${this.escapeHtml(subKeywords)}` : ''}</p>
          </div>
          <button type="button" class="modal-close" data-action="bigword-close-result-modal" aria-label="閉じる" style="background: none; border: none; cursor: pointer; padding: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body" style="padding: 1.5rem;">
          <div id="bigwordAnalysisResult" class="analysis-result" style="min-height: 200px;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem;">
              <div style="width: 40px; height: 40px; border: 3px solid #f3f4f6; border-top-color: #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              <p style="margin-top: 1rem; color: var(--text-secondary, #6b7280);">分析中...</p>
            </div>
          </div>
          <div id="bigwordExportButtons" style="display: none; margin-top: 1.5rem;"></div>
          <div id="bigwordUsageInfo" style="display: none; margin-top: 1.5rem;"></div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 閉じるボタンのイベントリスナー
    modal.querySelector('[data-action="bigword-close-result-modal"]')?.addEventListener('click', () => {
      modal.remove();
    });

    // モーダル背景クリックで閉じる
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    this.addEscapeKeyListener(modal, () => modal.remove());

    // スピナーアニメーションとボタンホバー用のスタイルを追加
    if (!document.getElementById('bigword-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'bigword-spinner-style';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .btn-advisor:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * OpenAI APIでBigワード分析をストリーミング実行
   */
  async streamBigwordAnalysis({ mainKeyword, subKeywords, html, url }) {
    setAnalysisActive('bigword-analyzer');
    this.isStreaming = true;

    const resultDiv = document.getElementById('bigwordAnalysisResult');
    if (!resultDiv) {
      console.error('[BigwordAnalyzer] Result div not found');
      setAnalysisInactive('bigword-analyzer');
      return;
    }

    resultDiv.innerHTML = '<div class="streaming-content"></div>';
    const streamingDiv = resultDiv.querySelector('.streaming-content');

    let fullText = '';
    let lastUpdateTime = Date.now();
    const updateInterval = 100; // 100msごとに更新

    try {
      const userApiKey = this.getUserApiKey();
      const apiUrl = this.getApiUrl('seo-bigword-analyzer');

      const requestBody = {
        mainKeyword,
        subKeywords,
        html,
        url,
        model: this.model,
      };

      if (userApiKey) {
        requestBody.apiKey = userApiKey;
        const provider = this.getUserApiProvider();
        const baseUrl = this.getUserApiBaseUrl();
        if (provider) requestBody.provider = provider;
        if (baseUrl) requestBody.baseUrl = baseUrl;
      }

      const abortController = new AbortController();
      window.ANALYSIS_STATE.abortControllers['bigword-analyzer'] = abortController;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              if (parsed.error) {
                throw new Error(parsed.error);
              }

              if (parsed.content) {
                fullText += parsed.content;

                // パフォーマンス最適化: 一定間隔でのみ更新
                const now = Date.now();
                if (now - lastUpdateTime > updateInterval) {
                  streamingDiv.innerHTML = this.renderMarkdownCommon(fullText);
                  lastUpdateTime = now;
                }
              }

              if (parsed.usage) {
                this.currentUsage = parsed.usage;
              }
            } catch (e) {
              console.warn('[BigwordAnalyzer] Failed to parse SSE data:', e);
            }
          }
        }
      }

      // 最終更新
      streamingDiv.innerHTML = this.renderMarkdownCommon(fullText);

      // 使用量情報を表示
      if (this.currentUsage) {
        this.showUsageInfo(this.currentUsage);
      }

      // エクスポートボタンを表示
      this.showExportButtons(fullText, mainKeyword);

      // レート制限を記録
      this.recordUsage();
    } catch (error) {
      console.error('[BigwordAnalyzer] Streaming error:', error);

      if (error.name === 'AbortError') {
        streamingDiv.innerHTML = '<p class="error-message">分析がキャンセルされました。</p>';
      } else {
        streamingDiv.innerHTML = `<p class="error-message">エラー: ${this.escapeHtml(error.message)}</p>`;
      }
    } finally {
      this.isStreaming = false;
      setAnalysisInactive('bigword-analyzer');
      delete window.ANALYSIS_STATE.abortControllers['bigword-analyzer'];
    }
  }

  /**
   * 使用量情報を表示
   */
  showUsageInfo(usage) {
    const usageDiv = document.getElementById('bigwordUsageInfo');
    if (!usageDiv) return;

    const html = this.renderApiUsagePanel(usage, this.model);
    usageDiv.innerHTML = html;
    usageDiv.style.display = 'block';
  }

  /**
   * エクスポートボタンを表示
   */
  showExportButtons(analysisText, mainKeyword) {
    const exportDiv = document.getElementById('bigwordExportButtons');
    if (!exportDiv) return;

    this.showExportButtonsCommon(
      'bigwordExportButtons',
      () => this.exportToCsv(analysisText, mainKeyword),
      () => this.exportToHtml(analysisText, mainKeyword)
    );
  }

  /**
   * CSV形式でエクスポート
   */
  exportToCsv(analysisText, mainKeyword) {
    const cleanText = this.cleanHtmlText(analysisText);
    const timestamp = new Date().toISOString().slice(0, 10);

    const csvContent = [
      ['分析日時', '分析対象URL', 'メインキーワード', '分析結果'],
      [
        new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        this.currentUrl || '',
        mainKeyword,
        this.escapeCsvValue(cleanText),
      ],
    ]
      .map(row => row.join(','))
      .join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, `bigword-analysis-${timestamp}.csv`);
  }

  /**
   * HTML形式でエクスポート
   */
  exportToHtml(analysisText, mainKeyword) {
    const timestamp = new Date().toISOString().slice(0, 10);
    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bigワード達成度分析 - ${this.escapeHtml(mainKeyword)}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1, h2, h3 { color: #333; }
    .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .meta p { margin: 5px 0; }
    .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'Courier New', monospace; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="meta">
    <h1>Bigワード達成度分析結果</h1>
    <p><strong>分析日時:</strong> ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</p>
    <p><strong>分析対象URL:</strong> ${this.escapeHtml(this.currentUrl || '')}</p>
    <p><strong>メインキーワード:</strong> ${this.escapeHtml(mainKeyword)}</p>
  </div>
  <div class="content">
    ${this.renderMarkdownCommon(analysisText)}
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    this.downloadFile(blob, `bigword-analysis-${timestamp}.html`);
  }
}

// グローバルインスタンスを作成
window.seoBigwordAnalyzer = new SeoBigwordAnalyzer();

// URL分析時に自動的にボタンを表示（Article/BlogPostingの時のみ）
document.addEventListener('DOMContentLoaded', () => {
  const originalDisplaySEOAnalysis = window.displaySEOAnalysis;
  if (originalDisplaySEOAnalysis) {
    window.displaySEOAnalysis = function (html, schemas) {
      originalDisplaySEOAnalysis.call(this, html, schemas);

      // Bigワード分析ボタンを表示（schemasを渡す）
      const urlInput = document.getElementById('urlInput');
      if (urlInput && urlInput.value && schemas) {
        window.seoBigwordAnalyzer.showAnalysisButton(urlInput.value, schemas);
      }
    };
  }
});
