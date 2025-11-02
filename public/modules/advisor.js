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
        'advisor-start-agent': () => this.startAnalysis('agent'),
        'advisor-close-mode-overlay': () => this.closeModal('ModeOverlay'),
        'advisor-close-view': () => this.closeAdvisorView(),
        'advisor-fetch-advice': () => this.fetchAdvice(this.currentMode),
        'advisor-switch-perspective-employer': () => this.switchPerspective('employer'),
        'advisor-switch-perspective-applicant': () => this.switchPerspective('applicant'),
        'advisor-switch-perspective-agent': () => this.switchPerspective('agent'),
        'advisor-toggle-job-section': () => this.toggleAccordion('job'),
        'advisor-toggle-advice-section': () => this.toggleAccordion('advice'),
        // Web-prefixed actions for cross-module compatibility
        'web-save-developer-key': () => this.saveDeveloperKey(),
        'web-start-analysis': () => this.showModeSelector(),
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
    this.perspectiveCache = {}; // 視点ごとのキャッシュ
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
    const actionsContainer =
      document.getElementById('aiActions') || document.getElementById('results');
    if (!actionsContainer || document.getElementById('advisorTriggerBtn')) return;

    const button = document.createElement('button');
    button.id = 'advisorTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.type = 'button';
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
      rateLimitHtml =
        '<div class="advisor-rate-info advisor-rate-unlimited">MyAPIモード（無制限）</div>';
    } else {
      const limitMsg = rateLimit.allowed
        ? `残り ${rateLimit.remaining} 回`
        : '利用制限に達しました';
      rateLimitHtml = `<div class="advisor-rate-info">${limitMsg} / ${rateLimit.maxRequests} 回（24時間）</div>`;
    }

    const overlay = this.createModal(
      'ModeOverlay',
      `
      <div class="advisor-modal">
        <div class="advisor-modal-header advisor-modal-header--stack">
           <div class="advisor-modal-header-row">
            <div class="advisor-mode-buttons-small">
              <button type="button" class="advisor-mode-btn-small" data-action="advisor-reset-to-normal-mode">通常モード</button>
              <button type="button" class="advisor-mode-btn-small" data-action="advisor-show-stakeholder-prompt">関係者</button>
              <button type="button" class="advisor-mode-btn-small" data-action="advisor-show-developer-prompt">MyAPI</button>
            </div>
            <button type="button" class="advisor-modal-close" data-action="advisor-close-mode-overlay"><svg width="24" height="24" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor"/></svg></button>
          </div>
          <h2>どの視点でアドバイスしますか？</h2>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}
          <div class="advisor-mode-buttons-grid">
            <button type="button" class="advisor-mode-btn" data-action="advisor-start-employer">
              <h3>採用側向け</h3><p>求人票をレビューし改善提案を提供</p>
            </button>
            <button type="button" class="advisor-mode-btn" data-action="advisor-start-applicant">
              <h3>応募者向け</h3><p>面接対策と要件傾向の分析を提供</p>
            </button>
            <button type="button" class="advisor-mode-btn" data-action="advisor-start-agent">
              <h3>エージェント向け</h3><p>営業戦略・市場分析・双方へのアドバイスを提供</p>
            </button>
          </div>
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
        <div class="advisor-advice-panel">
          <h3 class="advisor-accordion-header" data-action="advisor-toggle-advice-section">
            <span class="advisor-accordion-icon">▼</span>AI分析結果
          </h3>
          <div class="advisor-advice-content advisor-accordion-content" id="advisorAdviceContent"><div class="advisor-loading"></div></div>
          <div id="advisorExportButtons" class="advisor-export-buttons"></div>
        </div>
      </div>
    `
    );
    container.style.display = 'none';
    advisorView.classList.add('advisor-view');
  }

  closeAdvisorView() {
    this.isStreaming = false;
    this.perspectiveCache = {}; // キャッシュをクリア
    this.clearSelectedUserMode(); // ユーザータイプ選択をクリア
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
    return html
      .split(/\n\n+/)
      .map(p => `<p>${p.split('\n').join('<br>')}</p>`)
      .join('');
  }

  async fetchAdvice(mode) {
    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;
    this.isStreaming = true;

    try {
      const apiUrl = window.location.hostname.includes('vercel.app')
        ? '/api/advisor'
        : 'http://127.0.0.1:3333/api/advisor';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobPosting: this.currentJobPosting,
          mode,
          userApiKey: this.getUserApiKey() || undefined,
        }),
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
            // キャッシュに保存
            this.perspectiveCache[mode] = {
              content: fullText,
              usage: this.currentUsage,
              model: this.currentModel,
            };
            // エクスポートボタンを表示
            this.showExportButtons();
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
      adviceContent.innerHTML = `<div class="advisor-error"><p>AI分析に失敗しました</p><button type="button" data-action="advisor-fetch-advice">再試行</button></div>`;
    }
  }

  renderMarkdown(markdown) {
    let html = this.escapeHtml(markdown);
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>').replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(
      /((?:<li>.*?<\/li>(?:<br>)*)+)/g,
      match => `<ul>${match.replace(/<br>/g, '')}</ul>`
    );
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

    if (willConsumeTokens && rateLimit.mode === 'normal') {
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
      <button type="button" class="advisor-export-btn advisor-export-pdf-btn" aria-label="AI分析結果をPDF形式でエクスポート">PDFでエクスポート</button>
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

      // CSVヘッダー付きで整形
      const csvLines = [];

      // メタデータセクション
      csvLines.push('【エクスポート情報】');
      csvLines.push(`エクスポート日時,${new Date().toLocaleString('ja-JP')}`);
      csvLines.push(`視点,${modeLabel}`);
      csvLines.push(`使用モデル,${this.currentModel}`);
      csvLines.push(`トークン使用数,"入力: ${this.currentUsage.prompt_tokens}, 出力: ${this.currentUsage.completion_tokens}"`);
      csvLines.push('');

      // 求人情報セクション
      csvLines.push('【求人情報】');
      const jobLines = jobText.split('\n').filter(line => line.trim().length > 0);
      jobLines.forEach(line => {
        csvLines.push(this.escapeCsvLine(line));
      });
      csvLines.push('');

      // AI分析結果セクション
      csvLines.push('【AI分析結果】');
      const adviceLines = adviceText.split('\n').filter(line => line.trim().length > 0);
      adviceLines.forEach(line => {
        csvLines.push(this.escapeCsvLine(line));
      });

      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `advice_${this.currentMode}_${timestamp}.csv`;

      this.downloadFile(blob, filename);
      console.log('[Advisor] CSV export successful:', filename);
    } catch (error) {
      console.error('[Advisor] CSV export failed:', error);
      alert('CSVエクスポートに失敗しました。');
    }
  }

  /**
   * HTMLタグを除去してテキストをクリーンアップ
   */
  cleanHtmlText(text) {
    return text
      .replace(/<[^>]*>/g, '') // HTMLタグ除去
      .replace(/&nbsp;/g, ' ')  // &nbsp;をスペースに
      .replace(/\t+/g, ' ')     // タブをスペースに
      .replace(/\s+/g, ' ')     // 連続する空白を単一スペースに
      .trim();
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
   * PDF形式でエクスポート（HTML形式で日本語対応）
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

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `advice_${this.currentMode}_${dateStr}.html`;

      this.downloadFile(blob, filename);
      console.log('[Advisor] PDF export successful (HTML形式):', filename);
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
}

// グローバルインスタンス
const advisorManager = new AdvisorManager();
