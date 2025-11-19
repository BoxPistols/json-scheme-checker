// Content Upload Reviewer Module
import { FileUpload } from '../components/form/FileUpload.js';
import { Tabs } from '../components/common/Tabs.js';
import { RadioGroup } from '../components/form/RadioGroup.js';
import { Preview } from '../components/common/Preview.js';
const BaseAdvisorManager = window.BaseAdvisorManager || globalThis.BaseAdvisorManager;
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

  getSelectedModel() {
    return (
      localStorage.getItem('jsonld_content_upload_reviewer_model') ||
      window.ADVISOR_CONST.DEFAULT_MODEL
    );
  }

  setSelectedModel(model) {
    this.model = model;
    localStorage.setItem('jsonld_content_upload_reviewer_model', model);
  }

  showUploadModal() {
    const existingModal = document.getElementById('contentUploadModal');
    if (existingModal) {
      existingModal.remove();
    }
    const modal = this.createUploadModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    this.addEscapeKeyListener(modal, this.closeUploadModal);
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeUploadModal();
      }
    });
  }

  createUploadModal() {
    const overlay = document.createElement('div');
    overlay.id = 'contentUploadModal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    const container = document.createElement('div');
    container.className = 'modal-container modal-container--wide';
    const header = this._createModalHeader();
    container.appendChild(header);
    const body = this._createModalBody();
    container.appendChild(body);
    const footer = this._createModalFooter();
    container.appendChild(footer);
    overlay.appendChild(container);
    return overlay;
  }

  _createModalHeader() {
    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.textContent = 'コンテンツアップロード & レビュー ';
    const betaBadge = document.createElement('span');
    betaBadge.className = 'badge-beta';
    betaBadge.textContent = 'Beta';
    title.appendChild(betaBadge);
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-modal-close';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.closeUploadModal());
    header.appendChild(title);
    header.appendChild(closeBtn);
    return header;
  }

  _createModalBody() {
    const body = document.createElement('div');
    body.className = 'modal-body';
    const infoBox = this._createInfoBox();
    body.appendChild(infoBox);
    const reviewTypeSection = this._createReviewTypeSection();
    body.appendChild(reviewTypeSection);
    const inputSection = this._createInputSection();
    body.appendChild(inputSection);
    const matchingFields = this._createMatchingFields();
    body.appendChild(matchingFields);
    return body;
  }

  _createInfoBox() {
    const infoBox = document.createElement('div');
    infoBox.className = 'modal-info-box modal-info-box--blue modal-info-box--spacing';
    const heading = document.createElement('h4');
    heading.textContent = 'ベータ版機能について';
    const para1 = document.createElement('p');
    para1.textContent = 'この機能は現在ベータ版です。無料プランでは';
    const strong = document.createElement('strong');
    strong.textContent = '50回/24時間';
    para1.appendChild(strong);
    para1.appendChild(document.createTextNode('まで利用できます。'));
    const para2 = document.createElement('p');
    para2.className = 'modal-info-box-secondary-text';
    para2.textContent =
      '独自のOpenAI APIキーを設定すると、レート制限なしで無制限に利用できます（ヘッダーの「My API」から設定）。';
    infoBox.appendChild(heading);
    infoBox.appendChild(para1);
    infoBox.appendChild(para2);
    return infoBox;
  }

  _createReviewTypeSection() {
    const section = document.createElement('section');
    section.className = 'modal-section';
    const title = document.createElement('h3');
    title.className = 'modal-section-title';
    title.textContent = 'レビュー種類を選択';
    section.appendChild(title);
    const radioGroup = RadioGroup({
      name: 'reviewType',
      value: 'blog',
      layout: 'grid',
      options: [
        { value: 'blog', label: 'ブログコンテンツ' },
        { value: 'job', label: '求人票' },
        { value: 'skill-sheet', label: 'スキルシート' },
        { value: 'matching', label: '求人×スキルシートマッチング' },
        { value: 'general', label: '汎用テキスト' },
      ],
      onChange: value => {
        this.currentReviewType = value;
        this.toggleMatchingFields(value === 'matching');
      },
    });
    radioGroup.querySelector('.radio-group').className = 'review-type-selector';
    radioGroup.querySelectorAll('.radio-option').forEach(opt => {
      opt.className = 'review-type-option';
    });
    section.appendChild(radioGroup);
    return section;
  }

  _createInputSection() {
    const section = document.createElement('section');
    section.className = 'modal-section';
    const title = document.createElement('h3');
    title.className = 'modal-section-title';
    title.textContent = 'コンテンツ入力方法';
    section.appendChild(title);
    const textPanel = this._createTextInputPanel();
    const filePanel = this._createFileInputPanel();
    const tabs = Tabs({
      id: 'contentInputTabs',
      activeTab: 'text',
      tabs: [
        { id: 'text', label: 'テキスト入力', content: textPanel },
        { id: 'file', label: 'ファイルアップロード', content: filePanel },
      ],
      onChange: tabId => {
        this.switchInputTab(tabId);
      },
    });
    tabs.querySelector('.tabs-header').className = 'content-input-tabs';
    tabs.querySelectorAll('.tab-button').forEach(btn => {
      btn.className = btn.classList.contains('active')
        ? 'content-input-tab active'
        : 'content-input-tab';
      btn.dataset.tab = btn.dataset.tabId;
    });
    tabs.querySelectorAll('.tab-panel').forEach(panel => {
      panel.className = panel.classList.contains('active')
        ? 'content-input-panel active'
        : 'content-input-panel';
      panel.id = panel.dataset.tabId === 'text' ? 'textInputPanel' : 'fileInputPanel';
    });
    section.appendChild(tabs);
    return section;
  }

  _createTextInputPanel() {
    const panel = document.createElement('div');
    const textArea = document.createElement('textarea');
    textArea.id = 'contentTextArea';
    textArea.placeholder = 'レビュー対象のテキストを貼り付けてください...';
    textArea.rows = 15;
    textArea.className = 'content-text-area';
    const textCount = document.createElement('div');
    textCount.id = 'textCount';
    textCount.className = 'text-count';
    textCount.textContent = '0 文字';
    textArea.addEventListener('input', e => {
      const count = e.target.value.length;
      textCount.textContent = `${count.toLocaleString()} 文字`;
    });
    panel.appendChild(textArea);
    panel.appendChild(textCount);
    return panel;
  }

  _createFileInputPanel() {
    const panel = document.createElement('div');
    const uploadArea = document.createElement('div');
    uploadArea.className = 'file-upload-area';
    uploadArea.id = 'fileUploadArea';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'fileInput';
    fileInput.accept = '.pdf,.csv,.xlsx,.xls,.md,.markdown,.json,.txt';
    fileInput.className = 'file-upload-input-hidden';

    // ファイル選択時のイベントリスナーを追加
    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        this.handleFileUpload(fileInput.files[0]);
      }
    });

    const placeholder = this._createFileUploadPlaceholder();
    const fileInfo = this._createFileInfoDisplay();
    uploadArea.appendChild(placeholder);
    uploadArea.appendChild(fileInfo);
    uploadArea.addEventListener('click', () => fileInput.click());
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
    panel.appendChild(fileInput);
    panel.appendChild(uploadArea);
    return panel;
  }

  _createFileUploadPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'file-upload-placeholder';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '48');
    svg.setAttribute('height', '48');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4');
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '17 8 12 3 7 8');
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', '12');
    line.setAttribute('y1', '3');
    line.setAttribute('x2', '12');
    line.setAttribute('y2', '15');
    svg.appendChild(path);
    svg.appendChild(polyline);
    svg.appendChild(line);
    const text1 = document.createElement('p');
    text1.textContent = 'クリックしてファイルを選択、またはドラッグ&ドロップ';
    const text2 = document.createElement('p');
    text2.className = 'file-format-hint';
    text2.textContent = '対応形式: PDF, CSV, Excel, Markdown, JSON, TXT';
    placeholder.appendChild(svg);
    placeholder.appendChild(text1);
    placeholder.appendChild(text2);
    return placeholder;
  }

  _createFileInfoDisplay() {
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info file-info-hidden';
    fileInfo.id = 'fileInfo';
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    fileName.id = 'fileName';
    const fileMeta = document.createElement('div');
    fileMeta.className = 'file-meta';
    fileMeta.id = 'fileMeta';
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-file';
    removeBtn.textContent = '削除';
    removeBtn.addEventListener('click', e => {
      e.stopPropagation();
      this.removeFile();
    });
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileMeta);
    fileInfo.appendChild(removeBtn);
    return fileInfo;
  }

  _createMatchingFields() {
    const fields = document.createElement('div');
    fields.className = 'matching-mode-fields matching-mode-fields-hidden';
    fields.id = 'matchingFields';
    const heading = document.createElement('h4');
    heading.textContent = 'マッチング分析用（2つのコンテンツが必要）';
    const inputs = document.createElement('div');
    inputs.className = 'matching-inputs';
    const jobGroup = document.createElement('div');
    jobGroup.className = 'matching-input-group';
    const jobLabel = document.createElement('label');
    jobLabel.textContent = '求人票URL または テキスト';
    const jobUrlInput = document.createElement('input');
    jobUrlInput.type = 'url';
    jobUrlInput.id = 'jobUrlInput';
    jobUrlInput.placeholder = '求人票のURL';
    jobUrlInput.className = 'matching-url-input';
    const separator = document.createElement('span');
    separator.className = 'matching-separator';
    separator.textContent = 'または';
    const jobTextInput = document.createElement('textarea');
    jobTextInput.id = 'jobTextInput';
    jobTextInput.placeholder = '求人票のテキストを貼り付け';
    jobTextInput.rows = 5;
    jobTextInput.className = 'matching-text-input';
    jobGroup.appendChild(jobLabel);
    jobGroup.appendChild(jobUrlInput);
    jobGroup.appendChild(separator);
    jobGroup.appendChild(jobTextInput);
    const skillGroup = document.createElement('div');
    skillGroup.className = 'matching-input-group';
    const skillLabel = document.createElement('label');
    skillLabel.textContent = 'スキルシート（上記で入力済み）';
    const skillHint = document.createElement('p');
    skillHint.className = 'matching-hint';
    skillHint.textContent =
      'スキルシートは「テキスト入力」または「ファイルアップロード」で入力してください';
    skillGroup.appendChild(skillLabel);
    skillGroup.appendChild(skillHint);
    inputs.appendChild(jobGroup);
    inputs.appendChild(skillGroup);
    fields.appendChild(heading);
    fields.appendChild(inputs);
    return fields;
  }

  _createModalFooter() {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'キャンセル';
    cancelBtn.addEventListener('click', () => this.closeUploadModal());
    const submitBtn = document.createElement('button');
    submitBtn.className = 'btn-primary';
    submitBtn.textContent = 'レビュー開始';
    submitBtn.dataset.action = 'content-upload-submit';
    footer.appendChild(cancelBtn);
    footer.appendChild(submitBtn);
    return footer;
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
        panels[key].classList.add('active');
      } else {
        panels[key].classList.remove('active');
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
      if (show) {
        matchingFields.classList.remove('matching-mode-fields-hidden');
      } else {
        matchingFields.classList.add('matching-mode-fields-hidden');
      }
    }
  }

  handleFileSelect() {
    const fileInput = document.getElementById('fileInput');
    if (fileInput && fileInput.files.length > 0) {
      this.handleFileUpload(fileInput.files[0]);
    }
  }

  async handleFileUpload(file) {
    try {
      if (!FileParser.isSupportedFile(file.name)) {
        throw new Error(
          `対応していないファイル形式です。対応形式: ${FileParser.getSupportedExtensions().join(', ')}`
        );
      }
      const { text, metadata } = await FileParser.parseFile(file);
      this.uploadedFile = file;
      this.currentContent = text;
      this.updateFileInfo(metadata);
    } catch (error) {
      this.showError(`ファイルの読み込みに失敗しました: ${error.message}`);
    }
  }

  updateFileInfo(metadata) {
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileMeta = document.getElementById('fileMeta');
    const placeholder = document.querySelector('.file-upload-placeholder');
    if (fileInfo && fileName && fileMeta && placeholder) {
      fileName.textContent = metadata.filename;
      fileMeta.textContent = `${FileParser.getFileTypeDisplayName(metadata.extension)} | ${(metadata.size / 1024).toFixed(2)} KB`;
      placeholder.classList.add('file-upload-placeholder-hidden');
      fileInfo.classList.remove('file-info-hidden');
    }
  }

  removeFile() {
    this.uploadedFile = null;
    this.currentContent = null;
    const fileInfo = document.getElementById('fileInfo');
    const placeholder = document.querySelector('.file-upload-placeholder');
    const fileInput = document.getElementById('fileInput');
    if (fileInfo && placeholder) {
      fileInfo.classList.add('file-info-hidden');
      placeholder.classList.remove('file-upload-placeholder-hidden');
    }
    if (fileInput) {
      fileInput.value = '';
    }
  }

  async submitForReview() {
    try {
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
      let jobContent = '';
      if (this.currentReviewType === 'matching') {
        const jobUrlInput = document.getElementById('jobUrlInput');
        const jobTextInput = document.getElementById('jobTextInput');
        if (jobUrlInput && jobUrlInput.value.trim()) {
          jobContent = await this.fetchJobFromUrl(jobUrlInput.value.trim());
        } else if (jobTextInput && jobTextInput.value.trim()) {
          jobContent = jobTextInput.value.trim();
        }
        if (!jobContent) {
          this.showError('マッチング分析には求人票の入力が必要です');
          return;
        }
      }
      const rateLimit = this.checkRateLimit();
      if (!rateLimit.allowed) {
        this.showError(
          `レート制限に達しました。リセット時刻: ${rateLimit.resetTime.toLocaleString('ja-JP')}`
        );
        return;
      }
      this.closeUploadModal();
      this.showReviewView(content, jobContent);
      await this.callReviewAPI(content, jobContent);
      this.recordUsage();
    } catch (error) {
      this.showError(`レビューの開始に失敗しました: ${error.message}`);
    }
  }

  async fetchJobFromUrl(url) {
    try {
      const proxyUrl = this.getProxyUrl(url);
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const html = await response.text();
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
        } catch (e) {}
      }
      if (jobPosting) {
        return this.formatJobPostingText(jobPosting);
      } else {
        const bodyText = doc.body?.textContent || '';
        return `URL: ${url}\n\n${bodyText.trim().substring(0, 5000)}`;
      }
    } catch (error) {
      throw new Error(`求人票の取得に失敗しました: ${error.message}`);
    }
  }

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

  closeUploadModal() {
    const modal = document.getElementById('contentUploadModal');
    if (modal) {
      modal.remove();
    }
  }

  showReviewView(content, jobContent = '') {
    const existingView = document.getElementById('contentUploadReviewView');
    if (existingView) {
      existingView.remove();
    }
    const reviewView = this.createReviewView(content, jobContent);
    document.body.appendChild(reviewView);
    reviewView.style.display = 'flex';
  }

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
              <div id="analysis-content"></div>
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

  closeReviewView() {
    const view = document.getElementById('contentUploadReviewView');
    if (view) {
      view.remove();
    }
  }

  async callReviewAPI(content, jobContent = '') {
    if (!canStartAnalysis('content-upload-reviewer')) {
      this.showError('他の分析が実行中です。完了してから再度お試しください。');
      this.closeReviewView();
      return;
    }
    const controller = new AbortController();
    window.ANALYSIS_STATE.abortControllers['content-upload-reviewer'] = controller;
    setAnalysisActive('content-upload-reviewer');
    this.isStreaming = true;
    try {
      const apiUrl = this.getApiUrl('content-upload-reviewer');
      const userApiKey = this.getUserApiKey();
      const baseUrl = this.getUserApiBaseUrl();
      const requestBody = {
        content,
        reviewType: this.currentReviewType,
        userApiKey,
        baseUrl,
        model: this.model,
      };
      if (this.currentReviewType === 'matching' && jobContent) {
        requestBody.jobContent = jobContent;
      }
      const headers = {
        'Content-Type': 'application/json',
      };

      // 認証情報を取得
      const authCredentials = this.getAuthCredentials();
      if (authCredentials) {
        headers['Authorization'] = `Basic ${authCredentials}`;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      // 401エラーの場合は認証ダイアログを表示
      if (response.status === 401) {
        const authSuccess = await this.showAuthDialog();
        if (authSuccess) {
          // 認証成功後、再度APIを呼び出す
          return this.callReviewAPI(content, jobContent);
        } else {
          throw new Error('認証が必要です');
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      await this.processStreamingResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        this.showError('レビューがキャンセルされました');
      } else {
        this.showError(`レビューに失敗しました: ${error.message}`);
      }
      this.closeReviewView();
    } finally {
      this.ensureAnalysisCleanup('content-upload-reviewer');
    }
  }

  async processStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let receivedModel = null;
    const statusEl = document.getElementById('reviewStatus');
    const diffContainer = document.getElementById('reviewDiffContainer');
    const analysisEl = document.getElementById('reviewAnalysis');
    const analysis-content = document.getElementById('analysis-content');
    const revisedContent = document.getElementById('revisedContent');
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.model) {
              receivedModel = parsed.model;
            }
            if (parsed.content) {
              fullText += parsed.content;
              if (statusEl && statusEl.style.display !== 'none') {
                statusEl.style.display = 'none';
                if (diffContainer) diffContainer.style.display = 'grid';
                if (analysisEl) analysisEl.style.display = 'block';
              }
              const { revisedText, analysisText } = this.parseReviewResponse(fullText);
              if (revisedContent && revisedText) {
                revisedContent.innerHTML = this.renderMarkdownCommon(revisedText);
              }
              if (analysis-content && analysisText) {
                analysis-content.innerHTML = this.renderMarkdownCommon(analysisText);
              }
            }
            if (parsed.usage) {
              this.currentUsage = parsed.usage;
              this.displayUsageInfo(parsed.usage, receivedModel);
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {}
        }
      }
    }
    const { revisedText, analysisText } = this.parseReviewResponse(fullText);
    this.revisedText = revisedText;
    if (revisedContent && revisedText) {
      revisedContent.innerHTML = this.renderMarkdownCommon(revisedText);
    }
    if (analysis-content && analysisText) {
      analysis-content.innerHTML = this.renderMarkdownCommon(analysisText);
    }

    this.showAnalysisCompleteNotification('content-upload-reviewer');
  }

  parseReviewResponse(fullText) {
    const revisedSectionPattern = /##\s*校閲済みテキスト\s*\n([\s\S]*?)(?=\n##\s|\n---\s|$)/i;
    const match = fullText.match(revisedSectionPattern);
    let revisedText = '';
    let analysisText = fullText;
    if (match && match[1]) {
      revisedText = match[1].trim();
      analysisText = fullText.replace(revisedSectionPattern, '').trim();
    }
    return { revisedText, analysisText };
  }

  displayUsageInfo(usage, model) {
    const usagePanel = document.getElementById('reviewUsagePanel');
    if (!usagePanel) return;
    usagePanel.innerHTML = this.renderApiUsagePanel(usage, model);
    usagePanel.style.display = 'block';
  }

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
        this.showError('コピーに失敗しました');
      });
  }

  downloadRevisedText() {
    if (!this.revisedText) {
      this.showError('校閲済みテキストがありません');
      return;
    }
    const blob = new Blob([this.revisedText], { type: 'text/plain;charset=utf-8' });
    const filename = `校閲済み_${new Date().toISOString().slice(0, 10)}.txt`;
    this.downloadFile(blob, filename);
  }

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

  /**
   * 認証情報をlocalStorageから取得
   * @returns {string|null} Base64エンコードされた認証情報
   */
  getAuthCredentials() {
    return localStorage.getItem('jsonld_upload_auth');
  }

  /**
   * 認証情報をlocalStorageに保存
   * @param {string} username - ユーザー名
   * @param {string} password - パスワード
   */
  saveAuthCredentials(username, password) {
    const credentials = btoa(`${username}:${password}`);
    localStorage.setItem('jsonld_upload_auth', credentials);
  }

  /**
   * 認証情報をlocalStorageから削除
   */
  clearAuthCredentials() {
    localStorage.removeItem('jsonld_upload_auth');
  }

  /**
   * 認証ダイアログを表示
   * @returns {Promise<boolean>} 認証成功時はtrue、キャンセル時はfalse
   */
  showAuthDialog() {
    return new Promise((resolve) => {
      const existingDialog = document.getElementById('uploadAuthDialog');
      if (existingDialog) {
        existingDialog.remove();
      }

      const dialog = this.createAuthDialog();
      document.body.appendChild(dialog);
      dialog.style.display = 'flex';

      const usernameInput = document.getElementById('uploadAuthUsername');
      const passwordInput = document.getElementById('uploadAuthPassword');
      const loginBtn = document.getElementById('uploadAuthLogin');
      const cancelBtn = document.getElementById('uploadAuthCancel');

      const cleanup = () => {
        dialog.remove();
      };

      const handleLogin = async () => {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username || !password) {
          this.showError('ユーザー名とパスワードを入力してください');
          return;
        }

        // 認証情報を保存
        this.saveAuthCredentials(username, password);

        cleanup();
        resolve(true);
      };

      const handleCancel = () => {
        cleanup();
        resolve(false);
      };

      loginBtn.addEventListener('click', handleLogin);
      cancelBtn.addEventListener('click', handleCancel);

      // Escapeキーでキャンセル
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          handleCancel();
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // モーダル外クリックでキャンセル
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          handleCancel();
        }
      });

      // フォーカスを設定
      setTimeout(() => usernameInput.focus(), 100);
    });
  }

  /**
   * 認証ダイアログのHTMLを作成
   * @returns {HTMLElement} ダイアログ要素
   */
  createAuthDialog() {
    const overlay = document.createElement('div');
    overlay.id = 'uploadAuthDialog';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    const container = document.createElement('div');
    container.className = 'modal-container';
    container.style.maxWidth = '400px';

    const header = document.createElement('div');
    header.className = 'modal-header';
    const title = document.createElement('h2');
    title.textContent = '認証が必要です';
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'modal-body';

    const infoText = document.createElement('p');
    infoText.textContent = 'Content Upload Reviewerを使用するには認証が必要です。';
    infoText.style.marginBottom = '1rem';
    body.appendChild(infoText);

    const usernameGroup = document.createElement('div');
    usernameGroup.style.marginBottom = '1rem';
    const usernameLabel = document.createElement('label');
    usernameLabel.textContent = 'ユーザー名';
    usernameLabel.style.display = 'block';
    usernameLabel.style.marginBottom = '0.5rem';
    const usernameInput = document.createElement('input');
    usernameInput.type = 'text';
    usernameInput.id = 'uploadAuthUsername';
    usernameInput.className = 'input-field';
    usernameInput.style.width = '100%';
    usernameGroup.appendChild(usernameLabel);
    usernameGroup.appendChild(usernameInput);
    body.appendChild(usernameGroup);

    const passwordGroup = document.createElement('div');
    passwordGroup.style.marginBottom = '1rem';
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'パスワード';
    passwordLabel.style.display = 'block';
    passwordLabel.style.marginBottom = '0.5rem';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.id = 'uploadAuthPassword';
    passwordInput.className = 'input-field';
    passwordInput.style.width = '100%';
    passwordGroup.appendChild(passwordLabel);
    passwordGroup.appendChild(passwordInput);
    body.appendChild(passwordGroup);

    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    footer.style.display = 'flex';
    footer.style.gap = '0.5rem';
    footer.style.justifyContent = 'flex-end';

    const cancelBtn = document.createElement('button');
    cancelBtn.id = 'uploadAuthCancel';
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'キャンセル';

    const loginBtn = document.createElement('button');
    loginBtn.id = 'uploadAuthLogin';
    loginBtn.className = 'btn btn-primary';
    loginBtn.textContent = 'ログイン';

    footer.appendChild(cancelBtn);
    footer.appendChild(loginBtn);

    container.appendChild(header);
    container.appendChild(body);
    container.appendChild(footer);
    overlay.appendChild(container);

    return overlay;
  }
}
window.ContentUploadReviewerManager = ContentUploadReviewerManager;
window.contentUploadReviewerManager = new ContentUploadReviewerManager();
export { ContentUploadReviewerManager };
export default ContentUploadReviewerManager;
