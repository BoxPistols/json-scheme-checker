// Web Advisor Module - AI-powered advice for pages with no schema or only WebPage schema

class WebAdvisorManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_web_advisor_usage',
      USER_API_KEY: 'jsonld_web_advisor_openai_key',
      USAGE_TOTAL_KEY: 'jsonld_usage_web_advisor_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
      MAX_REQUESTS_PER_DAY: 50,
      elemIdPrefix: 'webAdvisor',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'web-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'web-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'web-save-developer-key': () => this.saveDeveloperKey(),
        'web-test-developer-connection': () => this.testDeveloperConnection(),
        'web-reset-developer-settings': () => this.resetDeveloperSettings(),
        'web-show-developer-prompt': () => this.showDeveloperPrompt(),
        'web-reset-to-free-mode': () => this.resetToFreeMode(),
        'web-close-confirm-dialog': () => this.closeConfirmDialog(),
        'web-start-analysis': () => this.startAnalysis(),
        'web-close-result-view': () => this.closeResultView(),
        'web-fetch-analysis': () => this.fetchAnalysis(),
        'show-web-confirm-dialog': () => this.showConfirmDialog(),
        'web-toggle-metadata-section': () => this.toggleAccordion('metadata'),
        'web-toggle-content-section': () => this.toggleAccordion('content'),
      },
      actions: {
        closeDeveloperPrompt: 'web-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'web-toggle-developer-key-visibility',
        saveDeveloperKey: 'web-save-developer-key',
        testDeveloperConnection: 'web-test-developer-connection',
        resetDeveloperSettings: 'web-reset-developer-settings',
      },
    };
    super(config);

    this.currentUrl = null;
    this.currentMetadata = null; // メタデータを保存
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
      return false;
    }

    // すべてのページでWebアドバイザーを表示
    // Organization, WebSite, その他のスキーマタイプにも対応
    console.log('[WebAdvisor] Showing analysis button for all pages');
    this.currentUrl = url;
    this.showAnalysisButton();
    return true;
  }

  /**
   * 分析ボタンを表示（BlogReviewer/Advisorと同じUI）
   */
  showAnalysisButton() {
    const actionsContainer =
      document.getElementById('aiActions') || document.getElementById('results');
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

    // actions containerに追加
    actionsContainer.appendChild(button);
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
   * Dialog内にはAPI関連情報は含めない（API設定はHeadeのMy APIで管理）
   */
  showConfirmDialog() {
    const overlay = document.createElement('div');
    overlay.id = 'webAdvisorConfirmOverlay';
    overlay.className = 'advisor-overlay';
    overlay.innerHTML = `
      <div class="advisor-modal">
        <div class="advisor-modal-header">
          <h2>Webページ分析</h2>
          <button type="button" class="advisor-modal-close" data-action="web-close-confirm-dialog">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          </button>
        </div>
        <div class="advisor-modal-body">
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
      const resetTimeStr = rateLimit.resetTime
        ? rateLimit.resetTime.toLocaleString('ja-JP')
        : '不明';
      alert(
        `利用制限に達しました。\n\nリセット時刻: ${resetTimeStr}\n\nMyAPIモード（Header「My API」設定）で自分のOpenAI APIキーを使用すると無制限利用できます。`
      );
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
    const headerHtml = this.renderViewHeader(
      'Webページ分析',
      'web-close-result-view',
      `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7-5.5-4h7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
    );
    view.innerHTML = `
      ${headerHtml}
      <div class="advisor-view-content">
        <div class="advisor-job-panel">
          <h3 class="advisor-accordion-header" data-action="web-toggle-metadata-section">
            <span class="advisor-accordion-icon">▼</span>対象ページ
          </h3>
          <div class="advisor-job-content advisor-accordion-content" id="webAdvisorMetadata">
            <div style="padding: 8px 0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; opacity: 0.7;">読み込み中...</p>
            </div>
          </div>
        </div>
        <div class="advisor-advice-panel">
          <h3 class="advisor-accordion-header" data-action="web-toggle-content-section">
            <span class="advisor-accordion-icon">▼</span>AI分析結果
          </h3>
          <div class="advisor-advice-content advisor-accordion-content" id="webAdvisorContent">
            <div class="advisor-progress-container" id="webAdvisorProgressContainer">
              <div class="advisor-progress-bar">
                <div class="advisor-progress-fill" id="webAdvisorProgressFill"></div>
              </div>
              <div class="advisor-progress-text" id="webAdvisorProgressText">準備中...</div>
            </div>
            <div class="advisor-skeleton-loader" id="webAdvisorSkeletonLoader">
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
            <div class="advisor-markdown" id="webAdvisorMarkdown"></div>
          </div>
          <div id="webAdvisorExportButtons" class="advisor-export-buttons"></div>
        </div>
        <div id="webAdvisorChatContainer" class="advisor-chat-container"></div>
      </div>
    `;

    container.style.display = 'none';
    document.body.appendChild(view);
    setTimeout(() => view.classList.add('active'), 10);
  }

  /**
   * メタデータパネルを更新（meta イベント受信時に呼び出し）
   */
  updateMetadataPanel() {
    if (!this.currentMetadata) return;

    const panel = document.getElementById('webAdvisorMetadata');
    if (!panel) return;

    const { title, description, headings, og } = this.currentMetadata;
    const h1Content = headings.h1.length > 0 ? headings.h1[0] : '';
    const h2Content = headings.h2.length > 0 ? headings.h2.slice(0, 3).join(' / ') : '';

    let metadataHtml = `
      <div style="padding: 8px 0; font-size: 13px; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;">
          <strong style="display: block; margin-bottom: 2px;">URL</strong>
          <a href="${this.escapeHtml(this.currentUrl)}" target="_blank" style="color: var(--link-color); text-decoration: none; word-break: break-all; font-size: 12px;">
            ${this.escapeHtml(this.currentUrl)}
          </a>
        </p>
    `;

    if (title) {
      metadataHtml += `
        <p style="margin: 0 0 8px 0;">
          <strong style="display: block; margin-bottom: 2px;">タイトル</strong>
          <span style="font-size: 12px; opacity: 0.9;">${this.escapeHtml(title.substring(0, 80))}</span>
        </p>
      `;
    }

    if (description) {
      metadataHtml += `
        <p style="margin: 0 0 8px 0;">
          <strong style="display: block; margin-bottom: 2px;">説明</strong>
          <span style="font-size: 12px; opacity: 0.8;">${this.escapeHtml(description.substring(0, 100))}</span>
        </p>
      `;
    }

    if (h1Content) {
      metadataHtml += `
        <p style="margin: 0 0 8px 0;">
          <strong style="display: block; margin-bottom: 2px;">H1</strong>
          <span style="font-size: 12px; opacity: 0.85;">${this.escapeHtml(h1Content.substring(0, 60))}</span>
        </p>
      `;
    }

    if (h2Content) {
      metadataHtml += `
        <p style="margin: 0 0 8px 0;">
          <strong style="display: block; margin-bottom: 2px;">見出し構成</strong>
          <span style="font-size: 12px; opacity: 0.8;">${this.escapeHtml(h2Content.substring(0, 100))}</span>
        </p>
      `;
    }

    // Open Graph メタデータを表示
    if (og) {
      metadataHtml += `<div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid var(--border-color);">`;

      if (og.title) {
        metadataHtml += `
          <p style="margin: 0 0 6px 0;">
            <strong style="display: block; margin-bottom: 2px; font-size: 12px; opacity: 0.7;">OG:Title</strong>
            <span style="font-size: 12px; opacity: 0.8;">${this.escapeHtml(og.title.substring(0, 70))}</span>
          </p>
        `;
      }

      if (og.image) {
        metadataHtml += `
          <p style="margin: 0 0 6px 0;">
            <strong style="display: block; margin-bottom: 2px; font-size: 12px; opacity: 0.7;">OG:Image</strong>
            <img src="${this.escapeHtml(og.image)}" style="max-width: 100%; height: auto; border-radius: 3px; margin-top: 4px;" alt="OG Image" onerror="this.style.display='none'">
          </p>
        `;
      }

      if (og.description) {
        metadataHtml += `
          <p style="margin: 0 0 6px 0;">
            <strong style="display: block; margin-bottom: 2px; font-size: 12px; opacity: 0.7;">OG:Description</strong>
            <span style="font-size: 12px; opacity: 0.75;">${this.escapeHtml(og.description.substring(0, 90))}</span>
          </p>
        `;
      }

      if (og.type) {
        metadataHtml += `
          <p style="margin: 0;">
            <strong style="display: block; margin-bottom: 2px; font-size: 12px; opacity: 0.7;">OG:Type</strong>
            <span style="font-size: 12px; opacity: 0.75;">${this.escapeHtml(og.type)}</span>
          </p>
        `;
      }

      metadataHtml += '</div>';
    }

    metadataHtml += '</div>';

    panel.innerHTML = metadataHtml;
  }

  /**
   * プログレスバーを更新
   */
  updateProgress(percentage, text) {
    const fill = document.getElementById('webAdvisorProgressFill');
    const textEl = document.getElementById('webAdvisorProgressText');

    if (fill) {
      fill.style.width = Math.min(percentage, 100) + '%';
    }

    if (textEl) {
      textEl.textContent = text;
    }
  }

  /** SSEで分析を取得 */
  async fetchAnalysis() {
    // グローバルな分析実行状態をチェック（複数の分析の同時実行を防ぐ）
    if (!canStartAnalysis('web-advisor')) {
      alert('別の分析が実行中です。しばらくお待ちください。');
      return;
    }

    const content = document.getElementById('webAdvisorContent');
    if (!content) return;

    // 既存EventSourceをクリーン
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (_) {}
      this.eventSource = null;
    }

    this.isStreaming = true;
    setAnalysisActive('web-advisor'); // グローバルにアクティブ化

    // タイムアウト処理（180秒）
    const timeoutId = setTimeout(() => {
      if (this.isStreaming) {
        console.warn('[WebAdvisor] Analysis timeout - forcing completion');
        this.isStreaming = false;
        if (this.eventSource) {
          try {
            this.eventSource.close();
          } catch (_) {}
          this.eventSource = null;
        }
        this.updateProgress(100, '完了');
        const progressContainer = document.getElementById('webAdvisorProgressContainer');
        if (progressContainer) {
          progressContainer.style.display = 'none';
        }
        alert('分析がタイムアウトしました。取得できた範囲で結果を表示しています。');
      }
    }, 180000); // 180秒

    const isVercel = window.location.hostname.includes('vercel.app');
    const base = isVercel ? '' : 'http://127.0.0.1:3333';

    console.log('[WebAdvisor-fetchAnalysis] Base URL:', base);
    console.log('[WebAdvisor-fetchAnalysis] Target URL:', this.currentUrl);

    // まずセッション発行（キーやモデル等を安全に送る）
    let sessionToken = '';
    try {
      const payload = {
        userApiKey: this.getUserApiKey?.() || '',
        provider: this.getUserApiProvider?.() || '',
        baseUrl: this.getUserApiBaseUrl?.() || '',
        model: this.getUserApiModel?.() || '',
      };
      console.log('[WebAdvisor-fetchAnalysis] Sending session payload:', {
        hasUserApiKey: !!payload.userApiKey,
        provider: payload.provider,
        model: payload.model,
      });
      const resp = await fetch(`${base}/api/web-advisor/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) {
        const js = await resp.json();
        sessionToken = js.sessionToken || '';
        console.log('[WebAdvisor-fetchAnalysis] Session created:', sessionToken ? 'YES' : 'NO');
      } else {
        console.log('[WebAdvisor-fetchAnalysis] Session endpoint failed:', resp.status);
      }
    } catch (err) {
      console.log('[WebAdvisor-fetchAnalysis] Session creation error:', err.message);
      // セッションが作れない場合でもSSEは続行（envキーのみで解析可能）
    }

    const params = new URLSearchParams({ url: this.currentUrl });
    if (sessionToken) params.set('sessionToken', sessionToken);

    const url = `${base}/api/web-advisor?${params.toString()}`;
    console.log('[WebAdvisor-fetchAnalysis] SSE URL:', url);

    try {
      // 既存のマークダウン要素を使用（HTML上書きしない）
      const md = document.getElementById('webAdvisorMarkdown');
      if (!md) {
        throw new Error('マークダウン要素が見つかりません');
      }

      let full = '';
      let tokenCount = 0;
      let firstTokenReceived = false;

      const es = new EventSource(url);
      this.eventSource = es;
      console.log('[WebAdvisor-fetchAnalysis] EventSource created');

      // 初期プログレスを表示
      this.updateProgress(0, '初期化中...');

      es.onmessage = e => {
        console.log('[WebAdvisor-SSE-onmessage] Event:', e.data?.substring(0, 100));
        if (!e.data) return;
        try {
          const data = JSON.parse(e.data);
          console.log('[WebAdvisor-SSE-onmessage] Type:', data.type);
          switch (data.type) {
            case 'init':
              this.updateProgress(5, data.message || '初期化中...');
              break;
            case 'progress':
              // stage に応じてプログレスを更新
              if (data.stage === 'fetching') {
                this.updateProgress(15, data.message || 'ページを取得中...');
              } else if (data.stage === 'parsing') {
                this.updateProgress(45, data.message || 'ページを解析中...');
              } else if (data.stage === 'analyzing') {
                this.updateProgress(70, data.message || 'AI分析中...');
              }
              break;
            case 'meta':
              // メタデータを保存してパネルを更新
              this.currentMetadata = data.data;
              this.updateMetadataPanel();
              break;
            case 'token':
              full += data.content || '';
              tokenCount++;

              // 初回トークン受信時、スケルトンローダーを非表示
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                const skeletonLoader = document.getElementById('webAdvisorSkeletonLoader');
                if (skeletonLoader) {
                  skeletonLoader.style.display = 'none';
                }
              }

              // トークン受信に応じてプログレスを更新（70% -> 99%）
              const tokenProgress = 70 + Math.min(tokenCount * 0.5, 29);
              this.updateProgress(tokenProgress, `分析中...${tokenCount}トークン`);
              md.innerHTML = this.renderMarkdown(full);
              break;
            case 'usage':
              // usage情報を保存して表示
              console.log('[WebAdvisor] Received usage:', data.data);
              this.currentUsage = data.data;
              this.currentModel = data.model || 'gpt-5-nano';
              this.displayUsage();
              this.showExportButtons();
              this.currentAnalysisContent = full;
              this.initChatBox();
              break;
            case 'done':
              console.log('[WebAdvisor-SSE-onmessage] Analysis complete');
              this.updateProgress(100, '完了');
              // プログレスバーを非表示（スケルトンローダーは初回トークン時に既に非表示）
              const doneProgressContainer = document.getElementById('webAdvisorProgressContainer');
              if (doneProgressContainer) doneProgressContainer.style.display = 'none';
              this.isStreaming = false;
              this.recordUsage();
              setAnalysisInactive('web-advisor'); // グローバル状態をクリア
              es.close();
              break;
            case 'error':
              console.log('[WebAdvisor-SSE-onmessage] Error:', data.message);
              // プログレスバーとスケルトンローダーを非表示
              const errProgressContainer = document.getElementById('webAdvisorProgressContainer');
              const errSkeletonLoader = document.getElementById('webAdvisorSkeletonLoader');
              if (errProgressContainer) errProgressContainer.style.display = 'none';
              if (errSkeletonLoader) errSkeletonLoader.style.display = 'none';
              this.isStreaming = false;
              setAnalysisInactive('web-advisor'); // グローバル状態をクリア
              md.innerHTML = `<div class="advisor-error"><p>${this.escapeHtml(data.message || '分析に失敗しました')}</p></div>`;
              es.close();
              break;
            default:
              console.log('[WebAdvisor-SSE-onmessage] Ignored type:', data.type);
              break;
          }
        } catch (err) {
          console.log('[WebAdvisor-SSE-onmessage] Parse error:', err.message);
          // 無視
        }
      };

      es.onerror = () => {
        console.log('[WebAdvisor-SSE-onerror] Connection error, isStreaming:', this.isStreaming);
        if (this.isStreaming) {
          // プログレスバーとスケルトンローダーを非表示
          const errorProgressContainer = document.getElementById('webAdvisorProgressContainer');
          const errorSkeletonLoader = document.getElementById('webAdvisorSkeletonLoader');
          if (errorProgressContainer) errorProgressContainer.style.display = 'none';
          if (errorSkeletonLoader) errorSkeletonLoader.style.display = 'none';
          this.isStreaming = false;
          setAnalysisInactive('web-advisor'); // グローバル状態をクリア
          md.innerHTML = '<div class="advisor-error"><p>接続に失敗しました</p></div>';
        }
        es.close();
      };
    } catch (err) {
      console.log('[WebAdvisor-fetchAnalysis] Error:', err.message);
      // プログレスバーとスケルトンローダーを非表示
      const catchProgressContainer = document.getElementById('webAdvisorProgressContainer');
      const catchSkeletonLoader = document.getElementById('webAdvisorSkeletonLoader');
      if (catchProgressContainer) catchProgressContainer.style.display = 'none';
      if (catchSkeletonLoader) catchSkeletonLoader.style.display = 'none';
      this.isStreaming = false;
      setAnalysisInactive('web-advisor'); // グローバル状態をクリア
      const md = document.getElementById('webAdvisorMarkdown');
      if (md) {
        md.innerHTML = `<div class="advisor-error"><p>${this.escapeHtml(err.message || '分析開始に失敗しました')}</p></div>`;
      }
    } finally {
      // タイムアウトタイマーをクリア
      clearTimeout(timeoutId);
    }
  }

  /** 結果ビューを閉じる */
  closeResultView() {
    this.isStreaming = false;
    if (this.eventSource) {
      try {
        this.eventSource.close();
      } catch (_) {}
      this.eventSource = null;
    }

    // グローバルな分析状態をクリア
    setAnalysisInactive('web-advisor');
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

  /**
   * アコーディオンの開閉を切り替え
   */
  toggleAccordion(section) {
    const contentId = section === 'metadata' ? 'webAdvisorMetadata' : 'webAdvisorContent';
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
   * API使用量を表示
   */
  displayUsage() {
    if (!this.currentUsage) {
      console.log('[WebAdvisor] No usage data to display');
      return;
    }

    console.log('[WebAdvisor] Displaying usage:', this.currentUsage);

    // モデル名を取得
    const model = this.currentModel || 'gpt-5-nano';

    // BaseAdvisorManagerの共通メソッドを使用してHTML生成
    const usageHtml = this.renderApiUsagePanel(this.currentUsage, model);

    // 分析結果コンテンツの末尾に追加
    const content = document.getElementById('webAdvisorContent');
    if (content) {
      const markdownDiv = content.querySelector('.advisor-markdown');
      if (markdownDiv) {
        const container = document.createElement('div');
        container.innerHTML = usageHtml;
        markdownDiv.appendChild(container);
      }
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
   * エクスポートボタンを表示
   */
  showExportButtons() {
    const exportContainer = document.getElementById('webAdvisorExportButtons');
    if (!exportContainer) return;

    this.showExportButtonsCommon(
      'webAdvisorExportButtons',
      () => this.exportToCSV(),
      () => this.exportToPDF()
    );
  }

  /**
   * CSV形式でエクスポート（整形済みで見やすい形式）
   */
  exportToCSV() {
    try {
      const timestamp = new Date().toISOString().split('T')[0];

      const metadataContent = document.getElementById('webAdvisorMetadata');
      const analysisContent = document.querySelector('.advisor-markdown');

      // メタデータ抽出（HTMLタグ除去）
      const metadataText = metadataContent
        ? this.cleanHtmlText(metadataContent.innerText)
        : '情報なし';
      const analysisText = analysisContent ? analysisContent.innerText : '情報なし';

      // CSVを項目,値の形式で整形（BOM付きUTF-8対応）
      const csvLines = [];

      // ヘッダー行
      csvLines.push('項目,値');

      // メタデータ
      csvLines.push(`エクスポート日時,${new Date().toLocaleString('ja-JP')}`);
      csvLines.push(`使用モデル,${this.currentModel}`);
      csvLines.push(`入力トークン数,${this.currentUsage.prompt_tokens}`);
      csvLines.push(`出力トークン数,${this.currentUsage.completion_tokens}`);

      // ページ情報（セクションヘッダー）
      csvLines.push('ページ情報,');
      const metadataLines = metadataText.split('\n').filter(line => line.trim().length > 0);
      metadataLines.forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`));

      // AI分析結果
      csvLines.push('AI分析結果,');
      const analysisLines = analysisText.split('\n').filter(line => line.trim().length > 0);
      analysisLines.forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`));

      // BOM付きUTF-8でエンコード（Excelで正常に表示される）
      const csvContent = '\ufeff' + csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `web_analysis_${timestamp}.csv`;

      this.downloadFile(blob, filename);
      console.log('[WebAdvisor] CSV export successful:', filename);
    } catch (error) {
      console.error('[WebAdvisor] CSV export failed:', error);
      alert('CSVエクスポートに失敗しました。');
    }
  }

  /**
   * HTMLファイルでエクスポート（ブラウザで印刷→PDFで保存）
   * 注：実装上HTMLファイルがダウンロードされます。
   *     ブラウザで開き、「印刷」→「PDFとして保存」でPDF化してください。
   */
  exportToPDF() {
    try {
      const timestamp = new Date().toLocaleString('ja-JP');

      const metadataContent = document.getElementById('webAdvisorMetadata');
      const analysisContent = document.querySelector('.advisor-markdown');

      const metadataText = metadataContent ? metadataContent.innerText : '情報なし';
      const analysisText = analysisContent ? analysisContent.innerText : '情報なし';

      // HTML形式のPDF（ブラウザで印刷→PDFで保存）
      const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Webページ分析結果エクスポート</title>
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
  <h1>Webページ分析結果エクスポート</h1>

  <div class="metadata">
    <p><strong>エクスポート日時:</strong> ${timestamp}</p>
    <p><strong>使用モデル:</strong> ${this.currentModel}</p>
    <p><strong>トークン使用数:</strong> 入力 ${this.currentUsage.prompt_tokens}、出力 ${this.currentUsage.completion_tokens}</p>
  </div>

  <div class="section">
    <h2>対象ページ情報</h2>
    <div class="content">${this.escapeHtml(metadataText)}</div>
  </div>

  <div class="section">
    <h2>AI分析結果</h2>
    <div class="content">${this.escapeHtml(analysisText)}</div>
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
      const filename = `web_analysis_${dateStr}.html`;

      this.downloadFile(blob, filename);
      console.log('[WebAdvisor] PDF export successful (HTML形式):', filename);
    } catch (error) {
      console.error('[WebAdvisor] PDF export failed:', error);
      alert('PDFエクスポートに失敗しました。');
    }
  }

  /**
   * チャットボックスを初期化
   */
  initChatBox() {
    const chatConfig = {
      type: 'web-advisor',
      context: {
        url: this.currentUrl,
        metadata: this.currentMetadata,
        analysis: this.currentAnalysisContent || '',
      },
      chatMessagesId: 'webAdvisorChatMessages',
      chatInputId: 'webAdvisorChatInput',
      chatSendBtnId: 'webAdvisorChatSendBtn',
    };

    this.renderChatBoxCommon('webAdvisorChatContainer', chatConfig);
  }
}

// グローバルインスタンスを作成
const webAdvisorManager = new WebAdvisorManager();
