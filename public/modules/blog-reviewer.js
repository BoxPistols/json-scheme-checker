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
        'blog-reset-to-normal-mode': () => this.resetToNormalMode(),
        'blog-close-confirm-dialog': () => this.closeConfirmDialog(),
        'blog-start-review': () => this.startReview(),
        'blog-close-review-view': () => this.closeReviewView(),
        'blog-fetch-review': () => this.fetchReview(),
        'show-blog-confirm-dialog': () => this.showConfirmDialog(),
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

  /**
   * 現在選択されているモデルを取得
   * @returns {string} モデル名
   */
  getSelectedModel() {
    return localStorage.getItem('jsonld_blog_reviewer_model') || window.ADVISOR_CONST.DEFAULT_MODEL;
  }

  /**
   * モデルを選択して保存
   * @param {string} model - 選択されたモデル名
   */
  setSelectedModel(model) {
    this.model = model;
    localStorage.setItem('jsonld_blog_reviewer_model', model);
    console.log(`[BlogReviewer] Model set to: ${model}`);
  }

  // getModelPricingメソッドは削除（BaseAdvisorManagerの共通メソッドを使用）
  // BaseAdvisorManagerのgetModelPricingは1000トークンあたりの価格なので、
  // 計算時に調整が必要

  /**
   * レビュー対象のリモートHTMLを設定
   * @param {string} html - 取得したリモートHTML
   */
  setRemoteHtml(html) {
    try {
      const parser = new DOMParser();
      this.remoteDoc = parser.parseFromString(html, 'text/html');
    } catch (e) {
      console.warn('[BlogReviewer] Remote HTMLのパースに失敗:', e);
      this.remoteDoc = null;
    }
  }

  /**
   * Article/BlogPostingスキーマを検出してレビューボタンを表示
   * @param {Array} jsonLdData - 抽出されたJSON-LDデータ
   */
  detectBlogPost(jsonLdData) {
    console.log('[BlogReviewerManager] detectBlogPost called with:', jsonLdData);
    console.log('[BlogReviewerManager] Number of schemas:', jsonLdData?.length);

    // 既存のボタンを削除
    this.hideReviewButton();

    if (!jsonLdData || !Array.isArray(jsonLdData) || jsonLdData.length === 0) {
      console.warn('[BlogReviewerManager] jsonLdData is empty or not an array');
      return;
    }

    // デバッグ: 各アイテムの@typeをログ出力
    jsonLdData.forEach((item, index) => {
      console.log(`[BlogReviewerManager] Schema ${index + 1} @type:`, item['@type']);
    });

    // Article または BlogPosting を検索
    const article = jsonLdData.find(
      item =>
        item['@type'] === 'Article' ||
        item['@type'] === 'BlogPosting' ||
        item['@type']?.includes('Article') ||
        item['@type']?.includes('BlogPosting')
    );

    console.log('[BlogReviewerManager] Article/BlogPosting detected:', article);

    if (article) {
      // HTMLから不足情報を補完
      this.currentArticle = this.enrichArticleData(article);
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

    // description が欠けている場合、メタタグから取得
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

    // articleBody が欠けている場合、HTMLから抽出
    if (!enriched.articleBody) {
      const root = this.remoteDoc || document; // 取得済みのリモートHTMLを優先
      let bodyText = '';
      console.log('[BlogReviewer] articleBody not found in JSON-LD, extracting from HTML...');

      // 方法1: <article>タグから抽出
      const articleElement = root.querySelector('article');
      console.log('[BlogReviewer] article element:', articleElement);
      if (articleElement) {
        bodyText = this.extractTextContent(articleElement);
        console.log('[BlogReviewer] Extracted from <article>:', bodyText.substring(0, 200));
      }

      // 方法2: main要素から抽出（articleがない場合）
      if (!bodyText) {
        const mainElement = root.querySelector('main');
        console.log('[BlogReviewer] main element:', mainElement);
        if (mainElement) {
          bodyText = this.extractTextContent(mainElement);
          console.log('[BlogReviewer] Extracted from <main>:', bodyText.substring(0, 200));
        }
      }

      // 方法3: 汎用的なセレクタで本文候補を探す
      if (!bodyText) {
        console.log('[BlogReviewer] Trying generic content selectors...');

        // セマンティックHTMLと一般的なCMSクラスを優先順に試す
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

  /**
   * HTML要素からテキストコンテンツを抽出
   * @param {HTMLElement} element - 抽出元の要素
   * @returns {string} 抽出されたテキスト
   */
  extractTextContent(element) {
    if (!element) return '';

    // スクリプトやスタイルタグを除外（パフォーマンス最適化：単一クエリで実行）
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

    // 単一のクエリで全要素を取得して削除
    clone.querySelectorAll(excludeSelector).forEach(el => el.remove());

    let text = clone.textContent
      .replace(/\s+/g, ' ') // 連続する空白を1つに
      .trim();

    // 不要なフレーズを削除（Basic認証ダイアログの残骸など）
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

  /**
   * レビューボタンを表示
   */
  showReviewButton() {
    const actionsContainer =
      document.getElementById('aiActions') || document.getElementById('results');
    console.log('[BlogReviewerManager] showReviewButton called');
    console.log('[BlogReviewerManager] actions container:', actionsContainer);
    console.log('[BlogReviewerManager] actions container found:', !!actionsContainer);

    if (!actionsContainer) {
      console.error('[BlogReviewerManager] ERROR: actions container not found');
      // フォールバック: schemasContainerを探す
      const schemasContainer = document.getElementById('schemasContainer');
      if (schemasContainer) {
        console.log('[BlogReviewerManager] Using schemasContainer as fallback');
        const button = this.createReviewButton();
        schemasContainer.parentElement.insertBefore(button, schemasContainer);
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
    actionsContainer.insertBefore(button, actionsContainer.firstChild);
    console.log('[BlogReviewerManager] Review button inserted into DOM');
  }

  /**
   * レビューボタンを作成
   * @returns {HTMLButtonElement}
   */
  createReviewButton() {
    const button = document.createElement('button');
    button.id = 'blogReviewerTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.type = 'button';
    button.dataset.action = 'show-blog-confirm-dialog';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ブログ記事レビューを受ける
    `;
    console.log('[BlogReviewerManager] Review button created');
    return button;
  }

  /**
   * レビューボタンを非表示
   */
  hideReviewButton() {
    const btn = document.getElementById('blogReviewerTriggerBtn');
    if (btn) btn.remove();
  }

  /**
   * レビュー実行確認ダイアログを表示
   * Dialog内にはAPI関連情報は含めない（API設定はHeaderのMy APIで管理）
   */
  showConfirmDialog() {
    // currentArticleがnullの場合は何もしない（誤動作防止）
    if (!this.currentArticle) {
      console.warn('[BlogReviewer] showConfirmDialog called but currentArticle is null');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'blogReviewerConfirmOverlay';
    overlay.className = 'advisor-overlay';
    overlay.innerHTML = `
      <div class="advisor-modal">
        <div class="advisor-modal-header">
          <h2>ブログ記事レビュー</h2>
          <button type="button" class="advisor-modal-close" data-action="blog-close-confirm-dialog">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          <p class="advisor-modal-text advisor-center advisor-muted">SEO観点、EEAT観点、アクセシビリティ観点でブログ記事をレビューします。</p>
          <div class="advisor-confirm-buttons">
            <button type="button" class="advisor-btn-secondary" data-action="blog-close-confirm-dialog">キャンセル</button>
            <button type="button" class="advisor-btn-primary" data-action="blog-start-review">レビュー開始</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, () => this.closeConfirmDialog());

    setTimeout(() => overlay.classList.add('active'), 10);
  }

  /**
   * 確認ダイアログを閉じる
   */
  closeConfirmDialog() {
    const overlay = document.getElementById('blogReviewerConfirmOverlay');
    if (overlay) {
      // Escapeキーリスナーをクリーンアップ
      if (overlay.handleEscape) {
        document.removeEventListener('keydown', overlay.handleEscape);
      }
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * レビューを開始
   */
  async startReview() {
    // currentArticleがnullの場合は何もしない（誤動作防止）
    if (!this.currentArticle) {
      console.error('[BlogReviewer] startReview called but currentArticle is null');
      alert('レビュー対象の記事が見つかりません。');
      return;
    }

    // レート制限チェック
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

  /**
   * レビュー表示画面を表示
   */
  showReviewView() {
    const container = document.querySelector('.container');
    if (!container) return;

    const reviewView = document.createElement('div');
    reviewView.id = 'blogReviewerView';
    reviewView.className = 'advisor-view';
    const headerHtml = this.renderViewHeader(
      'ブログ記事レビュー',
      'blog-close-review-view',
      `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `
    );
    reviewView.innerHTML = `
      ${headerHtml}
      <div class="advisor-view-content">
        <div class="advisor-job-panel">
          <h3>記事情報</h3>
          <div class="advisor-job-content" id="blogReviewerArticleContent">
            ${this.formatArticle(this.currentArticle)}
          </div>
        </div>
        <div class="advisor-advice-panel">
          <h3>AI分析結果</h3>
          <div class="advisor-advice-content" id="blogReviewerReviewContent">
            <div class="advisor-loading">
              <div class="advisor-spinner"></div>
              <p>AI分析中...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.style.display = 'none';
    document.body.appendChild(reviewView);

    setTimeout(() => {
      reviewView.classList.add('active');
      // モデルセレクト初期化
      const sel = document.getElementById('blogReviewerModelSelect');
      if (sel) {
        sel.value = this.getSelectedModel();
        sel.addEventListener('change', () => this.setSelectedModel(sel.value));
      }
      // 初期表示時点で累積表示を更新
      this.updateHeaderUsageChip();
    }, 10);
  }

  /**
   * Articleデータをフォーマット
   * @param {Object} article - Articleオブジェクト
   * @returns {string} HTML文字列
   */
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

    // 記事本文を取得（最大1000文字で省略）
    const MAX_BODY_LENGTH = 1000;
    let articleBody = article.articleBody || '本文なし';
    let isTruncated = false;

    if (articleBody !== '本文なし' && articleBody.length > MAX_BODY_LENGTH) {
      articleBody = articleBody.substring(0, MAX_BODY_LENGTH);
      isTruncated = true;
    }

    return `
      <div class="job-field">
        <label>タイトル</label>
        <div class="job-value">${this.escapeHtml(headline)}</div>
      </div>
      <div class="job-field">
        <label>著者</label>
        <div class="job-value">${this.escapeHtml(author)}</div>
      </div>
      <div class="job-field">
        <label>公開日</label>
        <div class="job-value">${this.escapeHtml(datePublished)}</div>
      </div>
      <div class="job-field">
        <label>最終更新日</label>
        <div class="job-value">${this.escapeHtml(dateModified)}</div>
      </div>
      <div class="job-field">
        <label>説明</label>
        <div class="job-value job-description">${this.escapeHtml(description)}</div>
      </div>
      ${
        articleBody && articleBody !== '本文なし'
          ? `
      <div class="job-field">
        <label>本文</label>
        <div class="job-value job-description">
          ${this.escapeHtml(articleBody)}${isTruncated ? '<span class="text-muted">...（省略）</span>' : ''}
        </div>
      </div>
      `
          : ''
      }
    `;
  }

  /**
   * AIレビューを取得（ストリーミング）
   */
  async fetchReview() {
    // グローバルな分析実行状態をチェック（複数の分析の同時実行を防ぐ）
    if (!canStartAnalysis('blog-reviewer')) {
      alert('別の分析が実行中です。しばらくお待ちください。');
      return;
    }

    const reviewContent = document.getElementById('blogReviewerReviewContent');
    if (!reviewContent) return;

    this.isStreaming = true;
    setAnalysisActive('blog-reviewer'); // グローバルにアクティブ化

    // AbortControllerを作成してグローバルに保存
    const abortController = new AbortController();
    window.ANALYSIS_STATE.abortControllers['blog-reviewer'] = abortController;

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
        // 429 Too Many Requests: レート制限エラー
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

      reviewContent.innerHTML = '<div class="advisor-markdown"></div>';
      const markdownDiv = reviewContent.querySelector('.advisor-markdown');

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
                if (parsed.model) {
                  this.currentArticle.model = parsed.model;
                  console.log('[BlogReviewer] Received model:', parsed.model);
                } else if (parsed.content) {
                  fullText += parsed.content;
                  markdownDiv.innerHTML = this.renderMarkdown(fullText);
                } else if (parsed.usage) {
                  // usage情報を保存して表示
                  console.log('[BlogReviewer] Received usage:', parsed.usage);
                  this.currentUsage = parsed.usage;
                  this.displayUsage();
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
        // ストリームを確実にキャンセル
        reader.cancel().catch(err => console.warn('Reader cancel failed:', err));

        // グローバルな分析状態をクリア
        this.isStreaming = false;
        setAnalysisInactive('blog-reviewer');
        delete window.ANALYSIS_STATE.abortControllers['blog-reviewer'];
      }
    } catch (error) {
      // AbortError（キャンセル）の場合
      if (error.name === 'AbortError') {
        console.log('[BlogReviewer] 分析がキャンセルされました');
        reviewContent.innerHTML =
          '<div class="advisor-notice"><p>分析がキャンセルされました</p></div>';
        return;
      }

      console.error('BlogReviewer fetch error:', error);
      const isVercel = window.location.hostname.includes('vercel.app');
      const errorMessage = isVercel
        ? '予期せぬエラーが発生しました。時間をおいて再度お試しください。'
        : this.escapeHtml(error.message);

      reviewContent.innerHTML = `
        <div class="advisor-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>AI分析に失敗しました</p>
          <p class="advisor-error-detail">${errorMessage}</p>
          <button class="advisor-btn-primary" data-action="fetch-review">
            再試行
          </button>
        </div>
      `;
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

    // 見出しの直後の <br> を削除（h1, h2, h3）
    html = html.replace(/<\/(h[123])><br>/g, '</$1>');

    // 連続する<li>タグを<ul>で囲む（改行変換後に実行）
    html = html.replace(
      /((?:<li>.*?<\/li>(?:<br>)*)+)/g,
      match => `<ul>${match.replace(/<br>/g, '')}</ul>`
    );

    // </li> の直後の <br> を削除
    html = html.replace(/<\/li><br>/g, '</li>');

    return html;
  }
  /**
   * ヘッダの使用量チップを更新
   */
  updateHeaderUsageChip() {
    const chip = document.getElementById('blogReviewerHeaderUsage');
    const cur = document.getElementById('blogReviewerHeaderUsageTokens');
    const total = document.getElementById('blogReviewerHeaderUsageTotal');
    if (!chip || !cur || !total) return;

    // 現回
    if (this.currentUsage) {
      const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = this.currentUsage;
      cur.textContent = `${total_tokens.toLocaleString()} tok`;
      chip.style.display = 'inline-flex';
    }

    // 累計
    const acc = this.getAccumulatedUsage();
    const totalTokens = acc?.total_tokens || 0;
    total.textContent = `${totalTokens.toLocaleString()} tok`;
  }

  /**
   * 累積使用量の取得/保存
   */
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

  /**
   * 累積モード切替（セッション or 永続）
   */
  setUsageMode(mode) {
    // mode: 'session' | 'permanent'
    if (mode !== 'session' && mode !== 'permanent') return;
    localStorage.setItem(this.config.USAGE_MODE_KEY, mode);
    this.updateHeaderUsageChip();
  }

  /**
   * API usage情報を表示
   */
  displayUsage() {
    if (!this.currentUsage) {
      console.log('[BlogReviewer] No usage data to display');
      return;
    }

    console.log('[BlogReviewer] Displaying usage:', this.currentUsage);

    // モデル名を取得
    const model = this.currentArticle.model || 'gpt-5-nano';

    // BaseAdvisorManagerの共通メソッドを使用してHTML生成
    const usageHtml = this.renderApiUsagePanel(this.currentUsage, model);

    // レビューコンテンツの末尾に追加
    const reviewContent = document.getElementById('blogReviewerReviewContent');
    console.log('[BlogReviewer] reviewContent element:', reviewContent);
    if (reviewContent) {
      const markdownDiv = reviewContent.querySelector('.advisor-markdown');
      console.log('[BlogReviewer] markdownDiv element:', markdownDiv);
      if (markdownDiv) {
        // 既存のusageパネルがあれば削除
        const existingPanel = reviewContent.querySelector('.advisor-usage-panel');
        if (existingPanel) existingPanel.remove();
        markdownDiv.insertAdjacentHTML('afterend', usageHtml);
        console.log('[BlogReviewer] Usage HTML inserted');
      }
    }
  }

  /**
   * レビュー画面を閉じる
   */
  closeReviewView() {
    this.isStreaming = false;
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
const blogReviewerManager = new BlogReviewerManager();
