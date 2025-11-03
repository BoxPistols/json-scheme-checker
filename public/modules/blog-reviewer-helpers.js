// Blog Reviewer Helpers (<= 500 lines)
window.BlogReviewerHelpers = {
  /**
   * HTML要素からテキストコンテンツを抽出
   * - script/style/ナビ/フォームなどを除外
   * - 余分な空白や不要語を除去
   * @param {HTMLElement} element
   * @returns {string}
   */
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

    let text = clone.textContent.replace(/\s+/g, ' ').trim();
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
  },

  /**
   * Article/BlogPostingデータをHTMLから補完
   * @param {Object} article
   * @returns {Object}
   */
  enrichArticleData(article) {
    const enriched = { ...article };
    const root = this?.remoteDoc || document;

    if (!enriched.description && !enriched.abstract) {
      const metaDescription =
        root.querySelector('meta[name="description"]')?.content ||
        root.querySelector('meta[property="og:description"]')?.content;
      if (metaDescription) enriched.description = metaDescription;
    }

    if (!enriched.articleBody) {
      let bodyText = '';
      const articleElement = root.querySelector('article');
      if (articleElement)
        bodyText = this?.extractTextContent
          ? this.extractTextContent(articleElement)
          : window.BlogReviewerHelpers.extractTextContent(articleElement);

      if (!bodyText) {
        const mainElement = root.querySelector('main');
        if (mainElement)
          bodyText = this?.extractTextContent
            ? this.extractTextContent(mainElement)
            : window.BlogReviewerHelpers.extractTextContent(mainElement);
      }

      if (!bodyText) {
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
          const el = root.querySelector(selector);
          if (el) {
            const text = this?.extractTextContent
              ? this.extractTextContent(el)
              : window.BlogReviewerHelpers.extractTextContent(el);
            if (text.length > window.ADVISOR_CONST.ARTICLE.MIN_BODY_LEN) {
              bodyText = text;
              break;
            }
          }
        }
      }
      if (bodyText) enriched.articleBody = bodyText;
    }
    return enriched;
  },

  /**
   * Markdownを簡易HTMLへ変換
   * @param {string} markdown
   * @returns {string}
   */
  renderMarkdown(markdown) {
    let html = (typeof markdown === 'string' ? markdown : '').replace(
      /[&<>]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]
    );
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\n/g, '<br>');

    // 見出しの前後の <br> を削除（h1, h2, h3）
    html = html.replace(/<br><(h[123])>/g, '<$1>'); // 見出しの前
    html = html.replace(/<\/(h[123])><br>/g, '</$1>'); // 見出しの後

    html = html.replace(
      /((?:<li>.*?<\/li>(?:<br>)*)+)/g,
      m => `<ul>${m.replace(/<br>/g, '')}</ul>`
    );
    // </li> の直後の <br> を削除
    html = html.replace(/<\/li><br>/g, '</li>');
    return html;
  },

  /** Articleのフォーマット（HTML） */
  formatArticle(article) {
    const escapeHtml = t => {
      const div = document.createElement('div');
      div.textContent = t ?? '';
      return div.innerHTML;
    };
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

    const MAX_BODY_LENGTH = window.ADVISOR_CONST.ARTICLE.MAX_BODY_LENGTH;
    let articleBody = article.articleBody || '本文なし';
    let isTruncated = false;
    if (articleBody !== '本文なし' && articleBody.length > MAX_BODY_LENGTH) {
      articleBody = articleBody.substring(0, MAX_BODY_LENGTH);
      isTruncated = true;
    }

    return `
      <div class="job-field">
        <label>タイトル</label>
        <div class="job-value">${escapeHtml(headline)}</div>
      </div>
      <div class="job-field">
        <label>著者</label>
        <div class="job-value">${escapeHtml(author)}</div>
      </div>
      <div class="job-field">
        <label>公開日</label>
        <div class="job-value">${escapeHtml(datePublished)}</div>
      </div>
      <div class="job-field">
        <label>最終更新日</label>
        <div class="job-value">${escapeHtml(dateModified)}</div>
      </div>
      <div class="job-field">
        <label>説明</label>
        <div class="job-value job-description">${escapeHtml(description)}</div>
      </div>
      ${
        articleBody && articleBody !== '本文なし'
          ? `
      <div class="job-field">
        <label>本文</label>
        <div class="job-value job-description">
          ${escapeHtml(articleBody)}${isTruncated ? '<span class="text-muted">...（省略）</span>' : ''}
        </div>
      </div>
      `
          : ''
      }
    `;
  },

  /** ヘッダーの使用量チップ更新 */
  updateHeaderUsageChip(curUsage, config) {
    const chip = document.getElementById('blogReviewerHeaderUsage');
    const cur = document.getElementById('blogReviewerHeaderUsageTokens');
    const total = document.getElementById('blogReviewerHeaderUsageTotal');
    if (!chip || !cur || !total) return;

    if (curUsage) {
      const { total_tokens = 0 } = curUsage;
      cur.textContent = `${total_tokens.toLocaleString()} tok`;
      chip.style.display = 'inline-flex';
    }

    const acc = this.getAccumulatedUsage(config);
    const totalTokens = acc?.total_tokens || 0;
    total.textContent = `${totalTokens.toLocaleString()} tok`;
  },

  /** 累積使用量の取得/保存/加算とモード切替 */
  getAccumulatedUsage(config) {
    try {
      const mode = localStorage.getItem(config.USAGE_MODE_KEY) || 'session';
      const dataStr =
        mode === 'session'
          ? sessionStorage.getItem(config.USAGE_TOTAL_KEY)
          : localStorage.getItem(config.USAGE_TOTAL_KEY);
      return dataStr
        ? JSON.parse(dataStr)
        : { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    } catch {
      return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    }
  },
  saveAccumulatedUsage(config, usage) {
    try {
      const mode = localStorage.getItem(config.USAGE_MODE_KEY) || 'session';
      const dataStr = JSON.stringify(usage);
      if (mode === 'session') sessionStorage.setItem(config.USAGE_TOTAL_KEY, dataStr);
      else localStorage.setItem(config.USAGE_TOTAL_KEY, dataStr);
    } catch {}
  },
  addToAccumulatedUsage(config, usage) {
    const acc = this.getAccumulatedUsage(config);
    const merged = {
      prompt_tokens: (acc.prompt_tokens || 0) + (usage.prompt_tokens || 0),
      completion_tokens: (acc.completion_tokens || 0) + (usage.completion_tokens || 0),
      total_tokens: (acc.total_tokens || 0) + (usage.total_tokens || 0),
    };
    this.saveAccumulatedUsage(config, merged);
  },
  setUsageMode(config, mode) {
    if (mode !== 'session' && mode !== 'permanent') return;
    localStorage.setItem(config.USAGE_MODE_KEY, mode);
  },
};
