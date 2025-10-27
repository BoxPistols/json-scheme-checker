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
    console.log('[WebAdvisor] detectNoSchemaOrWebPageOnly called');
    console.log('[WebAdvisor] Schemas count:', schemas.length);
    console.log('[WebAdvisor] Schemas:', schemas);

    // 既存のボタンを削除
    this.hideAnalysisButton();

    if (!url) {
      console.log('[WebAdvisor] No URL provided');
      return;
    }

    // スキーマが無い場合
    const hasNoSchema = schemas.length === 0;
    console.log('[WebAdvisor] Has no schema:', hasNoSchema);

    // WebPage以外の有用なスキーマがあるかチェック
    // JobPosting, BlogPosting, Article, Product, Event, Organization, Personなど
    const usefulSchemaTypes = [
      'JobPosting', 'BlogPosting', 'Article', 'NewsArticle',
      'Product', 'Event', 'Organization', 'Person',
      'Recipe', 'HowTo', 'FAQPage', 'QAPage',
      'Course', 'Review', 'Rating', 'Offer',
      'LocalBusiness', 'Restaurant', 'Store'
    ];

    const hasUsefulSchema = schemas.some(schema => {
      const type = schema['@type'];
      console.log('[WebAdvisor] Checking schema type:', type);

      if (!type) return false;

      // WebPageとBreadcrumbListは除外（これらは汎用的すぎる）
      const typesToIgnore = ['WebPage', 'WebSite', 'BreadcrumbList', 'SearchAction', 'ReadAction'];

      // @typeが配列の場合
      if (Array.isArray(type)) {
        // WebPageなどの汎用タイプを除外してチェック
        const relevantTypes = type.filter(t => !typesToIgnore.includes(t));
        console.log('[WebAdvisor] Relevant types (array):', relevantTypes);
        return relevantTypes.some(t => usefulSchemaTypes.includes(t));
      }

      // @typeが文字列の場合
      // WebPageなどの汎用タイプは除外
      if (typesToIgnore.includes(type)) {
        console.log('[WebAdvisor] Ignoring generic type:', type);
        return false;
      }

      const isUseful = usefulSchemaTypes.includes(type);
      console.log('[WebAdvisor] Is useful schema:', isUseful);
      return isUseful;
    });

    console.log('[WebAdvisor] Has useful schema:', hasUsefulSchema);

    // スキーマが無い、またはWebPageのみ（有用なスキーマがない）の場合にCTA表示
    if (hasNoSchema || !hasUsefulSchema) {
      console.log('[WebAdvisor] Showing analysis button');
      this.currentUrl = url;
      this.showAnalysisButton();
    } else {
      console.log('[WebAdvisor] Not showing button (有用なスキーマが存在)');
    }
  }

  /**
   * 分析ボタンを表示（BlogReviewer/Advisorと同じUI）
   */
  showAnalysisButton() {
    const resultDiv = document.getElementById('results');
    if (!resultDiv) {
      console.warn('[WebAdvisor] results div not found');
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
    button.dataset.action = 'show-web-confirm-dialog';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2l2 7h7l-5.5 4 2 7-5.5-4-5.5 4 2-7-5.5-4h7z"/>
      </svg>
      Webページ分析を受ける
    `;

    // results divの最初に挿入（BlogReviewer/Advisorと同じ）
    resultDiv.insertBefore(button, resultDiv.firstChild);
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