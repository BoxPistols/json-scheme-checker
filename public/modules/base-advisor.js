// Base Advisor Module - Common functionality for AI-powered advisors

class BaseAdvisorManager {
  constructor(config) {
    if (!config) {
      throw new Error('BaseAdvisorManager requires a configuration object.');
    }
    this.config = config;
    this.initEventListeners();
  }

  /**
   * Generic event listeners for actions defined in the config.
   */
  initEventListeners() {
    document.addEventListener('click', event => {
      const target = event.target.closest('button[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      if (this.config.actionHandlers && this.config.actionHandlers[action]) {
        event.preventDefault();
        this.config.actionHandlers[action]();
      }
    });
  }

  /**
   * Adds an Escape key listener to a modal overlay.
   * @param {HTMLElement} overlay - The overlay element.
   * @param {Function} closeFunc - The function to call to close the modal.
   */
  addEscapeKeyListener(overlay, closeFunc) {
    const handleEscape = e => {
      if (e.key === 'Escape') {
        closeFunc.call(this);
      }
    };
    overlay.handleEscape = handleEscape;
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Checks the rate limit for the current user.
   * @returns {object} Rate limit status.
   */
  checkRateLimit() {
    const userApiKey = this.getUserApiKey();
    if (userApiKey) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: null,
        usingUserKey: true,
        mode: 'developer',
      };
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const usageData = JSON.parse(localStorage.getItem(this.config.RATE_LIMIT_KEY) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);

    const isStakeholder = this.isStakeholderMode();
    const maxRequests = isStakeholder
      ? this.config.MAX_REQUESTS_STAKEHOLDER
      : this.config.MAX_REQUESTS_PER_DAY;

    const remaining = maxRequests - recentRequests.length;
    const allowed = remaining > 0;
    const resetTime = recentRequests.length > 0 ? new Date(recentRequests[0] + oneDayMs) : null;

    return {
      allowed,
      remaining,
      resetTime,
      usingUserKey: false,
      mode: isStakeholder ? 'stakeholder' : 'normal',
      maxRequests,
    };
  }

  /**
   * Records a usage timestamp for rate limiting.
   */
  recordUsage() {
    if (this.getUserApiKey()) return; // Do not record usage for developer mode

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const usageData = JSON.parse(localStorage.getItem(this.config.RATE_LIMIT_KEY) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    recentRequests.push(now);
    localStorage.setItem(this.config.RATE_LIMIT_KEY, JSON.stringify(recentRequests));
  }

  getUserApiKey() {
    return localStorage.getItem(this.config.USER_API_KEY);
  }

  saveUserApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(this.config.USER_API_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(this.config.USER_API_KEY);
    }
  }

  isStakeholderMode() {
    return localStorage.getItem(this.config.STAKEHOLDER_MODE_KEY) === 'true';
  }

  enableStakeholderMode() {
    localStorage.setItem(this.config.STAKEHOLDER_MODE_KEY, 'true');
  }

  disableStakeholderMode() {
    localStorage.removeItem(this.config.STAKEHOLDER_MODE_KEY);
  }

  /**
   * Resets all special modes and API keys.
   */
  resetToNormalMode() {
    this.disableStakeholderMode();
    this.saveUserApiKey('');
    alert('通常モードに戻しました。');
    this.config.ui.showConfirmDialog(); // Re-render the confirmation dialog
  }

  /**
   * Shows a prompt for stakeholder confirmation.
   */
  showStakeholderPrompt() {
    const overlay = this.createModal('stakeholderPrompt', `
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
    `);
    this.addEscapeKeyListener(overlay, this.config.ui.closeStakeholderPrompt);
  }

  closeStakeholderPrompt() {
    this.closeModal('stakeholderPrompt');
  }

  confirmStakeholder() {
    this.enableStakeholderMode();
    this.closeStakeholderPrompt();
    this.config.ui.showConfirmDialog();
  }

  /**
   * Shows a prompt for entering a developer API key.
   */
  showDeveloperPrompt() {
    const currentKey = this.getUserApiKey() || '';
    const overlay = this.createModal('developerPrompt', `
      <div class="advisor-modal advisor-developer-modal">
        <div class="advisor-modal-header">
          <h2>Developer/無制限モード</h2>
          <button class="advisor-modal-close" data-action="${this.config.actions.closeDeveloperPrompt}" aria-label="閉じる">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          <p>自分のOpenAI APIキーを使用すると、無制限で利用できます。</p>
          <div class="advisor-api-key-wrapper">
            <input type="password" id="developerApiKeyInput" placeholder="sk-proj-..." value="${currentKey}" class="advisor-input">
            <button type="button" data-action="${this.config.actions.toggleDeveloperKeyVisibility}" class="advisor-btn-icon" title="表示/非表示">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
          <p class="advisor-notice">このAPIキーはブラウザにのみ保存され、サーバーには送信されません。</p>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="${this.config.actions.closeDeveloperPrompt}">キャンセル</button>
            <button class="advisor-btn-primary" data-action="${this.config.actions.saveDeveloperKey}">保存</button>
          </div>
        </div>
      </div>
    `);
    this.addEscapeKeyListener(overlay, this.config.ui.closeDeveloperPrompt);
  }

  closeDeveloperPrompt() {
    this.closeModal('developerPrompt');
  }

  saveDeveloperKey() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) {
      this.saveUserApiKey(input.value.trim());
      this.closeDeveloperPrompt();
      this.config.ui.showConfirmDialog();
    }
  }

  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  // Helper methods for modal creation and closing
  createModal(id, html) {
    const overlay = document.createElement('div');
    overlay.id = this.config.elemIdPrefix + id;
    overlay.className = 'advisor-overlay active';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);
    return overlay;
  }

  closeModal(id) {
    const overlay = document.getElementById(this.config.elemIdPrefix + id);
    if (overlay) {
      if (overlay.handleEscape) {
        document.removeEventListener('keydown', overlay.handleEscape);
      }
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 共通: アドバイザービューのヘッダーHTMLを生成
   * ページ間でUIを統一するため、ここで一元管理する
   * @param {string} title - 見出し
   * @param {string} closeAction - 戻るボタンのdata-action
   * @param {string} [iconSvg=''] - 見出し左のアイコンSVG
   * @returns {string}
   */
  renderViewHeader(title, closeAction, iconSvg = '') {
    // 旧来の最小デザインに統一（ページごとの差異をなくす）
    return `
      <div class="advisor-view-header"><h2>${this.escapeHtml(title)}</h2><button data-action="${closeAction}">戻る</button></div>
    `;
  }

  /**
   * モデルの価格情報を取得
   * @param {string} model - モデル名
   * @returns {object} 価格情報
   */
  getModelPricing(model) {
    const prices = {
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4.1-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4.1': { input: 0.003, output: 0.015 },
      'gpt-4.1-nano': { input: 0.00015, output: 0.0006 },
      'o3-mini': { input: 0.0006, output: 0.0024 },
      'o3': { input: 0.003, output: 0.015 },
    };
    return prices[model] || prices['gpt-4o-mini'];
  }

  /**
   * API使用量の詳細表示HTMLを生成
   * @param {object} usage - API使用量オブジェクト
   * @param {string} [model='gpt-4o-mini'] - 使用したモデル名
   * @returns {string} HTML文字列
   */
  renderApiUsagePanel(usage, model = 'gpt-4o-mini') {
    if (!usage) return '';

    const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usage;
    const prices = this.getModelPricing(model);

    // 料金計算（トークンを1000で割ってから価格を掛ける）
    const inputCost = (prompt_tokens / 1000) * prices.input;
    const outputCost = (completion_tokens / 1000) * prices.output;
    const totalCost = inputCost + outputCost;
    const totalCostJPY = totalCost * 150; // 1ドル150円で計算

    return `
      <div class="advisor-usage-panel" style="margin-top: 20px; padding: 16px; background: var(--secondary-bg-color); border: 1px solid var(--border-color); border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--secondary-text-color);">API使用量 (モデル: ${model})</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.85rem;">
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">入力トークン</div>
            <div style="font-weight: 600;">${prompt_tokens.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">出力トークン</div>
            <div style="font-weight: 600;">${completion_tokens.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">合計トークン</div>
            <div style="font-weight: 600;">${total_tokens.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">推定料金</div>
            <div style="font-weight: 600;">
              $${totalCost.toFixed(6)} (約 ¥${totalCostJPY.toFixed(2)})
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
