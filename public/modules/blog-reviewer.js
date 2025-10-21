// Blog Reviewer Module

class BlogReviewerManager {
  constructor() {
    this.currentArticle = null;
    this.isStreaming = false;
    this.currentUsage = null; // API usage情報
    this.remoteDoc = null; // 解析対象のリモートHTMLドキュメント
    this.RATE_LIMIT_KEY = 'jsonld_blog_reviewer_usage';
    this.USER_API_KEY = 'jsonld_blog_reviewer_openai_key';
    this.STAKEHOLDER_MODE_KEY = 'jsonld_blog_reviewer_stakeholder';
    this.USAGE_TOTAL_KEY = 'jsonld_usage_blog_reviewer_total';
    this.USAGE_MODE_KEY = 'jsonld_usage_mode'; // 'session' | 'permanent'
    this.MAX_REQUESTS_PER_DAY = 10;
    this.MAX_REQUESTS_STAKEHOLDER = 30;
    // GPT-4o-miniの料金（1トークンあたりのUSD）
    this.PRICE_PER_INPUT_TOKEN = 0.00000015; // $0.15 / 1M tokens
    this.PRICE_PER_OUTPUT_TOKEN = 0.0000006; // $0.6 / 1M tokens
    this.initEventListeners();
  }

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
   * モーダルにEscapeキーリスナーを追加
   * @param {HTMLElement} overlay - オーバーレイ要素
   * @param {Function} closeFunc - 閉じる関数
   */
  addEscapeKeyListener(overlay, closeFunc) {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeFunc.call(this);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * イベントリスナーを初期化
   */
  initEventListeners() {
    document.addEventListener('click', (event) => {
      const target = event.target.closest('button');
      if (!target) return;

      const action = target.dataset.action;
      if (!action) return;

      // onclick属性を使用していた関数のマッピング
      const handlers = {
        'close-stakeholder-prompt': () => this.closeStakeholderPrompt(),
        'confirm-stakeholder': () => this.confirmStakeholder(),
        'close-developer-prompt': () => this.closeDeveloperPrompt(),
        'toggle-developer-key-visibility': () => this.toggleDeveloperKeyVisibility(),
        'save-developer-key': () => this.saveDeveloperKey(),
        'show-stakeholder-prompt': () => this.showStakeholderPrompt(),
        'show-developer-prompt': () => this.showDeveloperPrompt(),
        'reset-to-normal-mode': () => this.resetToNormalMode(),
        'close-confirm-dialog': () => this.closeConfirmDialog(),
        'start-review': () => this.startReview(),
        'close-review-view': () => this.closeReviewView(),
        'fetch-review': () => this.fetchReview(),
        'show-blog-confirm-dialog': () => this.showConfirmDialog(),
      };

      if (handlers[action]) {
        event.preventDefault();
        handlers[action]();
      }
    });
  }

  /**
   * レート制限をチェック
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: Date }
   */
  checkRateLimit() {
    // ユーザーAPIキーがある場合はレート制限をバイパス
    const userApiKey = this.getUserApiKey();
    if (userApiKey) {
      return {
        allowed: true,
        remaining: Infinity,
        resetTime: null,
        usingUserKey: true,
        mode: 'developer',
      };
    }

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const usageData = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '[]');

    // 24時間以内のリクエストをフィルタ
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);

    // 関係者モードのチェック
    const isStakeholder = this.isStakeholderMode();
    const maxRequests = isStakeholder ? this.MAX_REQUESTS_STAKEHOLDER : this.MAX_REQUESTS_PER_DAY;

    const remaining = maxRequests - recentRequests.length;
    const allowed = remaining > 0;

    // 最も古いリクエストから24時間後がリセット時刻
    const resetTime = recentRequests.length > 0 ? new Date(recentRequests[0] + oneDayMs) : null;

    return {
      allowed,
      remaining,
      resetTime,
      usingUserKey: false,
      mode: isStakeholder ? 'stakeholder' : 'normal',
      maxRequests,
    };
  }

  /**
   * レート制限使用履歴を記録
   */
  recordUsage() {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    const usageData = JSON.parse(localStorage.getItem(this.RATE_LIMIT_KEY) || '[]');

    // 24時間以内のリクエストのみ保持
    const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
    recentRequests.push(now);

    localStorage.setItem(this.RATE_LIMIT_KEY, JSON.stringify(recentRequests));
  }

  /**
   * ユーザーAPIキーを取得
   * @returns {string|null}
   */
  getUserApiKey() {
    return localStorage.getItem(this.USER_API_KEY);
  }

  /**
   * ユーザーAPIキーを保存
   * @param {string} apiKey
   */
  saveUserApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem(this.USER_API_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(this.USER_API_KEY);
    }
  }

  /**
   * 関係者モードかチェック
   * @returns {boolean}
   */
  isStakeholderMode() {
    return localStorage.getItem(this.STAKEHOLDER_MODE_KEY) === 'true';
  }

  /**
   * 関係者モードを有効化
   */
  enableStakeholderMode() {
    localStorage.setItem(this.STAKEHOLDER_MODE_KEY, 'true');
  }

  /**
   * 関係者モードを無効化
   */
  disableStakeholderMode() {
    localStorage.removeItem(this.STAKEHOLDER_MODE_KEY);
  }

  /**
   * 関係者確認ダイアログを表示
   */
  showStakeholderPrompt() {
    const overlay = document.createElement('div');
    overlay.className = 'advisor-overlay active';
    overlay.innerHTML = `
      <div class="advisor-modal advisor-confirm-modal">
        <div class="advisor-modal-header">
          <h2>関係者確認</h2>
        </div>
        <div class="advisor-modal-body">
          <p style="margin-bottom: 20px; text-align: center;">あなたは関係者ですか？</p>
          <p style="font-size: 0.85rem; color: var(--secondary-text-color); margin-bottom: 20px; text-align: center;">
            関係者の場合、利用回数が30回/24時間に増加します
          </p>
          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="close-stakeholder-prompt">いいえ</button>
            <button class="advisor-btn-primary" data-action="confirm-stakeholder">はい</button>
          </div>
        </div>
      </div>
    `;
    overlay.id = 'stakeholderPromptBlog';
    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, this.closeStakeholderPrompt);
  }

  /**
   * 関係者確認ダイアログを閉じる
   */
  closeStakeholderPrompt() {
    const overlay = document.getElementById('stakeholderPromptBlog');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * 関係者モード確定
   */
  confirmStakeholder() {
    this.enableStakeholderMode();
    this.closeStakeholderPrompt();
    // 確認画面を再表示
    this.showConfirmDialog();
  }

  /**
   * 開発者モード（APIキー入力）ダイアログを表示
   */
  showDeveloperPrompt() {
    const currentKey = this.getUserApiKey() || '';
    const overlay = document.createElement('div');
    overlay.className = 'advisor-overlay active';
    overlay.innerHTML = `
      <div class="advisor-modal advisor-developer-modal">
        <div class="advisor-modal-header">
          <h2>開発者モード</h2>
          <button class="advisor-modal-close" data-action="close-developer-prompt">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          <p style="margin-bottom: 16px; color: var(--secondary-text-color); font-size: 0.9rem;">
            自分のOpenAI APIキーを使用すると、無制限で利用できます。
          </p>

          <div class="advisor-api-key-wrapper">
            <input type="password" id="developerApiKeyInputBlog" placeholder="sk-proj-..." value="${currentKey}" class="advisor-input">
            <button type="button" data-action="toggle-developer-key-visibility" class="advisor-btn-icon" title="表示/非表示">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
              </svg>
            </button>
          </div>

          <p class="advisor-notice" style="margin-top: 12px;">
            このAPIキーはあなたのブラウザにのみ保存され、サーバーには送信されません。
            OpenAI APIキーは <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI Platform</a> で取得できます。
          </p>

          <p class="advisor-notice advisor-notice-warning" style="margin-top: 12px;">
            <strong>重要:</strong> 開発者モードでは、あなた自身のAPIキーを使用します。
            サービス提供者のAPIキーは使用されません。
            OpenAIの利用規約を遵守してください。
          </p>

          <div class="advisor-confirm-buttons" style="margin-top: 20px;">
            <button class="advisor-btn-secondary" data-action="close-developer-prompt">キャンセル</button>
            <button class="advisor-btn-primary" data-action="save-developer-key">保存</button>
          </div>
        </div>
      </div>
    `;
    overlay.id = 'developerPromptBlog';
    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, this.closeDeveloperPrompt);
  }

  /**
   * 開発者モードダイアログを閉じる
   */
  closeDeveloperPrompt() {
    const overlay = document.getElementById('developerPromptBlog');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * 開発者APIキーを保存
   */
  saveDeveloperKey() {
    const input = document.getElementById('developerApiKeyInputBlog');
    if (input) {
      this.saveUserApiKey(input.value.trim());
      this.closeDeveloperPrompt();
      // 確認画面を再表示
      this.showConfirmDialog();
    }
  }

  /**
   * トリガーボタン横の累積使用量チップ更新
   */
  updateTriggerUsageChip() {
    const btn = document.getElementById('blogReviewerTriggerBtn');
    if (!btn) return;
    let chip = document.getElementById('blogReviewerTriggerUsage');
    if (!chip) {
      chip = document.createElement('span');
      chip.id = 'blogReviewerTriggerUsage';
      chip.style.cssText = 'margin-left:8px; padding:4px 8px; font-size:12px; color:var(--secondary-text-color); border:1px solid var(--border-color); border-radius:999px;';
      btn.insertAdjacentElement('afterend', chip);
    }
    const acc = this.getAccumulatedUsage();
    chip.textContent = `累計: ${(acc.total_tokens || 0).toLocaleString()} tok`;
  }

  /**
   * 開発者APIキーの表示/非表示を切り替え
   */
  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInputBlog');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  /**
   * 通常モードに戻す（関係者モード・開発者モードを解除）
   */
  resetToNormalMode() {
    // 関係者モードを解除
    localStorage.removeItem(this.STAKEHOLDER_MODE_KEY);

    // 開発者モード（APIキー）を解除
    localStorage.removeItem(this.USER_API_KEY);

    // 確認ダイアログを閉じて再表示
    this.closeConfirmDialog();

    alert('通常モードに戻しました。');

    // ダイアログを再表示
    setTimeout(() => this.showConfirmDialog(), 100);
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
      console.log('[BlogReviewerManager] Review button shown with enriched data:', this.currentArticle);
    } else {
      console.log('[BlogReviewerManager] No Article/BlogPosting found in schemas');
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

      // 方法3: 汎用的なセレクタで本文候補を探し、最も長いテキストを採用
      if (!bodyText) {
        console.log('[BlogReviewer] Trying generic content selectors...');

        // セマンティックHTMLと一般的なCMSクラスを優先順に試す
        const contentSelectors = [
          // セマンティックHTML（最優先）
          'article',
          'main',
          '[role="main"]',
          // 一般的なCMS・ブログプラットフォーム共通クラス
          '.entry-content',
          '.post-content',
          '.article-content',
          '.content',
          // WordPress系共通パターン
          '[class*="entry"][class*="content"]',
          '[class*="post"][class*="content"]',
          '[class*="article"][class*="content"]',
          // 汎用パターン（最も緩い）
          '[class*="content"]',
          '[class*="article"]',
          '[class*="post"]'
        ];

        let candidates = [];
        for (const selector of contentSelectors) {
          const elements = root.querySelectorAll(selector);
          elements.forEach(element => {
            const text = this.extractTextContent(element);
            if (text.length > 100) { // 最低100文字以上
              candidates.push({ selector, element, text, length: text.length });
              console.log(`[BlogReviewer] Candidate "${selector}": ${text.length} chars`);
            }
          });
        }

        // 最も長いテキストを持つ候補を選択
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.length - a.length);
          bodyText = candidates[0].text;
          console.log(`[BlogReviewer] Selected best candidate "${candidates[0].selector}" with ${bodyText.length} chars`);
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

    // スクリプトやスタイルタグを除外
    const clone = element.cloneNode(true);
    const excludeSelectors = [
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
      'details'
    ];
    excludeSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });

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
      'パスワード'
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
    const resultDiv = document.getElementById('results');
    console.log('[BlogReviewerManager] showReviewButton called');
    console.log('[BlogReviewerManager] results div:', resultDiv);
    console.log('[BlogReviewerManager] results div found:', !!resultDiv);

    if (!resultDiv) {
      console.error('[BlogReviewerManager] ERROR: results div not found');
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
    resultDiv.insertBefore(button, resultDiv.firstChild);
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
   */
  showConfirmDialog() {
    const rateLimit = this.checkRateLimit();

    let rateLimitHtml = '';
    let modeLabel = '';
    if (rateLimit.mode === 'developer') {
      rateLimitHtml =
        '<div class="advisor-rate-info advisor-rate-unlimited">開発者モード（無制限）</div>';
      modeLabel = '開発者モード';
    } else if (rateLimit.mode === 'stakeholder') {
      if (!rateLimit.allowed) {
        const resetTimeStr = rateLimit.resetTime
          ? rateLimit.resetTime.toLocaleString('ja-JP')
          : '不明';
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
      } else {
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-stakeholder">関係者モード - 残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
      }
      modeLabel = '関係者モード';
    } else {
      if (!rateLimit.allowed) {
        const resetTimeStr = rateLimit.resetTime
          ? rateLimit.resetTime.toLocaleString('ja-JP')
          : '不明';
        rateLimitHtml = `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
      } else {
        rateLimitHtml = `<div class="advisor-rate-info">残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
      }
      modeLabel = '通常モード';
    }

    const overlay = document.createElement('div');
    overlay.id = 'blogReviewerConfirmOverlay';
    overlay.className = 'advisor-overlay';
    overlay.innerHTML = `
      <div class="advisor-modal">
        <div class="advisor-modal-header" style="display: flex; flex-direction: column; align-items: stretch;">
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-bottom: 12px;">
            <div class="advisor-mode-buttons-small">
              ${rateLimit.mode !== 'normal' ? `
                <button class="advisor-mode-btn-small" data-action="reset-to-normal-mode" title="通常モード（10回/24時間）に戻す" style="background: var(--secondary-bg-color); border-color: var(--border-color);">
                  通常モード
                </button>
              ` : ''}
              <button class="advisor-mode-btn-small" data-action="show-stakeholder-prompt" title="関係者は30回/24時間まで利用可能">
                関係者
              </button>
              <button class="advisor-mode-btn-small" data-action="show-developer-prompt" title="自分のAPIキーで無制限利用">
                開発者
              </button>
            </div>
            <button class="advisor-modal-close" data-action="close-confirm-dialog">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <h2 style="margin: 0; width: 100%;">ブログ記事レビュー</h2>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}

          <p style="margin: 20px 0; text-align: center; font-size: 0.95rem;">
            SEO観点、EEAT観点、アクセシビリティ観点でブログ記事をレビューします。
          </p>

          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" data-action="close-confirm-dialog">キャンセル</button>
            <button class="advisor-btn-primary" data-action="start-review">レビュー開始</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.addEscapeKeyListener(overlay, this.closeConfirmDialog);

    setTimeout(() => overlay.classList.add('active'), 10);
  }

  /**
   * 確認ダイアログを閉じる
   */
  closeConfirmDialog() {
    const overlay = document.getElementById('blogReviewerConfirmOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * レビューを開始
   */
  async startReview() {
    // レート制限チェック
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      this.closeConfirmDialog();
      const resetTimeStr = rateLimit.resetTime
        ? rateLimit.resetTime.toLocaleString('ja-JP')
        : '不明';

      let message = `利用制限に達しました。\n\nリセット時刻: ${resetTimeStr}\n\n`;
      if (rateLimit.mode === 'stakeholder') {
        message += '開発者モードで自分のAPIキーを使用すると制限なしで利用できます。';
      } else {
        message += '関係者モードで30回/24時間、または開発者モードで無制限利用が可能です。';
      }

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
    reviewView.innerHTML = `
      <div class="advisor-view-header">
        <h2>
          <span style="display: inline-flex; align-items: center; margin-right: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          ブログ記事レビュー
        </h2>
        <div class="advisor-view-actions" style="display:flex; align-items:center; gap:8px;">
          <label for="blogReviewerModelSelect" class="text-muted" style="font-size:12px;">モデル</label>
          <select id="blogReviewerModelSelect" class="advisor-select" style="font-size:12px; padding:4px 8px; background: var(--secondary-bg-color); color: var(--text-color); border: 1px solid var(--border-color);">
            <option value="gpt-4o-mini" selected>gpt-4o-mini</option>
            <option value="gpt-4o">gpt-4o</option>
            <option value="gpt-4.1-nano">gpt-4.1-nano</option>
            <option value="gpt-4.1-mini">gpt-4.1-mini</option>
            <option value="gpt-4.1">gpt-4.1</option>
            <option value="o3-mini">o3-mini</option>
            <option value="o3">o3</option>
          </select>
          <div id="blogReviewerHeaderUsage" class="advisor-usage-chip" style="display:none; align-items:center; gap:8px; padding:6px 10px; border:1px solid var(--border-color); border-radius:999px; font-size:12px; color:var(--secondary-text-color);">
            <span>本回: <span id="blogReviewerHeaderUsageTokens">-</span></span>
            <span style="opacity:.6;">/ 累計: <span id="blogReviewerHeaderUsageTotal">-</span></span>
          </div>
          <button class="advisor-btn-secondary" data-action="close-review-view">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            戻る
          </button>
        </div>
      </div>
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
      ${articleBody && articleBody !== '本文なし' ? `
      <div class="job-field">
        <label>本文</label>
        <div class="job-value job-description">
          ${this.escapeHtml(articleBody)}${isTruncated ? '<span style="color: var(--secondary-text-color);">...（省略）</span>' : ''}
        </div>
      </div>
      ` : ''}
    `;
  }

  /**
   * AIレビューを取得（ストリーミング）
   */
  async fetchReview() {
    const reviewContent = document.getElementById('blogReviewerReviewContent');
    if (!reviewContent) return;

    this.isStreaming = true;

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
        }),
      });

      if (!response.ok) {
        // 429 Too Many Requests: レート制限エラー
        if (response.status === 429) {
          try {
            const errorData = await response.json();
            const resetTime = new Date(errorData.resetTime).toLocaleTimeString('ja-JP');
            throw new Error(
              `レート制限に達しました。${resetTime}にリセットされます。` +
              '\n\n開発者モードで自分のOpenAI APIキーを使用すると、無制限で利用できます。'
            );
          } catch (e) {
            throw new Error(
              'レート制限に達しました。24時間後に再度試してください。' +
              '\n\n開発者モードで自分のOpenAI APIキーを使用すると、無制限で利用できます。'
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
                if (parsed.content) {
                  fullText += parsed.content;
                  markdownDiv.innerHTML = this.renderMarkdown(fullText);
                } else if (parsed.model) {
                  // サーバーから推定モデル名が送られてきたらUIに反映
                  console.log('[BlogReviewer] Model detected:', parsed.model);
                  this.setSelectedModel(parsed.model);
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
                console.error('Parse error:', e);
              }
            }
          }
        }
      } finally {
        // ストリームを確実にキャンセル
        reader.cancel().catch(err => console.warn('Reader cancel failed:', err));
      }
    } catch (error) {
      console.error('BlogReviewer fetch error:', error);
      reviewContent.innerHTML = `
        <div class="advisor-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>AI分析に失敗しました</p>
          <p class="advisor-error-detail">${this.escapeHtml(error.message)}</p>
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

    // 連続する<li>タグを<ul>で囲む（改行変換後に実行）
    html = html.replace(/((?:<li>.*?<\/li>(?:<br>)*)+)/g, (match) => `<ul>${match.replace(/<br>/g, '')}</ul>`);

    return html;
  }

  /**
  // トップのトリガー横の累積チップも金額併記
  updateTriggerUsageChip() {
    const btn = document.getElementById('blogReviewerTriggerBtn');
    if (!btn) return;
    let chip = document.getElementById('blogReviewerTriggerUsage');
    if (!chip) {
      chip = document.createElement('span');
      chip.id = 'blogReviewerTriggerUsage';
      chip.style.cssText = 'margin-left:8px; padding:4px 8px; font-size:12px; color:var(--secondary-text-color); border:1px solid var(--border-color); border-radius:999px;';
      btn.insertAdjacentElement('afterend', chip);
    }
    const acc = this.getAccumulatedUsage();
    const usd = (acc.prompt_tokens || 0) * this.PRICE_PER_INPUT_TOKEN + (acc.completion_tokens || 0) * this.PRICE_PER_OUTPUT_TOKEN;
    chip.textContent = `累計: ${(acc.total_tokens||0).toLocaleString()} tok / $${usd.toFixed(4)} (¥${(usd*150).toFixed(0)})`;
  }

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
    const totalTokens = (acc?.total_tokens || 0);
    total.textContent = `${totalTokens.toLocaleString()} tok`;
  }

  /**
   * 累積使用量の取得/保存
   */
  /**
   * モデル選択の保存/取得
   */
  getSelectedModel() {
    try {
      return localStorage.getItem('jsonld_model_blog_reviewer') || 'gpt-4o-mini';
    } catch { return 'gpt-4o-mini'; }
  }
  setSelectedModel(model) {
    try {
      localStorage.setItem('jsonld_model_blog_reviewer', model);
      // モデルごとの料金に応じて単価を切り替え
      const pricing = this.getModelPricing(model);
      this.PRICE_PER_INPUT_TOKEN = pricing.input;
      this.PRICE_PER_OUTPUT_TOKEN = pricing.output;
      // セレクトに反映
      const sel = document.getElementById('blogReviewerModelSelect');
      if (sel) sel.value = model;
      // ヘッダ/最下部の表示更新
      this.updateHeaderUsageChip();
      if (this.currentUsage) this.displayUsage();
    } catch {}
  }
  getModelPricing(model) {
    // USD per token（参考・簡易値。最新料金と異なる場合があります）
    const table = {
      'gpt-4o-mini': { input: 0.00000015, output: 0.0000006 },
      'gpt-4o': { input: 0.0000025, output: 0.00001 },
      'gpt-4.1-mini': { input: 0.00000015, output: 0.0000006 },
      'gpt-4.1': { input: 0.000003, output: 0.000015 },
      'o3-mini': { input: 0.0000006, output: 0.0000024 },
      'o3': { input: 0.000003, output: 0.000015 },
    };
    return table[model] || table['gpt-4o-mini'];
  }

  getAccumulatedUsage() {
    try {
      const mode = localStorage.getItem(this.USAGE_MODE_KEY) || 'session';
      const dataStr = mode === 'session'
        ? sessionStorage.getItem(this.USAGE_TOTAL_KEY)
        : localStorage.getItem(this.USAGE_TOTAL_KEY);
      return dataStr ? JSON.parse(dataStr) : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    } catch {
      return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }
  }

  saveAccumulatedUsage(usage) {
    try {
      const mode = localStorage.getItem(this.USAGE_MODE_KEY) || 'session';
      const dataStr = JSON.stringify(usage);
      if (mode === 'session') {
        sessionStorage.setItem(this.USAGE_TOTAL_KEY, dataStr);
      } else {
        localStorage.setItem(this.USAGE_TOTAL_KEY, dataStr);
      }
    } catch {}
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
    localStorage.setItem(this.USAGE_MODE_KEY, mode);
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
    const { prompt_tokens, completion_tokens, total_tokens } = this.currentUsage;

    // 料金計算
    const inputCost = prompt_tokens * this.PRICE_PER_INPUT_TOKEN;
    const outputCost = completion_tokens * this.PRICE_PER_OUTPUT_TOKEN;
    const totalCost = inputCost + outputCost;

    // 日本円換算（1 USD = 150 JPY）
    const totalCostJPY = totalCost * 150;

    // usage表示用のHTML
    const usageHtml = `
      <div class="advisor-usage-panel" style="margin-top: 20px; padding: 16px; background: var(--secondary-bg-color); border: 1px solid var(--border-color); border-radius: 8px;">
        <h4 style="margin: 0 0 12px 0; font-size: 0.9rem; color: var(--secondary-text-color);">API使用量</h4>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; font-size: 0.85rem;">
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">入力トークン</div>
            <div style="font-weight: 600;">${prompt_tokens.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">出力トークン</div>
            <div style="font-weight: 600;">${completion_tokens.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">合計トークン</div>
            <div style="font-weight: 600;">${total_tokens.toLocaleString()} tokens</div>
          </div>
          <div>
            <div style="color: var(--secondary-text-color); margin-bottom: 4px;">推定料金</div>
            <div style="font-weight: 600;">$${totalCost.toFixed(6)} (約 ¥${totalCostJPY.toFixed(4)})</div>
          </div>
        </div>
      </div>
    `;

    // レビューコンテンツの末尾に追加
    const reviewContent = document.getElementById('blogReviewerReviewContent');
    console.log('[BlogReviewer] reviewContent element:', reviewContent);
    if (reviewContent) {
      const markdownDiv = reviewContent.querySelector('.advisor-markdown');
      console.log('[BlogReviewer] markdownDiv element:', markdownDiv);
      if (markdownDiv) {
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

    // トリガー側の累積チップを更新
    this.updateTriggerUsageChip();
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
