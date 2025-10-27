// Web Advisor Module - AI-powered advice for pages with no schema or only WebPage schema

class WebAdvisorManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_web_advisor_usage',
      USER_API_KEY: 'jsonld_web_advisor_openai_key',
      STAKEHOLDER_MODE_KEY: 'jsonld_web_advisor_stakeholder',
      USAGE_TOTAL_KEY: 'jsonld_usage_web_advisor_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
      MAX_REQUESTS_PER_DAY: 10,
      MAX_REQUESTS_STAKEHOLDER: 30,
      elemIdPrefix: 'webAdvisor',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeStakeholderPrompt: () => this.closeModal('stakeholderPrompt'),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'web-close-stakeholder-prompt': () => this.closeModal('stakeholderPrompt'),
        'web-confirm-stakeholder': () => this.confirmStakeholder(),
        'web-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'web-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'web-save-developer-key': () => this.saveDeveloperKey(),
        'web-show-stakeholder-prompt': () => this.showStakeholderPrompt(),
        'web-show-developer-prompt': () => this.showDeveloperPrompt(),
        'web-reset-to-normal-mode': () => this.resetToNormalMode(),
        'web-close-confirm-dialog': () => this.closeConfirmDialog(),
        'web-start-analysis': () => this.startAnalysis(),
        'web-close-result-view': () => this.closeResultView(),
        'web-fetch-analysis': () => this.fetchAnalysis(),
        'show-web-confirm-dialog': () => this.showConfirmDialog(),
      },
      actions: {
        closeStakeholderPrompt: 'web-close-stakeholder-prompt',
        confirmStakeholder: 'web-confirm-stakeholder',
        closeDeveloperPrompt: 'web-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'web-toggle-developer-key-visibility',
        saveDeveloperKey: 'web-save-developer-key',
      },
    };
    super(config);

    this.currentUrl = null;
    this.isStreaming = false;
    this.currentResult = '';
    this.eventSource = null;
  }

  /**
   * スキーマが無いか、WebPageのみの場合にCTAを表示
   * @param {Array} schemas - 検出されたスキーマ
   * @param {string} url - 分析対象URL
   */
  detectNoSchemaOrWebPageOnly(schemas, url) {
    // 既存のボタンを削除
    this.hideAnalysisButton();

    if (!url) return;

    // スキーマが無い場合
    const hasNoSchema = schemas.length === 0;

    // WebPage以外の有用なスキーマがあるかチェック
    // JobPosting, BlogPosting, Article, Product, Event, Organization, Personなど
    const usefulSchemaTypes = [
      'JobPosting', 'BlogPosting', 'Article', 'NewsArticle',
      'Product', 'Event', 'Organization', 'Person',
      'Recipe', 'HowTo', 'FAQPage', 'QAPage',
      'Course', 'Review', 'Rating', 'Offer'
    ];

    const hasUsefulSchema = schemas.some(schema => {
      const type = schema['@type'];
      if (!type) return false;

      // @typeが配列の場合
      if (Array.isArray(type)) {
        return type.some(t => usefulSchemaTypes.includes(t));
      }

      // @typeが文字列の場合
      return usefulSchemaTypes.includes(type);
    });

    // スキーマが無い、またはWebPageのみ（有用なスキーマがない）の場合にCTA表示
    if (hasNoSchema || !hasUsefulSchema) {
      this.currentUrl = url;
      this.showAnalysisButton();
    }
  }

  /**
   * 分析ボタンを表示（ヘッダーエリアに配置）
   */
  showAnalysisButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // 既存のボタンがあれば削除
    const existingBtn = document.getElementById('webAdvisorButton');
    if (existingBtn) existingBtn.remove();

    const buttonHtml = `
      <button
        id="webAdvisorButton"
        class="btn-web-advisor"
        data-action="show-web-confirm-dialog"
        title="AI分析でコンテンツ品質をチェック"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7-5.5-4h7z"/>
        </svg>
        Webページ分析
      </button>
    `;

    // テーマ切り替えボタンの前に挿入
    const themeToggle = document.getElementById('btnThemeToggle');
    if (themeToggle) {
      themeToggle.insertAdjacentHTML('beforebegin', buttonHtml);
    } else {
      headerActions.insertAdjacentHTML('beforeend', buttonHtml);
    }
  }

  /**
   * 分析ボタンを非表示
   */
  hideAnalysisButton() {
    const btn = document.getElementById('webAdvisorButton');
    if (btn) btn.remove();
  }

  /**
   * 確認ダイアログを表示せず、別タブで分析ページを開く
   */
  showConfirmDialog() {
    const rateLimit = this.checkRateLimit();

    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? rateLimit.resetTime.toLocaleString('ja-JP') : '不明';
      showSnackbar(`利用上限に達しました。リセット時刻: ${resetTime}`, 'error', 5000);
      return;
    }

    // レート制限を記録
    this.recordUsage();

    // 別タブで専用ページを開く
    const analysisUrl = `/web-advisor.html?url=${encodeURIComponent(this.currentUrl)}`;
    window.open(analysisUrl, '_blank', 'noopener,noreferrer');

    showSnackbar('別タブで分析ページを開きました', 'success', 2000);
  }

  /**
   * 確認ダイアログを閉じる（互換性のため残す）
   */
  closeConfirmDialog() {
    // 何もしない（モーダルを使用しないため）
  }

  /**
   * 分析を開始（互換性のため残す）
   */
  startAnalysis() {
    // showConfirmDialogで直接別タブを開くため、ここでは何もしない
  }

  // モーダル関連のメソッドは削除（専用ページで実行）
  // 必要に応じてBaseAdvisorManagerのメソッドをオーバーライド

  closeModal(modalType) {
    // モーダルを使用しないため、何もしない
  }
}

// グローバルインスタンスを作成
const webAdvisorManager = new WebAdvisorManager();