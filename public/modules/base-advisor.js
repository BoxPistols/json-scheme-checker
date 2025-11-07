// Base Advisor Module - Common functionality for AI-powered advisors

// グローバル定数（マジックナンバー排除）
window.ADVISOR_CONST = window.ADVISOR_CONST || {
  DEFAULT_MODEL: 'gpt-5-nano',
  TOKENS_PER_UNIT: 1000,
  USD_TO_JPY_RATE: 150,
  RATE_LIMIT: { NORMAL: 50 },
  ARTICLE: { MAX_BODY_LENGTH: 1000, MIN_BODY_LEN: 100 },
  USAGE_MODE: { SESSION: 'session', PERMANENT: 'permanent' },
};

// グローバルな分析ストリーミング状態管理（複数の分析の同時実行を防ぐ）
window.ANALYSIS_STATE = window.ANALYSIS_STATE || {
  activeAnalysis: null, // 現在実行中の分析（'advisor', 'blog-reviewer', 'web-advisor', null）
  abortControllers: {}, // 各分析のAbortController
  isStreaming: false, // ストリーミング実行中フラグ
};

/**
 * グローバルな分析実行状態をチェック（複数の分析の同時実行を防ぐ）
 * @param {string} analyzerType - アナライザータイプ ('advisor', 'blog-reviewer', 'web-advisor')
 * @returns {boolean} 実行可能ならtrue
 */
function canStartAnalysis(analyzerType) {
  if (window.ANALYSIS_STATE.isStreaming) {
    console.warn(
      `[MultiAnalysisGuard] 分析実行中のため、${analyzerType}の実行をスキップしました。現在実行中：${window.ANALYSIS_STATE.activeAnalysis}`
    );
    return false;
  }
  return true;
}

/**
 * 分析の開始状態を設定
 * @param {string} analyzerType - アナライザータイプ
 */
function setAnalysisActive(analyzerType) {
  // 他の分析が実行中なら、そのリクエストをキャンセル
  if (
    window.ANALYSIS_STATE.activeAnalysis &&
    window.ANALYSIS_STATE.activeAnalysis !== analyzerType
  ) {
    cancelAnalysis(window.ANALYSIS_STATE.activeAnalysis);
  }
  window.ANALYSIS_STATE.activeAnalysis = analyzerType;
  window.ANALYSIS_STATE.isStreaming = true;
  console.log(`[MultiAnalysisGuard] ${analyzerType} 分析を開始`);
}

/**
 * 分析の終了状態を設定
 * @param {string} analyzerType - アナライザータイプ
 */
function setAnalysisInactive(analyzerType) {
  if (window.ANALYSIS_STATE.activeAnalysis === analyzerType) {
    window.ANALYSIS_STATE.activeAnalysis = null;
    window.ANALYSIS_STATE.isStreaming = false;
    console.log(`[MultiAnalysisGuard] ${analyzerType} 分析を終了`);
  }
}

/**
 * 実行中の分析をキャンセル
 * @param {string} analyzerType - アナライザータイプ
 */
function cancelAnalysis(analyzerType) {
  const controller = window.ANALYSIS_STATE.abortControllers[analyzerType];
  if (controller) {
    console.log(`[MultiAnalysisGuard] ${analyzerType} 分析をキャンセル`);
    controller.abort();
    delete window.ANALYSIS_STATE.abortControllers[analyzerType];
  }
}

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
      const target = event.target.closest('button[data-action], [data-action]');
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

    const maxRequests = this.config.MAX_REQUESTS_PER_DAY;
    const remaining = maxRequests - recentRequests.length;
    const allowed = remaining > 0;

    // リセット時刻はJST（Asia/Tokyo +9h）で計算
    const resetTime = recentRequests.length > 0 ? new Date(recentRequests[0] + oneDayMs) : null;

    return {
      allowed,
      remaining,
      resetTime,
      usingUserKey: false,
      mode: 'free',
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
    const storedModel = localStorage.getItem('jsonld_user_api_model') || '';

    if (!storedModel) {
      return '';
    }

    const allowedModels = new Set([
      'gpt-5-nano',
      'gpt-5-nano-2025-08-07',
      'gpt-4.1-nano',
      'gpt-5-mini',
      'gpt-5',
      'gpt-4.1-mini',
      'gpt-4.1',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-3.5-turbo',
      'o3',
      'o3-mini',
    ]);

    if (!allowedModels.has(storedModel)) {
      console.warn(
        '[BaseAdvisor] Unsupported stored model detected:',
        storedModel,
        'Fallback to gpt-5-nano'
      );
      localStorage.setItem('jsonld_user_api_model', 'gpt-5-nano');
      return 'gpt-5-nano';
    }

    return storedModel;
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

  /**
   * Clears all user API credentials (key, provider, baseUrl).
   */
  clearUserApiCredentials() {
    this.saveUserApiKey('');
    this.saveUserApiProvider('');
    this.saveUserApiBaseUrl('');
  }

  /**
   * Resets all special modes and API keys (free mode).
   */
  resetToFreeMode() {
    this.clearUserApiCredentials();
    alert('無料版に戻しました。');
    // this.config.ui.showConfirmDialog(); // Re-render the confirmation dialog
  }

  /**
   * Shows a prompt for entering a developer API key.
   */
  showDeveloperPrompt() {
    const currentKey = this.getUserApiKey() || '';
    const currentProvider = this.getUserApiProvider();
    const currentBaseUrl = this.getUserApiBaseUrl();
    const currentModel = this.getUserApiModel();
    const hasApiKey = !!(currentKey && currentKey.trim());

    const overlay = this.createModal(
      'developerPrompt',
      `
      <div class="advisor-modal advisor-developer-modal">
        <div class="advisor-modal-header">
          <h2>API設定</h2>
          <button type="button" class="advisor-modal-close" data-action="${this.config.actions.closeDeveloperPrompt}" aria-label="閉じる">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          <!-- モード選択 -->
          <div style="margin-bottom: 24px; padding: 16px; background: var(--secondary-bg-color); border-radius: 8px; border: 1px solid var(--border-color);">
            <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 0.9rem;">利用モード</label>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; border-radius: 6px; border: 2px solid var(--border-color);">
                <input type="radio" name="advisorApiMode" value="free" id="advisorRadioModeFree" ${hasApiKey ? '' : 'checked'} style="margin-top: 2px; margin-right: 8px; cursor: pointer;">
                <div>
                  <div style="font-weight: 500;">無料版を使用（サーバー負担）</div>
                  <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-top: 2px;">
                    gpt-5-nano（最新世代低レイテンシ）を利用可能。レート制限あり（50回/24時間、毎日0:00にリセット）
                  </div>
                </div>
              </label>
              <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; border-radius: 6px; border: 2px solid var(--border-color);">
                <input type="radio" name="advisorApiMode" value="myapi" id="advisorRadioModeMyAPI" ${hasApiKey ? 'checked' : ''} style="margin-top: 2px; margin-right: 8px; cursor: pointer;">
                <div>
                  <div style="font-weight: 500;">MyAPIを使用（ユーザー負担）</div>
                  <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-top: 2px;">
                    独自のOpenAI APIキーを使用。全モデル選択可能、レート制限なし
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- 無料版エリア -->
          <div id="advisorFreeModelArea" style="margin-bottom: 16px; ${hasApiKey ? 'display: none;' : ''}">
            <div class="advisor-field">
              <label class="advisor-label" for="advisorFreeModelSelect">モデル選択</label>
              <select id="advisorFreeModelSelect" class="advisor-input">
                <option value="gpt-5-nano">gpt-5-nano（最速、簡潔な回答）</option>
                <option value="gpt-4.1-nano">gpt-4.1-nano（やや遅い、詳細な回答）</option>
              </select>
              <div class="advisor-help-text">gpt-5-nano: 超低レイテンシで最速応答、要点重視の分析（推奨）</div>
              <div class="advisor-help-text">gpt-4.1-nano: やや遅い、より詳細な説明が必要な場合</div>
              <div class="advisor-help-text">※ 一日のリクエスト上限: 50回/デバイス</div>
            </div>
          </div>

          <!-- MyAPIエリア -->
          <div id="advisorMyApiArea" style="${hasApiKey ? '' : 'display: none;'}">
            <div class="advisor-field">
              <label class="advisor-label" for="developerApiKeyInput">OpenAI APIキー</label>
              <div class="advisor-api-key-wrapper">
                <input type="password" id="developerApiKeyInput" placeholder="sk-..." value="${currentKey}" class="advisor-input">
                <button type="button" data-action="${this.config.actions.toggleDeveloperKeyVisibility}" class="advisor-btn-icon" title="表示/非表示">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </button>
              </div>
              <div class="advisor-help-text">APIキーは安全にローカルストレージに保存されます</div>
            </div>
            <div class="advisor-field">
              <label class="advisor-label" for="developerApiModelInput">モデル</label>
              <select id="developerApiModelInput" class="advisor-input">
                <option value="gpt-5-nano" ${currentModel === 'gpt-5-nano' ? 'selected' : ''}>gpt-5-nano（超低レイテンシ: $0.05/1M入力）</option>
                <option value="gpt-4.1-nano" ${currentModel === 'gpt-4.1-nano' ? 'selected' : ''}>gpt-4.1-nano（レガシー互換: $0.08/1M入力）</option>
                <option value="gpt-4.1-mini" ${currentModel === 'gpt-4.1-mini' ? 'selected' : ''}>gpt-4.1-mini（$0.40/1M入力）</option>
                <option value="gpt-5-mini" ${currentModel === 'gpt-5-mini' ? 'selected' : ''}>gpt-5-mini（$0.30/1M入力・推定）</option>
                <option value="gpt-4o" ${currentModel === 'gpt-4o' ? 'selected' : ''}>gpt-4o（品質重視: $2.50/1M入力）</option>
                <option value="gpt-5" ${currentModel === 'gpt-5' ? 'selected' : ''}>gpt-5（最高品質: $1.25/1M入力）</option>
              </select>
              <div class="advisor-help-text">GPT-5シリーズは超低レイテンシですが、temperatureパラメータは非対応です</div>
            </div>
            <details style="margin-bottom: 16px;">
              <summary style="cursor: pointer; font-weight: 500; margin-bottom: 8px;">詳細設定（オプション）</summary>
              <div style="padding-left: 16px;">
                <div class="advisor-field">
                  <label class="advisor-label" for="developerApiBaseUrlInput">Base URL</label>
                  <input type="text" id="developerApiBaseUrlInput" placeholder="https://api.openai.com/v1" value="${currentBaseUrl}" class="advisor-input">
                  <div class="advisor-help-text">OpenAI互換APIを使用する場合のみ指定</div>
                </div>
              </div>
            </details>
          </div>

          <div class="advisor-confirm-buttons">
            <button type="button" class="advisor-btn-secondary" data-action="${this.config.actions.resetDeveloperSettings}">初期化</button>
            <button type="button" class="advisor-btn-secondary" data-action="${this.config.actions.testDeveloperConnection}">接続テスト</button>
            <button type="button" class="advisor-btn-secondary" data-action="${this.config.actions.closeDeveloperPrompt}">キャンセル</button>
            <button type="button" class="advisor-btn-primary" data-action="${this.config.actions.saveDeveloperKey}">保存</button>
          </div>
        </div>
      </div>
    `
    );
    this.addEscapeKeyListener(overlay, this.config.ui.closeDeveloperPrompt);

    // ラジオボタンの切り替えイベントを設定
    this.setupAdvisorApiModeToggle();
  }

  closeDeveloperPrompt() {
    this.closeModal('developerPrompt');
  }

  setupAdvisorApiModeToggle() {
    const radioFree = document.getElementById('advisorRadioModeFree');
    const radioMyAPI = document.getElementById('advisorRadioModeMyAPI');
    const freeArea = document.getElementById('advisorFreeModelArea');
    const myApiArea = document.getElementById('advisorMyApiArea');

    if (!radioFree || !radioMyAPI || !freeArea || !myApiArea) return;

    function toggleAreas() {
      if (radioFree.checked) {
        freeArea.style.display = 'block';
        myApiArea.style.display = 'none';
      } else {
        freeArea.style.display = 'none';
        myApiArea.style.display = 'block';
      }
    }

    radioFree.addEventListener('change', toggleAreas);
    radioMyAPI.addEventListener('change', toggleAreas);

    // 初期表示
    toggleAreas();
  }

  saveDeveloperKey() {
    const isFreeMode = document.getElementById('advisorRadioModeFree')?.checked;
    let key = '';
    let provider = '';
    let baseUrl = '';
    let model = '';

    if (isFreeMode) {
      // 無料版モード
      const freeModelSelect = document.getElementById('advisorFreeModelSelect');
      model = freeModelSelect?.value ?? 'gpt-5-nano';

      // APIキーをクリア
      this.clearUserApiCredentials();
    } else {
      // MyAPIモード
      const keyInput = document.getElementById('developerApiKeyInput');
      const baseUrlInput = document.getElementById('developerApiBaseUrlInput');
      const modelInput = document.getElementById('developerApiModelInput');

      const rawKey = keyInput?.value ?? '';
      const rawBaseUrl = baseUrlInput?.value ?? '';
      const rawModel = modelInput?.value ?? '';

      // 空白のみの保存を禁止
      if ([rawKey, rawBaseUrl, rawModel].some(v => v && v.trim() === '')) {
        alert('空白のみの入力は保存できません。値を入力するか、空欄にしてください。');
        return;
      }

      key = rawKey.trim();
      baseUrl = rawBaseUrl.trim();
      model = rawModel.trim();
      provider = 'openai'; // 固定

      if (!key) {
        alert('APIキーを入力してください');
        return;
      }
    }

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

    // 保存処理
    this.saveUserApiKey(key);
    this.saveUserApiProvider(provider);
    this.saveUserApiBaseUrl(baseUrl);
    this.saveUserApiModel(model);

    this.closeDeveloperPrompt();
    // this.config.ui.showConfirmDialog();
    alert('設定を保存しました。再度分析ボタンを押してください。');
  }

  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  async testDeveloperConnection() {
    console.debug('[BaseAdvisor] testDeveloperConnection: start');
    const isFreeMode = document.getElementById('advisorRadioModeFree')?.checked;

    if (isFreeMode) {
      alert('無料版モードでは接続テストは不要です');
      return;
    }

    const key = (document.getElementById('developerApiKeyInput')?.value || '').trim();
    const baseUrl = (document.getElementById('developerApiBaseUrlInput')?.value || '').trim();
    const model = (document.getElementById('developerApiModelInput')?.value || '').trim();
    const provider = 'openai';

    if (!key) {
      alert('APIキーを入力してください');
      return;
    }

    const isVercel = window.location.hostname.includes('vercel.app');
    const url = isVercel ? '/api/test-connection' : 'http://127.0.0.1:3333/api/test-connection';
    console.debug('[BaseAdvisor] testDeveloperConnection: url', url, { provider, baseUrl, model });
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userApiKey: key, provider, baseUrl, model }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) throw new Error(data.error || `HTTP ${resp.status}`);
      localStorage.setItem(
        'jsonld_user_api_last_test',
        JSON.stringify({ ok: true, at: Date.now(), provider: data.provider, model: data.model })
      );
      const status = document.getElementById('developerApiStatus');
      if (status)
        status.querySelector('.advisor-status-chip:last-child').textContent = '接続: 正常';
      alert(`接続に成功しました\nprovider: ${data.provider}\nmodel: ${data.model}`);
    } catch (e) {
      localStorage.setItem(
        'jsonld_user_api_last_test',
        JSON.stringify({ ok: false, at: Date.now(), error: e.message })
      );
      const status = document.getElementById('developerApiStatus');
      if (status)
        status.querySelector('.advisor-status-chip:last-child').textContent = '接続: 失敗';
      alert(`接続に失敗しました: ${e.message}`);
    }
  }

  resetDeveloperSettings() {
    console.debug('[BaseAdvisor] resetDeveloperSettings: start');
    const ok = window.confirm('拡張モード設定を初期化します（無料版に戻ります）。よろしいですか？');
    if (!ok) return;
    try {
      this.clearUserApiCredentials();
      this.saveUserApiModel('gpt-5-nano');
      alert('拡張モード設定を初期化しました（無料版に戻りました）。');
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
      <div class="advisor-view-header"><h2>${this.escapeHtml(title)}</h2><button type="button" data-action="${closeAction}">戻る</button></div>
    `;
  }

  /**
   * モデルの価格情報を取得
   * @param {string} model - モデル名
   * @returns {object} 価格情報 {input: number, output: number}
   */
  getModelPricing(model) {
    // 料金は per 1K tokens（OpenAI公式料金 per 1M を 1000 で割った値、2025年版）
    const prices = {
      // GPT-5 シリーズ（2025年8月リリース）
      'gpt-5-nano': { input: 0.00005, output: 0.0004 }, // $0.05/1M, $0.40/1M
      'gpt-5-nano-2025-08-07': { input: 0.00005, output: 0.0004 }, // $0.05/1M, $0.40/1M
      'gpt-4.1-nano': { input: 0.00008, output: 0.00035 }, // $0.08/1M, $0.35/1M（レガシー互換）
      'gpt-5-mini': { input: 0.0003, output: 0.0015 }, // $0.30/1M, $1.50/1M (推定)
      'gpt-5': { input: 0.00125, output: 0.01 }, // $1.25/1M, $10.00/1M
      // GPT-4.1 シリーズ
      'gpt-4.1-mini': { input: 0.0004, output: 0.0016 }, // $0.40/1M, $1.60/1M
      'gpt-4.1': { input: 0.002, output: 0.008 }, // $2.00/1M, $8.00/1M
      // GPT-4o シリーズ
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/1M, $0.60/1M
      'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50/1M, $10.00/1M
      'gpt-4-turbo': { input: 0.01, output: 0.03 }, // $10.00/1M, $30.00/1M
      // GPT-3.5
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }, // $0.50/1M, $1.50/1M
      // o3 シリーズ
      'o3-mini': { input: 0.0011, output: 0.0044 }, // $1.10/1M, $4.40/1M
      o3: { input: 0.02, output: 0.08 }, // $20.00/1M, $80.00/1M
    };

    // モデル名のバリデーション
    if (!model || typeof model !== 'string') {
      console.warn('[BaseAdvisor] Invalid model name:', model, 'Using default: gpt-5-nano');
      return prices['gpt-5-nano'];
    }

    if (!prices[model]) {
      console.warn('[BaseAdvisor] Unknown model:', model, 'Using default: gpt-5-nano');
    }

    return prices[model] || prices['gpt-5-nano'];
  }

  /**
   * API使用量の詳細表示HTMLを生成
   * @param {Object} usage - API使用量オブジェクト
   * @param {number} usage.prompt_tokens - 入力トークン数
   * @param {number} usage.completion_tokens - 出力トークン数
   * @param {number} usage.total_tokens - 合計トークン数
   * @param {string} [model='gpt-5-nano'] - 使用したモデル名
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
      <div class="advisor-usage-panel" style="container-type: inline-size; container-name: usage-panel;">
        <h4 class="advisor-usage-panel-title">API使用量 (モデル: ${model})</h4>
        <div class="advisor-usage-panel-grid">
          <div class="advisor-usage-panel-item">
            <div class="advisor-usage-panel-label">入力トークン</div>
            <div class="advisor-usage-panel-value">${prompt_tokens.toLocaleString()} tokens</div>
          </div>
          <div class="advisor-usage-panel-item">
            <div class="advisor-usage-panel-label">出力トークン</div>
            <div class="advisor-usage-panel-value">${completion_tokens.toLocaleString()} tokens</div>
          </div>
          <div class="advisor-usage-panel-item">
            <div class="advisor-usage-panel-label">合計トークン</div>
            <div class="advisor-usage-panel-value">${total_tokens.toLocaleString()} tokens</div>
          </div>
          <div class="advisor-usage-panel-item">
            <div class="advisor-usage-panel-label">推定料金<sup style="font-size: 0.7rem;">*</sup></div>
            <div class="advisor-usage-panel-value">
              $${totalCost.toFixed(6)} (約 ¥${totalCostJPY.toFixed(2)})
            </div>
          </div>
        </div>
        <div class="advisor-usage-panel-footer">
          <sup>*</sup> ${model}の価格で計算（入力: $${prices.input}/1K tokens, 出力: $${prices.output}/1K tokens, 1USD=${USD_TO_JPY_RATE}JPY換算）
        </div>
      </div>
    `;
  }

  /**
   * 分析結果表示用の共通HTML構造を生成
   * @param {string} prefixId - 要素ID の接頭辞 ('advisor', 'blogReviewer', 'webAdvisor')
   * @returns {string} HTML マークアップ
   */
  createAnalysisResultsContainer(prefixId) {
    return `
      <div class="advisor-progress-container" id="${prefixId}ProgressContainer">
        <div class="advisor-progress-bar">
          <div class="advisor-progress-fill" id="${prefixId}ProgressFill"></div>
        </div>
        <div class="advisor-progress-text" id="${prefixId}ProgressText">準備中...</div>
      </div>
      <div class="advisor-skeleton-loader" id="${prefixId}SkeletonLoader">
        <div class="advisor-skeleton-item large"></div>
        <div class="advisor-skeleton-item medium"></div>
        <div class="advisor-skeleton-item medium"></div>
        <div class="advisor-skeleton-item small"></div>
        <div style="height: 8px;"></div>
        <div class="advisor-skeleton-item large"></div>
        <div class="advisor-skeleton-item medium"></div>
        <div class="advisor-skeleton-item medium"></div>
        <div class="advisor-skeleton-item small"></div>
      </div>
      <div class="advisor-markdown" id="${prefixId}Markdown"></div>
    `;
  }

  /**
   * プログレスバーを更新する共通メソッド
   * @param {string} prefixId - 要素ID の接頭辞
   * @param {number} percentage - 進捗率（0-100）
   * @param {string} text - 進捗テキスト
   */
  updateProgressCommon(prefixId, percentage, text) {
    const fill = document.getElementById(`${prefixId}ProgressFill`);
    const textEl = document.getElementById(`${prefixId}ProgressText`);

    if (fill) {
      fill.style.width = Math.min(percentage, 100) + '%';
    }

    if (textEl) {
      textEl.textContent = text;
    }
  }

  /**
   * スケルトンローダーを非表示にする共通メソッド
   * @param {string} prefixId - 要素ID の接頭辞
   */
  hideSkeletonLoader(prefixId) {
    const skeletonLoader = document.getElementById(`${prefixId}SkeletonLoader`);
    if (skeletonLoader) {
      skeletonLoader.style.display = 'none';
    }
  }

  /**
   * プログレスコンテナを非表示にする共通メソッド
   * @param {string} prefixId - 要素ID の接頭辞
   */
  hideProgressContainer(prefixId) {
    const progressContainer = document.getElementById(`${prefixId}ProgressContainer`);
    if (progressContainer) {
      progressContainer.style.display = 'none';
    }
  }

  /**
   * 分析結果マークダウン要素を取得する共通メソッド
   * @param {string} prefixId - 要素ID の接頭辞
   * @returns {HTMLElement|null} マークダウン要素
   */
  getMarkdownElement(prefixId) {
    return document.getElementById(`${prefixId}Markdown`);
  }

  /**
   * マークダウンをHTML に変換する共通メソッド（全Advisor共通化）
   * @param {string} markdown - マークダウンテキスト
   * @returns {string} HTML文字列
   */
  renderMarkdownCommon(markdown) {
    let html = this.escapeHtml(markdown);

    // 見出し（h1, h2, h3）
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>');

    // 太字
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // リスト（ハイフン + 番号付き）
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>').replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // 改行を先に <br> に変換
    html = html.replace(/\n/g, '<br>');

    // 見出しの前後の <br> を削除（h1, h2, h3）
    html = html.replace(/<br><(h[123])>/g, '<$1>'); // 見出しの前
    html = html.replace(/<\/(h[123])><br>/g, '</$1>'); // 見出しの後

    // 複数の <li>...<br><li>... パターンを <ul> で包括
    html = html.replace(
      /(<li>.*?<\/li>(?:<br>)*)+/g,
      match => `<ul>${match.replace(/<br>/g, '')}</ul>`
    );

    // </li><br> 後の <br> を削除（リスト項目間）
    html = html.replace(/<\/li><br>/g, '</li>');

    return html;
  }

  /**
   * アコーディオン開閉の共通メソッド
   * @param {string} contentId - コンテンツ要素ID
   */
  toggleAccordionCommon(contentId) {
    const content = document.getElementById(contentId);
    if (!content) return;

    const header = content.previousElementSibling;
    if (!header) return;

    const icon = header.querySelector('.advisor-accordion-icon');
    const isOpen = content.style.maxHeight && content.style.maxHeight !== '0px';

    if (isOpen) {
      content.style.maxHeight = '0px';
      content.style.opacity = '0';
      content.style.overflow = 'hidden';
      if (icon) icon.textContent = '▶';
    } else {
      content.style.maxHeight = content.scrollHeight + 'px';
      content.style.opacity = '1';
      content.style.overflow = 'visible';
      if (icon) icon.textContent = '▼';
    }
  }

  /**
   * CSVエクスポートボタンを表示する共通メソッド
   * @param {string} containerId - ボタン配置先のコンテナID
   * @param {Function} onCsvExport - CSVエクスポート時のコールバック
   * @param {Function} onHtmlExport - HTMLエクスポート時のコールバック
   */
  showExportButtonsCommon(containerId, onCsvExport, onHtmlExport) {
    const exportContainer = document.getElementById(containerId);
    if (!exportContainer) return;

    exportContainer.innerHTML = `
      <button type="button" class="advisor-export-btn advisor-export-csv-btn" aria-label="AI分析結果をCSV形式でエクスポート">CSVでエクスポート</button>
      <button type="button" class="advisor-export-btn advisor-export-pdf-btn" aria-label="AI分析結果をHTMLでエクスポート（ブラウザの印刷機能でPDF化）">HTMLをPDF化</button>
    `;

    const csvBtn = exportContainer.querySelector('.advisor-export-csv-btn');
    const pdfBtn = exportContainer.querySelector('.advisor-export-pdf-btn');

    if (csvBtn && onCsvExport) csvBtn.addEventListener('click', onCsvExport);
    if (pdfBtn && onHtmlExport) pdfBtn.addEventListener('click', onHtmlExport);
  }

  /**
   * ファイルをダウンロードする共通メソッド
   * @param {Blob} blob - ダウンロードするBlob
   * @param {string} filename - ファイル名
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * CSV用に値をエスケープする共通メソッド
   * @param {*} value - エスケープする値
   * @returns {string} エスケープされた値
   */
  escapeCsvValue(value) {
    const escaped = String(value).replace(/"/g, '""');
    return `"${escaped}"`;
  }

  /**
   * HTMLテキストをクリーンアップする共通メソッド
   * @param {string} text - テキスト
   * @returns {string} クリーンなテキスト
   */
  cleanHtmlText(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * HTMLテキストをクリーンアップ（改行保持版）
   * チャット履歴エクスポートなど、改行を保持する必要がある場合に使用
   * @param {string} text - テキスト
   * @returns {string} クリーンなテキスト（改行保持）
   */
  cleanHtmlTextPreserveLineBreaks(text) {
    return text
      .replace(/<br\s*\/?>/gi, '\n') // <br>を改行に変換
      .replace(/<\/p>/gi, '\n\n') // </p>を2つの改行に変換
      .replace(/<\/div>/gi, '\n') // </div>を改行に変換
      .replace(/<\/(h[1-6])>/gi, '\n\n') // 見出しの後に2つの改行
      .replace(/<\/li>/gi, '\n') // リスト項目の後に改行
      .replace(/<\/ul>/gi, '\n\n') // リストの後に2つの改行
      .replace(/<\/ol>/gi, '\n\n') // 順序リストの後に2つの改行
      .replace(/<ul>/gi, '\n') // リストの前に改行
      .replace(/<ol>/gi, '\n') // 順序リストの前に改行
      .replace(/<[^>]*>/g, '') // その他のHTMLタグ除去
      .replace(/&nbsp;/g, ' ') // &nbsp;をスペースに
      .replace(/\t+/g, ' ') // タブをスペースに
      .replace(/ +/g, ' ') // 連続する半角スペースを単一スペースに
      .replace(/\n\n\n+/g, '\n\n') // 3つ以上の連続改行を2つに
      .trim();
  }

  /**
   * チャット機能専用のレート制限をチェック
   * @returns {object} レート制限状態
   */
  checkChatRateLimit() {
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
    const chatUsageKey = 'jsonld_chat_rate_limit';
    const usageData = JSON.parse(localStorage.getItem(chatUsageKey) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);

    const maxRequests = 50; // チャット専用の制限
    const remaining = maxRequests - recentRequests.length;
    const allowed = remaining > 0;

    const resetTime = recentRequests.length > 0 ? new Date(recentRequests[0] + oneDayMs) : null;

    return {
      allowed,
      remaining,
      resetTime,
      usingUserKey: false,
      mode: 'free',
      maxRequests,
    };
  }

  /**
   * チャット使用履歴を記録
   */
  recordChatUsage() {
    if (this.getUserApiKey()) return; // MyAPIモードでは記録しない

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const chatUsageKey = 'jsonld_chat_rate_limit';
    const usageData = JSON.parse(localStorage.getItem(chatUsageKey) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    recentRequests.push(now);
    localStorage.setItem(chatUsageKey, JSON.stringify(recentRequests));
  }

  /**
   * フローティングチャットボタンを表示
   * @param {string} containerId - ボタンを配置するコンテナID
   * @param {object} config - チャット設定
   */
  renderFloatingChatButton(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[BaseAdvisor] Chat container not found:', containerId);
      return;
    }

    // ユニークなIDを生成
    const uniqueId = `advisorFloatingChatBtn-${config.type}-${Date.now()}`;

    container.innerHTML = `
      <button type="button" class="advisor-floating-chat-btn" id="${uniqueId}" aria-label="チャットを開く" title="AI チャット">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="advisor-chat-badge" id="advisorChatBadge" style="display: none;"></span>
      </button>
    `;

    const btn = document.getElementById(uniqueId);
    if (btn) {
      console.log('[BaseAdvisor] Floating chat button created:', uniqueId);
      btn.addEventListener('click', e => {
        console.log('[BaseAdvisor] Floating chat button clicked');
        e.preventDefault();
        e.stopPropagation();
        // 質問者選択モーダルを表示
        this.showQuestionerModal(config);
      });
    } else {
      console.error('[BaseAdvisor] Floating chat button not found:', uniqueId);
    }
  }

  /**
   * 質問者選択モーダルを表示
   * @param {object} config - チャット設定
   */
  showQuestionerModal(config) {
    console.log('[BaseAdvisor] showQuestionerModal called with config:', config);
    const questioners = this.getQuestionerPersonas(config.type);
    console.log('[BaseAdvisor] Questioner personas:', questioners);

    const modal = document.createElement('div');
    modal.className = 'advisor-modal-overlay';
    modal.innerHTML = `
      <div class="advisor-questioner-modal">
        <div class="advisor-questioner-modal-header">
          <h3>チャットの質問者を選択してください</h3>
          <button type="button" class="advisor-modal-close-btn" aria-label="閉じる">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-questioner-modal-body">
          <p class="advisor-questioner-modal-desc">より適切なアドバイスを提供するために、あなたのペルソナを教えてください。</p>
          <div class="advisor-questioner-list">
            ${questioners
              .map(
                (q, idx) => `
              <button type="button" class="advisor-questioner-btn" data-questioner-idx="${idx}" data-questioner-id="${q.id}">
                <div class="advisor-questioner-name">${q.name}</div>
                <div class="advisor-questioner-desc">${q.description}</div>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // 閉じるボタン
    modal.querySelector('.advisor-modal-close-btn').addEventListener('click', () => {
      modal.remove();
    });

    // オーバーレイクリックで閉じる
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Escキーで閉じる
    const handleEscape = e => {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);

    // 質問者選択
    modal.querySelectorAll('.advisor-questioner-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.currentTarget.dataset.questionerIdx, 10);
        const questioner = questioners[idx];
        config.questioner = questioner;
        config.questionerLabel = questioner.name;
        config.questionerSelected = true;
        modal.remove();

        // チャットボックスを表示
        this.renderChatBoxCommon(config.containerId, config);
      });
    });
  }

  /**
   * チャットボックスUIを生成する共通メソッド
   * @param {string} containerId - チャットボックスを配置するコンテナID
   * @param {object} config - チャット設定
   * @param {string} config.type - Advisorタイプ ('advisor', 'blog-reviewer', 'web-advisor')
   * @param {object} config.context - 分析コンテキスト
   * @param {string} config.chatMessagesId - メッセージ履歴を表示する要素ID
   * @param {string} config.chatInputId - 入力フォームの要素ID
   * @param {string} config.chatSendBtnId - 送信ボタンの要素ID
   * @param {string} [config.questionerLabel] - 質問者ラベル
   */
  renderChatBoxCommon(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[BaseAdvisor] Chat container not found:', containerId);
      return;
    }

    console.log('[BaseAdvisor] renderChatBoxCommon called for:', containerId);

    // フローティングチャットボタンのHTMLを保存
    const floatingBtn = container.querySelector('.advisor-floating-chat-btn');
    let floatingBtnHtml = '';
    if (floatingBtn) {
      console.log('[BaseAdvisor] Saving floating chat button HTML');
      floatingBtnHtml = floatingBtn.outerHTML.replace('display: flex', 'display: none');
    }

    const rateLimit = this.checkChatRateLimit();
    const rateLimitText = rateLimit.usingUserKey
      ? '無制限（MyAPI使用中）'
      : `残り ${rateLimit.remaining}/${rateLimit.maxRequests} 回`;

    container.innerHTML = `
      ${floatingBtnHtml}
      <div class="advisor-chat-box advisor-chat-expanded advisor-chat-right" id="advisorChatBox">
        <div class="advisor-chat-header advisor-chat-drag-handle" id="advisorChatDragHandle">
          <div class="advisor-chat-header-left">
            <svg class="advisor-chat-drag-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="9" cy="5" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="5" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/>
            </svg>
            <h3 style="margin: 0; font-size: 1rem;">AI チャット</h3>
            ${config.questionerLabel ? `<span class="advisor-chat-questioner-badge">${config.questionerLabel}</span>` : ''}
          </div>
          <div class="advisor-chat-header-right">
            <span class="advisor-chat-rate-limit">${rateLimitText}</span>
            <button type="button" class="advisor-chat-reset-btn" aria-label="位置とサイズをリセット" title="位置とサイズをリセット">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button type="button" class="advisor-chat-export-btn" aria-label="チャット履歴をエクスポート" title="履歴をエクスポート">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <button type="button" class="advisor-chat-collapse-btn" aria-label="チャットを折りたたむ" title="折りたたむ">−</button>
            <button type="button" class="advisor-chat-close-btn" aria-label="チャットを閉じる" title="閉じる">×</button>
          </div>
        </div>
        <div class="advisor-chat-messages" id="${config.chatMessagesId}">
          <div class="advisor-chat-welcome">
            <p>フォローアップが必要ですか？</p>
          </div>
        </div>
        <div class="advisor-chat-input-wrapper">
          <textarea
            id="${config.chatInputId}"
            class="advisor-chat-input"
            placeholder="質問を入力してください... (Enterで送信、Shift+Enterで改行)"
            rows="4"
            maxlength="1000"
            data-composition="false"
            style="resize: vertical; min-height: 80px; max-height: 300px;"
          ></textarea>
          <button
            type="button"
            id="${config.chatSendBtnId}"
            class="advisor-chat-send-btn"
            aria-label="メッセージを送信"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-chat-resize-handle" id="advisorChatResizeHandle" title="ドラッグしてリサイズ"></div>
      </div>
    `;

    // イベントリスナーを設定
    this.initChatEventListeners(config);
    this.initChatUIControls(containerId, config);
  }

  /**
   * 質問者ペルソナを取得
   * @param {string} type - Advisorタイプ
   * @returns {Array} 質問者ペルソナリスト
   */
  getQuestionerPersonas(type) {
    const personas = {
      advisor: [
        {
          id: 'employer',
          name: '採用側（企業担当者）',
          description:
            '採用成功を目指す採用担当者や経営者。求人内容の最適化、人材マッチング率向上を重視。',
        },
        {
          id: 'applicant',
          name: '応募者側',
          description: '求職者。職務経歴書の作成、面接対策、アピールポイント強化を必要とする。',
        },
        {
          id: 'agent',
          name: 'エージェント',
          description: '人材紹介エージェント。マッチング率向上、営業戦略、市場分析が重点。',
        },
      ],
      'blog-reviewer': [
        {
          id: 'writer',
          name: 'ブログライター',
          description: '記事執筆者。記事品質向上、SEO対策、リーダーシップ改善に注力。',
        },
        {
          id: 'editor',
          name: '編集者',
          description: '編集・監修者。記事全体の品質管理、戦略的なコンテンツ企画を担当。',
        },
      ],
      'web-advisor': [
        {
          id: 'owner',
          name: 'Webサイト責任者',
          description: 'サイト管理者。ページ最適化、ユーザー体験向上、ビジネス目標達成を重視。',
        },
        {
          id: 'marketer',
          name: 'マーケター',
          description:
            'マーケティング担当。流入増加、コンバージョン改善、SEO戦略実行を必要とする。',
        },
      ],
    };

    return personas[type] || [];
  }

  /**
   * チャットUI制御を初期化
   * @param {string} containerId - コンテナID
   * @param {object} config - チャット設定
   */
  initChatUIControls(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chatBox = container.querySelector('.advisor-chat-box');
    const collapseBtn = container.querySelector('.advisor-chat-collapse-btn');
    const closeBtn = container.querySelector('.advisor-chat-close-btn');
    const resetBtn = container.querySelector('.advisor-chat-reset-btn');
    const exportBtn = container.querySelector('.advisor-chat-export-btn');
    const dragHandle = container.querySelector('.advisor-chat-drag-handle');
    const resizeHandle = container.querySelector('.advisor-chat-resize-handle');

    // リセットボタン
    if (resetBtn && chatBox) {
      resetBtn.addEventListener('click', () => {
        // 位置とサイズをリセット（デフォルト位置に戻す）
        chatBox.classList.add('advisor-chat-right');
        chatBox.classList.remove('advisor-chat-left');
        chatBox.style.right = '';
        chatBox.style.bottom = '';
        chatBox.style.left = '';
        chatBox.style.top = '';
        chatBox.style.width = '';
        chatBox.style.height = '';
        chatBox.style.transform = '';
        // LocalStorageもクリア
        localStorage.removeItem('advisor-chat-position-x');
        localStorage.removeItem('advisor-chat-position-y');
        localStorage.removeItem('advisor-chat-width');
        localStorage.removeItem('advisor-chat-height');
        console.log(
          '[BaseAdvisor] Chat position and size reset to default (right: 20px, bottom: 20px)'
        );
      });
    }

    // エクスポートボタン
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportChatHistory(config);
      });
    }

    // 折りたたみボタン
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        chatBox.classList.toggle('advisor-chat-collapsed');
        collapseBtn.textContent = chatBox.classList.contains('advisor-chat-collapsed') ? '+' : '−';
      });
    }

    // 閉じるボタン
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // チャットボックスを削除
        if (chatBox) {
          chatBox.remove();
        }
        // フローティングチャットボタンを再作成（イベントリスナー付き）
        this.renderFloatingChatButton(containerId, config);
      });
    }

    // ドラッグ機能
    if (dragHandle && chatBox) {
      let isDragging = false;
      let currentX = 0;
      let currentY = 0;
      let initialX = 0;
      let initialY = 0;

      const onMouseDown = e => {
        // ボタンクリック時はドラッグしない
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }

        isDragging = true;

        // 現在の位置を取得
        currentX = chatBox.offsetLeft;
        currentY = chatBox.offsetTop;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;

        // インラインスタイルで位置を固定
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
        chatBox.style.right = 'auto';
        chatBox.style.bottom = 'auto';

        dragHandle.style.cursor = 'grabbing';
      };

      const onMouseMove = e => {
        if (!isDragging) return;

        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;

        // ビューポート内に制限
        const maxX = window.innerWidth - chatBox.offsetWidth;
        const maxY = window.innerHeight - chatBox.offsetHeight;
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        dragHandle.style.cursor = 'grab';

        // 位置をローカルストレージに保存
        localStorage.setItem('advisor-chat-position-x', currentX);
        localStorage.setItem('advisor-chat-position-y', currentY);
      };

      // タッチイベントハンドラー（iPhone/iPad用）
      const onTouchStart = e => {
        // ボタンタップ時はドラッグしない
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
          return;
        }

        isDragging = true;
        const touch = e.touches[0];

        // 現在の位置を取得
        currentX = chatBox.offsetLeft;
        currentY = chatBox.offsetTop;
        initialX = touch.clientX - currentX;
        initialY = touch.clientY - currentY;

        // インラインスタイルで位置を固定
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
        chatBox.style.right = 'auto';
        chatBox.style.bottom = 'auto';
      };

      const onTouchMove = e => {
        if (!isDragging) return;

        e.preventDefault();
        const touch = e.touches[0];
        currentX = touch.clientX - initialX;
        currentY = touch.clientY - initialY;

        // ビューポート内に制限
        const maxX = window.innerWidth - chatBox.offsetWidth;
        const maxY = window.innerHeight - chatBox.offsetHeight;
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));

        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
      };

      const onTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;

        // 位置をローカルストレージに保存
        localStorage.setItem('advisor-chat-position-x', currentX);
        localStorage.setItem('advisor-chat-position-y', currentY);
      };

      // マウスイベント
      dragHandle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      // タッチイベント
      dragHandle.addEventListener('touchstart', onTouchStart, { passive: false });
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);

      // 保存された位置を復元
      const savedX = localStorage.getItem('advisor-chat-position-x');
      const savedY = localStorage.getItem('advisor-chat-position-y');
      if (savedX !== null && savedY !== null) {
        currentX = parseInt(savedX, 10);
        currentY = parseInt(savedY, 10);

        // ビューポート内に収まるか確認
        const maxX = window.innerWidth - chatBox.offsetWidth;
        const maxY = window.innerHeight - chatBox.offsetHeight;

        // 画面外の場合はデフォルト位置を使用
        if (currentX < 0 || currentX > maxX || currentY < 0 || currentY > maxY) {
          console.log('[BaseAdvisor] Saved position is out of viewport, using default position');
          localStorage.removeItem('advisor-chat-position-x');
          localStorage.removeItem('advisor-chat-position-y');
          return;
        }

        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
        chatBox.style.right = 'auto';
        chatBox.style.bottom = 'auto';
      }
    }

    // リサイズ機能
    if (resizeHandle && chatBox) {
      let isResizing = false;
      let startWidth = 0;
      let startHeight = 0;
      let startX = 0;
      let startY = 0;

      const onMouseDown = e => {
        isResizing = true;
        startWidth = chatBox.offsetWidth;
        startHeight = chatBox.offsetHeight;
        startX = e.clientX;
        startY = e.clientY;

        e.preventDefault();
        resizeHandle.style.cursor = 'nwse-resizing';
      };

      const onMouseMove = e => {
        if (!isResizing) return;

        e.preventDefault();
        const width = startWidth + (e.clientX - startX);
        const height = startHeight + (e.clientY - startY);

        // 最小サイズと最大サイズを設定
        const minWidth = 320;
        const minHeight = 450;
        const maxWidth = Math.min(window.innerWidth - 40, 900);
        const maxHeight = Math.min(window.innerHeight - 40, 800);
        const newWidth = Math.max(minWidth, Math.min(maxWidth, width));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, height));

        chatBox.style.width = `${newWidth}px`;
        chatBox.style.height = `${newHeight}px`;
      };

      const onMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        resizeHandle.style.cursor = 'nwse-resize';

        // サイズをローカルストレージに保存
        localStorage.setItem('advisor-chat-width', chatBox.style.width);
        localStorage.setItem('advisor-chat-height', chatBox.style.height);
      };

      resizeHandle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      // 保存されたサイズを復元
      const savedWidth = localStorage.getItem('advisor-chat-width');
      const savedHeight = localStorage.getItem('advisor-chat-height');
      if (savedWidth) chatBox.style.width = savedWidth;
      if (savedHeight) chatBox.style.height = savedHeight;
    }
  }

  /**
   * チャットイベントリスナーを初期化
   * @param {object} config - チャット設定
   */
  initChatEventListeners(config) {
    const inputEl = document.getElementById(config.chatInputId);
    const sendBtn = document.getElementById(config.chatSendBtnId);

    if (!inputEl || !sendBtn) {
      console.error('[BaseAdvisor] Chat input or send button not found');
      return;
    }

    // メッセージ履歴を保持（インスタンスプロパティ）
    if (!this.chatMessages) {
      this.chatMessages = [];
    }

    // 日本語入力対応：IME確定前の送信を防止
    let isComposing = false;

    inputEl.addEventListener('compositionstart', () => {
      isComposing = true;
      inputEl.dataset.composition = 'true';
    });

    inputEl.addEventListener('compositionend', () => {
      isComposing = false;
      inputEl.dataset.composition = 'false';
    });

    // 送信ボタンのクリックイベント
    sendBtn.addEventListener('click', () => {
      if (isComposing) return; // IME確定中なら送信しない

      const message = inputEl.value.trim();
      if (!message) return;

      this.sendChatMessageCommon(message, config);
      inputEl.value = '';
      inputEl.focus();
    });

    // Enterキーで送信（Shift+Enterで改行）
    inputEl.addEventListener('keydown', e => {
      // IME確定中なら処理しない
      if (isComposing) {
        return;
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = inputEl.value.trim();
        if (!message) return;

        this.sendChatMessageCommon(message, config);
        inputEl.value = '';
      }
    });

    // 初期フォーカス
    inputEl.focus();
  }

  /**
   * チャットメッセージを送信する共通メソッド
   * @param {string} message - ユーザーメッセージ
   * @param {object} config - チャット設定
   */
  async sendChatMessageCommon(message, config) {
    // レート制限チェック
    const rateLimit = this.checkChatRateLimit();
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime
        ? new Date(rateLimit.resetTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        : '不明';
      alert(
        `チャット回数の上限に達しました。リセット時刻: ${resetTime}\n\nまたは、MyAPIを使用してください（設定から）。`
      );
      return;
    }

    // ユーザーメッセージを表示
    this.renderChatMessageCommon('user', message, config.chatMessagesId);

    // メッセージ履歴に追加
    if (!this.chatMessages) {
      this.chatMessages = [];
    }
    this.chatMessages.push({ role: 'user', content: message });

    // AIメッセージのプレースホルダーを作成
    const messagesContainer = document.getElementById(config.chatMessagesId);
    if (!messagesContainer) return;

    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'advisor-chat-message advisor-chat-message-assistant';
    aiMessageDiv.innerHTML = `
      <div class="advisor-chat-message-label">AI</div>
      <div class="advisor-chat-message-content">
        <span class="advisor-chat-typing">回答を生成中...</span>
      </div>
    `;
    messagesContainer.appendChild(aiMessageDiv);

    // 自動スクロール
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    try {
      // APIリクエスト
      const isVercel = window.location.hostname.includes('vercel.app');
      const apiUrl = isVercel ? '/api/chat' : 'http://127.0.0.1:3333/api/chat';

      const userApiKey = this.getUserApiKey();
      const baseUrl = this.getUserApiBaseUrl();
      const model = this.getUserApiModel() || 'gpt-5-nano';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: config.type,
          context: config.context,
          messages: this.chatMessages,
          userApiKey,
          baseUrl,
          model,
          questioner: config.questioner || { id: 'default' },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // ストリーミングレスポンスを処理
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      const contentDiv = aiMessageDiv.querySelector('.advisor-chat-message-content');
      contentDiv.innerHTML = ''; // タイピング表示を削除

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                contentDiv.innerHTML = this.renderMarkdownCommon(fullText);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
              if (e.message !== 'Unexpected end of JSON input') {
                console.error('[BaseAdvisor] Chat stream parse error:', e);
              }
            }
          }
        }
      }

      // メッセージ履歴に追加
      this.chatMessages.push({ role: 'assistant', content: fullText });

      // 使用履歴を記録
      this.recordChatUsage();

      // レート制限表示を更新
      this.updateChatRateLimitDisplay();
    } catch (error) {
      console.error('[BaseAdvisor] Chat error:', error);
      const contentDiv = aiMessageDiv.querySelector('.advisor-chat-message-content');
      contentDiv.innerHTML = `<span style="color: var(--error-color);">エラー: ${this.escapeHtml(error.message)}</span>`;
    }
  }

  /**
   * チャットメッセージを表示する共通メソッド
   * @param {string} role - メッセージの役割 ('user' | 'assistant')
   * @param {string} content - メッセージ内容
   * @param {string} messagesContainerId - メッセージを表示するコンテナID
   */
  renderChatMessageCommon(role, content, messagesContainerId) {
    const messagesContainer = document.getElementById(messagesContainerId);
    if (!messagesContainer) return;

    // 初回メッセージの場合、ウェルカムメッセージを削除
    const welcomeMsg = messagesContainer.querySelector('.advisor-chat-welcome');
    if (welcomeMsg) {
      welcomeMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `advisor-chat-message advisor-chat-message-${role}`;

    const label = role === 'user' ? 'あなた' : 'AI';
    const renderedContent =
      role === 'assistant' ? this.renderMarkdownCommon(content) : this.escapeHtml(content);

    messageDiv.innerHTML = `
      <div class="advisor-chat-message-label">${label}</div>
      <div class="advisor-chat-message-content">${renderedContent}</div>
    `;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * チャットレート制限表示を更新
   */
  updateChatRateLimitDisplay() {
    const rateLimitEl = document.querySelector('.advisor-chat-rate-limit');
    if (!rateLimitEl) return;

    const rateLimit = this.checkChatRateLimit();
    const rateLimitText = rateLimit.usingUserKey
      ? '無制限（MyAPI使用中）'
      : `残り ${rateLimit.remaining}/${rateLimit.maxRequests} 回`;

    rateLimitEl.textContent = rateLimitText;
  }

  /**
   * チャット履歴をエクスポート
   * @param {object} config - チャット設定
   */
  exportChatHistory(config) {
    const messagesContainer = document.getElementById(config.chatMessagesId);
    if (!messagesContainer) {
      console.error('[BaseAdvisor] Messages container not found:', config.chatMessagesId);
      return;
    }

    // メッセージを収集
    const messages = messagesContainer.querySelectorAll('.advisor-chat-message');
    if (messages.length === 0) {
      alert('エクスポートするメッセージがありません。');
      return;
    }

    // Markdown形式で出力
    let content = `# AI チャット履歴\n\n`;
    content += `**日時**: ${new Date().toLocaleString('ja-JP')}\n`;
    content += `**Advisor**: ${config.type}\n`;
    if (config.questionerLabel) {
      content += `**質問者**: ${config.questionerLabel}\n`;
    }
    content += `\n---\n\n`;

    messages.forEach((msg, index) => {
      const isUser = msg.classList.contains('advisor-chat-message-user');
      const role = isUser ? 'あなた' : 'AI';
      // 改行保持版のクリーニングメソッドを使用
      const messageContent = msg.querySelector('.advisor-chat-message-content');
      const text = messageContent
        ? this.cleanHtmlTextPreserveLineBreaks(messageContent.innerHTML)
        : this.cleanHtmlTextPreserveLineBreaks(msg.innerHTML);
      content += `## ${index + 1}. ${role}\n\n${text}\n\n`;
    });

    // BOM付きUTF-8でエンコード（Windows/Mac両方で文字化けしない）
    const contentWithBom = '\ufeff' + content;
    const blob = new Blob([contentWithBom], { type: 'text/markdown;charset=utf-8' });
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `chat-history-${config.type}-${timestamp}.md`;

    this.downloadFile(blob, filename);
    console.log('[BaseAdvisor] Chat history exported:', filename);
  }

  /**
   * フッターまでスムーズスクロール（共通メソッド）
   */
  scrollToFooter() {
    setTimeout(() => {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        // footerが見つからない場合はページ最下部までスクロール
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 500); // 完了後少し待ってからスクロール
  }
}

// Node.js用のテストエクスポート（ブラウザ実行には影響なし）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BaseAdvisorManager };
}
