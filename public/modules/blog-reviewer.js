// Blog Reviewer Module

class BlogReviewerManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_blog_reviewer_usage',
      USER_API_KEY: 'jsonld_blog_reviewer_openai_key',
      USAGE_TOTAL_KEY: 'jsonld_usage_blog_reviewer_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
      MAX_REQUESTS_PER_DAY: 50,
      elemIdPrefix: 'blogReviewer',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'blog-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'blog-toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'blog-save-developer-key': () => this.saveDeveloperKey(),
        'blog-test-developer-connection': () => this.testDeveloperConnection(),
        'blog-reset-developer-settings': () => this.resetDeveloperSettings(),
        'blog-show-developer-prompt': () => this.showDeveloperPrompt(),
        'blog-reset-to-free-mode': () => this.resetToFreeMode(),
        'blog-close-confirm-dialog': () => this.closeConfirmDialog(),
        'blog-start-review': () => this.startReview(),
        'blog-close-review-view': () => this.closeReviewView(),
        'blog-fetch-review': () => this.fetchReview(),
        'show-blog-confirm-dialog': () => this.showConfirmDialog(),
        'blog-reviewer-toggle-article-section': () => this.toggleAccordion('article'),
        'blog-reviewer-toggle-review-section': () => this.toggleAccordion('review'),
      },
      actions: {
        closeDeveloperPrompt: 'blog-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'blog-toggle-developer-key-visibility',
        saveDeveloperKey: 'blog-save-developer-key',
        testDeveloperConnection: 'blog-test-developer-connection',
        resetDeveloperSettings: 'blog-reset-developer-settings',
      },
    };
    super(config);
    this.currentArticle = null;
    this.isStreaming = false;
    this.currentUsage = null;
    this.remoteDoc = null;
    this.model = this.getSelectedModel();
  }

  getSelectedModel() {
    return localStorage.getItem('jsonld_blog_reviewer_model') || window.ADVISOR_CONST.DEFAULT_MODEL;
  }

  setSelectedModel(model) {
    this.model = model;
    localStorage.setItem('jsonld_blog_reviewer_model', model);
    console.log(`[BlogReviewer] Model set to: ${model}`);
  }

  setRemoteHtml(html) {
    try {
      const parser = new DOMParser();
      this.remoteDoc = parser.parseFromString(html, 'text/html');
        const ogImageMeta = this.remoteDoc.querySelector('meta[property="og:image"]');
      const ogImageUrl = ogImageMeta?.content;
      console.log('[BlogReviewer] setRemoteHtml - og:image meta tag found:', !!ogImageMeta);
      console.log('[BlogReviewer] setRemoteHtml - og:image URL:', ogImageUrl);
    } catch (e) {
      console.warn('[BlogReviewer] Remote HTMLのパースに失敗:', e);
      this.remoteDoc = null;
    }
  }

  /**
   * Article/BlogPostingスキーマを検出してレビューボタンを表示
   * @param {Array} jsonLdData - 抽出されたJSON-LDデータ
   * @param {string} url - 分析元URL
   */
  detectBlogPost(jsonLdData, url) {
    console.log('[BlogReviewerManager] detectBlogPost called with:', jsonLdData);
    console.log('[BlogReviewerManager] Number of schemas:', jsonLdData?.length);
    this.hideReviewButton();
    if (!jsonLdData || !Array.isArray(jsonLdData) || jsonLdData.length === 0) {
      console.warn('[BlogReviewerManager] jsonLdData is empty or not an array');
      return;
    }
    jsonLdData.forEach((item, index) => {
      console.log(`[BlogReviewerManager] Schema ${index + 1} @type:`, item['@type']);
    });
    const article = jsonLdData.find(
      item =>
        item['@type'] === 'Article' ||
        item['@type'] === 'BlogPosting' ||
        item['@type']?.includes('Article') ||
        item['@type']?.includes('BlogPosting')
    );
    console.log('[BlogReviewerManager] Article/BlogPosting detected:', article);
    if (article) {
        this.currentArticle = this.enrichArticleData(article);
      this.currentUrl = url;
      this.showReviewButton();
      console.log(
        '[BlogReviewerManager] Review button shown with enriched data:',
        this.currentArticle
      );
      return true;
    } else {
      console.log('[BlogReviewerManager] No Article/BlogPosting found in schemas');
      return false;
    }
  }

  /**
   * Article/BlogPostingデータをHTMLから補完
   * @param {Object} article - 元のArticle/BlogPostingオブジェクト
   * @returns {Object} 補完されたArticleオブジェクト
   */
  enrichArticleData(article) {
    const enriched = { ...article };
    console.log('[BlogReviewerManager] enrichArticleData called');
    console.log('[BlogReviewerManager] remoteDoc available:', !!this.remoteDoc);
    console.log('[BlogReviewerManager] article.image:', article.image);
    if (!enriched.description && !enriched.abstract) {
      const root = this.remoteDoc || document;
      const metaDescription =
        root.querySelector('meta[name="description"]')?.content ||
        root.querySelector('meta[property="og:description"]')?.content;
      if (metaDescription) {
        enriched.description = metaDescription;
        console.log('[BlogReviewerManager] Added description from meta tag:', metaDescription);
      }
    }
    if (enriched.image) {
      let imageUrl = '';
        if (typeof enriched.image === 'object') {
        if (Array.isArray(enriched.image)) {
                const firstImage = enriched.image[0];
          imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url || '';
        } else if (enriched.image.url) {
                imageUrl = enriched.image.url;
        }
      } else if (typeof enriched.image === 'string') {
            imageUrl = enriched.image;
      }
      if (imageUrl) {
        enriched.image = imageUrl;
        console.log('[BlogReviewerManager] image normalized to string:', imageUrl);
      } else {
        enriched.image = undefined;
        console.log('[BlogReviewerManager] image is empty object, will search OGP');
      }
    }
    if (!enriched.image) {
      const root = this.remoteDoc || document;
      console.log('[BlogReviewerManager] Searching for OGP image...');
        const allMetas = root.querySelectorAll('meta[property]');
      console.log('[BlogReviewerManager] Total meta tags with property:', allMetas.length);
      const ogImage =
        root.querySelector('meta[property="og:image"]')?.content ||
        root.querySelector('meta[property="og:image:url"]')?.content;
      console.log('[BlogReviewerManager] og:image found:', ogImage);
      if (ogImage) {
            let absoluteImageUrl = ogImage;
        try {
          if (typeof ogImage === 'string') {
            if (ogImage.startsWith('/')) {
                        const urlObj = new URL(window.location.href);
              absoluteImageUrl = urlObj.origin + ogImage;
            } else if (!ogImage.startsWith('http')) {
                        const urlObj = new URL(window.location.href);
              const basePath = urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1);
              absoluteImageUrl = urlObj.origin + basePath + ogImage;
            }
          }
        } catch (e) {
          console.warn('[BlogReviewerManager] Error normalizing URL:', e);
        }
        enriched.image = absoluteImageUrl;
        console.log(
          '[BlogReviewerManager] Added OGP image:',
          ogImage,
          '→ absolute:',
          absoluteImageUrl
        );
      } else {
        console.log('[BlogReviewerManager] No og:image found');
      }
    } else {
      console.log('[BlogReviewerManager] image already exists in article:', enriched.image);
    }
    if (!enriched.articleBody) {
      const root = this.remoteDoc || document; // 取得済みのリモートHTMLを優先
      let bodyText = '';
      console.log('[BlogReviewer] articleBody not found in JSON-LD, extracting from HTML...');
        const articleElement = root.querySelector('article');
      console.log('[BlogReviewer] article element:', articleElement);
      if (articleElement) {
        bodyText = this.extractTextContent(articleElement);
        console.log('[BlogReviewer] Extracted from <article>:', bodyText.substring(0, 200));
      }
        if (!bodyText) {
        const mainElement = root.querySelector('main');
        console.log('[BlogReviewer] main element:', mainElement);
        if (mainElement) {
          bodyText = this.extractTextContent(mainElement);
          console.log('[BlogReviewer] Extracted from <main>:', bodyText.substring(0, 200));
        }
      }
        if (!bodyText) {
        console.log('[BlogReviewer] Trying generic content selectors...');
            const contentSelectors = [
          'article',
          'main',
          '[role="main"]',
          '.entry-content',
          '.post-content',
          '.article-content',
          '.content',
          '[class*="entry"][class*="content"]',
          '[class*="post"][class*="content"]',
          '[class*="article"][class*="content"]',
          '[class*="content"]',
          '[class*="article"]',
          '[class*="post"]',
        ];
        for (const selector of contentSelectors) {
          const element = root.querySelector(selector);
          if (element) {
            const text = this.extractTextContent(element);
            if (text.length > 100) {
              bodyText = text;
              console.log(`[BlogReviewer] Found content with "${selector}": ${text.length} chars`);
              break; // 最初に見つかったら終了
            }
          }
        }
      }
      if (bodyText) {
        enriched.articleBody = bodyText;
        console.log('[BlogReviewerManager] Final articleBody:', bodyText.substring(0, 200) + '...');
      } else {
        console.warn('[BlogReviewer] Could not extract articleBody from HTML');
      }
    }
    return enriched;
  }

  extractTextContent(element) {
    if (!element) return '';
    const clone = element.cloneNode(true);
    const excludeSelector = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      'aside',
      '.sidebar',
      'form',
      'button',
      'input',
      'select',
      'textarea',
      '[role="dialog"]',
      '[role="alert"]',
      '.modal',
      '.dialog',
      '.overlay',
      '#basicAuthDialog',
      '#authSection',
      '[class*="auth-"]',
      '.advisor-overlay',
      '.advisor-modal',
      'details',
    ].join(',');
    clone.querySelectorAll(excludeSelector).forEach(el => el.remove());
    let text = clone.textContent
      .replace(/\s+/g, ' ') // 連続する空白を1つに
      .trim();
    const unwantedPhrases = [
      '認証情報の保存方法',
      '保存しない（最もセキュア）',
      'タブを閉じるまで保存（推奨）',
      '24時間保存（利便性重視）',
      '永続保存（期限なし）',
      'すべてクリア',
      'Basic認証',
      'ユーザー名',
      'パスワード',
    ];
    unwantedPhrases.forEach(phrase => {
      text = text.replace(new RegExp(phrase, 'g'), '');
    });
    return text.replace(/\s+/g, ' ').trim();
  }

  showReviewButton() {
    const actionsContainer =
      document.getElementById('aiActions') || document.getElementById('results');
    console.log('[BlogReviewerManager] showReviewButton called');
    console.log('[BlogReviewerManager] actions container:', actionsContainer);
    console.log('[BlogReviewerManager] actions container found:', !!actionsContainer);
    if (!actionsContainer) {
      console.error('[BlogReviewerManager] ERROR: actions container not found');
        const schemasContainer = document.getElementById('schemasContainer');
      if (schemasContainer) {
        console.log('[BlogReviewerManager] Using schemasContainer as fallback');
        const button = this.createReviewButton();
        schemasContainer.parentElement.appendChild(button);
        return;
      }
      return;
    }
    const existingBtn = document.getElementById('blogReviewerTriggerBtn');
    if (existingBtn) {
      console.log('[BlogReviewerManager] Review button already exists');
      return;
    }
    const button = this.createReviewButton();
    actionsContainer.appendChild(button);
    console.log('[BlogReviewerManager] Review button inserted into DOM');
  }

  createReviewButton() {
    const button = document.createElement('button');
    button.id = 'blogReviewerTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.type = 'button';
    button.dataset.action = 'show-blog-confirm-dialog';
    button.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>ブログ記事レビューを受ける`;
    console.log('[BlogReviewerManager] Review button created');
    return button;
  }

  hideReviewButton() {
    const btn = document.getElementById('blogReviewerTriggerBtn');
    if (btn) btn.remove();
  }

  showConfirmDialog() {
    if (!this.currentArticle) {
      console.warn('[BlogReviewer] showConfirmDialog called but currentArticle is null');
      return;
    }
    const overlay = document.createElement('div');
    overlay.id = 'blogReviewerConfirmOverlay';
    overlay.className = 'advisor-overlay';
overlay.innerHTML = ` <div class="advisor-modal">   <div class="advisor-modal-header">     <h2>ブログ記事レビュー</h2>     <button type="button" class="advisor-modal-close" data-action="blog-close-confirm-dialog">       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">         <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>       </svg>     </button>   </div>   <div class="advisor-modal-body">     <p class="advisor-modal-text advisor-center advisor-muted">SEO観点、EEAT観点、アクセシビリティ観点でブログ記事をレビューします。</p>     <div class="advisor-confirm-buttons">       <button type="button" class="advisor-btn-secondary" data-action="blog-close-confirm-dialog">キャンセル</button>       <button type="button" class="advisor-btn-primary" data-action="blog-start-review">レビュー開始</button>     </div>   </div> </div> `;
    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, () => this.closeConfirmDialog());
    setTimeout(() => overlay.classList.add('active'), 10);
  }

  closeConfirmDialog() {
    const overlay = document.getElementById('blogReviewerConfirmOverlay');
    if (overlay) {
        if (overlay.handleEscape) {
        document.removeEventListener('keydown', overlay.handleEscape);
      }
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  async startReview() {
    if (!this.currentArticle) {
      console.error('[BlogReviewer] startReview called but currentArticle is null');
      alert('レビュー対象の記事が見つかりません。');
      return;
    }
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      this.closeConfirmDialog();
      const resetTimeStr = rateLimit.resetTime
        ? rateLimit.resetTime.toLocaleString('ja-JP')
        : '不明';
      const message = `利用制限に達しました。\n\nリセット時刻: ${resetTimeStr}\n\nMyAPIモード（Header「My API」設定）で自分のOpenAI APIキーを使用すると無制限利用できます。`;
      alert(message);
      return;
    }
    this.closeConfirmDialog();
    this.showReviewView();
    await this.fetchReview();
  }

  showReviewView() {
    const container = document.querySelector('.container');
    if (!container) return;
    const reviewView = document.createElement('div');
    reviewView.id = 'blogReviewerView';
    reviewView.className = 'advisor-view';
    const headerHtml = this.renderViewHeader(
      'ブログ記事レビュー',
      'blog-close-review-view',
` <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/> </svg> `
    );
reviewView.innerHTML = ` ${headerHtml} <div class="advisor-view-content">   <div class="advisor-job-panel">     <h3 class="advisor-accordion-header" data-action="blog-reviewer-toggle-article-section">       <span class="advisor-accordion-icon">▼</span>記事情報     </h3>     <div class="advisor-job-content advisor-accordion-content" id="blogReviewerArticleContent">       ${this.formatArticle(this.currentArticle)}     </div>   </div>   <div class="advisor-resize-handle" data-resize-target="blog-reviewer"></div>   <div class="advisor-advice-panel">     <h3 class="advisor-accordion-header" data-action="blog-reviewer-toggle-review-section">       <span class="advisor-accordion-icon">▼</span>AI分析結果     </h3>     <div class="advisor-advice-content advisor-accordion-content" id="blogReviewerReviewContent">       <div class="advisor-progress-container" id="blogReviewerProgressContainer">         <div class="advisor-progress-bar">           <div class="advisor-progress-fill" id="blogReviewerProgressFill"></div>         </div>         <div class="advisor-progress-text" id="blogReviewerProgressText">準備中...</div>       </div>       <div class="advisor-skeleton-loader" id="blogReviewerSkeletonLoader">         <div class="advisor-skeleton-item large"></div>         <div class="advisor-skeleton-item medium"></div>         <div class="advisor-skeleton-item medium"></div>         <div class="advisor-skeleton-item small"></div>         <div style="height: 8px;"></div>         <div class="advisor-skeleton-item large"></div>         <div class="advisor-skeleton-item medium"></div>         <div class="advisor-skeleton-item medium"></div>         <div class="advisor-skeleton-item small"></div>       </div>       <div class="advisor-markdown" id="blogReviewerMarkdown"></div>     </div>     <div id="blogReviewerExportButtons" class="advisor-export-buttons"></div>   </div>   <div id="blogReviewerChatContainer" class="advisor-chat-container"></div> </div> `;
    container.style.display = 'none';
    document.body.appendChild(reviewView);
    setTimeout(() => {
      reviewView.classList.add('active');
        const sel = document.getElementById('blogReviewerModelSelect');
      if (sel) {
        sel.value = this.getSelectedModel();
        sel.addEventListener('change', () => this.setSelectedModel(sel.value));
      }
        this.initResizeHandle('blog-reviewer');
        this.updateHeaderUsageChip();
    }, 10);
  }

  formatArticle(article) {
    const headline = article.headline || article.name || article.title || '不明';
    const author =
      article.author?.name || (typeof article.author === 'string' ? article.author : '不明');
    const datePublished = article.datePublished
      ? new Date(article.datePublished).toLocaleDateString('ja-JP')
      : '不明';
    const dateModified = article.dateModified
      ? new Date(article.dateModified).toLocaleDateString('ja-JP')
      : '不明';
    const description = article.description || article.abstract || '説明なし';
    const image = article.image;
    console.log('[BlogReviewer] formatArticle called - image available:', !!image);
    const MAX_BODY_LENGTH = 1000;
    let articleBody = article.articleBody || '本文なし';
    let isTruncated = false;
    if (articleBody !== '本文なし' && articleBody.length > MAX_BODY_LENGTH) {
      articleBody = articleBody.substring(0, MAX_BODY_LENGTH);
      isTruncated = true;
    }
    let html = '';
    if (this.currentUrl) {
html += ` <div class="job-field"> <label>分析元URL</label> <div class="job-value"> <a href="${this.escapeHtml(this.currentUrl)}" target="_blank" rel="noopener noreferrer" style="color: var(--link-color); text-decoration: underline; word-break: break-all;"> ${this.escapeHtml(this.currentUrl)} </a> </div> </div> `;
    }
    if (image) {
html += ` <div class="job-field"> <label>OGP画像</label> <div class="job-value" style="text-align: center;"> <img src="${this.escapeHtml(image)}" alt="OGP" loading="lazy" onerror="this.parentElement.parentElement.style.display='none'" style="max-width: 100%; max-height: 300px; border-radius: 4px; border: 1px solid var(--border-color); display: block;" > </div> </div> `;
    }
html += ` <div class="job-field"> <label>タイトル</label> <div class="job-value">${this.escapeHtml(headline)}</div> </div> <div class="job-field"> <label>著者</label> <div class="job-value">${this.escapeHtml(author)}</div> </div> <div class="job-field"> <label>公開日</label> <div class="job-value">${this.escapeHtml(datePublished)}</div> </div> <div class="job-field"> <label>最終更新日</label> <div class="job-value">${this.escapeHtml(dateModified)}</div> </div> <div class="job-field"> <label>説明</label> <div class="job-value job-description">${this.escapeHtml(description)}</div> </div> `;
    if (articleBody && articleBody !== '本文なし') {
html += ` <div class="job-field"> <label>本文</label> <div class="job-value job-description"> ${this.escapeHtml(articleBody)}${isTruncated ? '<span class="text-muted">...（省略）</span>' : ''} </div> </div> `;
    }
    return html;
  }

  async fetchReview() {
    if (window.isDebugMode && window.isDebugMode()) {
      console.log('[BlogReviewer] Debug mode enabled - using mock data');
      this.renderMockReview();
      return;
    }
    if (!canStartAnalysis('blog-reviewer')) {
      alert('別の分析が実行中です。しばらくお待ちください。');
      return;
    }
    const reviewContent = document.getElementById('blogReviewerReviewContent');
    if (!reviewContent) return;
    this.isStreaming = true;
    setAnalysisActive('blog-reviewer'); // グローバルにアクティブ化
    const abortController = new AbortController();
    window.ANALYSIS_STATE.abortControllers['blog-reviewer'] = abortController;
    const timeoutId = setTimeout(() => {
      if (this.isStreaming) {
        console.warn('[BlogReviewer] Analysis timeout - forcing completion');
        this.isStreaming = false;
        abortController.abort();
        this.updateProgress(100, '完了');
        const progressContainer = document.getElementById('blogReviewerProgressContainer');
        if (progressContainer) {
          progressContainer.style.display = 'none';
        }
        alert('分析がタイムアウトしました。取得できた範囲で結果を表示しています。');
      }
    }, 180000); // 180秒
    try {
      const isVercel = window.location.hostname.includes('vercel.app');
      const apiUrl = isVercel ? '/api/blog-reviewer' : 'http://127.0.0.1:3333/api/blog-reviewer';
      const userApiKey = this.getUserApiKey();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article: this.currentArticle,
          userApiKey: userApiKey || undefined,
          model: this.model,
        }),
        signal: abortController.signal,
      });
      if (!response.ok) {
            if (response.status === 429) {
          try {
            const errorData = await response.json();
            const resetTime = new Date(errorData.resetTime).toLocaleTimeString('ja-JP');
            throw new Error(
              `レート制限に達しました。${resetTime}にリセットされます。` +
                '\n\nMyAPIモードで自分のOpenAI APIキーを使用すると、無制限で利用できます。'
            );
          } catch (e) {
            throw new Error(
              'レート制限に達しました。24時間後に再度試してください。' +
                '\n\nMyAPIモードで自分のOpenAI APIキーを使用すると、無制限で利用できます。'
            );
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
        const md = document.getElementById('blogReviewerMarkdown');
      if (!md) {
        throw new Error('マークダウン要素が見つかりません');
      }
      this.updateProgress(0, '初期化中...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      let firstTokenReceived = false;
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
                this.updateProgress(100, '完了');
                            const progressContainer = document.getElementById('blogReviewerProgressContainer');
                if (progressContainer) {
                  progressContainer.style.display = 'none';
                }
                            this.recordUsage();
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.model) {
                  this.currentArticle.model = parsed.model;
                  console.log('[BlogReviewer] Received model:', parsed.model);
                } else if (parsed.content) {
                  fullText += parsed.content;
                                if (!firstTokenReceived) {
                    firstTokenReceived = true;
                    const skeletonLoader = document.getElementById('blogReviewerSkeletonLoader');
                    if (skeletonLoader) {
                      skeletonLoader.style.display = 'none';
                    }
                    this.updateProgress(10, '分析開始...');
                  }
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
                                console.log('[BlogReviewer] Received usage:', parsed.usage);
                  this.currentUsage = parsed.usage;
                  this.displayUsage();
                  this.showExportButtons();
                  this.currentReviewContent = fullText;
                  this.initChatBox();
                  this.scrollToFooter();
                  this.addToAccumulatedUsage(parsed.usage);
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.warn('[BlogReviewer] Failed to parse streaming data:', e);
              }
            }
          }
        }
      } finally {
            reader.cancel().catch(err => console.warn('Reader cancel failed:', err));
            this.isStreaming = false;
        setAnalysisInactive('blog-reviewer');
        delete window.ANALYSIS_STATE.abortControllers['blog-reviewer'];
      }
    } catch (error) {
        const progressContainer = document.getElementById('blogReviewerProgressContainer');
      const skeletonLoader = document.getElementById('blogReviewerSkeletonLoader');
      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
      if (skeletonLoader) {
        skeletonLoader.style.display = 'none';
      }
        if (error.name === 'AbortError') {
        console.log('[BlogReviewer] 分析がキャンセルされました');
        const md = document.getElementById('blogReviewerMarkdown');
        if (md) {
          md.innerHTML = '<div class="advisor-notice"><p>分析がキャンセルされました</p></div>';
        }
        return;
      }
      console.error('BlogReviewer fetch error:', error);
      const isVercel = window.location.hostname.includes('vercel.app');
      const errorMessage = isVercel
        ? '予期せぬエラーが発生しました。時間をおいて再度お試しください。'
        : this.escapeHtml(error.message);
      const md = document.getElementById('blogReviewerMarkdown');
      if (md) {
md.innerHTML = ` <div class="advisor-error"> <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"> <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/> <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/> </svg> <p>AI分析に失敗しました</p> <p class="advisor-error-detail">${errorMessage}</p> <button class="advisor-btn-primary" data-action="blog-fetch-review"> 再試行 </button> </div> `;
      }
    } finally {
        clearTimeout(timeoutId);
    }
  }

  renderMarkdown(markdown) {
    return this.renderMarkdownCommon(markdown);
  }

  scrollToFooter() {
    setTimeout(() => {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }
    }, 500); // 完了後少し待ってからスクロール
  }

  updateProgress(percentage, text) {
    const fill = document.getElementById('blogReviewerProgressFill');
    const textEl = document.getElementById('blogReviewerProgressText');
    if (fill) {
      fill.style.width = Math.min(percentage, 100) + '%';
    }
    if (textEl) {
      textEl.textContent = text;
    }
  }

  toggleAccordion(section) {
    const contentId =
      section === 'article' ? 'blogReviewerArticleContent' : 'blogReviewerReviewContent';
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

  updateHeaderUsageChip() {
    const chip = document.getElementById('blogReviewerHeaderUsage');
    const cur = document.getElementById('blogReviewerHeaderUsageTokens');
    const total = document.getElementById('blogReviewerHeaderUsageTotal');
    if (!chip || !cur || !total) return;
    if (this.currentUsage) {
      const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = this.currentUsage;
      cur.textContent = `${total_tokens.toLocaleString()} tok`;
      chip.style.display = 'inline-flex';
    }
    const acc = this.getAccumulatedUsage();
    const totalTokens = acc?.total_tokens || 0;
    total.textContent = `${totalTokens.toLocaleString()} tok`;
  }

  getAccumulatedUsage() {
    try {
      const mode = localStorage.getItem(this.config.USAGE_MODE_KEY) || 'session';
      const dataStr =
        mode === 'session'
          ? sessionStorage.getItem(this.config.USAGE_TOTAL_KEY)
          : localStorage.getItem(this.config.USAGE_TOTAL_KEY);
      return dataStr
        ? JSON.parse(dataStr)
        : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    } catch (e) {
      console.warn('[BlogReviewer] Failed to get accumulated usage:', e);
      return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }
  }

  saveAccumulatedUsage(usage) {
    try {
      const mode = localStorage.getItem(this.config.USAGE_MODE_KEY) || 'session';
      const dataStr = JSON.stringify(usage);
      if (mode === 'session') {
        sessionStorage.setItem(this.config.USAGE_TOTAL_KEY, dataStr);
      } else {
        localStorage.setItem(this.config.USAGE_TOTAL_KEY, dataStr);
      }
    } catch (e) {
      console.warn('[BlogReviewer] Failed to save accumulated usage:', e);
    }
  }

  addToAccumulatedUsage(usage) {
    const acc = this.getAccumulatedUsage();
    const merged = {
      prompt_tokens: (acc.prompt_tokens || 0) + (usage.prompt_tokens || 0),
      completion_tokens: (acc.completion_tokens || 0) + (usage.completion_tokens || 0),
      total_tokens: (acc.total_tokens || 0) + (usage.total_tokens || 0),
    };
    this.saveAccumulatedUsage(merged);
    this.updateHeaderUsageChip();
  }

  setUsageMode(mode) {
    if (mode !== 'session' && mode !== 'permanent') return;
    localStorage.setItem(this.config.USAGE_MODE_KEY, mode);
    this.updateHeaderUsageChip();
  }

  displayUsage() {
    if (!this.currentUsage) {
      console.log('[BlogReviewer] No usage data to display');
      return;
    }
    console.log('[BlogReviewer] Displaying usage:', this.currentUsage);
    const model = this.currentArticle.model || 'gpt-5-nano';
    const usageHtml = this.renderApiUsagePanel(this.currentUsage, model);
    const reviewContent = document.getElementById('blogReviewerReviewContent');
    console.log('[BlogReviewer] reviewContent element:', reviewContent);
    if (reviewContent) {
      const markdownDiv = reviewContent.querySelector('.advisor-markdown');
      console.log('[BlogReviewer] markdownDiv element:', markdownDiv);
      if (markdownDiv) {
            const existingPanel = reviewContent.querySelector('.advisor-usage-panel');
        if (existingPanel) existingPanel.remove();
        markdownDiv.insertAdjacentHTML('afterend', usageHtml);
        console.log('[BlogReviewer] Usage HTML inserted');
      }
    }
  }

  closeReviewView() {
    this.isStreaming = false;
    const modals = document.querySelectorAll('.advisor-modal-overlay');
    modals.forEach(modal => modal.remove());
    const view = document.getElementById('blogReviewerView');
    if (view) {
      view.classList.remove('active');
      setTimeout(() => view.remove(), 300);
    }
    const container = document.querySelector('.container');
    if (container) {
      container.style.display = '';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showExportButtons() {
    const exportContainer = document.getElementById('blogReviewerExportButtons');
    if (!exportContainer) return;
    this.showExportButtonsCommon(
      'blogReviewerExportButtons',
      () => this.exportToCSV(),
      () => this.exportToPDF()
    );
  }

  exportToCSV() {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const articleContent = document.getElementById('blogReviewerArticleContent');
      const reviewContent = document.querySelector('.advisor-markdown');
        const articleText = articleContent
        ? this.cleanHtmlText(articleContent.innerText)
        : '情報なし';
      const reviewText = reviewContent ? reviewContent.innerText : '情報なし';
        const csvLines = [];
        csvLines.push('項目,値');
        csvLines.push('記事情報（タイトル）,');
      const articleLines = articleText.split('\n').filter(line => line.trim().length > 0);
      articleLines.slice(0, 1).forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`)); // 最初の行（タイトル）
      csvLines.push('記事情報（詳細）,');
      articleLines.slice(1).forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`)); // 残りの行（詳細）
        csvLines.push('AI分析結果,');
      const reviewLines = reviewText.split('\n').filter(line => line.trim().length > 0);
      reviewLines.forEach(line => csvLines.push(`,${this.escapeCsvValue(line)}`));
        csvLines.push(','); // 空行
      csvLines.push(`使用モデル,${this.model}`);
      csvLines.push(`入力トークン数,${this.currentUsage.prompt_tokens}`);
      csvLines.push(`出力トークン数,${this.currentUsage.completion_tokens}`);
        const previewHtml = this.generateCsvPreview(csvLines);
        const filename = `blog_review_${timestamp}.csv`;
        this.showExportPreview(
        'CSVエクスポート - プレビュー',
        previewHtml,
        () => {
                const csvContent = '\ufeff' + csvLines.join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          this.downloadFile(blob, filename);
          console.log('[BlogReviewer] CSV export successful:', filename);
        },
        'table'
      );
    } catch (error) {
      console.error('[BlogReviewer] CSV export failed:', error);
      alert('CSVエクスポートに失敗しました。');
    }
  }

  generateCsvPreview(csvLines) {
    let html = '<table class="csv-preview-table"><thead><tr>';
    const headerCells = csvLines[0].split(',');
    headerCells.forEach(cell => {
      html += `<th>${this.escapeHtml(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';
    for (let i = 1; i < csvLines.length; i++) {
      const cells = this.parseCsvLine(csvLines[i]);
      html += '<tr>';
      cells.forEach((cell, index) => {
            const className = cell.trim() === '' && index === 0 ? 'csv-cell-indent' : '';
        html += `<td class="${className}">${this.escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  parseCsvLine(line) {
    const cells = [];
    let currentCell = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
                currentCell += '"';
          i++;
        } else {
                inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
            cells.push(currentCell);
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell);
    return cells;
  }

  exportToPDF() {
    try {
      const timestamp = new Date().toLocaleString('ja-JP');
      const articleContent = document.getElementById('blogReviewerArticleContent');
      const reviewContent = document.querySelector('.advisor-markdown');
      const articleText = articleContent ? articleContent.innerText : '情報なし';
      const reviewText = reviewContent ? reviewContent.innerText : '情報なし';
const htmlContent = ` <!DOCTYPE html> <html lang="ja"> <head> <meta charset="UTF-8"> <title>ブログ記事レビュー結果エクスポート</title> <style> body { font-family: "Segoe UI", "Hiragino Sans", "Yu Gothic", sans-serif; margin: 20px; line-height: 1.6; color: #1a1a1a; background-color: #ffffff; } h1 { text-align: center; border-bottom: 2px solid #5a7ca3; padding-bottom: 10px; color: #5a7ca3; } .section { margin: 30px 0; page-break-inside: avoid; } .section h2 { border-left: 4px solid #5a7ca3; padding-left: 10px; margin-top: 0; color: #2c3e50; } .content { background-color: #fafafa; padding: 15px; border: 1px solid #e0e0e0; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; font-size: 13px; color: #1a1a1a; } .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 11px; color: #666; } .footer .metadata { margin-top: 15px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 10px; color: #888; } .footer .metadata p { margin: 4px 0; } @media print { body { margin: 0; } .section { page-break-inside: avoid; } } </style> </head> <body> <h1>ブログ記事レビュー結果エクスポート</h1>  <div class="section"> <h2>記事情報</h2> <div class="content">${this.escapeHtml(articleText)}</div> </div>  <div class="section"> <h2>AI分析結果</h2> <div class="content">${this.escapeHtml(reviewText)}</div> </div>  <div class="footer"> <p>このドキュメントは自動生成されました。</p> <p>ブラウザの「印刷」機能から「PDFに保存」を選択してダウンロードしてください。</p> <div class="metadata"> <p>エクスポート日時: ${timestamp}</p> <p>使用モデル: ${this.model} | トークン使用数: 入力 ${this.currentUsage.prompt_tokens}、出力 ${this.currentUsage.completion_tokens}</p> </div> </div>  <script> </script> </body> </html> `;
        const previewHtml = htmlContent;
        const dateStr = new Date().toISOString().split('T')[0];
      const filename = `blog_review_${dateStr}.html`;
        this.showExportPreview(
        'HTML/PDFエクスポート - プレビュー',
        previewHtml,
        () => {
                const htmlWithBom = '\ufeff' + htmlContent;
          const blob = new Blob([htmlWithBom], { type: 'text/html;charset=utf-8;' });
          this.downloadFile(blob, filename);
          console.log('[BlogReviewer] PDF export successful (HTML形式):', filename);
        },
        'html'
      );
    } catch (error) {
      console.error('[BlogReviewer] PDF export failed:', error);
      alert('PDFエクスポートに失敗しました。');
    }
  }

  initChatBox() {
    const chatConfig = {
      type: 'blog-reviewer',
      containerId: 'blogReviewerChatContainer',
      context: {
        article: this.currentArticle,
        analysis: this.currentReviewContent || '',
      },
      chatMessagesId: 'blogReviewerChatMessages',
      chatInputId: 'blogReviewerChatInput',
      chatSendBtnId: 'blogReviewerChatSendBtn',
    };
    this.renderFloatingChatButton('blogReviewerChatContainer', chatConfig);
  }

  renderMockReview() {
    console.log('[BlogReviewer] Rendering mock review');
    const reviewContent = document.getElementById('blogReviewerReviewContent');
    const progressContainer = document.getElementById('blogReviewerProgressContainer');
    const skeletonLoader = document.getElementById('blogReviewerSkeletonLoader');
    const md = document.getElementById('blogReviewerMarkdown');
    if (!reviewContent || !md) {
      console.error('[BlogReviewer] Required elements not found');
      return;
    }
    if (progressContainer) {
      progressContainer.style.display = 'block';
    }
    if (skeletonLoader) {
      skeletonLoader.style.display = 'block';
    }
    const mockData = window.DEBUG_MOCK_DATA?.blog?.sample1;
    if (!mockData) {
      console.error('[BlogReviewer] Mock data not found');
      md.innerHTML = '<p>デバッグデータが見つかりません</p>';
      return;
    }
    const mockAnalysis = mockData.mockAnalysis;
    if (!mockAnalysis) {
      console.error('[BlogReviewer] Mock analysis not found');
      md.innerHTML = '<p>デバッグデータが見つかりません</p>';
      return;
    }
    this.updateProgress(0, '初期化中...');
    setTimeout(() => {
        if (skeletonLoader) {
        skeletonLoader.style.display = 'none';
      }
      this.updateProgress(30, '分析中...');
      setTimeout(() => {
        this.updateProgress(60, '分析中...');
        setTimeout(() => {
          this.updateProgress(90, '完了間近...');
          setTimeout(() => {
                    md.innerHTML = this.renderMarkdownCommon(mockAnalysis);
            this.currentReviewContent = mockAnalysis;
            this.updateProgress(100, '完了');
                    if (progressContainer) {
              progressContainer.style.display = 'none';
            }
                    this.currentUsage = {
              prompt_tokens: 1200,
              completion_tokens: 600,
              total_tokens: 1800,
            };
            this.currentModel = 'gpt-4o (mock)';
                    this.displayUsage();
                    this.showExportButtons();
                    this.initChatBox();
            console.log('[BlogReviewer] Mock review rendering completed');
          }, 500);
        }, 500);
      }, 500);
    }, 500);
  }
}
const blogReviewerManager = new BlogReviewerManager();
window.blogReviewerManager = blogReviewerManager;
