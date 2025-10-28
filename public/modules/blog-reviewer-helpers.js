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
      'script', 'style', 'nav', 'header', 'footer', 'aside', '.sidebar',
      'form', 'button', 'input', 'select', 'textarea',
      '[role="dialog"]', '[role="alert"]', '.modal', '.dialog', '.overlay',
      '#basicAuthDialog', '#authSection', '[class*="auth-"]',
      '.advisor-overlay', '.advisor-modal', 'details'
    ].join(',');
    clone.querySelectorAll(excludeSelector).forEach(el => el.remove());

    let text = clone.textContent.replace(/\s+/g, ' ').trim();
    const unwantedPhrases = [
      '認証情報の保存方法', '保存しない（最もセキュア）', 'タブを閉じるまで保存（推奨）',
      '24時間保存（利便性重視）', '永続保存（期限なし）', 'すべてクリア',
      'Basic認証', 'ユーザー名', 'パスワード'
    ];
    unwantedPhrases.forEach(phrase => { text = text.replace(new RegExp(phrase, 'g'), ''); });
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
      if (articleElement) bodyText = this?.extractTextContent
        ? this.extractTextContent(articleElement)
        : window.BlogReviewerHelpers.extractTextContent(articleElement);

      if (!bodyText) {
        const mainElement = root.querySelector('main');
        if (mainElement) bodyText = this?.extractTextContent
          ? this.extractTextContent(mainElement)
          : window.BlogReviewerHelpers.extractTextContent(mainElement);
      }

      if (!bodyText) {
        const contentSelectors = [
          'article','main','[role="main"]','.entry-content','.post-content','.article-content','.content',
          '[class*="entry"][class*="content"]','[class*="post"][class*="content"]','[class*="article"][class*="content"]',
          '[class*="content"]','[class*="article"]','[class*="post"]'
        ];
        for (const selector of contentSelectors) {
          const el = root.querySelector(selector);
          if (el) {
            const text = this?.extractTextContent
              ? this.extractTextContent(el)
              : window.BlogReviewerHelpers.extractTextContent(el);
            if (text.length > 100) { bodyText = text; break; }
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
    let html = (typeof markdown === 'string' ? markdown : '').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    html = html.replace(/\n/g, '<br>');
    html = html.replace(/((?:<li>.*?<\/li>(?:<br>)*)+)/g, m => `<ul>${m.replace(/<br>/g, '')}</ul>`);
    return html;
  }
};