// Base Advisor Module - Common functionality for AI-powered advisors

// グローバル定数（マジックナンバー排除）
window.ADVISOR_CONST = window.ADVISOR_CONST || {
  DEFAULT_MODEL: 'gpt-4o-mini',
  TOKENS_PER_UNIT: 1000,
  USD_TO_JPY_RATE: 150,
  RATE_LIMIT: { NORMAL: 10, STAKEHOLDER: 30 },
  ARTICLE: { MAX_BODY_LENGTH: 1000, MIN_BODY_LEN: 100 },
  USAGE_MODE: { SESSION: 'session', PERMANENT: 'permanent' }
};

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
      if (!action) return;
      try {
        if (this.config.actionHandlers && this.config.actionHandlers[action]) {
          event.preventDefault();
          console.debug('[AdvisorEvents]', this.config.elemIdPrefix, 'dispatch', action);
          this.config.actionHandlers[action]();
        } else {
          console.warn('[AdvisorEvents]', this.config.elemIdPrefix, 'no handler for', action);
        }
      } catch (e) {
        console.error('[AdvisorEvents]', this.config.elemIdPrefix, 'handler error for', action, e);
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

  getUserApiProvider() {
    return localStorage.getItem('jsonld_user_api_provider') || '';
  }

  getUserApiBaseUrl() {
    return localStorage.getItem('jsonld_user_api_base_url') || '';
  }

  getUserApiModel() {
    return localStorage.getItem('jsonld_user_api_model') || '';
  }

  saveUserApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(this.config.USER_API_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(this.config.USER_API_KEY);
    }
  }

  saveUserApiProvider(provider) {
    if (provider && provider.trim()) {
      localStorage.setItem('jsonld_user_api_provider', provider.trim());
    } else {
      localStorage.removeItem('jsonld_user_api_provider');
    }
  }

  saveUserApiBaseUrl(baseUrl) {
    if (baseUrl && baseUrl.trim()) {
      localStorage.setItem('jsonld_user_api_base_url', baseUrl.trim());
    } else {
      localStorage.removeItem('jsonld_user_api_base_url');
    }
  }

  saveUserApiModel(model) {
    if (model && model.trim()) {
      localStorage.setItem('jsonld_user_api_model', model.trim());
    } else {
      localStorage.removeItem('jsonld_user_api_model');
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
          <p class="advisor-modal-text advisor-center">あなたは関係者ですか？</p>
          <p class="advisor-notice advisor-center">
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
    const currentProvider = this.getUserApiProvider();
    const currentBaseUrl = this.getUserApiBaseUrl();
    const currentModel = this.getUserApiModel();
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
          <p>自分のAPIを使用すると、無制限で利用できます。未入力は環境設定を使用します。</p>
          <div class="advisor-field">
            <label class="advisor-label" for="developerApiKeyInput">APIキー</label>
            <div class="advisor-api-key-wrapper">
              <input type="password" id="developerApiKeyInput" placeholder="sk-... / az-..." value="${currentKey}" class="advisor-input">
              <button type="button" data-action="${this.config.actions.toggleDeveloperKeyVisibility}" class="advisor-btn-icon" title="表示/非表示">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="advisor-grid-2">
            <div class="advisor-field">
              <label class="advisor-label" for="developerApiProviderInput">プロバイダ</label>
              <input type="text" id="developerApiProviderInput" placeholder="openai / azure / groq / other" value="${currentProvider}" class="advisor-input">
            </div>
            <div class="advisor-field">
              <label class="advisor-label" for="developerApiModelInput">モデル名</label>
              <input type="text" id="developerApiModelInput" value="${currentModel}" class="advisor-input">
              <div class="advisor-help-text">例: gpt-4o-mini（空なら既定: ${window.ADVISOR_CONST.DEFAULT_MODEL}）</div>
            </div>
          </div>
          <div class="advisor-field">
            <label class="advisor-label" for="developerApiBaseUrlInput">ベースURL（OpenAI互換APIのエンドポイント）</label>
            <input type="text" id="developerApiBaseUrlInput" placeholder="https://api.openai.com/v1 など" value="${currentBaseUrl}" class="advisor-input">
            <div class="advisor-help-text">
              未入力: OpenAI公式を使用（https://api.openai.com/v1）。例: Groq https://api.groq.com/openai/v1 / OpenRouter https://openrouter.ai/api/v1
            </div>
          </div>
          <p class="advisor-notice">入力したプロバイダ/URL/モデルは.envより優先して使用します（空欄は.envを使用）。</p>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="${this.config.actions.resetDeveloperSettings}">初期化</button>
            <button class="advisor-btn-secondary" data-action="${this.config.actions.testDeveloperConnection}">接続テスト</button>
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
    const keyInput = document.getElementById('developerApiKeyInput');
    const providerInput = document.getElementById('developerApiProviderInput');
    const baseUrlInput = document.getElementById('developerApiBaseUrlInput');
    const modelInput = document.getElementById('developerApiModelInput');

    const rawKey = keyInput?.value ?? '';
    const rawProvider = providerInput?.value ?? '';
    const rawBaseUrl = baseUrlInput?.value ?? '';
    const rawModel = modelInput?.value ?? '';

    // 空白のみの保存を禁止
    if ([rawKey, rawProvider, rawBaseUrl, rawModel].some(v => v && v.trim() === '')) {
      alert('空白のみの入力は保存できません。値を入力するか、空欄にしてください。');
      return;
    }

    const key = rawKey.trim();
    const provider = rawProvider.trim();
    const baseUrl = rawBaseUrl.trim();
    const model = rawModel.trim();

    // baseUrl形式チェック（入力がある場合のみ）
    if (baseUrl) {
      try {
        const u = new URL(baseUrl);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('protocol');
      } catch {
        alert('ベースURLが不正です。http(s)から始まる有効なURLを入力してください。');
        return;
      }
    }

    // すべて空で保存する場合は最終確認（.env既定にフォールバック）
    const allEmpty = !key && !provider && !baseUrl && !model;
    if (allEmpty) {
      const ok = window.confirm('すべて空の状態で保存します。環境既定（.env）を使用します。よろしいですか？');
      if (!ok) return;
    }

    // ここまで通れば保存（空は削除＝.envフォールバック）
    if (keyInput) this.saveUserApiKey(key);
    if (providerInput) this.saveUserApiProvider(provider);
    if (baseUrlInput) this.saveUserApiBaseUrl(baseUrl);
    if (modelInput) this.saveUserApiModel(model);

    this.closeDeveloperPrompt();
    this.config.ui.showConfirmDialog();
  }

  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  async testDeveloperConnection() {
    console.debug('[BaseAdvisor] testDeveloperConnection: start');
    const key = (document.getElementById('developerApiKeyInput')?.value || '').trim();
    const provider = (document.getElementById('developerApiProviderInput')?.value || '').trim();
    const baseUrl = (document.getElementById('developerApiBaseUrlInput')?.value || '').trim();
    const model = (document.getElementById('developerApiModelInput')?.value || '').trim();

    if (!key) { alert('APIキーを入力してください'); return; }

    const isVercel = window.location.hostname.includes('vercel.app');
    const url = isVercel ? '/api/test-connection' : 'http://127.0.0.1:3333/api/test-connection';
    console.debug('[BaseAdvisor] testDeveloperConnection: url', url, { provider, baseUrl, model });
    try {
      const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userApiKey: key, provider, baseUrl, model }) });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      localStorage.setItem('jsonld_user_api_last_test', JSON.stringify({ ok: true, at: Date.now(), provider: data.provider, model: data.model }));
      const status = document.getElementById('developerApiStatus');
      if (status) status.querySelector('.advisor-status-chip:last-child').textContent = '接続: 正常';
      alert(`接続に成功しました\nprovider: ${data.provider}\nmodel: ${data.model}`);
    } catch (e) {
      localStorage.setItem('jsonld_user_api_last_test', JSON.stringify({ ok: false, at: Date.now(), error: e.message }));
      const status = document.getElementById('developerApiStatus');
      if (status) status.querySelector('.advisor-status-chip:last-child').textContent = '接続: 失敗';
      alert(`接続に失敗しました: ${e.message}`);
    }
  }

  resetDeveloperSettings() {
    console.debug('[BaseAdvisor] resetDeveloperSettings: start');
    const ok = window.confirm('Developer/無制限モードの設定を初期化します。よろしいですか？');
    if (!ok) return;
    try {
      this.saveUserApiKey('');
      this.saveUserApiProvider('');
      this.saveUserApiBaseUrl('');
      this.saveUserApiModel('');
      alert('Developer設定を初期化しました（環境既定に戻ります）。');
      // 再描画
      this.closeDeveloperPrompt();
      this.showDeveloperPrompt();
    } catch (e) {
      alert('初期化に失敗しました。再度お試しください。');
      console.error(e);
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
  renderViewHeader(title, closeAction) {
    // 旧来の最小デザインに統一（ページごとの差異をなくす）
    return `
      <div class="advisor-view-header"><h2>${this.escapeHtml(title)}</h2><button data-action="${closeAction}">戻る</button></div>
    `;
  }

  /**
   * モデルの価格情報を取得
   * @param {string} model - モデル名
   * @returns {object} 価格情報 {input: number, output: number}
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

    // モデル名のバリデーション
    if (!model || typeof model !== 'string') {
      console.warn('[BaseAdvisor] Invalid model name:', model, 'Using default: gpt-4o-mini');
      return prices['gpt-4o-mini'];
    }

    if (!prices[model]) {
      console.warn('[BaseAdvisor] Unknown model:', model, 'Using default: gpt-4o-mini');
    }

    return prices[model] || prices['gpt-4o-mini'];
  }

  /**
   * API使用量の詳細表示HTMLを生成
   * @param {Object} usage - API使用量オブジェクト
   * @param {number} usage.prompt_tokens - 入力トークン数
   * @param {number} usage.completion_tokens - 出力トークン数
   * @param {number} usage.total_tokens - 合計トークン数
   * @param {string} [model='gpt-4o-mini'] - 使用したモデル名
   * @returns {string} HTML文字列
   */
  renderApiUsagePanel(usage, model = window.ADVISOR_CONST.DEFAULT_MODEL) {
    if (!usage) return '';

    // 入力パラメータのバリデーション
    if (typeof usage !== 'object') {
      console.warn('[BaseAdvisor] Invalid usage object:', usage);
      return '';
    }

    const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usage;
    const prices = this.getModelPricing(model);

    // 料金計算定数
    const TOKENS_PER_UNIT = 1000;
    const USD_TO_JPY_RATE = 150;

    // 料金計算（トークンを1000で割ってから価格を掛ける）
    const inputCost = (prompt_tokens / TOKENS_PER_UNIT) * prices.input;
    const outputCost = (completion_tokens / TOKENS_PER_UNIT) * prices.output;
    const totalCost = inputCost + outputCost;
    const totalCostJPY = totalCost * USD_TO_JPY_RATE;

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
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">推定料金<sup style="font-size: 0.7rem;">*</sup></div>
            <div style="font-weight: 600;">
              $${totalCost.toFixed(6)} (約 ¥${totalCostJPY.toFixed(2)})
            </div>
          </div>
        </div>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color); font-size: 0.75rem; color: var(--secondary-text-color);">
          <sup>*</sup> ${model}の価格で計算（入力: $${prices.input}/1K tokens, 出力: $${prices.output}/1K tokens, 1USD=${USD_TO_JPY_RATE}JPY換算）
        </div>
      </div>
    `;
  }
}

// Node.js用のテストエクスポート（ブラウザ実行には影響なし）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BaseAdvisorManager };
}
