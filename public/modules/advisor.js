class AdvisorManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_advisor_usage',
      USER_API_KEY: 'jsonld_user_openai_key',
      STAKEHOLDER_MODE_KEY: 'jsonld_advisor_stakeholder',
      MAX_REQUESTS_PER_DAY: 10,
      MAX_REQUESTS_STAKEHOLDER: 30,
      elemIdPrefix: 'advisor',
      ui: {
        showConfirmDialog: () => this.showModeSelector(),
        closeStakeholderPrompt: () => this.closeStakeholderPrompt(),
        closeDeveloperPrompt: () => this.closeDeveloperPrompt(),
      },
      actionHandlers: {
        'advisor-close-stakeholder-prompt': () => this.closeStakeholderPrompt(),
        'advisor-confirm-stakeholder': () => this.confirmStakeholder(),
        'advisor-close-developer-prompt': () => this.closeDeveloperPrompt(),
        'advisor-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'advisor-save-developer-key': () => this.saveDeveloperKey(),
        'advisor-test-developer-connection': () => this.testDeveloperConnection(),
        'advisor-reset-developer-settings': () => this.resetDeveloperSettings(),
        'advisor-show-stakeholder-prompt': () => this.showStakeholderPrompt(),
        'advisor-show-developer-prompt': () => this.showDeveloperPrompt(),
        'advisor-reset-to-normal-mode': () => this.resetToNormalMode(),
        'advisor-start-employer': () => this.startAnalysis('employer'),
        'advisor-start-applicant': () => this.startAnalysis('applicant'),
        'advisor-close-mode-overlay': () => this.closeModal('ModeOverlay'),
        'advisor-close-view': () => this.closeAdvisorView(),
        'advisor-fetch-advice': () => this.fetchAdvice(this.currentMode),
      },
      actions: {
        closeStakeholderPrompt: 'advisor-close-stakeholder-prompt',
        confirmStakeholder: 'advisor-confirm-stakeholder',
        closeDeveloperPrompt: 'advisor-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'advisor-toggle-developer-key-visibility',
        saveDeveloperKey: 'advisor-save-developer-key',
        testDeveloperConnection: 'advisor-test-developer-connection',
        resetDeveloperSettings: 'advisor-reset-developer-settings',
      },
    };
    super(config);

    this.currentJobPosting = null;
    this.currentMode = null;
    this.isStreaming = false;
    this.currentUsage = null;
    this.currentModel = window.ADVISOR_CONST.DEFAULT_MODEL; // デフォルトモデル
  }

  detectJobPosting(jsonLdData) {
    this.hideAdvisorButton();
    const jobPosting = jsonLdData.find(
      item => item['@type'] === 'JobPosting' || item['@type']?.includes('JobPosting')
    );
    if (jobPosting) {
      this.currentJobPosting = jobPosting;
      this.showAdvisorButton();
    }
  }

  showAdvisorButton() {
    const actionsContainer = document.getElementById('aiActions') || document.getElementById('results');
    if (!actionsContainer || document.getElementById('advisorTriggerBtn')) return;

    const button = document.createElement('button');
    button.id = 'advisorTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.innerHTML = `<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\" fill=\"white\"/></svg> 求人/求職アドバイスを受ける`;
    button.onclick = () => this.showModeSelector();
    actionsContainer.insertBefore(button, actionsContainer.firstChild);
  }

  hideAdvisorButton() {
    const btn = document.getElementById('advisorTriggerBtn');
    if (btn) btn.remove();
  }

  showModeSelector() {
    const rateLimit = this.checkRateLimit();
    let rateLimitHtml = '';
    if (rateLimit.mode === 'developer') {
      rateLimitHtml = '<div class="advisor-rate-info advisor-rate-unlimited">MyAPIモード（無制限）</div>';
    } else {
      const limitMsg = rateLimit.allowed ? `残り ${rateLimit.remaining} 回` : '利用制限に達しました';
      rateLimitHtml = `<div class="advisor-rate-info">${limitMsg} / ${rateLimit.maxRequests} 回（24時間）</div>`;
    }

    const overlay = this.createModal('ModeOverlay', `
      <div class="advisor-modal">
        <div class="advisor-modal-header advisor-modal-header--stack">
           <div class="advisor-modal-header-row">
            <div class="advisor-mode-buttons-small">
              <button class="advisor-mode-btn-small" data-action="advisor-reset-to-normal-mode">通常モード</button>
              <button class="advisor-mode-btn-small" data-action="advisor-show-stakeholder-prompt">関係者</button>
              <button class="advisor-mode-btn-small" data-action="advisor-show-developer-prompt">MyAPI</button>
            </div>
            <button class="advisor-modal-close" data-action="advisor-close-mode-overlay"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor"/></svg></button>
          </div>
          <h2>どちらの視点でアドバイスしますか？</h2>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}
          <div class="advisor-mode-buttons-grid">
            <button class="advisor-mode-btn" data-action="advisor-start-employer">
              <h3>採用側向け</h3><p>求人票をレビューし改善提案を提供</p>
            </button>
            <button class="advisor-mode-btn" data-action="advisor-start-applicant">
              <h3>応募者向け</h3><p>面接対策と要件傾向の分析を提供</p>
            </button>
          </div>
        </div>
      </div>
    `);
    this.addEscapeKeyListener(overlay, () => this.closeModal('ModeOverlay'));
  }

  async startAnalysis(mode) {
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      this.closeModal('ModeOverlay');
      alert('利用制限に達しました。');
      return;
    }
    this.currentMode = mode;
    this.closeModal('ModeOverlay');
    this.showAdvisorView(mode);
    await this.fetchAdvice(mode);
  }

  showAdvisorView(mode) {
    const container = document.querySelector('.container');
    if (!container) return;
    const modeTitle = mode === 'employer' ? '採用側向けアドバイス' : '応募者向けアドバイス';
    const headerHtml = this.renderViewHeader(modeTitle, 'advisor-close-view');
    const advisorView = this.createModal('View', `
      ${headerHtml}
      <div class="advisor-view-content">
        <div class="advisor-job-panel"><h3>求人票</h3><div class="advisor-job-content">${this.formatJobPosting(this.currentJobPosting)}</div></div>
        <div class="advisor-advice-panel"><h3>AI分析結果</h3><div class="advisor-advice-content" id="advisorAdviceContent"><div class="advisor-loading"></div></div></div>
      </div>
    `);
    container.style.display = 'none';
    advisorView.classList.add('advisor-view');
  }

  closeAdvisorView() {
    this.isStreaming = false;
    this.closeModal('View');
    const container = document.querySelector('.container');
    if (container) container.style.display = '';
  }

  formatJobPosting(job) {
    const title = job.title || '不明';
    const description = this.formatDescription(job.description || '説明なし');
    return `<div class="job-field"><label>職種</label><div>${this.escapeHtml(title)}</div></div><div class="job-field"><label>職務内容</label><div>${description}</div></div>`;
  }

  formatDescription(text) {
    let html = this.escapeHtml(text).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    return html.split(/\n\n+/).map(p => `<p>${p.split('\n').join('<br>')}</p>`).join('');
  }

  async fetchAdvice(mode) {
    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;
    this.isStreaming = true;

    try {
      const apiUrl = window.location.hostname.includes('vercel.app') ? '/api/advisor' : 'http://127.0.0.1:3333/api/advisor';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobPosting: this.currentJobPosting, mode, userApiKey: this.getUserApiKey() || undefined }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      adviceContent.innerHTML = '<div class="advisor-markdown"></div>';
      const markdownDiv = adviceContent.querySelector('.advisor-markdown');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (this.isStreaming) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            this.isStreaming = false;
            this.recordUsage();
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.model) {
              this.currentModel = parsed.model;
              console.log('[Advisor] Received model:', parsed.model);
            } else if (parsed.content) {
              fullText += parsed.content;
              markdownDiv.innerHTML = this.renderMarkdown(fullText);
            } else if (parsed.usage) {
              this.currentUsage = parsed.usage;
              this.displayUsage();
            }
          } catch (e) {
            console.warn('[Advisor] Failed to parse streaming data:', e);
          }
        }
      }
    } catch (error) {
      adviceContent.innerHTML = `<div class="advisor-error"><p>AI分析に失敗しました</p><button data-action="advisor-fetch-advice">再試行</button></div>`;
    }
  }

  renderMarkdown(markdown) {
    let html = this.escapeHtml(markdown);
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/((?:<li>.*?<\/li>(?:<br>)*)+)/g, match => `<ul>${match.replace(/<br>/g, '')}</ul>`);
    return html.replace(/\n/g, '<br>');
  }

  displayUsage() {
    if (!this.currentUsage) return;
    const container = document.createElement('div');
    // BaseAdvisorManagerの共通メソッドを使用して詳細な使用量表示を生成
    // サーバーから受信したモデル名を使用、なければデフォルト
    container.innerHTML = this.renderApiUsagePanel(this.currentUsage, this.currentModel);
    document.getElementById('advisorAdviceContent').appendChild(container);
  }
}

// グローバルインスタンス
const advisorManager = new AdvisorManager();
