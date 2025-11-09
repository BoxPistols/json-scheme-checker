// Base Advisor Module - Common functionality for AI-powered advisors
window.ADVISOR_CONST = window.ADVISOR_CONST || {
  DEFAULT_MODEL: 'gpt-5-nano',
  TOKENS_PER_UNIT: 1000,
  USD_TO_JPY_RATE: 150,
  RATE_LIMIT: { NORMAL: 50 },
  ARTICLE: { MAX_BODY_LENGTH: 1000, MIN_BODY_LEN: 100 },
  USAGE_MODE: { SESSION: 'session', PERMANENT: 'permanent' },
};
window.ANALYSIS_STATE = window.ANALYSIS_STATE || {
  activeAnalysis: null,
  abortControllers: {},
  isStreaming: false,
};
function canStartAnalysis(analyzerType) {
  if (window.ANALYSIS_STATE.isStreaming) {
    console.log(
      `[MultiAnalysisGuard] 分析実行中のため、${analyzerType}の実行をスキップしました。現在実行中：${window.ANALYSIS_STATE.activeAnalysis}`
    );
    return false;
  }
  return true;
}
function setAnalysisActive(analyzerType) {
  if (
    window.ANALYSIS_STATE.activeAnalysis &&
    window.ANALYSIS_STATE.activeAnalysis !== analyzerType
  ) { cancelAnalysis(window.ANALYSIS_STATE.activeAnalysis); }
  window.ANALYSIS_STATE.activeAnalysis = analyzerType; window.ANALYSIS_STATE.isStreaming = true; }
function setAnalysisInactive(analyzerType) {
  if (window.ANALYSIS_STATE.activeAnalysis === analyzerType) {
    window.ANALYSIS_STATE.activeAnalysis = null; window.ANALYSIS_STATE.isStreaming = false; } }
function cancelAnalysis(analyzerType) {
  const controller = window.ANALYSIS_STATE.abortControllers[analyzerType];
  if (controller) {
    controller.abort(); delete window.ANALYSIS_STATE.abortControllers[analyzerType]; } }
class BaseAdvisorManager {
  constructor(config) {
    if (!config) { throw new Error('BaseAdvisorManager requires a configuration object.'); }
    this.config = config; this.initEventListeners(); }
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
        } else { }
      } catch (e) {
      } }); }
  addEscapeKeyListener(overlay, closeFunc) {
    const handleEscape = e => {
      if (e.key === 'Escape') { closeFunc.call(this); } };
    overlay.handleEscape = handleEscape; document.addEventListener('keydown', handleEscape); }
  checkRateLimit() {
    const userApiKey = this.getUserApiKey();
    if (userApiKey) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: null,
        usingUserKey: true,
        mode: 'developer', }; }
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const usageData = JSON.parse(localStorage.getItem(this.config.RATE_LIMIT_KEY) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    const maxRequests = this.config.MAX_REQUESTS_PER_DAY;
    const remaining = maxRequests - recentRequests.length;
    const allowed = remaining > 0;
    const resetTime = recentRequests.length > 0 ? new Date(recentRequests[0] + oneDayMs) : null;
    return {
      allowed,
      remaining,
      resetTime,
      usingUserKey: false,
      mode: 'free',
      maxRequests, }; }
  recordUsage() {
    if (this.getUserApiKey()) return; // Do not record usage for developer mode
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const usageData = JSON.parse(localStorage.getItem(this.config.RATE_LIMIT_KEY) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    recentRequests.push(now); localStorage.setItem(this.config.RATE_LIMIT_KEY, JSON.stringify(recentRequests)); }
  getUserApiKey() { return localStorage.getItem(this.config.USER_API_KEY); }
  getUserApiProvider() { return localStorage.getItem('jsonld_user_api_provider') || ''; }
  getUserApiBaseUrl() { return localStorage.getItem('jsonld_user_api_base_url') || ''; }
  getUserApiModel() {
    const storedModel = localStorage.getItem('jsonld_user_api_model') || '';
    if (!storedModel) { return ''; }
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
        '[BaseAdvisor] Unsupported stored model detected:',
        storedModel,
        'Fallback to gpt-5-nano'
      );
      localStorage.setItem('jsonld_user_api_model', 'gpt-5-nano'); return 'gpt-5-nano'; }
    return storedModel; }
  getApiUrl(endpoint) {
    const isVercel = window.location.hostname.includes('vercel.app');
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (isVercel) {
      return `/api/${endpoint}`;
    } else if (isLocalhost) {
      return `http://localhost:3333/api/${endpoint}`;
    } else { return `http://${window.location.hostname}:3333/api/${endpoint}`; } }
  saveUserApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(this.config.USER_API_KEY, apiKey.trim());
    } else { localStorage.removeItem(this.config.USER_API_KEY); } }
  saveUserApiProvider(provider) {
    if (provider && provider.trim()) {
      localStorage.setItem('jsonld_user_api_provider', provider.trim());
    } else { localStorage.removeItem('jsonld_user_api_provider'); } }
  saveUserApiBaseUrl(baseUrl) {
    if (baseUrl && baseUrl.trim()) {
      localStorage.setItem('jsonld_user_api_base_url', baseUrl.trim());
    } else { localStorage.removeItem('jsonld_user_api_base_url'); } }
  saveUserApiModel(model) {
    if (model && model.trim()) {
      localStorage.setItem('jsonld_user_api_model', model.trim());
    } else { localStorage.removeItem('jsonld_user_api_model'); } }
  clearUserApiCredentials() {
    this.saveUserApiKey('');
    this.saveUserApiProvider(''); this.saveUserApiBaseUrl(''); }
  resetToFreeMode() {
    this.clearUserApiCredentials(); alert('無料版に戻しました。'); }
  showDeveloperPrompt() {
    const currentKey = this.getUserApiKey() || '';
    const currentProvider = this.getUserApiProvider();
    const currentBaseUrl = this.getUserApiBaseUrl();
    const currentModel = this.getUserApiModel();
    const hasApiKey = !!(currentKey && currentKey.trim());
    const overlay = this.createModal(
      'developerPrompt',
` <div class="advisor-modal advisor-developer-modal"> <div class="advisor-modal-header"> <h2>API設定</h2> <button type="button" class="advisor-modal-close" data-action="${this.config.actions.closeDeveloperPrompt}" aria-label="閉じる"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> </svg> </button> </div> <div class="advisor-modal-body"> <!-- モード選択 --> <div style="margin-bottom: 24px; padding: 16px; background: var(--secondary-bg-color); border-radius: 8px; border: 1px solid var(--border-color);"> <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 0.9rem;">利用モード</label> <div style="display: flex; flex-direction: column; gap: 12px;"> <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; border-radius: 6px; border: 2px solid var(--border-color);"> <input type="radio" name="advisorApiMode" value="free" id="advisorRadioModeFree" ${hasApiKey ? '' : 'checked'} style="margin-top: 2px; margin-right: 8px; cursor: pointer;"> <div> <div style="font-weight: 500;">無料版を使用（サーバー負担）</div> <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-top: 2px;"> gpt-5-nano（最新世代低レイテンシ）を利用可能。レート制限あり（50回/24時間、毎日0:00にリセット） </div> </div> </label> <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; border-radius: 6px; border: 2px solid var(--border-color);"> <input type="radio" name="advisorApiMode" value="myapi" id="advisorRadioModeMyAPI" ${hasApiKey ? 'checked' : ''} style="margin-top: 2px; margin-right: 8px; cursor: pointer;"> <div> <div style="font-weight: 500;">MyAPIを使用（ユーザー負担）</div> <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-top: 2px;"> 独自のOpenAI APIキーを使用。全モデル選択可能、レート制限なし </div> </div> </label> </div> </div> <!-- 無料版エリア --> <div id="advisorFreeModelArea" style="margin-bottom: 16px; ${hasApiKey ? 'display: none;' : ''}"> <div class="advisor-field"> <label class="advisor-label" for="advisorFreeModelSelect">モデル選択</label> <select id="advisorFreeModelSelect" class="advisor-input"> <option value="gpt-5-nano">gpt-5-nano（最速、簡潔な回答）</option> <option value="gpt-4.1-nano">gpt-4.1-nano（やや遅い、詳細な回答）</option> </select> <div class="advisor-help-text">gpt-5-nano: 超低レイテンシで最速応答、要点重視の分析（推奨）</div> <div class="advisor-help-text">gpt-4.1-nano: やや遅い、より詳細な説明が必要な場合</div> <div class="advisor-help-text">※ 一日のリクエスト上限: 50回/デバイス</div> </div> </div> <!-- MyAPIエリア --> <div id="advisorMyApiArea" style="${hasApiKey ? '' : 'display: none;'}"> <div class="advisor-field"> <label class="advisor-label" for="developerApiKeyInput">OpenAI APIキー</label> <div class="advisor-api-key-wrapper"> <input type="password" id="developerApiKeyInput" placeholder="sk-..." value="${currentKey}" class="advisor-input"> <button type="button" data-action="${this.config.actions.toggleDeveloperKeyVisibility}" class="advisor-btn-icon" title="表示/非表示"> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/> </svg> </button> </div> <div class="advisor-help-text">APIキーは安全にローカルストレージに保存されます</div> </div> <div class="advisor-field"> <label class="advisor-label" for="developerApiModelInput">モデル</label> <select id="developerApiModelInput" class="advisor-input"> <option value="gpt-5-nano" ${currentModel === 'gpt-5-nano' ? 'selected' : ''}>gpt-5-nano（超低レイテンシ: $0.05/1M入力）</option> <option value="gpt-4.1-nano" ${currentModel === 'gpt-4.1-nano' ? 'selected' : ''}>gpt-4.1-nano（レガシー互換: $0.08/1M入力）</option> <option value="gpt-4.1-mini" ${currentModel === 'gpt-4.1-mini' ? 'selected' : ''}>gpt-4.1-mini（$0.40/1M入力）</option> <option value="gpt-5-mini" ${currentModel === 'gpt-5-mini' ? 'selected' : ''}>gpt-5-mini（$0.30/1M入力・推定）</option> <option value="gpt-4o" ${currentModel === 'gpt-4o' ? 'selected' : ''}>gpt-4o（品質重視: $2.50/1M入力）</option> <option value="gpt-5" ${currentModel === 'gpt-5' ? 'selected' : ''}>gpt-5（最高品質: $1.25/1M入力）</option> </select> <div class="advisor-help-text">GPT-5シリーズは超低レイテンシですが、temperatureパラメータは非対応です</div> </div> <details style="margin-bottom: 16px;"> <summary style="cursor: pointer; font-weight: 500; margin-bottom: 8px;">詳細設定（オプション）</summary> <div style="padding-left: 16px;"> <div class="advisor-field"> <label class="advisor-label" for="developerApiBaseUrlInput">Base URL</label> <input type="text" id="developerApiBaseUrlInput" placeholder="https://api.openai.com/v1" value="${currentBaseUrl}" class="advisor-input"> <div class="advisor-help-text">OpenAI互換APIを使用する場合のみ指定</div> </div> </div> </details> </div> <div class="advisor-confirm-buttons"> <button type="button" class="advisor-btn-secondary" data-action="${this.config.actions.resetDeveloperSettings}">初期化</button> <button type="button" class="advisor-btn-secondary" data-action="${this.config.actions.testDeveloperConnection}">接続テスト</button> <button type="button" class="advisor-btn-secondary" data-action="${this.config.actions.closeDeveloperPrompt}">キャンセル</button> <button type="button" class="advisor-btn-primary" data-action="${this.config.actions.saveDeveloperKey}">保存</button> </div> </div> </div> `
    );
    this.addEscapeKeyListener(overlay, this.config.ui.closeDeveloperPrompt); this.setupAdvisorApiModeToggle(); }
  closeDeveloperPrompt() { this.closeModal('developerPrompt'); }
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
        freeArea.style.display = 'none'; myApiArea.style.display = 'block'; } }
    radioFree.addEventListener('change', toggleAreas);
    radioMyAPI.addEventListener('change', toggleAreas); toggleAreas(); }
  saveDeveloperKey() {
    const isFreeMode = document.getElementById('advisorRadioModeFree')?.checked;
    let key = '';
    let provider = '';
    let baseUrl = '';
    let model = '';
    if (isFreeMode) {
      const freeModelSelect = document.getElementById('advisorFreeModelSelect');
      model = freeModelSelect?.value ?? 'gpt-5-nano';
      this.clearUserApiCredentials();
    } else {
      const keyInput = document.getElementById('developerApiKeyInput');
      const baseUrlInput = document.getElementById('developerApiBaseUrlInput');
      const modelInput = document.getElementById('developerApiModelInput');
      const rawKey = keyInput?.value ?? '';
      const rawBaseUrl = baseUrlInput?.value ?? '';
      const rawModel = modelInput?.value ?? '';
      if ([rawKey, rawBaseUrl, rawModel].some(v => v && v.trim() === '')) {
        alert('空白のみの入力は保存できません。値を入力するか、空欄にしてください。'); return; }
      key = rawKey.trim();
      baseUrl = rawBaseUrl.trim();
      model = rawModel.trim();
      provider = 'openai'; // 固定
      if (!key) {
        alert('APIキーを入力してください'); return; } }
    if (baseUrl) {
      try {
        const u = new URL(baseUrl);
        if (!['http:', 'https:'].includes(u.protocol)) throw new Error('protocol');
      } catch {
        alert('ベースURLが不正です。http(s)から始まる有効なURLを入力してください。'); return; } }
    this.saveUserApiKey(key);
    this.saveUserApiProvider(provider);
    this.saveUserApiBaseUrl(baseUrl);
    this.saveUserApiModel(model);
    this.closeDeveloperPrompt(); alert('設定を保存しました。再度分析ボタンを押してください。'); }
  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) { input.type = input.type === 'password' ? 'text' : 'password'; } }
  async testDeveloperConnection() {
    console.debug('[BaseAdvisor] testDeveloperConnection: start');
    const isFreeMode = document.getElementById('advisorRadioModeFree')?.checked;
    if (isFreeMode) {
      alert('無料版モードでは接続テストは不要です'); return; }
    const key = (document.getElementById('developerApiKeyInput')?.value || '').trim();
    const baseUrl = (document.getElementById('developerApiBaseUrlInput')?.value || '').trim();
    const model = (document.getElementById('developerApiModelInput')?.value || '').trim();
    const provider = 'openai';
    if (!key) {
      alert('APIキーを入力してください'); return; }
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
        status.querySelector('.advisor-status-chip:last-child').textContent = '接続: 失敗'; alert(`接続に失敗しました: ${e.message}`); } }
  resetDeveloperSettings() {
    console.debug('[BaseAdvisor] resetDeveloperSettings: start');
    const ok = window.confirm('拡張モード設定を初期化します（無料版に戻ります）。よろしいですか？');
    if (!ok) return;
    try {
      this.clearUserApiCredentials();
      this.saveUserApiModel('gpt-5-nano');
      alert('拡張モード設定を初期化しました（無料版に戻りました）。');
      this.closeDeveloperPrompt();
      this.showDeveloperPrompt();
    } catch (e) { alert('初期化に失敗しました。再度お試しください。'); } }
  createModal(id, html) {
    const overlay = document.createElement('div');
    overlay.id = this.config.elemIdPrefix + id;
    overlay.className = 'advisor-overlay active';
    overlay.innerHTML = html;
    document.body.appendChild(overlay); return overlay; }
  closeModal(id) {
    const overlay = document.getElementById(this.config.elemIdPrefix + id);
    if (overlay) {
      if (overlay.handleEscape) { document.removeEventListener('keydown', overlay.handleEscape); }
      overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 300); } }
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text; return div.innerHTML; }
  renderViewHeader(title, closeAction) { return ` <div class="advisor-view-header"><h2>${this.escapeHtml(title)}</h2><button type="button" data-action="${closeAction}">戻る</button></div> `; }
  getModelPricing(model) {
    const prices = {
      'gpt-5-nano': { input: 0.00005, output: 0.0004 }, // $0.05/1M, $0.40/1M
      'gpt-5-nano-2025-08-07': { input: 0.00005, output: 0.0004 }, // $0.05/1M, $0.40/1M
      'gpt-4.1-nano': { input: 0.00008, output: 0.00035 }, // $0.08/1M, $0.35/1M（レガシー互換）
      'gpt-5-mini': { input: 0.0003, output: 0.0015 }, // $0.30/1M, $1.50/1M (推定)
      'gpt-5': { input: 0.00125, output: 0.01 }, // $1.25/1M, $10.00/1M
      'gpt-4.1-mini': { input: 0.0004, output: 0.0016 }, // $0.40/1M, $1.60/1M
      'gpt-4.1': { input: 0.002, output: 0.008 }, // $2.00/1M, $8.00/1M
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }, // $0.15/1M, $0.60/1M
      'gpt-4o': { input: 0.0025, output: 0.01 }, // $2.50/1M, $10.00/1M
      'gpt-4-turbo': { input: 0.01, output: 0.03 }, // $10.00/1M, $30.00/1M
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 }, // $0.50/1M, $1.50/1M
      'o3-mini': { input: 0.0011, output: 0.0044 }, // $1.10/1M, $4.40/1M
      o3: { input: 0.02, output: 0.08 }, // $20.00/1M, $80.00/1M };
    if (!model || typeof model !== 'string') { return prices['gpt-5-nano']; }
    if (!prices[model]) {
    } return prices[model] || prices['gpt-5-nano']; }
  renderApiUsagePanel(usage, model = window.ADVISOR_CONST.DEFAULT_MODEL) {
    if (!usage) return '';
    if (typeof usage !== 'object') { return ''; }
    const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usage;
    const prices = this.getModelPricing(model);
    const TOKENS_PER_UNIT = 1000;
    const USD_TO_JPY_RATE = 150;
    const inputCost = (prompt_tokens / TOKENS_PER_UNIT) * prices.input;
    const outputCost = (completion_tokens / TOKENS_PER_UNIT) * prices.output;
    const totalCost = inputCost + outputCost;
    const totalCostJPY = totalCost * USD_TO_JPY_RATE; return ` <div class="advisor-usage-panel" style="container-type: inline-size; container-name: usage-panel;"> <h4 class="advisor-usage-panel-title">API使用量 (モデル: ${model})</h4> <div class="advisor-usage-panel-grid"> <div class="advisor-usage-panel-item"> <div class="advisor-usage-panel-label">入力トークン</div> <div class="advisor-usage-panel-value">${prompt_tokens.toLocaleString()} tokens</div> </div> <div class="advisor-usage-panel-item"> <div class="advisor-usage-panel-label">出力トークン</div> <div class="advisor-usage-panel-value">${completion_tokens.toLocaleString()} tokens</div> </div> <div class="advisor-usage-panel-item"> <div class="advisor-usage-panel-label">合計トークン</div> <div class="advisor-usage-panel-value">${total_tokens.toLocaleString()} tokens</div> </div> <div class="advisor-usage-panel-item"> <div class="advisor-usage-panel-label">推定料金<sup style="font-size: 0.7rem;">*</sup></div> <div class="advisor-usage-panel-value"> $${totalCost.toFixed(6)} (約 ¥${totalCostJPY.toFixed(2)}) </div> </div> </div> <div class="advisor-usage-panel-footer"> <sup>*</sup> ${model}の価格で計算（入力: $${prices.input}/1K tokens, 出力: $${prices.output}/1K tokens, 1USD=${USD_TO_JPY_RATE}JPY換算） </div> </div> `; }
  createAnalysisResultsContainer(prefixId) { return ` <div class="advisor-progress-container" id="${prefixId}ProgressContainer"> <div class="advisor-progress-bar"> <div class="advisor-progress-fill" id="${prefixId}ProgressFill"></div> </div> <div class="advisor-progress-text" id="${prefixId}ProgressText">準備中...</div> </div> <div class="advisor-skeleton-loader" id="${prefixId}SkeletonLoader"> <div class="advisor-skeleton-item large"></div> <div class="advisor-skeleton-item medium"></div> <div class="advisor-skeleton-item medium"></div> <div class="advisor-skeleton-item small"></div> <div style="height: 8px;"></div> <div class="advisor-skeleton-item large"></div> <div class="advisor-skeleton-item medium"></div> <div class="advisor-skeleton-item medium"></div> <div class="advisor-skeleton-item small"></div> </div> <div class="advisor-markdown" id="${prefixId}Markdown"></div> `; }
  updateProgressCommon(prefixId, percentage, text) {
    const fill = document.getElementById(`${prefixId}ProgressFill`);
    const textEl = document.getElementById(`${prefixId}ProgressText`);
    if (fill) { fill.style.width = Math.min(percentage, 100) + '%'; }
    if (textEl) { textEl.textContent = text; } }
  hideSkeletonLoader(prefixId) {
    const skeletonLoader = document.getElementById(`${prefixId}SkeletonLoader`);
    if (skeletonLoader) { skeletonLoader.style.display = 'none'; } }
  hideProgressContainer(prefixId) {
    const progressContainer = document.getElementById(`${prefixId}ProgressContainer`);
    if (progressContainer) { progressContainer.style.display = 'none'; } }
  getMarkdownElement(prefixId) { return document.getElementById(`${prefixId}Markdown`); }
  renderMarkdownCommon(markdown) {
    let html = this.escapeHtml(markdown);
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>').replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/<br><(h[123])>/g, '<$1>'); // 見出しの前
    html = html.replace(/<\/(h[123])><br>/g, '</$1>'); // 見出しの後
    html = html.replace(
      /(<li>.*?<\/li>(?:<br>)*)+/g,
      match => `<ul>${match.replace(/<br>/g, '')}</ul>`
    );
    html = html.replace(/<\/li><br>/g, '</li>'); return html; }
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
      if (icon) icon.textContent = '▼'; } }
  showExportButtonsCommon(containerId, onCsvExport, onHtmlExport) {
    const exportContainer = document.getElementById(containerId);
    if (!exportContainer) return;
exportContainer.innerHTML = ` <button type="button" class="advisor-export-btn advisor-export-csv-btn" aria-label="AI分析結果をCSV形式でエクスポート">CSVでエクスポート</button> <button type="button" class="advisor-export-btn advisor-export-pdf-btn" aria-label="AI分析結果をHTMLでエクスポート（ブラウザの印刷機能でPDF化）">HTMLをPDF化</button> `;
    const csvBtn = exportContainer.querySelector('.advisor-export-csv-btn');
    const pdfBtn = exportContainer.querySelector('.advisor-export-pdf-btn');
    if (csvBtn && onCsvExport) csvBtn.addEventListener('click', onCsvExport);
    if (pdfBtn && onHtmlExport) pdfBtn.addEventListener('click', onHtmlExport); }
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click(); URL.revokeObjectURL(url); }
  escapeCsvValue(value) {
    const escaped = String(value).replace(/"/g, '""'); return `"${escaped}"`; }
  cleanHtmlText(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\t+/g, ' ')
      .replace(/\s+/g, ' ') .trim(); }
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
      .replace(/\n\n\n+/g, '\n\n') // 3つ以上の連続改行を2つに .trim(); }
  checkChatRateLimit() {
    const userApiKey = this.getUserApiKey();
    if (userApiKey) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: null,
        usingUserKey: true,
        mode: 'developer', }; }
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
      maxRequests, }; }
  recordChatUsage() {
    if (this.getUserApiKey()) return; // MyAPIモードでは記録しない
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const chatUsageKey = 'jsonld_chat_rate_limit';
    const usageData = JSON.parse(localStorage.getItem(chatUsageKey) || '[]');
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    recentRequests.push(now); localStorage.setItem(chatUsageKey, JSON.stringify(recentRequests)); }
  renderFloatingChatButton(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) { return; }
    this.chatConfig = config;
    config.containerId = containerId;
    const uniqueId = `advisorFloatingChatBtn-${config.type}-${Date.now()}`;
container.innerHTML = ` <button type="button" class="advisor-floating-chat-btn" id="${uniqueId}" aria-label="チャットを開く" title="AI チャット"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg> <span class="advisor-chat-badge" id="advisorChatBadge" style="display: none;"></span> </button> `;
    const btn = document.getElementById(uniqueId);
    if (btn) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        if (this.chatConfig.questionerSelected) {
          this.renderChatBoxCommon(containerId, this.chatConfig);
        } else { this.showQuestionerModal(this.chatConfig); }
      });
    } else { } }
  showQuestionerModal(config) {
    const questioners = this.getQuestionerPersonas(config.type);
    const modal = document.createElement('div');
    modal.className = 'advisor-modal-overlay';
modal.innerHTML = ` <div class="advisor-questioner-modal"> <div class="advisor-questioner-modal-header"> <h3>チャットの質問者を選択してください</h3> <button type="button" class="advisor-modal-close-btn" aria-label="閉じる"> <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"> <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> </svg> </button> </div> <div class="advisor-questioner-modal-body"> <p class="advisor-questioner-modal-desc">より適切なアドバイスを提供するために、あなたのペルソナを教えてください。</p> <div class="advisor-questioner-list"> ${questioners .map( (q, idx) => `
              <button type="button" class="advisor-questioner-btn" data-questioner-idx="${idx}" data-questioner-id="${q.id}">
                <div class="advisor-questioner-name">${q.name}</div>
                <div class="advisor-questioner-desc">${q.description}</div>
              </button>
` ) .join('')} </div> </div> </div> `;
    document.body.appendChild(modal);
    modal.querySelector('.advisor-modal-close-btn').addEventListener('click', () => {
      modal.remove();
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) { modal.remove(); }
    });
    const handleEscape = e => {
      if (e.key === 'Escape') {
        modal.remove(); document.removeEventListener('keydown', handleEscape); } };
    document.addEventListener('keydown', handleEscape);
    modal.querySelectorAll('.advisor-questioner-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        const idx = parseInt(e.currentTarget.dataset.questionerIdx, 10);
        const questioner = questioners[idx];
        config.questioner = questioner;
        config.questionerLabel = questioner.name;
        config.questionerSelected = true;
        modal.remove();
        this.renderChatBoxCommon(config.containerId, config);
      }); }); }
  renderChatBoxCommon(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) { return; }
    const floatingBtn = container.querySelector('.advisor-floating-chat-btn');
    let floatingBtnHtml = '';
    if (floatingBtn) { floatingBtnHtml = floatingBtn.outerHTML.replace('display: flex', 'display: none'); }
    const rateLimit = this.checkChatRateLimit();
    const rateLimitText = rateLimit.usingUserKey
      ? '無制限（MyAPI使用中）'
      : `残り ${rateLimit.remaining}/${rateLimit.maxRequests} 回`;
container.innerHTML = ` ${floatingBtnHtml} <div class="advisor-chat-box advisor-chat-expanded advisor-chat-right" id="advisorChatBox"> <div class="advisor-chat-header advisor-chat-drag-handle" id="advisorChatDragHandle"> <div class="advisor-chat-header-left"> <svg class="advisor-chat-drag-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="9" cy="5" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="19" r="1.5" fill="currentColor"/> <circle cx="15" cy="5" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="19" r="1.5" fill="currentColor"/> </svg> <h3 style="margin: 0; font-size: 1rem;">AI チャット</h3> ${config.questionerLabel ? `<span class="advisor-chat-questioner-badge">${config.questionerLabel}</span>` : ''}
            <button type="button" class="advisor-chat-expand-btn" aria-label="全画面表示に切り替え" title="全画面表示">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="advisor-chat-btn-label">拡大</span>
            </button>
          </div>
          <div class="advisor-chat-header-right">
            <span class="advisor-chat-rate-limit">${rateLimitText}</span>
            <button type="button" class="advisor-chat-reset-btn" aria-label="位置とサイズをリセット" title="位置とサイズをリセット">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <polyline points="23 4 23 10 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="advisor-chat-btn-label">リセット</span>
            </button>
            <button type="button" class="advisor-chat-export-btn" aria-label="チャット履歴をエクスポート" title="履歴をエクスポート">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span class="advisor-chat-btn-label">保存</span>
            </button>
            <button type="button" class="advisor-chat-collapse-btn" aria-label="チャットを折りたたむ" title="折りたたむ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="advisor-chat-btn-label">最小化</span>
            </button>
            <button type="button" class="advisor-chat-close-btn" aria-label="チャットを閉じる" title="閉じる">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <span class="advisor-chat-btn-label">閉じる</span>
            </button>
          </div>
        </div>
        <div class="advisor-chat-messages" id="${config.chatMessagesId}">
          <div class="advisor-chat-welcome">
            <p>フォローアップが必要ですか？</p>
            ${
              config.questioner
? ` <div class="advisor-chat-sample-questions"> <p class="advisor-chat-sample-label">サンプル質問:</p> ${this.getSampleQuestions(config.type, config.questioner.id) .map( question => `
                <button type="button" class="advisor-chat-sample-btn" data-sample-question="${this.escapeHtml(question)}">
                  ${this.escapeHtml(question)}
                </button>
` ) .join('')} </div> `
                : '' }
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
`; this.initChatEventListeners(config); this.initChatUIControls(containerId, config); } getQuestionerPersonas(type) { const personas = { advisor: [ { id: 'employer', name: '採用側（企業担当者）', description: '採用成功を目指す採用担当者や経営者。求人内容の最適化、人材マッチング率向上を重視。', }, { id: 'applicant', name: '応募者側', description: '求職者。職務経歴書の作成、面接対策、アピールポイント強化を必要とする。', }, { id: 'agent', name: 'エージェント', description: '人材紹介エージェント。マッチング率向上、営業戦略、市場分析が重点。', }, ], 'blog-reviewer': [ { id: 'writer', name: 'ブログライター', description: '記事執筆者。記事品質向上、SEO対策、リーダーシップ改善に注力。', }, { id: 'editor', name: '編集者', description: '編集・監修者。記事全体の品質管理、戦略的なコンテンツ企画を担当。', }, ], 'web-advisor': [ { id: 'owner', name: 'Webサイト責任者', description: 'サイト管理者。ページ最適化、ユーザー体験向上、ビジネス目標達成を重視。', }, { id: 'marketer', name: 'マーケター', description: 'マーケティング担当。流入増加、コンバージョン改善、SEO戦略実行を必要とする。', }, ], }; return personas[type] || []; } getSampleQuestions(type, questionerId) { const samples = { advisor: { employer: [ 'この求人で不足している情報は何ですか？', '競合他社と比較して、この求人の魅力をどう高められますか？', '応募者を増やすために、どの項目を改善すべきですか？', ], applicant: [ 'この求人で最も評価されるスキルは何ですか？', '面接でアピールすべきポイントを教えてください', 'この企業の技術スタックで、キャリアはどう成長しますか？', ], agent: [ 'この求人に最適な候補者の技術プロフィールは？', '開発現場で使われる技術の実務的な使い方を教えてください', '候補者との面談で確認すべき技術要件は何ですか？', ], }, 'blog-reviewer': { writer: [ 'この記事の構成で改善すべき点はどこですか？', 'SEO効果を高めるために追加すべき要素は？', '読者の離脱を防ぐために工夫できることは？', ], editor: [ '記事全体の品質を向上させるポイントは？', 'ターゲット読者に響く内容になっていますか？', 'コンテンツ戦略として不足している要素は？', ], }, 'web-advisor': { owner: [ 'このページで最優先で改善すべき要素は何ですか？', 'ユーザー体験を向上させるための具体的な施策は？', 'コンバージョン率を改善するにはどうすればいいですか？', ], marketer: [ 'SEO観点でこのページの課題はどこですか？', 'SNSでのシェアを増やすための改善点は？', '流入経路ごとに最適化すべき要素はありますか？', ], }, }; if (samples[type] && samples[type][questionerId]) { return samples[type][questionerId]; } return [ 'この内容で改善すべきポイントは何ですか？', '最も重要な課題は何ですか？', '具体的な改善提案を教えてください', ]; } initChatUIControls(containerId, config) { const container = document.getElementById(containerId); if (!container) return; const chatBox = container.querySelector('.advisor-chat-box'); const collapseBtn = container.querySelector('.advisor-chat-collapse-btn'); const closeBtn = container.querySelector('.advisor-chat-close-btn'); const resetBtn = container.querySelector('.advisor-chat-reset-btn'); const exportBtn = container.querySelector('.advisor-chat-export-btn'); const expandBtn = container.querySelector('.advisor-chat-expand-btn'); const dragHandle = container.querySelector('.advisor-chat-drag-handle'); const resizeHandle = container.querySelector('.advisor-chat-resize-handle'); const toggleFullscreen = () => { const isFullscreen = chatBox.classList.contains('advisor-chat-fullscreen'); if (isFullscreen) { chatBox.classList.remove('advisor-chat-fullscreen'); chatBox.style.removeProperty('height'); chatBox.style.removeProperty('max-height'); chatBox.style.removeProperty('top'); chatBox.style.removeProperty('bottom'); if (expandBtn) { expandBtn.setAttribute('title', '全画面表示'); expandBtn.setAttribute('aria-label', '全画面表示に切り替え'); } } else { chatBox.classList.add('advisor-chat-fullscreen'); chatBox.style.left = ''; chatBox.style.top = ''; chatBox.style.right = ''; chatBox.style.bottom = ''; chatBox.style.transform = ''; if (expandBtn) { expandBtn.setAttribute('title', '全画面解除'); expandBtn.setAttribute('aria-label', '全画面を解除'); } if ('visualViewport' in window && window.visualViewport) { const viewport = window.visualViewport; const viewportHeight = viewport.height; const viewportOffsetTop = viewport.offsetTop; const maxHeight = viewportHeight - 20; chatBox.style.setProperty('height', `${maxHeight}px`, 'important');
          chatBox.style.setProperty('max-height', `${maxHeight}px`, 'important');
          chatBox.style.setProperty('top', `${viewportOffsetTop + 10}px`, 'important'); chatBox.style.setProperty('bottom', 'auto', 'important'); } } };
    if (resetBtn && chatBox) {
      resetBtn.addEventListener('click', () => {
        chatBox.classList.add('advisor-chat-right');
        chatBox.classList.remove('advisor-chat-left');
        chatBox.classList.remove('advisor-chat-fullscreen');
        chatBox.classList.remove('advisor-chat-collapsed');
        chatBox.style.right = '';
        chatBox.style.bottom = '';
        chatBox.style.left = '';
        chatBox.style.top = '';
        chatBox.style.width = '';
        chatBox.style.height = '';
        chatBox.style.transform = '';
        if (expandBtn) {
          expandBtn.setAttribute('title', '全画面表示'); expandBtn.setAttribute('aria-label', '全画面表示に切り替え'); }
        if (collapseBtn) {
          const icon = collapseBtn.querySelector('span:first-child');
          if (icon) { icon.textContent = '−'; } }
        localStorage.removeItem('advisor-chat-position-x');
        localStorage.removeItem('advisor-chat-position-y');
        localStorage.removeItem('advisor-chat-width');
        localStorage.removeItem('advisor-chat-height');
          '[BaseAdvisor] Chat reset to default state (position, size, fullscreen, collapsed)'
        ); }); }
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportChatHistory(config); }); }
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        const isFullscreen = chatBox.classList.contains('advisor-chat-fullscreen');
        if (isFullscreen) { toggleFullscreen(); }
        chatBox.classList.toggle('advisor-chat-collapsed'); }); }
    if (expandBtn && chatBox) {
      expandBtn.addEventListener('click', e => {
        e.stopPropagation(); // ドラッグイベントとの衝突を防ぐ
        if (chatBox.classList.contains('advisor-chat-collapsed')) { chatBox.classList.remove('advisor-chat-collapsed'); }
        toggleFullscreen(); }); }
    if (dragHandle && chatBox) {
      let lastTap = 0;
      const doubleTapDelay = 300; // 300ms以内のタップをダブルタップとみなす
      dragHandle.addEventListener('touchend', e => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) { return; }
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTap;
        if (tapLength < doubleTapDelay && tapLength > 0) {
          e.preventDefault();
          toggleFullscreen();
          lastTap = 0; // リセット
        } else { lastTap = currentTime; }
      });
      dragHandle.addEventListener('dblclick', e => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) { return; }
        toggleFullscreen();
      });
      if ('visualViewport' in window) {
        const handleViewportResize = () => {
          if (chatBox.classList.contains('advisor-chat-fullscreen')) {
            const viewport = window.visualViewport;
            const viewportHeight = viewport.height;
            const viewportOffsetTop = viewport.offsetTop;
            const maxHeight = viewportHeight - 20;
              viewportHeight,
              viewportOffsetTop,
              maxHeight,
            });
            chatBox.style.setProperty('height', `${maxHeight}px`, 'important');
            chatBox.style.setProperty('max-height', `${maxHeight}px`, 'important');
            chatBox.style.setProperty('top', `${viewportOffsetTop + 10}px`, 'important'); chatBox.style.setProperty('bottom', 'auto', 'important'); } };
        window.visualViewport.addEventListener('resize', handleViewportResize);
        window.visualViewport.addEventListener('scroll', handleViewportResize); handleViewportResize(); } }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (chatBox) { chatBox.remove(); }
        this.renderFloatingChatButton(containerId, config); }); }
    if (dragHandle && chatBox) {
      let isDragging = false;
      let currentX = 0;
      let currentY = 0;
      let initialX = 0;
      let initialY = 0;
      const onMouseDown = e => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) { return; }
        if (chatBox.classList.contains('advisor-chat-fullscreen')) { return; }
        isDragging = true;
        currentX = chatBox.offsetLeft;
        currentY = chatBox.offsetTop;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
        chatBox.style.right = 'auto';
        chatBox.style.bottom = 'auto';
        dragHandle.style.cursor = 'grabbing'; };
      const onMouseMove = e => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        const maxX = window.innerWidth - chatBox.offsetWidth;
        const maxY = window.innerHeight - chatBox.offsetHeight;
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`; };
      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        dragHandle.style.cursor = 'grab';
        localStorage.setItem('advisor-chat-position-x', currentX);
        localStorage.setItem('advisor-chat-position-y', currentY); };
      const onTouchStart = e => {
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) { return; }
        if (chatBox.classList.contains('advisor-chat-fullscreen')) { return; }
        isDragging = true;
        const touch = e.touches[0];
        currentX = chatBox.offsetLeft;
        currentY = chatBox.offsetTop;
        initialX = touch.clientX - currentX;
        initialY = touch.clientY - currentY;
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
        chatBox.style.right = 'auto';
        chatBox.style.bottom = 'auto'; };
      const onTouchMove = e => {
        if (!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        currentX = touch.clientX - initialX;
        currentY = touch.clientY - initialY;
        const maxX = window.innerWidth - chatBox.offsetWidth;
        const maxY = window.innerHeight - chatBox.offsetHeight;
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`; };
      const onTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        localStorage.setItem('advisor-chat-position-x', currentX);
        localStorage.setItem('advisor-chat-position-y', currentY); };
      dragHandle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      dragHandle.addEventListener('touchstart', onTouchStart, { passive: false });
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', onTouchEnd);
      const savedX = localStorage.getItem('advisor-chat-position-x');
      const savedY = localStorage.getItem('advisor-chat-position-y');
      if (savedX !== null && savedY !== null) {
        currentX = parseInt(savedX, 10);
        currentY = parseInt(savedY, 10);
        const maxX = window.innerWidth - chatBox.offsetWidth;
        const maxY = window.innerHeight - chatBox.offsetHeight;
        if (currentX < 0 || currentX > maxX || currentY < 0 || currentY > maxY) {
          localStorage.removeItem('advisor-chat-position-x');
          localStorage.removeItem('advisor-chat-position-y'); return; }
        chatBox.style.left = `${currentX}px`;
        chatBox.style.top = `${currentY}px`;
        chatBox.style.right = 'auto'; chatBox.style.bottom = 'auto'; } }
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
        resizeHandle.style.cursor = 'nwse-resizing'; };
      const onMouseMove = e => {
        if (!isResizing) return;
        e.preventDefault();
        const width = startWidth + (e.clientX - startX);
        const height = startHeight + (e.clientY - startY);
        const minWidth = 320;
        const minHeight = 450;
        const maxWidth = Math.min(window.innerWidth - 40, 900);
        const maxHeight = Math.min(window.innerHeight - 40, 800);
        const newWidth = Math.max(minWidth, Math.min(maxWidth, width));
        const newHeight = Math.max(minHeight, Math.min(maxHeight, height));
        chatBox.style.width = `${newWidth}px`;
        chatBox.style.height = `${newHeight}px`; };
      const onMouseUp = () => {
        if (!isResizing) return;
        isResizing = false;
        resizeHandle.style.cursor = 'nwse-resize';
        localStorage.setItem('advisor-chat-width', chatBox.style.width);
        localStorage.setItem('advisor-chat-height', chatBox.style.height); };
      resizeHandle.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      const savedWidth = localStorage.getItem('advisor-chat-width');
      const savedHeight = localStorage.getItem('advisor-chat-height');
      if (savedWidth) chatBox.style.width = savedWidth;
      if (savedHeight) chatBox.style.height = savedHeight; } }
  initChatEventListeners(config) {
    const inputEl = document.getElementById(config.chatInputId);
    const sendBtn = document.getElementById(config.chatSendBtnId);
    if (!inputEl || !sendBtn) { return; }
    if (!this.chatMessages) { this.chatMessages = []; }
    let isComposing = false;
    inputEl.addEventListener('compositionstart', () => {
      isComposing = true;
      inputEl.dataset.composition = 'true';
    });
    inputEl.addEventListener('compositionend', () => {
      isComposing = false;
      inputEl.dataset.composition = 'false';
    });
    sendBtn.addEventListener('click', () => {
      if (isComposing) return; // IME確定中なら送信しない
      const message = inputEl.value.trim();
      if (!message) return;
      this.sendChatMessageCommon(message, config);
      inputEl.value = '';
      inputEl.focus();
    });
    inputEl.addEventListener('keydown', e => {
      if (isComposing) { return; }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const message = inputEl.value.trim();
        if (!message) return;
        this.sendChatMessageCommon(message, config); inputEl.value = ''; }
    });
    const sampleButtons = document.querySelectorAll('.advisor-chat-sample-btn');
    sampleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.sampleQuestion;
        if (question) {
          inputEl.value = question;
          this.sendChatMessageCommon(question, config);
          inputEl.value = ''; inputEl.focus(); }
      });
    }); inputEl.focus(); }
  async sendChatMessageCommon(message, config) {
    const rateLimit = this.checkChatRateLimit();
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime
        ? new Date(rateLimit.resetTime).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
        : '不明';
      alert(
        `チャット回数の上限に達しました。リセット時刻: ${resetTime}\n\nまたは、MyAPIを使用してください（設定から）。`
      ); return; }
    this.renderChatMessageCommon('user', message, config.chatMessagesId);
    if (!this.chatMessages) { this.chatMessages = []; }
    this.chatMessages.push({ role: 'user', content: message });
    const messagesContainer = document.getElementById(config.chatMessagesId);
    if (!messagesContainer) return;
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'advisor-chat-message advisor-chat-message-assistant';
aiMessageDiv.innerHTML = ` <div class="advisor-chat-message-label">AI</div> <div class="advisor-chat-message-content"> <span class="advisor-chat-typing">回答を生成中...</span> </div> `;
    messagesContainer.appendChild(aiMessageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    try {
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
      if (!response.ok) { throw new Error(`HTTP ${response.status}: ${response.statusText}`); }
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
                contentDiv.innerHTML = this.renderMarkdownCommon(fullText); messagesContainer.scrollTop = messagesContainer.scrollHeight; }
              if (parsed.error) { throw new Error(parsed.error); }
            } catch (e) {
              if (e.message !== 'Unexpected end of JSON input') { } } } } }
      this.chatMessages.push({ role: 'assistant', content: fullText });
      this.recordChatUsage();
      this.updateChatRateLimitDisplay();
    } catch (error) {
      const contentDiv = aiMessageDiv.querySelector('.advisor-chat-message-content'); contentDiv.innerHTML = `<span style="color: var(--error-color);">エラー: ${this.escapeHtml(error.message)}</span>`; } }
  renderChatMessageCommon(role, content, messagesContainerId) {
    const messagesContainer = document.getElementById(messagesContainerId);
    if (!messagesContainer) return;
    const welcomeMsg = messagesContainer.querySelector('.advisor-chat-welcome');
    if (welcomeMsg) { welcomeMsg.remove(); }
    const messageDiv = document.createElement('div');
    messageDiv.className = `advisor-chat-message advisor-chat-message-${role}`;
    const label = role === 'user' ? 'あなた' : 'AI';
    const renderedContent =
      role === 'assistant' ? this.renderMarkdownCommon(content) : this.escapeHtml(content);
messageDiv.innerHTML = ` <div class="advisor-chat-message-label">${label}</div> <div class="advisor-chat-message-content">${renderedContent}</div> `;
    messagesContainer.appendChild(messageDiv); messagesContainer.scrollTop = messagesContainer.scrollHeight; }
  updateChatRateLimitDisplay() {
    const rateLimitEl = document.querySelector('.advisor-chat-rate-limit');
    if (!rateLimitEl) return;
    const rateLimit = this.checkChatRateLimit();
    const rateLimitText = rateLimit.usingUserKey
      ? '無制限（MyAPI使用中）'
      : `残り ${rateLimit.remaining}/${rateLimit.maxRequests} 回`; rateLimitEl.textContent = rateLimitText; }
  exportChatHistory(config) {
    const messagesContainer = document.getElementById(config.chatMessagesId);
    if (!messagesContainer) { return; }
    const messages = messagesContainer.querySelectorAll('.advisor-chat-message');
    if (messages.length === 0) {
      alert('エクスポートするメッセージがありません。'); return; }
    let content = `# AI チャット履歴\n\n`;
    content += `**日時**: ${new Date().toLocaleString('ja-JP')}\n`;
    content += `**Advisor**: ${config.type}\n`;
    if (config.questionerLabel) { content += `**質問者**: ${config.questionerLabel}\n`; }
    content += `\n---\n\n`;
    messages.forEach((msg, index) => {
      const isUser = msg.classList.contains('advisor-chat-message-user');
      const role = isUser ? 'あなた' : 'AI';
      const messageContent = msg.querySelector('.advisor-chat-message-content');
      const text = messageContent
        ? this.cleanHtmlTextPreserveLineBreaks(messageContent.innerHTML)
        : this.cleanHtmlTextPreserveLineBreaks(msg.innerHTML);
      content += `## ${index + 1}. ${role}\n\n${text}\n\n`;
    });
    const previewHtml = this.renderMarkdownCommon(content);
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `chat-history-${config.type}-${timestamp}.md`;
    this.showExportPreview(
      'チャット履歴エクスポート - プレビュー',
      previewHtml,
      () => {
        const contentWithBom = '\ufeff' + content;
        const blob = new Blob([contentWithBom], { type: 'text/markdown;charset=utf-8' });
        this.downloadFile(blob, filename);
      },
      'markdown' ); }
  showExportPreview(title, content, onDownload, type = 'html') {
    const overlay = document.createElement('div');
    overlay.className = 'export-preview-overlay';
overlay.innerHTML = ` <div class="export-preview-modal"> <div class="export-preview-header"> <h3 class="export-preview-title">${this.escapeHtml(title)}</h3> <button type="button" class="export-preview-close" aria-label="閉じる"> <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg> </button> </div> <div class="export-preview-content"> <div class="export-preview-${type}">${content}</div> </div> <div class="export-preview-footer"> <button type="button" class="export-preview-btn export-preview-btn-cancel">キャンセル</button> <button type="button" class="export-preview-btn export-preview-btn-download">ダウンロード</button> </div> </div> `;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
    const closePreview = () => {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300); };
    const closeBtn = overlay.querySelector('.export-preview-close');
    const cancelBtn = overlay.querySelector('.export-preview-btn-cancel');
    const downloadBtn = overlay.querySelector('.export-preview-btn-download');
    closeBtn.addEventListener('click', closePreview);
    cancelBtn.addEventListener('click', closePreview);
    downloadBtn.addEventListener('click', () => {
      onDownload();
      closePreview();
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { closePreview(); }
    });
    const handleEscape = e => {
      if (e.key === 'Escape') {
        closePreview(); document.removeEventListener('keydown', handleEscape); }
    }; document.addEventListener('keydown', handleEscape); }
  initResizeHandle(target) {
    if (window.innerWidth <= 768) { return; }
    const handle = document.querySelector(`.advisor-resize-handle[data-resize-target="${target}"]`);
    const leftPanel = handle?.previousElementSibling;
    const viewContent = handle?.parentElement;
    if (!handle || !leftPanel || !viewContent) { return; }
    const storageKey = `advisor-panel-width-${target}`;
    const savedWidth = localStorage.getItem(storageKey);
    if (savedWidth) { leftPanel.style.flex = `0 0 ${savedWidth}`; }
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    const handleMouseDown = e => {
      isResizing = true;
      startX = e.clientX;
      startWidth = leftPanel.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault(); };
    const handleMouseMove = e => {
      if (!isResizing) return;
      const containerWidth = viewContent.offsetWidth;
      const handleWidth = handle.offsetWidth;
      const deltaX = e.clientX - startX;
      const newWidth = startWidth + deltaX;
      const minWidth = 300;
      const maxWidth = containerWidth * 0.8 - handleWidth;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        const widthPercent = ((newWidth / containerWidth) * 100).toFixed(2) + '%'; leftPanel.style.flex = `0 0 ${widthPercent}`; } };
    const handleMouseUp = () => {
      if (!isResizing) return;
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      const currentWidth = leftPanel.style.flex.split(' ')[2];
      localStorage.setItem(storageKey, currentWidth); };
    handle.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    handle._resizeCleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp); }; }
  scrollToFooter() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const footer = document.querySelector('footer');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } else { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }
      }); }); } }
if (typeof module !== 'undefined' && module.exports) { module.exports = { BaseAdvisorManager }; }