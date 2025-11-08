class AdvisorManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_advisor_usage',
      USER_API_KEY: 'jsonld_user_openai_key',
      MAX_REQUESTS_PER_DAY: 50,
      elemIdPrefix: 'advisor',
      ui: {
        showConfirmDialog: () => this.showModeSelector(),
        closeDeveloperPrompt: () => this.closeDeveloperPrompt(),
      },
      actionHandlers: {
        'advisor-close-developer-prompt': () => this.closeDeveloperPrompt(),
        'advisor-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'advisor-save-developer-key': () => this.saveDeveloperKey(),
        'advisor-test-developer-connection': () => this.testDeveloperConnection(),
        'advisor-reset-developer-settings': () => this.resetDeveloperSettings(),
        'advisor-show-developer-prompt': () => this.showDeveloperPrompt(),
        'advisor-reset-to-free-mode': () => this.resetToFreeMode(),
        'advisor-start-employer': () => this.startAnalysis('employer'),
        'advisor-start-applicant': () => this.startAnalysis('applicant'),
        'advisor-start-agent': () => this.startAnalysis('agent'),
        'advisor-close-mode-overlay': () => this.closeModal('ModeOverlay'),
        'advisor-close-view': () => this.closeAdvisorView(),
        'advisor-fetch-advice': () => this.fetchAdvice(this.currentMode),
        'advisor-switch-perspective-employer': () => this.switchPerspective('employer'),
        'advisor-switch-perspective-applicant': () => this.switchPerspective('applicant'),
        'advisor-switch-perspective-agent': () => this.switchPerspective('agent'),
        'advisor-toggle-job-section': () => this.toggleAccordion('job'),
        'advisor-toggle-advice-section': () => this.toggleAccordion('advice'),
      },
      actions: {
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
    this.perspectiveCache = {}; // 視点ごとのキャッシュ
  }

  detectJobPosting(jsonLdData, url) {
    this.hideAdvisorButton();
    const jobPosting = jsonLdData.find(
      item => item['@type'] === 'JobPosting' || item['@type']?.includes('JobPosting')
    );
    if (jobPosting) {
      this.currentJobPosting = jobPosting;
      this.currentUrl = url;
      this.showAdvisorButton();
      return true;
    }
    return false;
  }

  showAdvisorButton() {
    const actionsContainer =
      document.getElementById('aiActions') || document.getElementById('results');
    if (!actionsContainer || document.getElementById('advisorTriggerBtn')) return;

    const button = document.createElement('button');
    button.id = 'advisorTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.type = 'button';
    button.innerHTML = `<svg width=\"20\" height=\"20\" viewBox=\"0 0 24 24\" fill=\"white\"><path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\" fill=\"white\"/></svg> 求人/求職アドバイスを受ける`;
    button.onclick = () => this.showModeSelector();
    actionsContainer.appendChild(button);
  }

  hideAdvisorButton() {
    const btn = document.getElementById('advisorTriggerBtn');
    if (btn) btn.remove();
  }

  showModeSelector() {
    // Dialog内にはAPI関連情報は含めない（API設定はHeaderのMy APIで管理）
    const overlay = this.createModal(
      'ModeOverlay',
      `
      <div class="advisor-modal">
        <div class="advisor-modal-header">
          <h2>どの視点でアドバイスしますか？</h2>
          <button type="button" class="advisor-modal-close" data-action="advisor-close-mode-overlay"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor"/></svg></button>
        </div>
        <div class="advisor-modal-body">
          <div class="advisor-mode-buttons-grid">
            <button type="button" class="advisor-mode-btn" data-action="advisor-start-employer">
              <h3>採用側向け</h3><p>求人票をレビューし改善提案を提供</p>
            </button>
            <button type="button" class="advisor-mode-btn" data-action="advisor-start-applicant">
              <h3>応募者向け</h3><p>面接対策と要件傾向の分析を提供</p>
            </button>
            </div>
            <button type="button" class="advisor-mode-btn" data-action="advisor-start-agent">
              <h3>エージェント向け</h3><p>営業戦略・市場分析・双方へのアドバイスを提供</p>
            </button>
        </div>
      </div>
    `
    );
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
    // ユーザーが選択したモードを保存（結果ページでの表示制御用）
    this.saveSelectedUserMode(mode);
    this.closeModal('ModeOverlay');
    this.showAdvisorView(mode);
    await this.fetchAdvice(mode);
  }

  showAdvisorView(mode) {
    const container = document.querySelector('.container');
    if (!container) return;

    let modeTitle;
    if (mode === 'employer') {
      modeTitle = '採用側向けアドバイス';
    } else if (mode === 'applicant') {
      modeTitle = '応募者向けアドバイス';
    } else {
      modeTitle = 'エージェント向けアドバイス';
    }

    const headerHtml = this.renderViewHeader(modeTitle, 'advisor-close-view');
    const advisorView = this.createModal(
      'View',
      `
      ${headerHtml}
      <div class="advisor-view-content">
        <div class="advisor-job-panel">
          <h3 class="advisor-accordion-header" data-action="advisor-toggle-job-section">
            <span class="advisor-accordion-icon">▼</span>求人票
          </h3>
          <div class="advisor-job-content advisor-accordion-content" id="advisorJobContent">${this.formatJobPosting(this.currentJobPosting)}</div>
        </div>
        <div class="advisor-resize-handle" data-resize-target="advisor"></div>
        <div class="advisor-advice-panel">
          <h3 class="advisor-accordion-header" data-action="advisor-toggle-advice-section">
            <span class="advisor-accordion-icon">▼</span>AI分析結果
          </h3>
          <div class="advisor-advice-content advisor-accordion-content" id="advisorAdviceContent">
            <div class="advisor-progress-container" id="advisorProgressContainer">
              <div class="advisor-progress-bar">
                <div class="advisor-progress-fill" id="advisorProgressFill"></div>
              </div>
              <div class="advisor-progress-text" id="advisorProgressText">準備中...</div>
            </div>
            <div class="advisor-skeleton-loader" id="advisorSkeletonLoader">
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
            <div class="advisor-markdown" id="advisorMarkdown"></div>
          </div>
          <div id="advisorExportButtons" class="advisor-export-buttons"></div>
        </div>
        <div id="advisorChatContainer" class="advisor-chat-container"></div>
      </div>
    `
    );
    container.style.display = 'none';
    advisorView.classList.add('advisor-view');

    // リサイズハンドルを初期化
    setTimeout(() => {
      this.initResizeHandle('advisor');
    }, 10);
  }

  closeAdvisorView() {
    this.isStreaming = false;
    this.perspectiveCache = {}; // キャッシュをクリア
    this.clearSelectedUserMode(); // ユーザータイプ選択をクリア

    // グローバルな分析状態をクリア
    setAnalysisInactive('advisor');
    cancelAnalysis('advisor');

    // モーダルオーバーレイを削除
    const modals = document.querySelectorAll('.advisor-modal-overlay');
    modals.forEach(modal => modal.remove());

    this.closeModal('View');
    const container = document.querySelector('.container');
    if (container) container.style.display = '';
  }

  formatJobPosting(job) {
    const title = job.title || '不明';
    const description = this.formatDescription(job.description || '説明なし');
    const company = job.hiringOrganization?.name || '不明';
    const location = job.jobLocation?.address?.addressLocality || job.jobLocation?.address?.addressRegion || '不明';

    let html = '';

    // URL情報
    if (this.currentUrl) {
      html += `
        <div class="job-field">
          <label>分析元URL</label>
          <div class="job-value">
            <a href="${this.escapeHtml(this.currentUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--link-color); text-decoration: underline; word-break: break-all;">
              ${this.escapeHtml(this.currentUrl)}
            </a>
          </div>
        </div>
      `;
    }

    // メタタグ情報
    html += `
      <div class="job-field">
        <label>企業名</label>
        <div class="job-value">${this.escapeHtml(company)}</div>
      </div>
      <div class="job-field">
        <label>勤務地</label>
        <div class="job-value">${this.escapeHtml(location)}</div>
      </div>
      <div class="job-field">
        <label>職種</label>
        <div class="job-value">${this.escapeHtml(title)}</div>
      </div>
      <div class="job-field">
        <label>職務内容</label>
        <div class="job-value job-description">${description}</div>
      </div>
    `;

    return html;
  }

  formatDescription(text) {
    let html = this.escapeHtml(text).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
    return html
      .split(/\n\n+/)
      .map(p => `<p>${p.split('\n').join('<br>')}</p>`)
      .join('');
  }

  async fetchAdvice(mode) {
    // デバッグモードチェック
    if (window.isDebugMode && window.isDebugMode()) {
      console.log('[Advisor] Debug mode enabled - using mock data');
      this.renderMockAnalysis(mode);
      return;
    }

    // グローバルな分析実行状態をチェック（複数の分析の同時実行を防ぐ）
    if (!canStartAnalysis('advisor')) {
      alert('別の分析が実行中です。しばらくお待ちください。');
      return;
    }

    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;

    this.isStreaming = true;
    setAnalysisActive('advisor'); // グローバルにアクティブ化
    console.log('[Advisor] fetchAdvice started for mode:', mode);

    // AbortControllerを作成してグローバルに保存
    const abortController = new AbortController();
    window.ANALYSIS_STATE.abortControllers['advisor'] = abortController;

    // タイムアウト処理（180秒）
    const timeoutId = setTimeout(() => {
      if (this.isStreaming) {
        console.warn('[Advisor] Analysis timeout - forcing completion');
        this.isStreaming = false;
        abortController.abort();
        this.updateProgress(100, '完了');
        const progressContainer = document.getElementById('advisorProgressContainer');
        if (progressContainer) {
          progressContainer.style.display = 'none';
        }
        alert('分析がタイムアウトしました。取得できた範囲で結果を表示しています。');
      }
    }, 180000); // 180秒

    try {
      const apiUrl = window.location.hostname.includes('vercel.app')
        ? '/api/advisor'
        : 'http://127.0.0.1:3333/api/advisor';
      console.log('[Advisor] Calling API:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPosting: this.currentJobPosting,
          mode,
          userApiKey: this.getUserApiKey() || undefined,
        }),
        signal: abortController.signal,
      });

      console.log('[Advisor] API response status:', response.status);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // 既存のマークダウン要素を使用（HTML 上書きしない）
      const md = document.getElementById('advisorMarkdown');
      if (!md) {
        throw new Error('マークダウン要素が見つかりません');
      }

      this.updateProgress(0, '初期化中...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let firstTokenReceived = false;

      console.log('[Advisor] Starting streaming loop...');
      while (this.isStreaming) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[Advisor] Stream done');
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('[Advisor] Received [DONE] signal');
            this.isStreaming = false;
            this.recordUsage();
            this.updateProgress(100, '完了');
            // プログレスバーとスケルトンを非表示
            const progressContainer = document.getElementById('advisorProgressContainer');
            if (progressContainer) {
              progressContainer.style.display = 'none';
            }
            // キャッシュに保存
            this.perspectiveCache[mode] = {
              content: fullText,
              usage: this.currentUsage,
              model: this.currentModel,
            };
            // エクスポートボタンを表示
            this.showExportButtons();
            // チャットボックスを表示
            this.initChatBox();
            // フッターまでスムーズスクロール
            this.scrollToFooter();
            break;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.model) {
              this.currentModel = parsed.model;
              console.log('[Advisor] Received model:', parsed.model);
            } else if (parsed.content) {
              fullText += parsed.content;

              // 初回トークン受信時、スケルトンローダーを非表示
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                const skeletonLoader = document.getElementById('advisorSkeletonLoader');
                if (skeletonLoader) {
                  skeletonLoader.style.display = 'none';
                }
                this.updateProgress(10, '分析開始...');
              }

              // テキスト長に基づいて進捗を更新（10%-90%）
              const textLength = fullText.length;
              let progressPercentage = 10;
              let progressText = '分析中...';

              if (textLength < 500) {
                progressPercentage = 10 + Math.floor((textLength / 500) * 20); // 10-30%
              } else if (textLength < 1500) {
                progressPercentage = 30 + Math.floor(((textLength - 500) / 1000) * 30); // 30-60%
              } else if (textLength < 3000) {
                progressPercentage = 60 + Math.floor(((textLength - 1500) / 1500) * 20); // 60-80%
              } else {
                progressPercentage = 80 + Math.min(Math.floor((textLength - 3000) / 500), 10); // 80-90%
                progressText = '完了間近...';
              }

              this.updateProgress(progressPercentage, progressText);
              md.innerHTML = this.renderMarkdown(fullText);
            } else if (parsed.usage) {
              this.currentUsage = parsed.usage;
              this.displayUsage();
            }
          } catch (e) {
            console.warn('[Advisor] Failed to parse streaming data:', e);
          }
        }
      }
      console.log('[Advisor] fetchAdvice completed');
    } catch (error) {
      // プログレスバーとスケルトン非表示
      const progressContainer = document.getElementById('advisorProgressContainer');
      const skeletonLoader = document.getElementById('advisorSkeletonLoader');
      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
      if (skeletonLoader) {
        skeletonLoader.style.display = 'none';
      }

      // AbortError（キャンセル）なら詳細を異なるように処理
      if (error.name === 'AbortError') {
        console.log('[Advisor] 分析がキャンセルされました');
        const md = document.getElementById('advisorMarkdown');
        if (md) {
          md.innerHTML = '<div class="advisor-notice"><p>分析がキャンセルされました</p></div>';
        }
      } else {
        console.error('[Advisor] fetchAdvice error:', error);
        const md = document.getElementById('advisorMarkdown');
        if (md) {
          md.innerHTML = `<div class="advisor-error"><p>AI分析に失敗しました</p><button type="button" data-action="advisor-fetch-advice">再試行</button></div>`;
        }
      }
    } finally {
      // タイムアウトタイマーをクリア
      clearTimeout(timeoutId);
      // 必ずクリーンアップ
      this.isStreaming = false;
      setAnalysisInactive('advisor');
      delete window.ANALYSIS_STATE.abortControllers['advisor'];
    }
  }

  /**
   * マークダウンをHTMLに変換（BaseAdvisorManagerの共通メソッドを使用）
   * @deprecated renderMarkdownCommon()を使用してください
   */
  renderMarkdown(markdown) {
    return this.renderMarkdownCommon(markdown);
  }

  /**
   * フッターまでスムーズスクロール
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

  /**
   * プログレスバーを更新
   */
  updateProgress(percentage, text) {
    const fill = document.getElementById('advisorProgressFill');
    const textEl = document.getElementById('advisorProgressText');

    if (fill) {
      fill.style.width = Math.min(percentage, 100) + '%';
    }

    if (textEl) {
      textEl.textContent = text;
    }
  }

  displayUsage() {
    if (!this.currentUsage) return;
    const container = document.createElement('div');
    // BaseAdvisorManagerの共通メソッドを使用して詳細な使用量表示を生成
    // サーバーから受信したモデル名を使用、なければデフォルト
    container.innerHTML = this.renderApiUsagePanel(this.currentUsage, this.currentModel);
    document.getElementById('advisorAdviceContent').appendChild(container);
  }

  /**
   * 視点を切り替えて再分析を実行（キャッシュ対応）
   */
  async switchPerspective(newMode) {
    // ユーザーが選択したモード以外への切り替えは禁止
    const selectedUserMode = this.getSelectedUserMode();
    if (selectedUserMode && selectedUserMode !== newMode) {
      console.log('[Advisor] 別のユーザータイプモードへの切り替えは許可されません');
      return;
    }

    // 現在のモードと同じ場合は何もしない
    if (this.currentMode === newMode) return;

    // ストリーミング中の場合は停止
    if (this.isStreaming) {
      this.isStreaming = false;
    }

    // モードを更新
    this.currentMode = newMode;

    // タイトルを更新
    let modeTitle;
    if (newMode === 'employer') {
      modeTitle = '採用側向けアドバイス';
    } else if (newMode === 'applicant') {
      modeTitle = '応募者向けアドバイス';
    } else {
      modeTitle = 'エージェント向けアドバイス';
    }

    const viewHeader = document.querySelector('.advisor-view-header h2');
    if (viewHeader) {
      viewHeader.textContent = modeTitle;
    }

    // アクティブボタンを更新
    const perspectiveBtns = document.querySelectorAll('.advisor-perspective-btn');
    perspectiveBtns.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.action === `advisor-switch-perspective-${newMode}`) {
        btn.classList.add('active');
      }
    });

    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;

    // キャッシュがある場合はキャッシュから表示（トークン消費なし）
    if (this.perspectiveCache[newMode]) {
      console.log(`[Advisor] Using cached data for ${newMode}`);
      const cached = this.perspectiveCache[newMode];
      adviceContent.innerHTML = '<div class="advisor-markdown"></div>';
      const markdownDiv = adviceContent.querySelector('.advisor-markdown');
      markdownDiv.innerHTML = this.renderMarkdown(cached.content);

      // キャッシュされた使用量を復元
      this.currentUsage = cached.usage;
      this.currentModel = cached.model;
      this.displayUsage();

      // キャッシュ利用のバッジを表示
      this.showCacheNotification(`${modeTitle}（キャッシュから取得）`);
      return;
    }

    // キャッシュがない場合、トークン消費を確認
    console.log(`[Advisor] Fetching new data for ${newMode}`);
    const rateLimit = this.checkRateLimit();
    const willConsumeTokens = !rateLimit.allowed || rateLimit.mode !== 'developer';

    if (willConsumeTokens && rateLimit.mode === 'free') {
      const message = `この操作で追加のトークンが消費されます。
視点: ${modeTitle}
残り使用回数: ${rateLimit.remaining} / ${rateLimit.maxRequests}

続けますか？`;

      if (!window.confirm(message)) {
        console.log('[Advisor] Perspective switch cancelled by user');
        this.currentMode = null; // モード変更をキャンセル
        return;
      }
    }

    // 新しく取得
    adviceContent.innerHTML =
      '<div class="advisor-loading"><div class="advisor-spinner"></div><p>AI分析中...</p></div>';
    await this.fetchAdvice(newMode);
  }

  /**
   * キャッシュ利用通知を表示
   */
  showCacheNotification(message) {
    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;

    const notification = document.createElement('div');
    notification.style.cssText = `
      padding: 12px 16px;
      margin-bottom: 12px;
      background: var(--secondary-bg-color);
      border-left: 4px solid var(--info-color, #0066cc);
      border-radius: 4px;
      font-size: 0.875rem;
      color: var(--secondary-text-color);
    `;
    notification.innerHTML = `<strong>キャッシュから取得</strong><br>${message}（追加トークン消費なし）`;
    adviceContent.insertBefore(notification, adviceContent.firstChild);

    // 5秒後に自動削除
    setTimeout(() => notification.remove(), 5000);
  }

  /**
   * アコーディオンの開閉を切り替え
   */
  toggleAccordion(section) {
    const contentId = section === 'job' ? 'advisorJobContent' : 'advisorAdviceContent';
    const content = document.getElementById(contentId);
    const header = content?.previousElementSibling;
    const icon = header?.querySelector('.advisor-accordion-icon');

    if (!content || !header || !icon) return;

    if (content.classList.contains('advisor-accordion-collapsed')) {
      content.classList.remove('advisor-accordion-collapsed');
      icon.textContent = '▼';
    } else {
      content.classList.add('advisor-accordion-collapsed');
      icon.textContent = '▶';
    }
  }

  /**
   * エクスポートボタンを表示
   */
  showExportButtons() {
    const exportContainer = document.getElementById('advisorExportButtons');
    if (!exportContainer) return;

    exportContainer.innerHTML = `
      <button type="button" class="advisor-export-btn advisor-export-csv-btn" aria-label="AI分析結果をCSV形式でエクスポート">CSVでエクスポート</button>
      <button type="button" class="advisor-export-btn advisor-export-pdf-btn" aria-label="AI分析結果をHTMLでエクスポート（ブラウザの印刷機能でPDF化）">HTMLをPDF化</button>
    `;

    const csvBtn = exportContainer.querySelector('.advisor-export-csv-btn');
    const pdfBtn = exportContainer.querySelector('.advisor-export-pdf-btn');

    csvBtn.addEventListener('click', () => this.exportToCSV());
    pdfBtn.addEventListener('click', () => this.exportToPDF());
  }

  /**
   * CSV形式でエクスポート（整形済みで見やすい形式）
   */
  exportToCSV() {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const modeLabel = this.getModeLabel(this.currentMode);

      const jobContent = document.getElementById('advisorJobContent');
      const adviceContent = document.querySelector('.advisor-markdown');

      // メタデータ抽出（HTMLタグ除去）
      const jobText = jobContent ? this.cleanHtmlText(jobContent.innerText) : '情報なし';
      const adviceText = adviceContent ? adviceContent.innerText : '情報なし';

      // CSVを項目,値の形式で整形（BOM付きUTF-8対応）
      const csvLines = [];

      // ヘッダー行
      csvLines.push('項目,値');

      // メタデータ
      csvLines.push(`エクスポート日時,${new Date().toLocaleString('ja-JP')}`);
      csvLines.push(`視点,${modeLabel}`);
      csvLines.push(`使用モデル,${this.currentModel}`);
      csvLines.push(`入力トークン数,${this.currentUsage.prompt_tokens}`);
      csvLines.push(`出力トークン数,${this.currentUsage.completion_tokens}`);

      // 求人情報（セクションヘッダー）
      csvLines.push('求人情報（タイトル）,');
      const jobLines = jobText.split('\n').filter(line => line.trim().length > 0);
      jobLines.slice(0, 1).forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`)); // 最初の行（タイトル）

      csvLines.push('求人情報（詳細）,');
      jobLines.slice(1).forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`)); // 残りの行（詳細）

      // AI分析結果
      csvLines.push('AI分析結果,');
      const adviceLines = adviceText.split('\n').filter(line => line.trim().length > 0);
      adviceLines.forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`));

      // CSVをHTMLテーブルに変換してプレビュー
      const previewHtml = this.generateCsvPreview(csvLines);

      // ファイル名を事前に生成
      const filename = `advice_${this.currentMode}_${timestamp}.csv`;

      // プレビューモーダルを表示
      this.showExportPreview(
        'CSVエクスポート - プレビュー',
        previewHtml,
        () => {
          // ダウンロード処理
          const csvContent = '\ufeff' + csvLines.join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          this.downloadFile(blob, filename);
          console.log('[Advisor] CSV export successful:', filename);
        },
        'table'
      );
    } catch (error) {
      console.error('[Advisor] CSV export failed:', error);
      alert('CSVエクスポートに失敗しました。');
    }
  }

  /**
   * CSVデータをHTMLテーブルプレビューに変換
   * @param {Array<string>} csvLines - CSVライン配列
   * @returns {string} HTMLテーブル
   */
  generateCsvPreview(csvLines) {
    let html = '<table class="csv-preview-table"><thead><tr>';

    // ヘッダー行
    const headerCells = csvLines[0].split(',');
    headerCells.forEach(cell => {
      html += `<th>${this.escapeHtml(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';

    // データ行
    for (let i = 1; i < csvLines.length; i++) {
      const cells = this.parseCsvLine(csvLines[i]);
      html += '<tr>';
      cells.forEach((cell, index) => {
        // 空のセル（インデント用）は特別なスタイルを適用
        const className = cell.trim() === '' && index === 0 ? 'csv-cell-indent' : '';
        html += `<td class="${className}">${this.escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    }

    html += '</tbody></table>';
    return html;
  }

  /**
   * CSVラインをパースしてセル配列に変換（引用符を考慮）
   * @param {string} line - CSVライン
   * @returns {Array<string>} セル配列
   */
  parseCsvLine(line) {
    const cells = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // エスケープされた引用符
          currentCell += '"';
          i++;
        } else {
          // 引用符の開始または終了
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // セルの区切り
        cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    // 最後のセルを追加
    cells.push(currentCell);
    return cells;
  }

  /**
   * HTMLタグを除去してテキストをクリーンアップ
   */
  cleanHtmlText(text) {
    return text
      .replace(/<[^>]*>/g, '') // HTMLタグ除去
      .replace(/&nbsp;/g, ' ') // &nbsp;をスペースに
      .replace(/\t+/g, ' ') // タブをスペースに
      .replace(/\s+/g, ' ') // 連続する空白を単一スペースに
      .trim();
  }

  /**
   * CSV用に値をエスケープ（ダブルクォートで囲む）
   */
  escapeCsvValue(value) {
    // ダブルクォートが含まれている場合は2倍にする
    const escaped = String(value).replace(/"/g, '""');
    // ダブルクォートで囲む
    return `"${escaped}"`;
  }

  /**
   * CSV用に行をエスケープ（改行や特殊文字を処理）
   */
  escapeCsvLine(line) {
    // ダブルクォートが含まれている場合は2倍にする
    const escaped = line.replace(/"/g, '""');
    // ダブルクォートで囲む
    return `"${escaped}"`;
  }

  /**
   * HTMLファイルでエクスポート（ブラウザで印刷→PDFで保存）
   * 注：実装上HTMLファイルがダウンロードされます。
   *     ブラウザで開き、「印刷」→「PDFとして保存」でPDF化してください。
   */
  exportToPDF() {
    try {
      const timestamp = new Date().toLocaleString('ja-JP');
      const modeLabel = this.getModeLabel(this.currentMode);

      const jobContent = document.getElementById('advisorJobContent');
      const adviceContent = document.querySelector('.advisor-markdown');

      const jobText = jobContent ? jobContent.innerText : '情報なし';
      const adviceText = adviceContent ? adviceContent.innerText : '情報なし';

      // HTML形式のPDF（ブラウザで印刷→PDFで保存）
      const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>AI分析結果エクスポート</title>
  <style>
    body {
      font-family: "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif;
      margin: 20px;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      text-align: center;
      border-bottom: 2px solid #5a7ca3;
      padding-bottom: 10px;
      color: #5a7ca3;
    }
    .metadata {
      background-color: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .metadata p {
      margin: 8px 0;
    }
    .section {
      margin: 30px 0;
      page-break-inside: avoid;
    }
    .section h2 {
      border-left: 4px solid #5a7ca3;
      padding-left: 10px;
      margin-top: 0;
      color: #2c3e50;
    }
    .content {
      background-color: #ffffff;
      padding: 15px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 13px;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #999;
    }
    @media print {
      body { margin: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>AI分析結果エクスポート</h1>

  <div class="metadata">
    <p><strong>エクスポート日時:</strong> ${timestamp}</p>
    <p><strong>視点:</strong> ${modeLabel}</p>
    <p><strong>使用モデル:</strong> ${this.currentModel}</p>
    <p><strong>トークン使用数:</strong> 入力 ${this.currentUsage.prompt_tokens}、出力 ${this.currentUsage.completion_tokens}</p>
  </div>

  <div class="section">
    <h2>求人情報</h2>
    <div class="content">${this.escapeHtml(jobText)}</div>
  </div>

  <div class="section">
    <h2>AI分析結果</h2>
    <div class="content">${this.escapeHtml(adviceText)}</div>
  </div>

  <div class="footer">
    <p>このドキュメントは自動生成されました。</p>
    <p>ブラウザの「印刷」機能から「PDFに保存」を選択してダウンロードしてください。</p>
  </div>

  <script>
    // ページ読み込み後に自動印刷ダイアログを表示（オプション）
    // window.print();
  </script>
</body>
</html>
      `;

      // プレビュー用にHTMLをレンダリング（iframeで表示）
      const previewHtml = htmlContent;

      // ファイル名を事前に生成
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `advice_${this.currentMode}_${dateStr}.html`;

      // プレビューモーダルを表示
      this.showExportPreview(
        'HTML/PDFエクスポート - プレビュー',
        previewHtml,
        () => {
          // ダウンロード処理
          const htmlWithBom = '\ufeff' + htmlContent;
          const blob = new Blob([htmlWithBom], { type: 'text/html;charset=utf-8;' });
          this.downloadFile(blob, filename);
          console.log('[Advisor] PDF export successful (HTML形式):', filename);
        },
        'html'
      );
    } catch (error) {
      console.error('[Advisor] PDF export failed:', error);
      alert('PDFエクスポートに失敗しました。');
    }
  }

  /**
   * ファイルダウンロード
   */
  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * 視点のラベルを取得
   */
  getModeLabel(mode) {
    const labels = {
      employer: '採用側視点',
      applicant: '応募者視点',
      agent: 'エージェント視点',
    };
    return labels[mode] || mode;
  }

  /**
   * ユーザーが選択したモードを保存
   */
  saveSelectedUserMode(mode) {
    localStorage.setItem('jsonld_advisor_selected_user_mode', mode);
    console.log('[Advisor] 選択ユーザータイプを保存:', mode);
  }

  /**
   * ユーザーが選択したモードを取得
   */
  getSelectedUserMode() {
    return localStorage.getItem('jsonld_advisor_selected_user_mode');
  }

  /**
   * ユーザーが選択したモードをクリア
   */
  clearSelectedUserMode() {
    localStorage.removeItem('jsonld_advisor_selected_user_mode');
    console.log('[Advisor] 選択ユーザータイプをクリア');
  }

  /**
   * チャットボックスを初期化
   */
  initChatBox() {
    const chatConfig = {
      type: 'advisor',
      containerId: 'advisorChatContainer',
      context: {
        jobPosting: this.currentJobPosting,
        mode: this.currentMode,
        analysis: this.perspectiveCache[this.currentMode]?.content || '',
      },
      chatMessagesId: 'advisorChatMessages',
      chatInputId: 'advisorChatInput',
      chatSendBtnId: 'advisorChatSendBtn',
    };

    this.renderFloatingChatButton('advisorChatContainer', chatConfig);
  }

  renderMockAnalysis(mode) {
    console.log('[Advisor] Rendering mock analysis for mode:', mode);

    const adviceContent = document.getElementById('advisorAdviceContent');
    const progressContainer = document.getElementById('advisorProgressContainer');
    const skeletonLoader = document.getElementById('advisorSkeletonLoader');
    const md = document.getElementById('advisorMarkdown');

    if (!adviceContent || !md) {
      console.error('[Advisor] Required elements not found');
      return;
    }

    // プログレスバーとスケルトンローダーを表示
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
    if (skeletonLoader) {
      skeletonLoader.style.display = 'block';
    }

    // モックデータを取得
    const mockData = window.DEBUG_MOCK_DATA?.jobPosting?.sample1;
    if (!mockData) {
      console.error('[Advisor] Mock data not found');
      md.innerHTML = '<p>デバッグデータが見つかりません</p>';
      return;
    }

    const mockAnalysis = mockData.mockAnalysis[mode];
    if (!mockAnalysis) {
      console.error('[Advisor] Mock analysis not found for mode:', mode);
      md.innerHTML = '<p>デバッグデータが見つかりません</p>';
      return;
    }

    // ストリーミングをシミュレート
    this.updateProgress(0, '初期化中...');

    setTimeout(() => {
      // スケルトンローダーを非表示
      if (skeletonLoader) {
        skeletonLoader.style.display = 'none';
      }
      this.updateProgress(30, '分析中...');

      setTimeout(() => {
        this.updateProgress(60, '分析中...');

        setTimeout(() => {
          this.updateProgress(90, '完了間近...');

          setTimeout(() => {
            // 分析結果を表示
            md.innerHTML = this.renderMarkdownCommon(mockAnalysis);

            this.updateProgress(100, '完了');

            // プログレスバーを非表示
            if (progressContainer) {
              progressContainer.style.display = 'none';
            }

            // モックの使用量データ
            this.currentUsage = {
              prompt_tokens: 1500,
              completion_tokens: 800,
              total_tokens: 2300,
            };
            this.currentModel = 'gpt-4o (mock)';

            // キャッシュに保存
            this.perspectiveCache[mode] = {
              content: mockAnalysis,
              usage: this.currentUsage,
              model: this.currentModel,
            };

            // 使用量を表示
            this.displayUsage();

            // エクスポートボタンを表示
            this.showExportButtons();

            // チャットボックスを表示
            this.initChatBox();

            console.log('[Advisor] Mock analysis rendering completed');
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  }
}

// グローバルインスタンス
const advisorManager = new AdvisorManager();
window.advisorManager = advisorManager;
