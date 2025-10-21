// AI Advisor Module

class AdvisorManager {
  constructor() {
    this.currentJobPosting = null;
    this.currentMode = null;
    this.isStreaming = false;
    this.currentUsage = null; // API usage情報
    this.RATE_LIMIT_KEY = 'jsonld_advisor_usage';
    this.USER_API_KEY = 'jsonld_user_openai_key';
    this.STAKEHOLDER_MODE_KEY = 'jsonld_advisor_stakeholder';
    this.USAGE_TOTAL_KEY = 'jsonld_usage_total'; // 共通累積
    this.USAGE_MODE_KEY = 'jsonld_usage_mode'; // 'daily' | 'session' | 'permanent'
    this.USD_TO_JPY = 150;
    this.MAX_REQUESTS_PER_DAY = 10;
    this.MAX_REQUESTS_STAKEHOLDER = 30;
    // 既定は gpt-4o-mini（目安単価）
    this.PRICE_PER_INPUT_TOKEN = 0.00000015;
    this.PRICE_PER_OUTPUT_TOKEN = 0.0000006;
  }

  /**
   * モーダルにEscapeキーリスナーを追加
   * @param {HTMLElement} overlay - オーバーレイ要素
   * @param {Function} closeFunc - 閉じる関数
   */
  addEscapeKeyListener(overlay, closeFunc) {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeFunc.call(this);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * レート制限をチェック
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: Date }
   */
  checkRateLimit() {
    // ユーザーAPIキーがある場合はレート制限をバイパス
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

    const usageData = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '[]');

    // 24時間以内のリクエストをフィルタ
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);

    // 関係者モードのチェック
    const isStakeholder = this.isStakeholderMode();
    const maxRequests = isStakeholder ? this.MAX_REQUESTS_STAKEHOLDER : this.MAX_REQUESTS_PER_DAY;

    const remaining = maxRequests - recentRequests.length;
    const allowed = remaining > 0;

    // 最も古いリクエストから24時間後がリセット時刻
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
   * レート制限使用履歴を記録
   */
  recordUsage() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const usageData = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '[]');

    // 24時間以内のリクエストのみ保持
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    recentRequests.push(now);

    localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(recentRequests));
  }

  /**
   * ユーザーAPIキーを取得
   * @returns {string|null}
   */
  getUserApiKey() {
    return localStorage.getItem(this.USER_API_KEY);
  }

  /**
   * ユーザーAPIキーを保存
   * @param {string} apiKey
   */
  saveUserApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(this.USER_API_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(this.USER_API_KEY);
    }
  }

  /**
   * 関係者モードかチェック
   * @returns {boolean}
   */
  isStakeholderMode() {
    return localStorage.getItem(this.STAKEHOLDER_MODE_KEY) === 'true';
  }

  /**
   * 関係者モードを有効化
   */
  enableStakeholderMode() {
    localStorage.setItem(this.STAKEHOLDER_MODE_KEY, 'true');
  }

  /**
   * 関係者モードを無効化
   */
  disableStakeholderMode() {
    localStorage.removeItem(this.STAKEHOLDER_MODE_KEY);
  }

  /**
   * 関係者確認ダイアログを表示
   */
  showStakeholderPrompt() {
    const overlay = document.createElement('div');
    overlay.className = 'advisor-overlay active';
    overlay.innerHTML = `
      <div class="advisor-modal advisor-confirm-modal">
        <div class="advisor-modal-header">
          <h2>関係者確認</h2>
        </div>
        <div class="advisor-modal-body">
          <p style="margin-bottom: 20px; text-align: center;">あなたは関係者ですか？</p>
          <p style="font-size: 0.85rem; color: var(--secondary-text-color); margin-bottom: 20px; text-align: center;">
            関係者の場合、利用回数が30回/24時間に増加します
          </p>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" onclick="advisorManager.closeStakeholderPrompt()">いいえ</button>
            <button class="advisor-btn-primary" onclick="advisorManager.confirmStakeholder()">はい</button>
          </div>
        </div>
      </div>
    `;
    overlay.id = 'stakeholderPrompt';
    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, this.closeStakeholderPrompt);
  }

  /**
   * 関係者確認ダイアログを閉じる
   */
  closeStakeholderPrompt() {
    const overlay = document.getElementById('stakeholderPrompt');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * 関係者モード確定
   */
  confirmStakeholder() {
    this.enableStakeholderMode();
    this.closeStakeholderPrompt();
    // モード選択画面を再表示
    this.showModeSelector();
  }

  /**
   * 開発者モード（APIキー入力）ダイアログを表示
   */
  showDeveloperPrompt() {
    const currentKey = this.getUserApiKey() || '';
    const overlay = document.createElement('div');
    overlay.className = 'advisor-overlay active';
    overlay.innerHTML = `
      <div class="advisor-modal advisor-developer-modal">
        <div class="advisor-modal-header">
          <h2>開発者モード</h2>
          <button class="advisor-modal-close" onclick="advisorManager.closeDeveloperPrompt()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          <p style="margin-bottom: 16px; color: var(--secondary-text-color); font-size: 0.9rem;">
            自分のOpenAI APIキーを使用すると、無制限で利用できます。
          </p>

          <div class="advisor-api-key-wrapper">
            <input type="password" id="developerApiKeyInput" placeholder="sk-proj-..." value="${currentKey}" class="advisor-input">
            <button type="button" onclick="advisorManager.toggleDeveloperKeyVisibility()" class="advisor-btn-icon" title="表示/非表示">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>
  updateTriggerUsageChip() {
    const chip = document.getElementById('advisorTriggerUsage');
    if (!chip) return;
    const acc = this.getAccumulatedUsage();
    const usd = (acc.prompt_tokens || 0) * this.PRICE_PER_INPUT_TOKEN + (acc.completion_tokens || 0) * this.PRICE_PER_OUTPUT_TOKEN;
    chip.textContent = `累計: ${((acc.total_tokens||0)).toLocaleString()} tok / $${usd.toFixed(4)} (¥${(usd*this.USD_TO_JPY).toFixed(0)})`;
  }


          <p class="advisor-notice" style="margin-top: 12px;">
            このAPIキーはあなたのブラウザにのみ保存され、サーバーには送信されません。
            OpenAI APIキーは <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a> で取得できます。
          </p>

          <p class="advisor-notice advisor-notice-warning" style="margin-top: 12px;">
            <strong>重要:</strong> 開発者モードでは、あなた自身のAPIキーを使用します。
            サービス提供者のAPIキーは使用されません。
            OpenAIの利用規約を遵守してください。
          </p>

          <div class="advisor-confirm-buttons" style="margin-top: 20px;">
            <button class="advisor-btn-secondary" onclick="advisorManager.closeDeveloperPrompt()">キャンセル</button>
            <button class="advisor-btn-primary" onclick="advisorManager.saveDeveloperKey()">保存</button>
          </div>
        </div>
      </div>
    `;
    overlay.id = 'developerPrompt';
    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, this.closeDeveloperPrompt);
  }

  /**
   * 開発者モードダイアログを閉じる
   */
  closeDeveloperPrompt() {
    const overlay = document.getElementById('developerPrompt');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
    setTimeout(() => advisorView.classList.add('active'), 10);
+    // 初期化: モデルセレクトとチップ
+    setTimeout(() => {
+      const sel = document.getElementById('advisorModelSelect');
+      if (sel) {
+        sel.value = this.getSelectedModel();
+        sel.addEventListener('change', () => this.setSelectedModel(sel.value));
+      }
+      const resetBtn = document.getElementById('advisorUsageResetBtn');
+      if (resetBtn) resetBtn.addEventListener('click', () => this.resetAccumulatedUsage());
+      const modeBtn = document.getElementById('advisorUsageModeBtn');
+      if (modeBtn) modeBtn.addEventListener('click', () => this.cycleUsageMode());
+      this.updateHeaderUsageChip();
+    }, 20);

  }

  /**
   * 開発者APIキーを保存
   */
  saveDeveloperKey() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) {
      this.saveUserApiKey(input.value.trim());
      this.closeDeveloperPrompt();
      // モード選択画面を再表示
      this.showModeSelector();
    }
  }

  /**
   * 開発者APIキーの表示/非表示を切り替え
   */
  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInput');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  /**
   * JobPostingスキーマを検出してアドバイスボタンを表示
   * @param {Array} jsonLdData - 抽出されたJSON-LDデータ
   */
  detectJobPosting(jsonLdData) {
    console.log('[AdvisorManager] detectJobPosting called with:', jsonLdData);

    // 既存のボタンを削除
    this.hideAdvisorButton();

    // JobPostingを検索（大文字小文字/配列/ヒューリスティック対応）
    const jobPosting = jsonLdData.find(item => {
      const t = item['@type'];
      if (t) {
        const arr = Array.isArray(t) ? t : [t];
        if (arr.some(v => String(v).toLowerCase().includes('jobposting'))) return true;
      }
      // 代表的なJobPostingプロパティでヒューリスティック判定
      const keys = ['employmentType', 'hiringOrganization', 'jobLocation', 'baseSalary', 'applicantLocationRequirements', 'validThrough'];
      return keys.some(k => k in item);
    });

    console.log('[AdvisorManager] JobPosting detected:', jobPosting);

    if (jobPosting) {
      this.currentJobPosting = jobPosting;
      this.showAdvisorButton();
      console.log('[AdvisorManager] Advisor button shown');
    } else {
      console.log('[AdvisorManager] No JobPosting found in schemas');
    }
  }

  /**
   * アドバイスボタンを表示
   */
  showAdvisorButton() {
    const resultDiv = document.getElementById('results');
    console.log('[AdvisorManager] showAdvisorButton - results div:', resultDiv);

    if (!resultDiv) {
      console.error('[AdvisorManager] ERROR: results div not found');
      return;
    }

    const existingBtn = document.getElementById('advisorTriggerBtn');
    if (existingBtn) {
      console.log('[AdvisorManager] Advisor button already exists');
      return;
    }

    const button = document.createElement('button');
    button.id = 'advisorTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      AIアドバイスを受ける
    `;
    button.onclick = () => this.showModeSelector();
  /** ヘッダ使用量チップ更新 */
  updateHeaderUsageChip() {
    const chip = document.getElementById('advisorHeaderUsage');
    const curTok = document.getElementById('advisorHeaderTokens');
    const curCost = document.getElementById('advisorHeaderCost');
    const totTok = document.getElementById('advisorHeaderTotalTokens');
    const totCost = document.getElementById('advisorHeaderTotalCost');
    if (!chip || !curTok || !curCost || !totTok || !totCost) return;

    if (this.currentUsage) {
      const { total_tokens = 0, prompt_tokens = 0, completion_tokens = 0 } = this.currentUsage;
      const inputCost = prompt_tokens * this.PRICE_PER_INPUT_TOKEN;
      const outputCost = completion_tokens * this.PRICE_PER_OUTPUT_TOKEN;
      const totalCost = inputCost + outputCost;
      curTok.textContent = `${total_tokens.toLocaleString()} tok`;
      curCost.textContent = `$${totalCost.toFixed(6)} (¥${(totalCost * this.USD_TO_JPY).toFixed(2)})`;
      chip.style.display = 'inline-flex';
    }

    const acc = this.getAccumulatedUsage();
    const t = acc.total_tokens || 0;
    const accCostUSD = (acc.prompt_tokens || 0) * this.PRICE_PER_INPUT_TOKEN + (acc.completion_tokens || 0) * this.PRICE_PER_OUTPUT_TOKEN;
    totTok.textContent = `${t.toLocaleString()} tok`;
    totCost.textContent = `$${accCostUSD.toFixed(6)} (¥${(accCostUSD * this.USD_TO_JPY).toFixed(2)})`;
  }

  /** 累積管理（共通・日別既定） */
  getAccumulatedUsage() {
    try {
      const mode = localStorage.getItem(this.USAGE_MODE_KEY) || 'daily';
      if (mode === 'session') {
        const raw = sessionStorage.getItem(this.USAGE_TOTAL_KEY);
        return raw ? JSON.parse(raw) : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      } else if (mode === 'permanent') {
        const raw = localStorage.getItem(this.USAGE_TOTAL_KEY);
        return raw ? JSON.parse(raw) : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
      } else {
        const today = new Date().toISOString().slice(0, 10);
        const raw = localStorage.getItem(this.USAGE_TOTAL_KEY);
        const obj = raw ? JSON.parse(raw) : { date: today, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        if (obj.date !== today) return { date: today, prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        return obj;
      }
    } catch { return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }; }
  }
  saveAccumulatedUsage(val) {
    try {
      const mode = localStorage.getItem(this.USAGE_MODE_KEY) || 'daily';
      if (mode === 'session') sessionStorage.setItem(this.USAGE_TOTAL_KEY, JSON.stringify(val));
      else localStorage.setItem(this.USAGE_TOTAL_KEY, JSON.stringify(val));
    } catch {}
  }
  addToAccumulatedUsage(usage) {
    const acc = this.getAccumulatedUsage();
    const today = new Date().toISOString().slice(0, 10);
    const base = { date: acc.date || today, prompt_tokens: acc.prompt_tokens || 0, completion_tokens: acc.completion_tokens || 0, total_tokens: acc.total_tokens || 0 };
    const next = {
      date: base.date === today ? base.date : today,
      prompt_tokens: base.date === today ? base.prompt_tokens + (usage.prompt_tokens || 0) : (usage.prompt_tokens || 0),
      completion_tokens: base.date === today ? base.completion_tokens + (usage.completion_tokens || 0) : (usage.completion_tokens || 0),
      total_tokens: base.date === today ? base.total_tokens + (usage.total_tokens || 0) : (usage.total_tokens || 0),
    };
    this.saveAccumulatedUsage(next);
    this.updateHeaderUsageChip();
  }
  resetAccumulatedUsage() {
    try {
      sessionStorage.removeItem(this.USAGE_TOTAL_KEY);
      localStorage.removeItem(this.USAGE_TOTAL_KEY);
      this.updateHeaderUsageChip();
    } catch {}
  }
  cycleUsageMode() {
    const mode = localStorage.getItem(this.USAGE_MODE_KEY) || 'daily';
    const order = ['daily', 'session', 'permanent'];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    localStorage.setItem(this.USAGE_MODE_KEY, next);
    this.updateHeaderUsageChip();
    alert(`集計モード: ${next}`);
  }

  /** モデル選択/単価 */
  getSelectedModel() {
    try { return localStorage.getItem('jsonld_model_common') || 'gpt-4o-mini'; } catch { return 'gpt-4o-mini'; }
  }
  setSelectedModel(model) {
    try {
      localStorage.setItem('jsonld_model_common', model);
      const p = this.getModelPricing(model);
      this.PRICE_PER_INPUT_TOKEN = p.input; this.PRICE_PER_OUTPUT_TOKEN = p.output;
      const sel = document.getElementById('advisorModelSelect');
      if (sel) sel.value = model;
      this.updateHeaderUsageChip();
      if (this.currentUsage) this.displayUsage();
    } catch {}
  }
  getModelPricing(model) {
    const table = {
      'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
      'gpt-4o': { input: 0.0000025, output: 0.00001 },
      'gpt-4.1-mini': { input: 0.00000015, output: 0.0000006 },
      'gpt-4.1': { input: 0.000003, output: 0.000015 },
      'o3-mini': { input: 0.0000006, output: 0.0000024 },
      'o3': { input: 0.000003, output: 0.000015 },
    };
    return table[model] || table['gpt-4o-mini'];
  }


    resultDiv.insertBefore(button, resultDiv.firstChild);
    console.log('[AdvisorManager] Advisor button inserted into DOM');
  }

  /**
   * アドバイスボタンを非表示
   */
  hideAdvisorButton() {
    const btn = document.getElementById('advisorTriggerBtn');
    if (btn) btn.remove();
  }

  /**
   * 通常モードに戻す（関係者モード・開発者モードを解除）
   */
  resetToNormalMode() {
    // 関係者モードを解除
    localStorage.removeItem(this.STAKEHOLDER_MODE_KEY);

    // 開発者モード（APIキー）を解除
    localStorage.removeItem(this.USER_API_KEY);

    // モード選択ダイアログを閉じて再表示
    this.closeModeSelector();

    alert('通常モードに戻しました。');

    // ダイアログを再表示
    setTimeout(() => this.showModeSelector(), 100);
  }

  /**
   * モード選択UIを表示
   */
  showModeSelector() {
    const rateLimit = this.checkRateLimit();

    let rateLimitHtml = '';
    let modeLabel = '';
    if (rateLimit.mode === 'developer') {
      rateLimitHtml =
        '<div class="advisor-rate-info advisor-rate-unlimited">開発者モード（無制限）</div>';
      modeLabel = '開発者モード';
    } else if (rateLimit.mode === 'stakeholder') {
      if (!rateLimit.allowed) {
        const resetTimeStr = rateLimit.resetTime
          ? rateLimit.resetTime.toLocaleString('ja-JP')
          : '不明';
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
      } else {
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-stakeholder">関係者モード - 残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
      }
      modeLabel = '関係者モード';
    } else {
      if (!rateLimit.allowed) {
        const resetTimeStr = rateLimit.resetTime
          ? rateLimit.resetTime.toLocaleString('ja-JP')
          : '不明';
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
      } else {
        rateLimitHtml = `<div class="advisor-rate-info">残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
      }
      modeLabel = '通常モード';
    }

    const overlay = document.createElement('div');
    overlay.id = 'advisorModeOverlay';
    overlay.className = 'advisor-overlay';
    overlay.innerHTML = `
      <div class="advisor-modal">
        <div class="advisor-modal-header" style="display: flex; flex-direction: column; align-items: stretch;">
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div class="advisor-mode-buttons-small">
              ${rateLimit.mode !== 'normal' ? `
                <button class="advisor-mode-btn-small" onclick="advisorManager.resetToNormalMode()" title="通常モード（10回/24時間）に戻す" style="background: var(--secondary-bg-color); border-color: var(--border-color);">
                  通常モード
                </button>
              ` : ''}
              <button class="advisor-mode-btn-small" onclick="advisorManager.showStakeholderPrompt()" title="関係者は30回/24時間まで利用可能">
                関係者
              </button>
              <button class="advisor-mode-btn-small" onclick="advisorManager.showDeveloperPrompt()" title="自分のAPIキーで無制限利用">
                開発者
              </button>
            </div>
            <button class="advisor-modal-close" onclick="advisorManager.closeModeSelector()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <h2 style="margin: 0; width: 100%;">どちらの視点でアドバイスしますか？</h2>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}

          <div class="advisor-mode-buttons-grid">
            <button class="advisor-mode-btn advisor-mode-employer" onclick="advisorManager.startAnalysis('employer')">
              <div class="advisor-mode-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2h12v4H6zM4 6h16v2H4zM5 9h14v10H5zM7 13h2v4H7zM11 13h2v4h-2zM15 13h2v4h-2zM3 20h18v1H3z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
              </div>
              <h3>採用側向け</h3>
              <p>求人票の内容をレビューし、<br>改善提案を提供します</p>
            </button>
            <button class="advisor-mode-btn advisor-mode-applicant" onclick="advisorManager.startAnalysis('applicant')">
              <div class="advisor-mode-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" stroke="currentColor" stroke-width="1" fill="none"/>
                </svg>
              </div>
              <h3>応募者向け</h3>
              <p>面接対策と要件傾向の<br>分析を提供します</p>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, this.closeModeSelector);

    setTimeout(() => overlay.classList.add('active'), 10);
  }

  /**
   * モード選択UIを閉じる
   */
  closeModeSelector() {
    const overlay = document.getElementById('advisorModeOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * AI分析を開始
   * @param {string} mode - 'employer' or 'applicant'
   */
  async startAnalysis(mode) {
    // レート制限チェック
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      this.closeModeSelector();
      const resetTimeStr = rateLimit.resetTime
        ? rateLimit.resetTime.toLocaleString('ja-JP')
        : '不明';

      let message = `利用制限に達しました。\n\nリセット時刻: ${resetTimeStr}\n\n`;
      if (rateLimit.mode === 'stakeholder') {
        message += '開発者モードで自分のAPIキーを使用すると制限なしで利用できます。';
      } else {
        message += '関係者モードで30回/24時間、または開発者モードで無制限利用が可能です。';
      }

      alert(message);
      return;
    }

    this.currentMode = mode;
    this.closeModeSelector();
    this.showAdvisorView(mode);
    await this.fetchAdvice(mode);
  }

  /**
   * アドバイス表示画面を表示
   * @param {string} mode - 'employer' or 'applicant'
   */
  showAdvisorView(mode) {
    const container = document.querySelector('.container');
    if (!container) return;

    const modeTitle = mode === 'employer' ? '採用側向けアドバイス' : '応募者向けアドバイス';

    const advisorView = document.createElement('div');
    advisorView.id = 'advisorView';
    advisorView.className = 'advisor-view';
    const modeIconSvg =
      mode === 'employer'
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v4H6zM4 6h16v2H4zM5 9h14v10H5zM7 13h2v4H7zM11 13h2v4h-2zM15 13h2v4h-2zM3 20h18v1H3z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" stroke="currentColor" stroke-width="1" fill="none"/></svg>';
    advisorView.innerHTML = `
      <div class="advisor-view-header">
        <h2><span style="display: inline-flex; align-items: center; margin-right: 8px;">${modeIconSvg}</span> ${modeTitle}</h2>
        <div class="advisor-view-actions">
          <button class="advisor-btn-secondary" onclick="advisorManager.closeAdvisorView()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            戻る
          </button>
        </div>
      </div>
      <div class="advisor-view-content">
        <div class="advisor-job-panel">
          <h3>求人票</h3>
          <div class="advisor-job-content" id="advisorJobContent">
            ${this.formatJobPosting(this.currentJobPosting)}
          </div>
        </div>
        <div class="advisor-advice-panel">
          <h3>AI分析結果</h3>
          <div class="advisor-advice-content" id="advisorAdviceContent">
            <div class="advisor-loading">
              <div class="advisor-spinner"></div>
              <p>AI分析中...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.style.display = 'none';
    document.body.appendChild(advisorView);

    setTimeout(() => advisorView.classList.add('active'), 10);
  }

  /**
   * JobPostingデータをHTMLフォーマット
   * @param {Object} jobPosting - JobPostingオブジェクト
   * @returns {string} HTML文字列
   */
  formatJobPosting(jobPosting) {
    const title = jobPosting.title || '不明';
    const description = jobPosting.description || '説明なし';
    const employmentType = jobPosting.employmentType || '不明';
    const location =
      jobPosting.jobLocation?.address?.addressLocality || jobPosting.jobLocation?.address || '不明';

    let salary = '記載なし';
    if (jobPosting.baseSalary) {
      const sal = jobPosting.baseSalary;
      const currency = sal.currency || 'JPY';
      const value = sal.value;
      if (value?.minValue && value?.maxValue) {
        salary = `${currency} ${value.minValue.toLocaleString()} - ${value.maxValue.toLocaleString()}`;
      } else if (value?.value) {
        salary = `${currency} ${value.value.toLocaleString()}`;
      }
    }

    // descriptionをHTMLに変換
    const formattedDescription = this.formatDescription(description);

    return `
      <div class="job-field">
        <label>職種</label>
        <div class="job-value">${this.escapeHtml(title)}</div>
      </div>
      <div class="job-field">
        <label>雇用形態</label>
        <div class="job-value">${this.escapeHtml(employmentType)}</div>
      </div>
      <div class="job-field">
        <label>勤務地</label>
        <div class="job-value">${this.escapeHtml(location)}</div>
      </div>
      <div class="job-field">
        <label>給与</label>
        <div class="job-value">${this.escapeHtml(salary)}</div>
      </div>
      <div class="job-field">
        <label>職務内容</label>
        <div class="job-value job-description">${formattedDescription}</div>
      </div>
    `;
  }

  /**
   * description を HTML に変換
   * @param {string} text - description テキスト
   * @returns {string} HTML文字列
   */
  formatDescription(text) {
    if (!text) return '';

    // HTMLエスケープ
    let html = this.escapeHtml(text);

    // <br /> タグを改行に変換
    html = html.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

    // 複数の改行を段落に変換
    const paragraphs = html.split(/\n\n+/);

    return paragraphs
      .map(paragraph => {
        // 箇条書きを検出（・、-、*で始まる行）
        const lines = paragraph.split('\n');
        const listItems = [];
        const normalLines = [];

        lines.forEach(line => {
          const trimmed = line.trim();
          if (/^[・\-\*]/.test(trimmed)) {
            // 箇条書き
            const content = trimmed.replace(/^[・\-\*]\s*/, '');
            listItems.push(`<li>${content}</li>`);
          } else if (trimmed) {
            normalLines.push(trimmed);
          }
        });

        let result = '';
        if (normalLines.length > 0) {
          result += `<p>${normalLines.join('<br>')}</p>`;
        }
        if (listItems.length > 0) {
          result += `<ul>${listItems.join('')}</ul>`;
        }
        return result;
      })
      .join('');
  }

  /**
   * AIアドバイスを取得（ストリーミング）
   * @param {string} mode - 'employer' or 'applicant'
   */
  async fetchAdvice(mode) {
    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;

    this.isStreaming = true;

    try {
      const isVercel = window.location.hostname.includes('vercel.app');
      const apiUrl = isVercel ? '/api/advisor' : 'http://127.0.0.1:3333/api/advisor';

      const userApiKey = this.getUserApiKey();

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPosting: this.currentJobPosting,
          mode: mode,
          userApiKey: userApiKey || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      adviceContent.innerHTML = '<div class="advisor-markdown"></div>';
      const markdownDiv = adviceContent.querySelector('.advisor-markdown');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      try {
        while (this.isStreaming) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                this.isStreaming = false;
                // 使用履歴を記録（成功時のみ）
                this.recordUsage();
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullText += parsed.content;
                  markdownDiv.innerHTML = this.renderMarkdown(fullText);
                } else if (parsed.usage) {
                  // usage情報を保存して表示
                  console.log('[Advisor] Received usage:', parsed.usage);
                  this.currentUsage = parsed.usage;
                  this.displayUsage();
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error('Parse error:', e);
              }
            }
          }
        }
      } finally {
        // ストリームを確実にキャンセル
        reader.cancel().catch(err => console.warn('Reader cancel failed:', err));
      }
    } catch (error) {
      console.error('Advisor fetch error:', error);
      adviceContent.innerHTML = `
        <div class="advisor-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>AI分析に失敗しました</p>
          <p class="advisor-error-detail">${this.escapeHtml(error.message)}</p>
          <button class="advisor-btn-primary" onclick="advisorManager.fetchAdvice('${mode}')">
            再試行
          </button>
        </div>
      `;
    }
  }

  /**
   * API usage情報を表示
   */
  displayUsage() {
    if (!this.currentUsage) {
      console.log('[Advisor] No usage data to display');
      return;
    }

    console.log('[Advisor] Displaying usage:', this.currentUsage);
    const { prompt_tokens, completion_tokens, total_tokens } = this.currentUsage;

    // 料金計算
    const inputCost = prompt_tokens * this.PRICE_PER_INPUT_TOKEN;
    const outputCost = completion_tokens * this.PRICE_PER_OUTPUT_TOKEN;
    const totalCost = inputCost + outputCost;

    // 日本円換算（1 USD = 150 JPY）
    const totalCostJPY = totalCost * 150;

    // usage表示用のHTML
    const usageHtml = `
      <div class="advisor-usage-panel" style="margin-top: 20px; padding: 16px; background: var(--secondary-bg-color); border: 1px solid var(--border-color); border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--secondary-text-color);">API使用量</h4>
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
            <div style="font-weight: 600;">$${totalCost.toFixed(6)} (約 ¥${totalCostJPY.toFixed(4)})</div>
          </div>
        </div>
      </div>
    `;

    // アドバイスコンテンツの末尾に追加
    const adviceContent = document.getElementById('advisorAdviceContent');
    console.log('[Advisor] adviceContent element:', adviceContent);
    if (adviceContent) {
      const markdownDiv = adviceContent.querySelector('.advisor-markdown');
      console.log('[Advisor] markdownDiv element:', markdownDiv);
      if (markdownDiv) {
        markdownDiv.insertAdjacentHTML('afterend', usageHtml);
        console.log('[Advisor] Usage HTML inserted');
      }
    }
  }

  /**
   * Markdownを簡易的にHTMLに変換
   * @param {string} markdown - Markdown文字列
   * @returns {string} HTML文字列
   */
  renderMarkdown(markdown) {
    let html = this.escapeHtml(markdown);

    // 見出し
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 太字
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // リスト（ハイフン）
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');

    // 番号付きリスト
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // 改行
    html = html.replace(/\n/g, '<br>');

    // 連続する<li>タグを<ul>で囲む（改行変換後に実行）
    html = html.replace(/((?:<li>.*?<\/li>(?:<br>)*)+)/g, '<ul>$1</ul>');

    return html;
  }

  /**
   * アドバイス画面を閉じる
   */
  closeAdvisorView() {
    this.isStreaming = false;
    const view = document.getElementById('advisorView');
    if (view) {
      view.classList.remove('active');
      setTimeout(() => view.remove(), 300);
    }

    const container = document.querySelector('.container');
    if (container) {
      container.style.display = '';
    }
  }

  /**
   * HTMLエスケープ
   * @param {string} text - エスケープする文字列
   * @returns {string} エスケープされた文字列
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// グローバルインスタンス
const advisorManager = new AdvisorManager();
