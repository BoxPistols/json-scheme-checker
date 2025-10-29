// Web Advisor Module - AI-powered advice for pages with no schema or only WebPage schema

class WebAdvisorManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_web_advisor_usage',
      USER_API_KEY: 'jsonld_web_advisor_openai_key',
      STAKEHOLDER_MODE_KEY: 'jsonld_web_advisor_stakeholder',
      USAGE_TOTAL_KEY: 'jsonld_usage_web_advisor_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
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
        'web-test-developer-connection': () => this.testDeveloperConnection(),
        'web-reset-developer-settings': () => this.resetDeveloperSettings(),
        'web-show-stakeholder-prompt': () => this.showStakeholderPrompt(),
        'web-show-developer-prompt': () => this.showDeveloperPrompt(),
        'web-reset-to-normal-mode': () => this.resetToNormalMode(),
        'web-close-confirm-dialog': () => this.closeConfirmDialog(),
        'web-start-analysis': () => this.startAnalysis(),
        'web-close-result-view': () => this.closeResultView(),
        'web-fetch-analysis': () => this.fetchAnalysis(),
        'show-web-confirm-dialog': () => this.showConfirmDialog(),
      },
      actions: {
        closeStakeholderPrompt: 'web-close-stakeholder-prompt',
        confirmStakeholder: 'web-confirm-stakeholder',
        closeDeveloperPrompt: 'web-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'web-toggle-developer-key-visibility',
        saveDeveloperKey: 'web-save-developer-key',
        testDeveloperConnection: 'web-test-developer-connection',
        resetDeveloperSettings: 'web-reset-developer-settings',
      },
    };
    super(config);

    this.currentUrl = null;
    this.isStreaming = false;
    this.currentResult = '';
    this.eventSource = null;
  }

  /**
   * 専用アドバイザーがない全てのページでCTAを表示
   * JobPosting、BlogPosting等の専用アドバイザーがある場合のみ除外
   * @param {Array} schemas - 検出されたスキーマ
   * @param {string} url - 分析対象URL
   */
  detectNoSchemaOrWebPageOnly(schemas, url) {
    console.log('[WebAdvisor] detectNoSchemaOrWebPageOnly called');
    console.log('[WebAdvisor] Schemas count:', schemas.length);
    console.log('[WebAdvisor] Schemas:', schemas);

    // 既存のボタンを削除
    this.hideAnalysisButton();

    if (!url) {
      console.log('[WebAdvisor] No URL provided');
      return;
    }

    // 専用アドバイザーがあるスキーマタイプ（これらがある場合のみ除外）
    const exclusiveAdvisorTypes = [
      'JobPosting',        // JobPosting専用アドバイザーあり
      'BlogPosting',       // BlogReviewer専用あり
      'Article',           // BlogReviewer専用あり
      'NewsArticle'        // BlogReviewer専用あり
    ];

    // 専用アドバイザーがあるスキーマが存在するかチェック
    const hasExclusiveAdvisor = schemas.some(schema => {
      const type = schema['@type'];
      console.log('[WebAdvisor] Checking schema type:', type);

      if (!type) return false;

      // @typeが配列の場合
      if (Array.isArray(type)) {
        const hasExclusive = type.some(t => exclusiveAdvisorTypes.includes(t));
        console.log('[WebAdvisor] Type array has exclusive advisor:', hasExclusive);
        return hasExclusive;
      }

      // @typeが文字列の場合
      const hasExclusive = exclusiveAdvisorTypes.includes(type);
      console.log('[WebAdvisor] Type has exclusive advisor:', hasExclusive);
      return hasExclusive;
    });

    console.log('[WebAdvisor] Has exclusive advisor:', hasExclusiveAdvisor);

    // 専用アドバイザーがない場合はWebアドバイザーのボタンを表示
    // スキーマ無し、WebPageのみ、Product、Event、Person等すべて対象
    if (!hasExclusiveAdvisor) {
      console.log('[WebAdvisor] Showing analysis button (専用アドバイザーなし)');
      this.currentUrl = url;
      this.showAnalysisButton();
    } else {
      console.log('[WebAdvisor] Not showing button (専用アドバイザーあり)');
    }
  }

  /**
   * 分析ボタンを表示（BlogReviewer/Advisorと同じUI）
   */
  showAnalysisButton() {
    const actionsContainer = document.getElementById('aiActions') || document.getElementById('results');
    if (!actionsContainer) {
      console.warn('[WebAdvisor] actions container not found');
      return;
    }

    // 既存のボタンがあれば削除
    const existingBtn = document.getElementById('webAdvisorButton');
    if (existingBtn) {
      console.log('[WebAdvisor] Button already exists');
      return;
    }

    const button = document.createElement('button');
    button.id = 'webAdvisorButton';
    button.className = 'advisor-trigger-btn';
    button.type = 'button';
    button.dataset.action = 'show-web-confirm-dialog';
    button.innerHTML = `
      <svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">\n        <path d=\"M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7-5.5-4h7z\"/>\n      </svg>\n      Webページ分析を受ける
    `;

    // actions containerの最初に挿入
    actionsContainer.insertBefore(button, actionsContainer.firstChild);
    console.log('[WebAdvisor] Analysis button inserted');
  }

  /**
   * 分析ボタンを非表示
   */
  hideAnalysisButton() {
    const btn = document.getElementById('webAdvisorButton');
    if (btn) btn.remove();
  }

  /**
   * 確認ダイアログを表示（Advisor/BlogReviewerと統一）
   */
  showConfirmDialog() {
    const rateLimit = this.checkRateLimit();

    let rateLimitHtml = '';
    if (rateLimit.mode === 'developer') {
      rateLimitHtml = '<div class="advisor-rate-info advisor-rate-unlimited">MyAPIモード（無制限）</div>';
    } else if (rateLimit.mode === 'stakeholder') {
      if (!rateLimit.allowed) {
        const resetTimeStr = rateLimit.resetTime ? rateLimit.resetTime.toLocaleString('ja-JP') : '不明';
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
      } else {
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-stakeholder">関係者モード - 残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
      }
    } else {
      if (!rateLimit.allowed) {
        const resetTimeStr = rateLimit.resetTime ? rateLimit.resetTime.toLocaleString('ja-JP') : '不明';
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
      } else {
        rateLimitHtml = `<div class="advisor-rate-info">残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
      }
    }

    const overlay = document.createElement('div');
    overlay.id = 'webAdvisorConfirmOverlay';
    overlay.className = 'advisor-overlay';
    overlay.innerHTML = `
      <div class="advisor-modal">
        <div class="advisor-modal-header advisor-modal-header--stack">
          <div class="advisor-modal-header-row">
            <div class="advisor-mode-buttons-small">
              <button type="button" class="advisor-mode-btn-small" data-action="web-reset-to-normal-mode" title="通常モード（10回/24時間）に戻す">通常モード</button>
              <button type="button" class="advisor-mode-btn-small" data-action="web-show-stakeholder-prompt" title="関係者は30回/24時間まで利用可能">関係者</button>
              <button type="button" class="advisor-mode-btn-small" data-action="web-show-developer-prompt" title="自分のAPIキーで無制限利用">MyAPI</button>
            </div>
            <button type="button" class="advisor-modal-close" data-action="web-close-confirm-dialog">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
            </button>
          </div>
          <h2>Webページ分析</h2>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}
          <p class="advisor-modal-text advisor-center advisor-muted">SEO/EEAT/アクセシビリティ観点で対象ページを分析します。</p>
          <div class="advisor-confirm-buttons">
            <button type="button" class="advisor-btn-secondary" data-action="web-close-confirm-dialog">キャンセル</button>
            <button type="button" class="advisor-btn-primary" data-action="web-start-analysis">レビュー開始</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, () => this.closeConfirmDialog());
    setTimeout(() => overlay.classList.add('active'), 10);
  }

  /** 閉じる */
  closeConfirmDialog() {
    const overlay = document.getElementById('webAdvisorConfirmOverlay');
    if (overlay) {
      if (overlay.handleEscape) document.removeEventListener('keydown', overlay.handleEscape);
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /** 分析開始（統一UIで実行） */
  async startAnalysis() {
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      this.closeConfirmDialog();
      const resetTimeStr = rateLimit.resetTime ? rateLimit.resetTime.toLocaleString('ja-JP') : '不明';
      alert(`利用制限に達しました。\n\nリセット時刻: ${resetTimeStr}\n\n関係者モード（30回/24h）またはMyAPIモードをご利用ください。`);
      return;
    }
    this.closeConfirmDialog();
    this.showResultView();
    await this.fetchAnalysis();
  }

  /** 結果ビューを表示 */
  showResultView() {
    const container = document.querySelector('.container');
    if (!container) return;

    const view = document.createElement('div');
    view.id = 'webAdvisorView';
    view.className = 'advisor-view';
    const headerHtml = this.renderViewHeader('Webページ分析', 'web-close-result-view', `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7-5.5-4h7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `);
    view.innerHTML = `
      ${headerHtml}
      <div class="advisor-view-content">
        <div class="advisor-job-panel">
          <h3>対象URL</h3>
          <div class="advisor-job-content"><a href="${this.escapeHtml(this.currentUrl)}" target="_blank">${this.escapeHtml(this.currentUrl)}</a></div>
        </div>
        <div class="advisor-advice-panel">
          <h3>AI分析結果</h3>
          <div class="advisor-advice-content" id="webAdvisorContent">
            <div class="advisor-loading"><div class="advisor-spinner"></div><p>AI分析中...</p></div>
          </div>
        </div>
      </div>
    `;

    container.style.display = 'none';
    document.body.appendChild(view);
    setTimeout(() => view.classList.add('active'), 10);
  }

  /** SSEで分析を取得 */
  async fetchAnalysis() {
    const content = document.getElementById('webAdvisorContent');
    if (!content) return;

    // 既存EventSourceをクリーン
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (_) {}
      this.eventSource = null;
    }

    const isVercel = window.location.hostname.includes('vercel.app');
    const base = isVercel ? '' : 'http://127.0.0.1:3333';

    // まずセッション発行（キーやモデル等を安全に送る）
    let sessionToken = '';
    try {
      const payload = {
        userApiKey: this.getUserApiKey?.() || '',
        provider: this.getUserApiProvider?.() || '',
        baseUrl: this.getUserApiBaseUrl?.() || '',
        model: this.getUserApiModel?.() || '',
      };
      const resp = await fetch(`${base}/api/web-advisor/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const js = await resp.json();
        sessionToken = js.sessionToken || '';
      }
    } catch (_) {
      // セッションが作れない場合でもSSEは続行（envキーのみで解析可能）
    }

    const params = new URLSearchParams({ url: this.currentUrl });
    if (sessionToken) params.set('sessionToken', sessionToken);

    const url = `${base}/api/web-advisor?${params.toString()}`;

    try {
      this.isStreaming = true;
      content.innerHTML = '<div class="advisor-markdown"></div>';
      const md = content.querySelector('.advisor-markdown');
      let full = '';

      const es = new EventSource(url);
      this.eventSource = es;

      es.onmessage = (e) => {
        if (!e.data) return;
        try {
          const data = JSON.parse(e.data);
          switch (data.type) {
            case 'token':
              full += data.content || '';
              md.innerHTML = this.renderMarkdown(full);
              break;
            case 'done':
              this.isStreaming = false;
              this.recordUsage();
              es.close();
              break;
            case 'error':
              this.isStreaming = false;
              md.innerHTML = `<div class="advisor-error"><p>${this.escapeHtml(data.message || '分析に失敗しました')}</p></div>`;
              es.close();
              break;
            default:
              // init/progress/meta は必要に応じて拡張
              break;
          }
        } catch (_) {
          // 無視
        }
      };

      es.onerror = () => {
        if (this.isStreaming) {
          this.isStreaming = false;
          md.innerHTML = '<div class="advisor-error"><p>接続に失敗しました</p></div>';
        }
        es.close();
      };
    } catch (err) {
      content.innerHTML = `<div class="advisor-error"><p>${this.escapeHtml(err.message || '分析開始に失敗しました')}</p></div>`;
    }
  }

  /** 結果ビューを閉じる */
  closeResultView() {
    this.isStreaming = false;
    if (this.eventSource) {
      try { this.eventSource.close(); } catch (_) {}
      this.eventSource = null;
    }
    const view = document.getElementById('webAdvisorView');
    if (view) {
      view.classList.remove('active');
      setTimeout(() => view.remove(), 300);
    }
    const container = document.querySelector('.container');
    if (container) container.style.display = '';
  }

  closeModal(modalType) {
    // 互換用（BaseのAPI呼び出しから来る）
    if (modalType === 'stakeholderPrompt' || modalType === 'developerPrompt') {
      const overlay = document.querySelector('.advisor-overlay');
      if (overlay) overlay.remove();
    }
  }
}

// グローバルインスタンスを作成
const webAdvisorManager = new WebAdvisorManager();