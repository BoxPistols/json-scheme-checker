// Web Advisor Module - 汎用Webアドバイザー（スキーマ無し/WebPageのみ）

class WebAdvisorManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_web_advisor_usage',
      USER_API_KEY: 'jsonld_web_advisor_openai_key',
      STAKEHOLDER_MODE_KEY: 'jsonld_web_advisor_stakeholder',
      MAX_REQUESTS_PER_DAY: 10,
      MAX_REQUESTS_STAKEHOLDER: 30,
      elemIdPrefix: 'webAdvisor',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeStakeholderPrompt: () => this.closeModal('stakeholderPrompt'),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'web-close-stakeholder-prompt': () => this.closeModal('stakeholderPrompt'),
        'web-confirm-stakeholder': () => this.confirmStakeholder(),
        'web-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'web-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'web-save-developer-key': () => this.saveDeveloperKey(),
        'web-show-stakeholder-prompt': () => this.showStakeholderPrompt(),
        'web-show-developer-prompt': () => this.showDeveloperPrompt(),
        'web-reset-to-normal-mode': () => this.resetToNormalMode(),
        'web-close-confirm-dialog': () => this.closeConfirmDialog(),
        'web-start-analysis': () => this.startAnalysis(),
        'web-close-advisor-view': () => this.closeAdvisorView(),
        'web-fetch-advice': () => this.fetchAdvice(),
        'show-web-confirm-dialog': () => this.showConfirmDialog(),
      },
      actions: {
        closeStakeholderPrompt: 'web-close-stakeholder-prompt',
        confirmStakeholder: 'web-confirm-stakeholder',
        closeDeveloperPrompt: 'web-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'web-toggle-developer-key-visibility',
        saveDeveloperKey: 'web-save-developer-key',
      },
    };
    super(config);

    this.isStreaming = false;
    this.currentUsage = null;
    this.remoteDoc = null;
    this.currentUrl = null;
  }

  /**
   * リモートHTMLを設定
   * @param {string} html - 取得したリモートHTML
   */
  setRemoteHtml(html) {
    try {
      const parser = new DOMParser();
      this.remoteDoc = parser.parseFromString(html, 'text/html');
    } catch (e) {
      console.warn('[WebAdvisor] Remote HTMLのパースに失敗:', e);
      this.remoteDoc = null;
    }
  }

  /**
   * スキーマを検出してWebアドバイザーボタンを表示
   * @param {Array} jsonLdData - 抽出されたJSON-LDデータ
   * @param {string} url - 分析対象URL
   */
  detectSchemas(jsonLdData, url) {
    console.log('[WebAdvisorManager] detectSchemas called with:', jsonLdData?.length, 'schemas');

    this.currentUrl = url;
    this.hideAdvisorButton();

    if (!jsonLdData || !Array.isArray(jsonLdData)) {
      console.warn('[WebAdvisorManager] jsonLdData is not an array');
      return;
    }

    // スキーマ無し、またはWebPageのみの場合にボタンを表示
    const hasNoSchemas = jsonLdData.length === 0;
    const hasOnlyWebPage =
      jsonLdData.length > 0 &&
      jsonLdData.every(
        item => item['@type'] === 'WebPage' || item['@type']?.includes('WebPage')
      );

    if (hasNoSchemas || hasOnlyWebPage) {
      console.log('[WebAdvisorManager] Showing Web Advisor button (no schemas or WebPage only)');
      this.showAdvisorButton();
    }
  }

  /**
   * Webアドバイザーボタンを表示
   */
  showAdvisorButton() {
    const resultDiv = document.getElementById('results');
    if (!resultDiv || document.getElementById('webAdvisorTriggerBtn')) return;

    const button = document.createElement('button');
    button.id = 'webAdvisorTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="white"/>
      </svg>
      Webアドバイザーを実行（汎用分析）
    `;
    button.onclick = () => this.showConfirmDialog();
    resultDiv.insertBefore(button, resultDiv.firstChild);
  }

  /**
   * Webアドバイザーボタンを非表示
   */
  hideAdvisorButton() {
    const btn = document.getElementById('webAdvisorTriggerBtn');
    if (btn) btn.remove();
  }

  /**
   * 確認ダイアログを表示
   */
  showConfirmDialog() {
    const rateLimit = this.checkRateLimit();
    let rateLimitHtml = '';
    if (rateLimit.mode === 'developer') {
      rateLimitHtml = '<div class="advisor-rate-info advisor-rate-unlimited">MyAPIモード（無制限）</div>';
    } else {
      const limitMsg = rateLimit.allowed ? `残り ${rateLimit.remaining} 回` : '利用制限に達しました';
      rateLimitHtml = `<div class="advisor-rate-info">${limitMsg} / ${rateLimit.maxRequests} 回（24時間）</div>`;
    }

    const overlay = this.createModal(
      'confirmDialog',
      `
      <div class="advisor-modal">
        <div class="advisor-modal-header" style="flex-direction: column; align-items: stretch;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div class="advisor-mode-buttons-small">
              <button class="advisor-mode-btn-small" data-action="web-reset-to-normal-mode">通常モード</button>
              <button class="advisor-mode-btn-small" data-action="web-show-stakeholder-prompt">関係者</button>
              <button class="advisor-mode-btn-small" data-action="web-show-developer-prompt">MyAPI</button>
            </div>
            <button class="advisor-modal-close" data-action="web-close-confirm-dialog">
              <svg width="24" height="24" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor"/></svg>
            </button>
          </div>
          <h2>Webアドバイザー（汎用分析）</h2>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}
          <p style="margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6;">
            このページはスキーマが無い、またはWebPageのみです。<br>
            SEO・EEAT・アクセシビリティの観点で汎用的なAI分析を実行しますか？
          </p>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="web-close-confirm-dialog">キャンセル</button>
            <button class="advisor-btn-primary" data-action="web-start-analysis" ${!rateLimit.allowed ? 'disabled' : ''}>
              分析を開始
            </button>
          </div>
        </div>
      </div>
    `
    );
    this.addEscapeKeyListener(overlay, this.closeConfirmDialog.bind(this));
  }

  /**
   * 確認ダイアログを閉じる
   */
  closeConfirmDialog() {
    this.closeModal('confirmDialog');
  }

  /**
   * 分析を開始
   */
  async startAnalysis() {
    console.log('[WebAdvisor] Starting analysis...');
    this.closeConfirmDialog();

    // レート制限チェック
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed && !rateLimit.usingUserKey) {
      alert(
        `利用制限に達しています。\n次回利用可能: ${rateLimit.resetTime ? new Date(rateLimit.resetTime).toLocaleString('ja-JP') : '不明'}`
      );
      return;
    }

    // 使用回数を記録
    this.recordUsage();

    // 分析ビューを表示
    this.showAdvisorView();

    // 分析を実行
    await this.fetchAdvice();
  }

  /**
   * 分析ビューを表示
   */
  showAdvisorView() {
    const existingOverlay = document.getElementById('webAdvisorOverlay');
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement('div');
    overlay.id = 'webAdvisorOverlay';
    overlay.className = 'advisor-overlay advisor-overlay--visible';
    overlay.innerHTML = `
      <div class="advisor-container">
        <div class="advisor-header">
          <h2>Webアドバイザー結果</h2>
          <button class="advisor-close-btn" data-action="web-close-advisor-view">
            <svg width="24" height="24" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/></svg>
          </button>
        </div>
        <div class="advisor-tabs">
          <button class="advisor-tab advisor-tab--active" data-tab="seo">SEO</button>
          <button class="advisor-tab" data-tab="eeat">EEAT</button>
          <button class="advisor-tab" data-tab="accessibility">アクセシビリティ</button>
          <button class="advisor-tab" data-tab="priority">優先課題</button>
          <button class="advisor-tab" data-tab="summary">要約</button>
        </div>
        <div class="advisor-content">
          <div class="advisor-tab-content advisor-tab-content--active" id="tab-seo">
            <div class="advisor-loading">
              <div class="advisor-spinner"></div>
              <p>AI分析中...</p>
            </div>
          </div>
          <div class="advisor-tab-content" id="tab-eeat"></div>
          <div class="advisor-tab-content" id="tab-accessibility"></div>
          <div class="advisor-tab-content" id="tab-priority"></div>
          <div class="advisor-tab-content" id="tab-summary"></div>
        </div>
        <div class="advisor-actions">
          <button class="advisor-btn-secondary" id="webAdvisorCopyBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            全文コピー
          </button>
          <button class="advisor-btn-secondary" id="webAdvisorSaveBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
              <polyline points="17 21 17 13 7 13 7 21"></polyline>
              <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            ファイル保存
          </button>
          <button class="advisor-btn-primary" data-action="web-fetch-advice">再実行</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // タブ切り替え
    overlay.querySelectorAll('.advisor-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // コピーボタン
    document.getElementById('webAdvisorCopyBtn').addEventListener('click', () => {
      this.copyAllContent();
    });

    // 保存ボタン
    document.getElementById('webAdvisorSaveBtn').addEventListener('click', () => {
      this.saveToFile();
    });

    this.addEscapeKeyListener(overlay, this.closeAdvisorView.bind(this));
  }

  /**
   * タブを切り替え
   */
  switchTab(tabName) {
    const tabs = document.querySelectorAll('.advisor-tab');
    const contents = document.querySelectorAll('.advisor-tab-content');

    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('advisor-tab--active');
      } else {
        tab.classList.remove('advisor-tab--active');
      }
    });

    contents.forEach(content => {
      if (content.id === `tab-${tabName}`) {
        content.classList.add('advisor-tab-content--active');
      } else {
        content.classList.remove('advisor-tab-content--active');
      }
    });
  }

  /**
   * 分析ビューを閉じる
   */
  closeAdvisorView() {
    const overlay = document.getElementById('webAdvisorOverlay');
    if (overlay) {
      if (overlay.handleEscape) {
        document.removeEventListener('keydown', overlay.handleEscape);
      }
      overlay.remove();
    }
  }

  /**
   * AI分析を実行
   */
  async fetchAdvice() {
    if (this.isStreaming) {
      console.warn('[WebAdvisor] Already streaming');
      return;
    }

    console.log('[WebAdvisor] Fetching advice...');
    this.isStreaming = true;

    // 分析データを収集
    const analysisData = this.collectAnalysisData();

    // APIエンドポイント
    const endpoint = PROXY_SERVER ? `${PROXY_SERVER}/api/web-advisor` : '/api/web-advisor';

    try {
      const userApiKey = this.getUserApiKey();
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...analysisData,
          userApiKey,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // SSEストリーミング処理
      await this.processStream(response);
    } catch (error) {
      console.error('[WebAdvisor] Fetch error:', error);
      this.showError(`エラーが発生しました: ${error.message}`);
    } finally {
      this.isStreaming = false;
    }
  }

  /**
   * 分析データを収集
   */
  collectAnalysisData() {
    const data = {
      url: this.currentUrl,
      title: null,
      description: null,
      ogData: {},
      twitterData: {},
      headings: [],
      bodyText: null,
    };

    if (!this.remoteDoc) {
      console.warn('[WebAdvisor] No remote document available');
      return data;
    }

    // タイトル
    const titleEl = this.remoteDoc.querySelector('title');
    if (titleEl) {
      data.title = titleEl.textContent.trim();
    }

    // メタディスクリプション
    const descEl = this.remoteDoc.querySelector('meta[name="description"]');
    if (descEl) {
      data.description = descEl.getAttribute('content');
    }

    // OGタグ
    this.remoteDoc.querySelectorAll('meta[property^="og:"]').forEach(meta => {
      const property = meta.getAttribute('property');
      const content = meta.getAttribute('content');
      if (property && content) {
        data.ogData[property] = content;
      }
    });

    // Twitter Card
    this.remoteDoc.querySelectorAll('meta[name^="twitter:"]').forEach(meta => {
      const name = meta.getAttribute('name');
      const content = meta.getAttribute('content');
      if (name && content) {
        data.twitterData[name] = content;
      }
    });

    // 見出し構造
    ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
      this.remoteDoc.querySelectorAll(tag).forEach(heading => {
        const text = heading.textContent.trim();
        if (text) {
          data.headings.push({
            level: tag.toUpperCase(),
            text: text.substring(0, 200), // 最大200文字
          });
        }
      });
    });

    // 本文テキスト（最初の5000文字）
    const bodyEl = this.remoteDoc.querySelector('body');
    if (bodyEl) {
      // スクリプトとスタイルを除外
      const clone = bodyEl.cloneNode(true);
      clone.querySelectorAll('script, style, noscript').forEach(el => el.remove());
      const text = clone.textContent.replace(/\s+/g, ' ').trim();
      data.bodyText = text.substring(0, 5000);
    }

    console.log('[WebAdvisor] Collected analysis data:', {
      url: data.url,
      hasTitle: !!data.title,
      hasDescription: !!data.description,
      ogCount: Object.keys(data.ogData).length,
      twitterCount: Object.keys(data.twitterData).length,
      headingCount: data.headings.length,
      bodyTextLength: data.bodyText?.length || 0,
    });

    return data;
  }

  /**
   * SSEストリームを処理
   */
  async processStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    // ローディング表示をクリア
    const loadingEl = document.querySelector('.advisor-loading');
    if (loadingEl) loadingEl.remove();

    // コンテンツ表示エリアを準備
    const seoTab = document.getElementById('tab-seo');
    seoTab.innerHTML = '<div class="advisor-markdown"></div>';
    const markdownEl = seoTab.querySelector('.advisor-markdown');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));

            if (data.type === 'content') {
              fullContent += data.content;
              markdownEl.innerHTML = this.renderMarkdown(fullContent);
            } else if (data.type === 'done') {
              console.log('[WebAdvisor] Stream completed');
              this.currentUsage = data.usage;
              this.distributeContentToTabs(fullContent);
            } else if (data.type === 'error') {
              throw new Error(data.error);
            } else if (data.type === 'rate_limit') {
              console.log('[WebAdvisor] Rate limit info:', data);
            }
          }
        }
      }
    } catch (error) {
      console.error('[WebAdvisor] Stream error:', error);
      this.showError(`ストリーミング中にエラーが発生しました: ${error.message}`);
    }
  }

  /**
   * コンテンツをタブに振り分け
   */
  distributeContentToTabs(content) {
    // セクションごとに分割
    const sections = {
      seo: this.extractSection(content, '## SEO分析'),
      eeat: this.extractSection(content, '## EEAT分析'),
      accessibility: this.extractSection(content, '## アクセシビリティ分析'),
      priority: this.extractSection(content, '## 優先課題'),
      summary: this.extractSection(content, '## 総合評価と要約'),
    };

    // 各タブに内容を設定
    Object.entries(sections).forEach(([key, content]) => {
      const tabEl = document.getElementById(`tab-${key}`);
      if (tabEl && content) {
        tabEl.innerHTML = `<div class="advisor-markdown">${this.renderMarkdown(content)}</div>`;
      }
    });
  }

  /**
   * Markdownセクションを抽出
   */
  extractSection(content, sectionTitle) {
    const startIndex = content.indexOf(sectionTitle);
    if (startIndex === -1) return null;

    // 次のセクション（## で始まる行）を探す
    const nextSectionIndex = content.indexOf('\n##', startIndex + sectionTitle.length);
    if (nextSectionIndex === -1) {
      return content.substring(startIndex);
    }
    return content.substring(startIndex, nextSectionIndex);
  }

  /**
   * Markdownをレンダリング（簡易版）
   */
  renderMarkdown(text) {
    if (!text) return '';

    let html = text
      // エスケープ
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // 見出し
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // 太字
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // リスト
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      // 段落
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // リストをラップ
    html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/<\/ul><ul>/g, '');

    // 段落をラップ
    html = `<p>${html}</p>`;

    return html;
  }

  /**
   * エラーを表示
   */
  showError(message) {
    const tabs = document.querySelectorAll('.advisor-tab-content');
    tabs.forEach(tab => {
      tab.innerHTML = `<div class="advisor-error">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>${message}</p>
      </div>`;
    });
  }

  /**
   * 全文をコピー
   */
  copyAllContent() {
    const tabs = document.querySelectorAll('.advisor-tab-content');
    let allText = '';
    tabs.forEach(tab => {
      const markdown = tab.querySelector('.advisor-markdown');
      if (markdown) {
        allText += markdown.textContent + '\n\n';
      }
    });

    navigator.clipboard
      .writeText(allText)
      .then(() => {
        showSnackbar('全文をコピーしました', 'success');
      })
      .catch(err => {
        console.error('Copy failed:', err);
        showSnackbar('コピーに失敗しました', 'error');
      });
  }

  /**
   * ファイルに保存
   */
  saveToFile() {
    const tabs = document.querySelectorAll('.advisor-tab-content');
    let allText = '# Webアドバイザー分析結果\n\n';
    allText += `URL: ${this.currentUrl}\n`;
    allText += `分析日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    allText += '---\n\n';

    tabs.forEach(tab => {
      const markdown = tab.querySelector('.advisor-markdown');
      if (markdown) {
        allText += markdown.textContent + '\n\n';
      }
    });

    const blob = new Blob([allText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-advisor-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSnackbar('ファイルを保存しました', 'success');
  }

  // BaseAdvisorManagerのメソッドをオーバーライド

  confirmStakeholder() {
    this.enableStakeholderMode();
    this.closeModal('stakeholderPrompt');
    alert(`関係者モードが有効になりました。\n利用回数が${this.config.MAX_REQUESTS_STAKEHOLDER}回/24時間に増加しました。`);
    this.showConfirmDialog();
  }

  showDeveloperPrompt() {
    const currentKey = this.getUserApiKey();
    const overlay = this.createModal(
      'developerPrompt',
      `
      <div class="advisor-modal advisor-developer-modal">
        <div class="advisor-modal-header"><h2>MyAPI設定</h2></div>
        <div class="advisor-modal-body">
          <p style="margin-bottom: 15px; font-size: 0.9rem; color: var(--secondary-text-color);">
            OpenAI APIキーを設定すると、利用回数制限なしで使用できます
          </p>
          <div class="advisor-input-group">
            <label for="webAdvisorApiKeyInput">OpenAI APIキー</label>
            <div class="advisor-password-wrapper">
              <input type="password" id="webAdvisorApiKeyInput" placeholder="sk-..." value="${currentKey || ''}" />
              <button type="button" class="advisor-password-toggle" data-action="web-toggle-developer-key-visibility">
                <svg class="icon-eye" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg class="icon-eye-off" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: none;">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              </button>
            </div>
          </div>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="web-close-developer-prompt">キャンセル</button>
            <button class="advisor-btn-primary" data-action="web-save-developer-key">保存</button>
          </div>
        </div>
      </div>
    `
    );
    this.addEscapeKeyListener(overlay, this.config.ui.closeDeveloperPrompt);
  }

  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('webAdvisorApiKeyInput');
    const iconEye = document.querySelector('.icon-eye');
    const iconEyeOff = document.querySelector('.icon-eye-off');
    if (input && iconEye && iconEyeOff) {
      if (input.type === 'password') {
        input.type = 'text';
        iconEye.style.display = 'none';
        iconEyeOff.style.display = 'inline-block';
      } else {
        input.type = 'password';
        iconEye.style.display = 'inline-block';
        iconEyeOff.style.display = 'none';
      }
    }
  }

  saveDeveloperKey() {
    const input = document.getElementById('webAdvisorApiKeyInput');
    if (input) {
      const apiKey = input.value.trim();
      this.saveUserApiKey(apiKey);
      this.closeModal('developerPrompt');
      alert(apiKey ? 'APIキーを保存しました' : 'APIキーをクリアしました');
      this.showConfirmDialog();
    }
  }

  showStakeholderPrompt() {
    const overlay = this.createModal(
      'stakeholderPrompt',
      `
      <div class="advisor-modal advisor-confirm-modal">
        <div class="advisor-modal-header"><h2>関係者確認</h2></div>
        <div class="advisor-modal-body">
          <p style="margin-bottom: 20px; text-align: center;">あなたは関係者ですか？</p>
          <p style="font-size: 0.85rem; color: var(--secondary-text-color); margin-bottom: 20px; text-align: center;">
            関係者の場合、利用回数が${this.config.MAX_REQUESTS_STAKEHOLDER}回/24時間に増加します
          </p>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="${this.config.actions.closeStakeholderPrompt}">いいえ</button>
            <button class="advisor-btn-primary" data-action="${this.config.actions.confirmStakeholder}">はい</button>
          </div>
        </div>
      </div>
    `
    );
    this.addEscapeKeyListener(overlay, this.config.ui.closeStakeholderPrompt);
  }

  createModal(id, content) {
    const existingModal = document.getElementById(`webAdvisor${id}`);
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = `webAdvisor${id}`;
    overlay.className = 'advisor-modal-overlay advisor-modal-overlay--visible';
    overlay.innerHTML = content;
    document.body.appendChild(overlay);
    return overlay;
  }

  closeModal(id) {
    const modal = document.getElementById(`webAdvisor${id}`);
    if (modal) {
      if (modal.handleEscape) {
        document.removeEventListener('keydown', modal.handleEscape);
      }
      modal.remove();
    }
  }
}

// グローバルインスタンスを作成
const webAdvisorManager = new WebAdvisorManager();
