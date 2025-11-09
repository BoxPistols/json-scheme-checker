// Content Upload Reviewer Module
// ファイル/テキストアップロード型のレビュー機能

class ContentUploadReviewerManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_content_upload_reviewer_usage',
      USER_API_KEY: 'jsonld_content_upload_reviewer_openai_key',
      USAGE_TOTAL_KEY: 'jsonld_usage_content_upload_reviewer_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
      MAX_REQUESTS_PER_DAY: 50,
      elemIdPrefix: 'contentUploadReviewer',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'content-upload-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'content-upload-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'content-upload-save-developer-key': () => this.saveDeveloperKey(),
        'content-upload-test-developer-connection': () => this.testDeveloperConnection(),
        'content-upload-reset-developer-settings': () => this.resetDeveloperSettings(),
        'content-upload-show-developer-prompt': () => this.showDeveloperPrompt(),
        'content-upload-reset-to-free-mode': () => this.resetToFreeMode(),
        'content-upload-close-confirm-dialog': () => this.closeConfirmDialog(),
        'content-upload-start-review': () => this.startReview(),
        'content-upload-close-review-view': () => this.closeReviewView(),
        'content-upload-show-upload-modal': () => this.showUploadModal(),
        'content-upload-file-select': () => this.handleFileSelect(),
        'content-upload-submit': () => this.submitForReview(),
        'content-upload-copy-revised': () => this.copyRevisedText(),
        'content-upload-download-revised': () => this.downloadRevisedText(),
      },
      actions: {
        closeDeveloperPrompt: 'content-upload-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'content-upload-toggle-developer-key-visibility',
        saveDeveloperKey: 'content-upload-save-developer-key',
        testDeveloperConnection: 'content-upload-test-developer-connection',
        resetDeveloperSettings: 'content-upload-reset-developer-settings',
      },
    };
    super(config);

    this.currentContent = null;
    this.currentReviewType = 'blog'; // デフォルトはブログレビュー
    this.isStreaming = false;
    this.currentUsage = null;
    this.model = this.getSelectedModel();
    this.revisedText = '';
    this.uploadedFile = null;
  }

  /**
   * 現在選択されているモデルを取得
   * @returns {string} モデル名
   */
  getSelectedModel() {
    return (
      localStorage.getItem('jsonld_content_upload_reviewer_model') ||
      window.ADVISOR_CONST.DEFAULT_MODEL
    );
  }

  /**
   * モデルを選択して保存
   * @param {string} model - 選択されたモデル名
   */
  setSelectedModel(model) {
    this.model = model;
    localStorage.setItem('jsonld_content_upload_reviewer_model', model);
    console.log(`[ContentUploadReviewer] Model set to: ${model}`);
  }

  /**
   * アップロードモーダルを表示
   */
  showUploadModal() {
    const existingModal = document.getElementById('contentUploadModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = this.createUploadModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    // Escapeキーでモーダルを閉じる
    this.addEscapeKeyListener(modal, this.closeUploadModal);

    // モーダル外クリックで閉じる
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeUploadModal();
      }
    });

    console.log('[ContentUploadReviewer] Upload modal shown');
  }

  /**
   * アップロードモーダルのDOM要素を作成
   * @returns {HTMLElement} モーダル要素
   */
  createUploadModal() {
    const overlay = document.createElement('div');
    overlay.id = 'contentUploadModal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    overlay.innerHTML = `
      <div class="modal-container modal-container--wide">
        <div class="modal-header">
          <h2>コンテンツアップロード & レビュー</h2>
          <button class="btn-modal-close" onclick="window.contentUploadReviewerManager.closeUploadModal()">×</button>
        </div>
        <div class="modal-body">
          <section class="modal-section">
            <h3 class="modal-section-title">レビュー種類を選択</h3>
            <div class="review-type-selector">
              <label class="review-type-option">
                <input type="radio" name="reviewType" value="blog" checked>
                <span>ブログコンテンツ</span>
              </label>
              <label class="review-type-option">
                <input type="radio" name="reviewType" value="job">
                <span>求人票</span>
              </label>
              <label class="review-type-option">
                <input type="radio" name="reviewType" value="skill-sheet">
                <span>スキルシート</span>
              </label>
              <label class="review-type-option">
                <input type="radio" name="reviewType" value="matching">
                <span>求人×スキルシートマッチング</span>
              </label>
              <label class="review-type-option">
                <input type="radio" name="reviewType" value="general">
                <span>汎用テキスト</span>
              </label>
            </div>
          </section>

          <section class="modal-section">
            <h3 class="modal-section-title">コンテンツ入力方法</h3>
            <div class="content-input-tabs">
              <button class="content-input-tab active" data-tab="text">テキスト入力</button>
              <button class="content-input-tab" data-tab="file">ファイルアップロード</button>
            </div>

            <div class="content-input-panel" id="textInputPanel">
              <textarea
                id="contentTextArea"
                placeholder="レビュー対象のテキストを貼り付けてください..."
                rows="15"
                class="content-text-area"
              ></textarea>
              <div class="text-count" id="textCount">0 文字</div>
            </div>

            <div class="content-input-panel" id="fileInputPanel" style="display: none;">
              <div class="file-upload-area" id="fileUploadArea">
                <input
                  type="file"
                  id="fileInput"
                  accept=".pdf,.csv,.xlsx,.xls,.md,.markdown,.json,.txt"
                  style="display: none;"
                  data-action="content-upload-file-select"
                >
                <div class="file-upload-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <p>クリックしてファイルを選択、またはドラッグ&ドロップ</p>
                  <p class="file-format-hint">対応形式: PDF, CSV, Excel, Markdown, JSON, TXT</p>
                </div>
                <div class="file-info" id="fileInfo" style="display: none;">
                  <div class="file-name" id="fileName"></div>
                  <div class="file-meta" id="fileMeta"></div>
                  <button class="btn-remove-file" onclick="window.contentUploadReviewerManager.removeFile()">削除</button>
                </div>
              </div>
            </div>

            <div class="matching-mode-fields" id="matchingFields" style="display: none;">
              <h4>マッチング分析用（2つのコンテンツが必要）</h4>
              <div class="matching-inputs">
                <div class="matching-input-group">
                  <label>求人票URL または テキスト</label>
                  <input type="url" id="jobUrlInput" placeholder="求人票のURL" class="matching-url-input">
                  <span class="matching-separator">または</span>
                  <textarea id="jobTextInput" placeholder="求人票のテキストを貼り付け" rows="5" class="matching-text-input"></textarea>
                </div>
                <div class="matching-input-group">
                  <label>スキルシート（上記で入力済み）</label>
                  <p class="matching-hint">スキルシートは「テキスト入力」または「ファイルアップロード」で入力してください</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="window.contentUploadReviewerManager.closeUploadModal()">
            キャンセル
          </button>
          <button class="btn-primary" data-action="content-upload-submit">
            レビュー開始
          </button>
        </div>
      </div>
    `;

    // タブ切り替えのイベントリスナー
    const tabs = overlay.querySelectorAll('.content-input-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', e => {
        const targetTab = e.target.dataset.tab;
        this.switchInputTab(targetTab);
      });
    });

    // テキストエリアの文字カウント
    const textArea = overlay.querySelector('#contentTextArea');
    textArea.addEventListener('input', e => {
      const count = e.target.value.length;
      overlay.querySelector('#textCount').textContent = `${count.toLocaleString()} 文字`;
    });

    // レビュー種類の変更
    const reviewTypeInputs = overlay.querySelectorAll('input[name="reviewType"]');
    reviewTypeInputs.forEach(input => {
      input.addEventListener('change', e => {
        this.currentReviewType = e.target.value;
        this.toggleMatchingFields(e.target.value === 'matching');
      });
    });

    // ファイルアップロードエリアのクリックイベント
    const uploadArea = overlay.querySelector('#fileUploadArea');
    uploadArea.addEventListener('click', () => {
      overlay.querySelector('#fileInput').click();
    });

    // ドラッグ&ドロップイベント
    uploadArea.addEventListener('dragover', e => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', e => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFileUpload(files[0]);
      }
    });

    return overlay;
  }

  /**
   * 入力タブを切り替え
   * @param {string} tabName - タブ名（text/file）
   */
  switchInputTab(tabName) {
    const tabs = document.querySelectorAll('.content-input-tab');
    const panels = {
      text: document.getElementById('textInputPanel'),
      file: document.getElementById('fileInputPanel'),
    };

    tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    Object.keys(panels).forEach(key => {
      if (key === tabName) {
        panels[key].style.display = 'block';
      } else {
        panels[key].style.display = 'none';
      }
    });
  }

  /**
   * マッチングフィールドの表示/非表示を切り替え
   * @param {boolean} show - 表示するかどうか
   */
  toggleMatchingFields(show) {
    const matchingFields = document.getElementById('matchingFields');
    if (matchingFields) {
      matchingFields.style.display = show ? 'block' : 'none';
    }
  }

  /**
   * ファイル選択ハンドラー
   */
  handleFileSelect() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files.length > 0) {
      this.handleFileUpload(fileInput.files[0]);
    }
  }

  /**
   * ファイルアップロード処理
   * @param {File} file - アップロードされたファイル
   */
  async handleFileUpload(file) {
    try {
      console.log('[ContentUploadReviewer] File uploaded:', file.name);

      // ファイル形式チェック
      if (!FileParser.isSupportedFile(file.name)) {
        throw new Error(
          `対応していないファイル形式です。対応形式: ${FileParser.getSupportedExtensions().join(', ')}`
        );
      }

      // ファイルをパース
      const { text, metadata } = await FileParser.parseFile(file);

      this.uploadedFile = file;
      this.currentContent = text;

      // UI更新
      this.updateFileInfo(metadata);

      console.log('[ContentUploadReviewer] File parsed successfully. Text length:', text.length);
    } catch (error) {
      console.error('[ContentUploadReviewer] File upload error:', error);
      this.showError(`ファイルの読み込みに失敗しました: ${error.message}`);
    }
  }

  /**
   * ファイル情報UIを更新
   * @param {object} metadata - ファイルのメタデータ
   */
  updateFileInfo(metadata) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileMeta = document.getElementById('fileMeta');
    const placeholder = document.querySelector('.file-upload-placeholder');

    if (fileInfo && fileName && fileMeta && placeholder) {
      fileName.textContent = metadata.filename;
      fileMeta.textContent = `${FileParser.getFileTypeDisplayName(metadata.extension)} | ${(metadata.size / 1024).toFixed(2)} KB`;

      placeholder.style.display = 'none';
      fileInfo.style.display = 'block';
    }
  }

  /**
   * アップロードされたファイルを削除
   */
  removeFile() {
    this.uploadedFile = null;
    this.currentContent = null;

    const fileInfo = document.getElementById('fileInfo');
    const placeholder = document.querySelector('.file-upload-placeholder');
    const fileInput = document.getElementById('fileInput');

    if (fileInfo && placeholder) {
      fileInfo.style.display = 'none';
      placeholder.style.display = 'block';
    }

    if (fileInput) {
      fileInput.value = '';
    }

    console.log('[ContentUploadReviewer] File removed');
  }

  /**
   * レビュー送信処理
   */
  async submitForReview() {
    try {
      // 入力内容を取得
      const textArea = document.getElementById('contentTextArea');
      const activeTab = document.querySelector('.content-input-tab.active');
      let content = '';

      if (activeTab && activeTab.dataset.tab === 'text') {
        content = textArea ? textArea.value.trim() : '';
      } else {
        content = this.currentContent || '';
      }

      if (!content) {
        this.showError('レビュー対象のコンテンツを入力してください');
        return;
      }

      // マッチングモードの場合、求人票も取得
      let jobContent = '';
      if (this.currentReviewType === 'matching') {
        const jobUrlInput = document.getElementById('jobUrlInput');
        const jobTextInput = document.getElementById('jobTextInput');

        if (jobUrlInput && jobUrlInput.value.trim()) {
          // URLから求人票を取得
          jobContent = await this.fetchJobFromUrl(jobUrlInput.value.trim());
        } else if (jobTextInput && jobTextInput.value.trim()) {
          jobContent = jobTextInput.value.trim();
        }

        if (!jobContent) {
          this.showError('マッチング分析には求人票の入力が必要です');
          return;
        }
      }

      // レート制限チェック
      const rateLimit = this.checkRateLimit();
      if (!rateLimit.allowed) {
        this.showError(
          `レート制限に達しました。リセット時刻: ${rateLimit.resetTime.toLocaleString('ja-JP')}`
        );
        return;
      }

      // モーダルを閉じる
      this.closeUploadModal();

      // レビュー画面を表示
      this.showReviewView(content, jobContent);

      // API呼び出し
      await this.callReviewAPI(content, jobContent);

      // レート制限を記録
      this.recordUsage();
    } catch (error) {
      console.error('[ContentUploadReviewer] Submit error:', error);
      this.showError(`レビューの開始に失敗しました: ${error.message}`);
    }
  }

  /**
   * URLから求人票を取得
   * @param {string} url - 求人票URL
   * @returns {Promise<string>} 求人票のテキスト
   */
  async fetchJobFromUrl(url) {
    try {
      // プロキシ経由でHTMLを取得
      const proxyUrl = this.getProxyUrl(url);
      const response = await fetch(proxyUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();

      // JSON-LDからJobPostingを抽出
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');

      let jobPosting = null;

      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'JobPosting' || data['@type']?.includes('JobPosting')) {
            jobPosting = data;
            break;
          }
        } catch (e) {
          console.warn('[ContentUploadReviewer] JSON-LD parse error:', e);
        }
      }

      if (jobPosting) {
        // JSON-LDから求人票テキストを生成
        return this.formatJobPostingText(jobPosting);
      } else {
        // JSON-LDがない場合、HTMLから主要テキストを抽出
        const bodyText = doc.body?.textContent || '';
        return `URL: ${url}\n\n${bodyText.trim().substring(0, 5000)}`;
      }
    } catch (error) {
      console.error('[ContentUploadReviewer] fetchJobFromUrl error:', error);
      throw new Error(`求人票の取得に失敗しました: ${error.message}`);
    }
  }

  /**
   * プロキシURLを取得
   * @param {string} targetUrl - 対象URL
   * @returns {string} プロキシURL
   */
  getProxyUrl(targetUrl) {
    const isVercel = window.location.hostname.includes('vercel.app');
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    const proxyBase = isVercel
      ? '/proxy'
      : isLocalhost
        ? 'http://localhost:3333/proxy'
        : `http://${window.location.hostname}:3333/proxy`;

    return `${proxyBase}?url=${encodeURIComponent(targetUrl)}`;
  }

  /**
   * JobPosting JSON-LDをテキスト形式にフォーマット
   * @param {object} jobPosting - JobPosting JSON-LD
   * @returns {string} フォーマット済みテキスト
   */
  formatJobPostingText(jobPosting) {
    const lines = [];

    if (jobPosting.title) lines.push(`職種: ${jobPosting.title}`);
    if (jobPosting.description) lines.push(`\n職務内容:\n${jobPosting.description}`);
    if (jobPosting.employmentType) lines.push(`\n雇用形態: ${jobPosting.employmentType}`);

    if (jobPosting.baseSalary) {
      const salary =
        typeof jobPosting.baseSalary === 'object'
          ? JSON.stringify(jobPosting.baseSalary)
          : jobPosting.baseSalary;
      lines.push(`\n給与: ${salary}`);
    }

    if (jobPosting.skills) {
      lines.push(`\nスキル要件: ${jobPosting.skills}`);
    }

    if (jobPosting.qualifications) {
      lines.push(`\n応募資格: ${jobPosting.qualifications}`);
    }

    if (jobPosting.responsibilities) {
      lines.push(`\n業務内容: ${jobPosting.responsibilities}`);
    }

    return lines.join('\n');
  }

  /**
   * アップロードモーダルを閉じる
   */
  closeUploadModal() {
    const modal = document.getElementById('contentUploadModal');
    if (modal) {
      modal.remove();
    }
    console.log('[ContentUploadReviewer] Upload modal closed');
  }

  /**
   * レビュー画面を表示
   * @param {string} content - レビュー対象コンテンツ
   * @param {string} jobContent - 求人票（マッチングモードの場合）
   */
  showReviewView(content, jobContent = '') {
    const existingView = document.getElementById('contentUploadReviewView');
    if (existingView) {
      existingView.remove();
    }

    const reviewView = this.createReviewView(content, jobContent);
    document.body.appendChild(reviewView);
    reviewView.style.display = 'flex';

    console.log('[ContentUploadReviewer] Review view shown');
  }

  /**
   * レビュー画面のDOM要素を作成
   * @param {string} content - レビュー対象コンテンツ
   * @param {string} jobContent - 求人票（マッチングモードの場合）
   * @returns {HTMLElement} レビュー画面要素
   */
  createReviewView(content, jobContent) {
    const overlay = document.createElement('div');
    overlay.id = 'contentUploadReviewView';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    const reviewTypeLabel = this.getReviewTypeLabel(this.currentReviewType);

    overlay.innerHTML = `
      <div class="modal-container modal-container--fullscreen">
        <div class="modal-header modal-header--sticky">
          <h2>${reviewTypeLabel}レビュー結果</h2>
          <button class="btn-modal-close" data-action="content-upload-close-review-view">×</button>
        </div>
        <div class="modal-body">
          <div class="review-result-container">
            <div class="review-status" id="reviewStatus">
              <div class="spinner"></div>
              <p>AIがレビューを実行中...</p>
            </div>

            <div class="review-diff-container" id="reviewDiffContainer" style="display: none;">
              <div class="diff-panel">
                <div class="diff-header">
                  <h3>元のコンテンツ</h3>
                </div>
                <div class="diff-content" id="originalContent">
                  ${this.escapeHtml(content)}
                </div>
              </div>

              <div class="diff-panel">
                <div class="diff-header">
                  <h3>校閲済みコンテンツ</h3>
                  <div class="diff-actions">
                    <button class="btn-secondary btn-sm" data-action="content-upload-copy-revised">コピー</button>
                    <button class="btn-secondary btn-sm" data-action="content-upload-download-revised">ダウンロード</button>
                  </div>
                </div>
                <div class="diff-content" id="revisedContent">
                  <!-- AIによる校閲結果がここに表示される -->
                </div>
              </div>
            </div>

            <div class="review-analysis" id="reviewAnalysis" style="display: none;">
              <h3>分析結果</h3>
              <div id="analysisContent"></div>
            </div>

            <div class="review-usage-panel" id="reviewUsagePanel" style="display: none;"></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" data-action="content-upload-close-review-view">閉じる</button>
        </div>
      </div>
    `;

    return overlay;
  }

  /**
   * レビュー種類のラベルを取得
   * @param {string} reviewType - レビュー種類
   * @returns {string} ラベル
   */
  getReviewTypeLabel(reviewType) {
    const labels = {
      blog: 'ブログコンテンツ',
      job: '求人票',
      'skill-sheet': 'スキルシート',
      matching: '求人×スキルシートマッチング',
      general: '汎用テキスト',
    };
    return labels[reviewType] || '汎用';
  }

  /**
   * レビュー画面を閉じる
   */
  closeReviewView() {
    const view = document.getElementById('contentUploadReviewView');
    if (view) {
      view.remove();
    }
    console.log('[ContentUploadReviewer] Review view closed');
  }

  /**
   * レビューAPIを呼び出し
   * @param {string} content - レビュー対象コンテンツ
   * @param {string} jobContent - 求人票（マッチングモードの場合）
   */
  async callReviewAPI(content, jobContent = '') {
    console.log('[ContentUploadReviewer] Calling review API...');
    console.log('Content length:', content.length);
    console.log('Review type:', this.currentReviewType);

    // 分析実行状態をチェック
    if (!canStartAnalysis('content-upload-reviewer')) {
      this.showError('他の分析が実行中です。完了してから再度お試しください。');
      this.closeReviewView();
      return;
    }

    // AbortControllerを作成
    const controller = new AbortController();
    window.ANALYSIS_STATE.abortControllers['content-upload-reviewer'] = controller;

    setAnalysisActive('content-upload-reviewer');
    this.isStreaming = true;

    try {
      const apiUrl = this.getApiUrl();
      const userApiKey = this.getUserApiKey();
      const baseUrl = this.getUserApiBaseUrl();

      const requestBody = {
        content,
        reviewType: this.currentReviewType,
        userApiKey,
        baseUrl,
        model: this.model,
      };

      // マッチングモードの場合、求人票も送信
      if (this.currentReviewType === 'matching' && jobContent) {
        requestBody.jobContent = jobContent;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // ストリーミングレスポンスを処理
      await this.processStreamingResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('[ContentUploadReviewer] Review aborted by user');
        this.showError('レビューがキャンセルされました');
      } else {
        console.error('[ContentUploadReviewer] API error:', error);
        this.showError(`レビューに失敗しました: ${error.message}`);
      }
      this.closeReviewView();
    } finally {
      setAnalysisInactive('content-upload-reviewer');
      this.isStreaming = false;
      delete window.ANALYSIS_STATE.abortControllers['content-upload-reviewer'];
    }
  }

  /**
   * APIのURLを取得
   * @returns {string} API URL
   */
  getApiUrl() {
    const isVercel = window.location.hostname.includes('vercel.app');
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

    if (isVercel) {
      return '/api/content-upload-reviewer';
    } else if (isLocalhost) {
      return 'http://localhost:3333/api/content-upload-reviewer';
    } else {
      return `http://${window.location.hostname}:3333/api/content-upload-reviewer`;
    }
  }

  /**
   * ストリーミングレスポンスを処理
   * @param {Response} response - Fetchレスポンス
   */
  async processStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let receivedModel = null;

    const statusEl = document.getElementById('reviewStatus');
    const diffContainer = document.getElementById('reviewDiffContainer');
    const analysisEl = document.getElementById('reviewAnalysis');
    const analysisContent = document.getElementById('analysisContent');
    const revisedContent = document.getElementById('revisedContent');

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('[ContentUploadReviewer] Stream complete');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          if (data === '[DONE]') {
            console.log('[ContentUploadReviewer] Stream finished');
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.model) {
              receivedModel = parsed.model;
              console.log('[ContentUploadReviewer] Using model:', receivedModel);
            }

            if (parsed.content) {
              fullText += parsed.content;

              // 初回コンテンツ受信時にUIを更新
              if (statusEl && statusEl.style.display !== 'none') {
                statusEl.style.display = 'none';
                if (diffContainer) diffContainer.style.display = 'grid';
                if (analysisEl) analysisEl.style.display = 'block';
              }

              // リアルタイムで全体を表示（ストリーム中）
              if (analysisContent) {
                analysisContent.innerHTML = this.renderMarkdownCommon(fullText);
              }
            }

            if (parsed.usage) {
              this.currentUsage = parsed.usage;
              this.displayUsageInfo(parsed.usage, receivedModel);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error('[ContentUploadReviewer] JSON parse error:', e);
          }
        }
      }
    }

    // ストリーム完了後、校閲済みテキストと分析結果を分離
    const { revisedText, analysisText } = this.parseReviewResponse(fullText);

    // 校閲済みテキストを保存して表示
    this.revisedText = revisedText;
    if (revisedContent && revisedText) {
      revisedContent.innerHTML = this.renderMarkdownCommon(revisedText);
    }

    // 分析結果を表示
    if (analysisContent && analysisText) {
      analysisContent.innerHTML = this.renderMarkdownCommon(analysisText);
    }
  }

  /**
   * AIレスポンスから校閲済みテキストと分析結果を分離
   * @param {string} fullText - AI応答全体
   * @returns {{revisedText: string, analysisText: string}}
   */
  parseReviewResponse(fullText) {
    // 「## 校閲済みテキスト」セクションを探す
    const revisedSectionPattern = /##\s*校閲済みテキスト\s*\n([\s\S]*?)(?=\n##\s|\n---\s|$)/i;
    const match = fullText.match(revisedSectionPattern);

    let revisedText = '';
    let analysisText = fullText;

    if (match && match[1]) {
      // 校閲済みテキストを抽出
      revisedText = match[1].trim();

      // 分析結果から校閲済みテキストセクションを除外
      analysisText = fullText.replace(revisedSectionPattern, '').trim();
    }

    return { revisedText, analysisText };
  }

  /**
   * 使用量情報を表示
   * @param {object} usage - 使用量データ
   * @param {string} model - 使用されたモデル
   */
  displayUsageInfo(usage, model) {
    const usagePanel = document.getElementById('reviewUsagePanel');
    if (!usagePanel) return;

    usagePanel.innerHTML = this.renderApiUsagePanel(usage, model);
    usagePanel.style.display = 'block';

    console.log('[ContentUploadReviewer] Usage info displayed:', usage);
  }

  /**
   * 校閲済みテキストをコピー
   */
  copyRevisedText() {
    if (!this.revisedText) {
      this.showError('校閲済みテキストがありません');
      return;
    }

    navigator.clipboard
      .writeText(this.revisedText)
      .then(() => {
        this.showSnackbar('校閲済みテキストをコピーしました');
      })
      .catch(err => {
        console.error('[ContentUploadReviewer] Copy error:', err);
        this.showError('コピーに失敗しました');
      });
  }

  /**
   * 校閲済みテキストをダウンロード
   */
  downloadRevisedText() {
    if (!this.revisedText) {
      this.showError('校閲済みテキストがありません');
      return;
    }

    const blob = new Blob([this.revisedText], { type: 'text/plain;charset=utf-8' });
    const filename = `校閲済み_${new Date().toISOString().slice(0, 10)}.txt`;
    this.downloadFile(blob, filename);
  }

  /**
   * エラーメッセージを表示
   * @param {string} message - エラーメッセージ
   */
  showError(message) {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message;
      snackbar.className = 'snackbar show error';
      setTimeout(() => {
        snackbar.className = 'snackbar';
      }, 3000);
    }
  }

  /**
   * スナックバーを表示
   * @param {string} message - メッセージ
   */
  showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message;
      snackbar.className = 'snackbar show';
      setTimeout(() => {
        snackbar.className = 'snackbar';
      }, 3000);
    }
  }
}

// グローバルに公開
window.ContentUploadReviewerManager = ContentUploadReviewerManager;
window.contentUploadReviewerManager = new ContentUploadReviewerManager();
