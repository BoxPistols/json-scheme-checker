// Content Upload Reviewer Module
// ファイル/テキストアップロード型のレビュー機能

// コンポーネントのインポート
import { FileUpload } from '../components/form/FileUpload.js';
import { Tabs } from '../components/common/Tabs.js';
import { RadioGroup } from '../components/form/RadioGroup.js';
import { Preview } from '../components/common/Preview.js';

// BaseAdvisorManagerはグローバルスコープから取得
// (base-advisor.jsで window.BaseAdvisorManager として定義されている)
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

    const container = document.createElement('div');
    container.className = 'modal-container modal-container--wide';

    // ヘッダー
    const header = this._createModalHeader();
    container.appendChild(header);

    // ボディ
    const body = this._createModalBody();
    container.appendChild(body);

    // フッター
    const footer = this._createModalFooter();
    container.appendChild(footer);

    overlay.appendChild(container);
    return overlay;
  }

  /**
   * モーダルヘッダーを作成
   * @private
   * @returns {HTMLElement}
   */
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

  /**
   * モーダルボディを作成
   * @private
   * @returns {HTMLElement}
   */
  _createModalBody() {
    const body = document.createElement('div');
    body.className = 'modal-body';

    // ベータ版情報ボックス
    const infoBox = this._createInfoBox();
    body.appendChild(infoBox);

    // レビュー種類選択セクション
    const reviewTypeSection = this._createReviewTypeSection();
    body.appendChild(reviewTypeSection);

    // コンテンツ入力セクション
    const inputSection = this._createInputSection();
    body.appendChild(inputSection);

    // マッチングフィールド
    const matchingFields = this._createMatchingFields();
    body.appendChild(matchingFields);

    return body;
  }

  /**
   * ベータ版情報ボックスを作成
   * @private
   * @returns {HTMLElement}
   */
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

  /**
   * レビュー種類選択セクションを作成
   * @private
   * @returns {HTMLElement}
   */
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

    // カスタムクラスを追加（既存CSSと互換性を保つ）
    radioGroup.querySelector('.radio-group').className = 'review-type-selector';
    radioGroup.querySelectorAll('.radio-option').forEach(opt => {
      opt.className = 'review-type-option';
    });

    section.appendChild(radioGroup);

    return section;
  }

  /**
   * コンテンツ入力セクションを作成
   * @private
   * @returns {HTMLElement}
   */
  _createInputSection() {
    const section = document.createElement('section');
    section.className = 'modal-section';

    const title = document.createElement('h3');
    title.className = 'modal-section-title';
    title.textContent = 'コンテンツ入力方法';
    section.appendChild(title);

    // テキスト入力パネル
    const textPanel = this._createTextInputPanel();

    // ファイルアップロードパネル
    const filePanel = this._createFileInputPanel();

    // タブコンポーネント
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

    // カスタムクラスを追加（既存CSSと互換性を保つ）
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

  /**
   * テキスト入力パネルを作成
   * @private
   * @returns {HTMLElement}
   */
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

  /**
   * ファイル入力パネルを作成
   * @private
   * @returns {HTMLElement}
   */
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
    fileInput.dataset.action = 'content-upload-file-select';

    const placeholder = this._createFileUploadPlaceholder();
    const fileInfo = this._createFileInfoDisplay();

    uploadArea.appendChild(placeholder);
    uploadArea.appendChild(fileInfo);

    // イベントリスナー
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

  /**
   * ファイルアップロードプレースホルダーを作成
   * @private
   * @returns {HTMLElement}
   */
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

  /**
   * ファイル情報表示エリアを作成
   * @private
   * @returns {HTMLElement}
   */
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

  /**
   * マッチングフィールドを作成
   * @private
   * @returns {HTMLElement}
   */
  _createMatchingFields() {
    const fields = document.createElement('div');
    fields.className = 'matching-mode-fields matching-mode-fields-hidden';
    fields.id = 'matchingFields';

    const heading = document.createElement('h4');
    heading.textContent = 'マッチング分析用（2つのコンテンツが必要）';

    const inputs = document.createElement('div');
    inputs.className = 'matching-inputs';

    // 求人票入力
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

    // スキルシート説明
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

  /**
   * モーダルフッターを作成
   * @private
   * @returns {HTMLElement}
   */
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

      placeholder.classList.add('file-upload-placeholder-hidden');
      fileInfo.classList.remove('file-info-hidden');
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
      fileInfo.classList.add('file-info-hidden');
      placeholder.classList.remove('file-upload-placeholder-hidden');
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

// グローバルに公開（後方互換性のため）
window.ContentUploadReviewerManager = ContentUploadReviewerManager;
window.contentUploadReviewerManager = new ContentUploadReviewerManager();

// ES6モジュールとしてエクスポート
export { ContentUploadReviewerManager };
export default ContentUploadReviewerManager;
