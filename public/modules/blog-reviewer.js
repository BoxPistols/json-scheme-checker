// Blog Reviewer Module

class BlogReviewerManager {
  constructor() {
    this.currentArticle = null;
    this.isStreaming = false;
    this.RATE_LIMIT_KEY = 'jsonld_blog_reviewer_usage';
    this.USER_API_KEY = 'jsonld_user_openai_key';
    this.STAKEHOLDER_MODE_KEY = 'jsonld_blog_reviewer_stakeholder';
    this.MAX_REQUESTS_PER_DAY = 10;
    this.MAX_REQUESTS_STAKEHOLDER = 30;
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
            <button class="advisor-btn-secondary" onclick="blogReviewerManager.closeStakeholderPrompt()">いいえ</button>
            <button class="advisor-btn-primary" onclick="blogReviewerManager.confirmStakeholder()">はい</button>
          </div>
        </div>
      </div>
    `;
    overlay.id = 'stakeholderPromptBlog';
    document.body.appendChild(overlay);
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
          <button class="advisor-modal-close" onclick="blogReviewerManager.closeDeveloperPrompt()">
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
            <button type="button" onclick="blogReviewerManager.toggleDeveloperKeyVisibility()" class="advisor-btn-icon" title="表示/非表示">
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
            <button class="advisor-btn-secondary" onclick="blogReviewerManager.closeDeveloperPrompt()">キャンセル</button>
            <button class="advisor-btn-primary" onclick="blogReviewerManager.saveDeveloperKey()">保存</button>
          </div>
        </div>
      </div>
    `;
    overlay.id = 'developerPromptBlog';
    document.body.appendChild(overlay);
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
   * 開発者APIキーの表示/非表示を切り替え
   */
  toggleDeveloperKeyVisibility() {
    const input = document.getElementById('developerApiKeyInputBlog');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  }

  /**
   * Article/BlogPostingスキーマを検出してレビューボタンを表示
   * @param {Array} jsonLdData - 抽出されたJSON-LDデータ
   */
  detectBlogPost(jsonLdData) {
    console.log('[BlogReviewerManager] detectBlogPost called with:', jsonLdData);

    // 既存のボタンを削除
    this.hideReviewButton();

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
      this.currentArticle = article;
      this.showReviewButton();
      console.log('[BlogReviewerManager] Review button shown');
    } else {
      console.log('[BlogReviewerManager] No Article/BlogPosting found in schemas');
    }
  }

  /**
   * レビューボタンを表示
   */
  showReviewButton() {
    const resultDiv = document.getElementById('results');
    console.log('[BlogReviewerManager] showReviewButton - results div:', resultDiv);

    if (!resultDiv) {
      console.error('[BlogReviewerManager] ERROR: results div not found');
      return;
    }

    const existingBtn = document.getElementById('blogReviewerTriggerBtn');
    if (existingBtn) {
      console.log('[BlogReviewerManager] Review button already exists');
      return;
    }

    const button = document.createElement('button');
    button.id = 'blogReviewerTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ブログ記事レビューを受ける
    `;
    button.onclick = () => this.showConfirmDialog();

    resultDiv.insertBefore(button, resultDiv.firstChild);
    console.log('[BlogReviewerManager] Review button inserted into DOM');
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
        <div class="advisor-modal-header">
          <h2>ブログ記事レビュー</h2>
          <div class="advisor-mode-buttons-small">
            <button class="advisor-mode-btn-small" onclick="blogReviewerManager.showStakeholderPrompt()" title="関係者は30回/24時間まで利用可能">
              関係者
            </button>
            <button class="advisor-mode-btn-small" onclick="blogReviewerManager.showDeveloperPrompt()" title="自分のAPIキーで無制限利用">
              開発者
            </button>
          </div>
          <button class="advisor-modal-close" onclick="blogReviewerManager.closeConfirmDialog()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          ${rateLimitHtml}

          <p style="margin: 20px 0; text-align: center; font-size: 0.95rem;">
            SEO観点、EEAT観点、アクセシビリティ観点でブログ記事をレビューします。
          </p>

          <div class="advisor-confirm-buttons">
            <button class="advisor-btn-secondary" onclick="blogReviewerManager.closeConfirmDialog()">キャンセル</button>
            <button class="advisor-btn-primary" onclick="blogReviewerManager.startReview()">レビュー開始</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

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
        <div class="advisor-view-actions">
          <button class="advisor-btn-secondary" onclick="blogReviewerManager.closeReviewView()">
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

    setTimeout(() => reviewView.classList.add('active'), 10);
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
      <div class="job-field">
        <label>本文</label>
        <div class="job-value job-description">
          ${this.escapeHtml(articleBody)}${isTruncated ? '<span style="color: var(--secondary-text-color);">...（省略）</span>' : ''}
        </div>
      </div>
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
          <button class="advisor-btn-primary" onclick="blogReviewerManager.fetchReview()">
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
    html = html.replace(/((?:<li>.*?<\/li>(?:<br>)*)+)/g, '<ul>$1</ul>');

    return html;
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
