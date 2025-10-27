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

    // スキーマが無い、またはWebPageのみの場合
    const hasOnlyWebPage = schemas.length === 1 &&
      (schemas[0]['@type'] === 'WebPage' || schemas[0]['@type']?.includes('WebPage'));
    const hasNoSchema = schemas.length === 0;

    if (hasNoSchema || hasOnlyWebPage) {
      this.currentUrl = url;
      this.showAnalysisButton();
    }
  }

  /**
   * 分析ボタンを表示
   */
  showAnalysisButton() {
    const container = document.getElementById('results');
    if (!container) return;

    // 既存のボタンがあれば削除
    const existingBtn = document.getElementById('webAdvisorButton');
    if (existingBtn) existingBtn.remove();

    const buttonHtml = `
      <div id="webAdvisorButton" class="advisor-cta-section">
        <div class="advisor-cta-card">
          <div class="advisor-cta-header">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l-6 6v7h9v-7m0 0l6-6m-6 6h7m0 0v9h7v-7l-6-6"/>
              <path d="M12 2v5"/>
              <path d="M5 12H2"/>
              <path d="M22 12h-3"/>
            </svg>
            <h3>Webページ分析（汎用）</h3>
          </div>
          <p class="advisor-cta-description">
            このページはブログ記事の可能性があります。<br>
            AI分析でコンテンツの品質、SEO、可読性などを評価します。
          </p>
          <button
            class="advisor-cta-button"
            data-action="show-web-confirm-dialog"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14"/>
              <path d="M12 5l7 7-7 7"/>
            </svg>
            Webページを分析
          </button>
        </div>
      </div>
    `;

    // スキーマ結果の後に挿入
    const schemasContainer = document.getElementById('schemasContainer');
    if (schemasContainer) {
      schemasContainer.insertAdjacentHTML('afterend', buttonHtml);
    } else {
      container.insertAdjacentHTML('beforeend', buttonHtml);
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
   * 確認ダイアログを表示
   */
  showConfirmDialog() {
    const rateLimit = this.checkRateLimit();

    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? rateLimit.resetTime.toLocaleString('ja-JP') : '不明';
      showSnackbar(`利用上限に達しました。リセット時刻: ${resetTime}`, 'error', 5000);
      return;
    }

    const modalHtml = `
      <div id="webAdvisorConfirmDialog" class="advisor-overlay">
        <div class="advisor-modal advisor-confirm-dialog">
          <div class="advisor-modal-header">
            <h2>Webページ分析の確認</h2>
            <button class="advisor-close-btn" data-action="web-close-confirm-dialog">×</button>
          </div>
          <div class="advisor-modal-body">
            <div class="advisor-info-section">
              <p><strong>分析対象URL:</strong></p>
              <p class="advisor-url">${this.currentUrl}</p>
            </div>

            <div class="advisor-info-section">
              <h3>分析内容</h3>
              <ul>
                <li>コンテンツの構成と品質評価</li>
                <li>SEO最適化の観点からの分析</li>
                <li>読みやすさとユーザー体験</li>
                <li>技術的な改善提案</li>
                <li>コンテンツマーケティング視点でのアドバイス</li>
              </ul>
            </div>

            <div class="advisor-usage-info">
              <p>残り利用回数: <strong>${rateLimit.remaining}回</strong></p>
              ${rateLimit.mode === 'stakeholder' ? '<span class="advisor-badge">関係者モード</span>' : ''}
              ${rateLimit.mode === 'developer' ? '<span class="advisor-badge">開発者モード</span>' : ''}
            </div>
          </div>
          <div class="advisor-modal-footer">
            <button class="advisor-btn-secondary" data-action="web-close-confirm-dialog">
              キャンセル
            </button>
            <button class="advisor-btn-primary" data-action="web-start-analysis">
              分析を開始
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const overlay = document.getElementById('webAdvisorConfirmDialog');
    if (overlay) {
      overlay.classList.add('active');
      this.addEscapeKeyListener(overlay, () => this.closeConfirmDialog());
    }
  }

  /**
   * 確認ダイアログを閉じる
   */
  closeConfirmDialog() {
    const dialog = document.getElementById('webAdvisorConfirmDialog');
    if (dialog) {
      dialog.classList.remove('active');
      setTimeout(() => dialog.remove(), 300);

      if (dialog.handleEscape) {
        document.removeEventListener('keydown', dialog.handleEscape);
      }
    }
  }

  /**
   * 分析を開始
   */
  startAnalysis() {
    this.closeConfirmDialog();

    // レート制限を記録
    this.recordUsage();

    // 結果表示エリアを作成
    this.showResultView();

    // SSE接続で分析を実行
    this.fetchAnalysis();
  }

  /**
   * 結果表示ビューを作成
   */
  showResultView() {
    const viewHtml = `
      <div id="webAdvisorResultView" class="advisor-overlay">
        <div class="advisor-modal advisor-result-modal">
          <div class="advisor-modal-header">
            <h2>Webページ分析結果</h2>
            <button class="advisor-close-btn" data-action="web-close-result-view">×</button>
          </div>
          <div class="advisor-modal-body">
            <div id="webAdvisorStatus" class="advisor-status">
              <div class="advisor-loading">
                <div class="advisor-spinner"></div>
                <span>分析を開始しています...</span>
              </div>
            </div>
            <div id="webAdvisorMeta" class="advisor-meta-info" style="display: none;"></div>
            <div id="webAdvisorContent" class="advisor-result-content"></div>
          </div>
          <div class="advisor-modal-footer" id="webAdvisorActions" style="display: none;">
            <button class="advisor-btn-secondary" onclick="webAdvisorManager.copyResult()">
              結果をコピー
            </button>
            <button class="advisor-btn-secondary" onclick="webAdvisorManager.saveResult()">
              結果を保存
            </button>
            <button class="advisor-btn-primary" data-action="web-close-result-view">
              閉じる
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', viewHtml);

    const overlay = document.getElementById('webAdvisorResultView');
    if (overlay) {
      overlay.classList.add('active');
      this.addEscapeKeyListener(overlay, () => this.closeResultView());
    }
  }

  /**
   * 結果表示ビューを閉じる
   */
  closeResultView() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    const view = document.getElementById('webAdvisorResultView');
    if (view) {
      view.classList.remove('active');
      setTimeout(() => view.remove(), 300);

      if (view.handleEscape) {
        document.removeEventListener('keydown', view.handleEscape);
      }
    }

    this.isStreaming = false;
    this.currentResult = '';
  }

  /**
   * SSEで分析を実行
   */
  async fetchAnalysis() {
    if (this.isStreaming) {
      showSnackbar('分析実行中です', 'warning', 2000);
      return;
    }

    this.isStreaming = true;
    this.currentResult = '';

    const statusArea = document.getElementById('webAdvisorStatus');
    const contentArea = document.getElementById('webAdvisorContent');
    const actionsArea = document.getElementById('webAdvisorActions');

    if (!statusArea || !contentArea) return;

    try {
      // 環境検出
      const currentHost = window.location.hostname;
      const isVercel = currentHost.includes('vercel.app') || currentHost.includes('vercel.sh');
      const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

      let apiUrl;
      if (isVercel) {
        apiUrl = `/api/web-advisor?url=${encodeURIComponent(this.currentUrl)}`;
      } else if (isLocalhost) {
        apiUrl = `http://localhost:3333/api/web-advisor?url=${encodeURIComponent(this.currentUrl)}`;
      } else {
        apiUrl = `http://${currentHost}:3333/api/web-advisor?url=${encodeURIComponent(this.currentUrl)}`;
      }

      // ユーザーAPIキーがある場合は追加
      const userApiKey = this.getUserApiKey();
      if (userApiKey) {
        apiUrl += `&userApiKey=${encodeURIComponent(userApiKey)}`;
      }

      this.eventSource = new EventSource(apiUrl);

      this.eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'init':
              statusArea.innerHTML = `
                <div class="advisor-loading">
                  <div class="advisor-spinner"></div>
                  <span>${data.message}</span>
                </div>
              `;
              break;

            case 'progress':
              statusArea.innerHTML = `
                <div class="advisor-loading">
                  <div class="advisor-spinner"></div>
                  <span>${data.message}</span>
                </div>
              `;
              break;

            case 'meta':
              this.displayMetaInfo(data.data);
              break;

            case 'token':
              this.currentResult += data.content;
              this.renderMarkdown(contentArea, this.currentResult);
              break;

            case 'done':
              statusArea.innerHTML = '<div class="advisor-status-success">分析が完了しました</div>';
              this.isStreaming = false;
              if (actionsArea) {
                actionsArea.style.display = 'flex';
              }
              this.eventSource.close();
              this.eventSource = null;
              break;

            case 'error':
              statusArea.innerHTML = `<div class="advisor-status-error">エラー: ${data.message}</div>`;
              this.isStreaming = false;
              this.eventSource.close();
              this.eventSource = null;
              break;
          }
        } catch (error) {
          console.error('[WebAdvisor] Parse error:', error);
        }
      });

      this.eventSource.addEventListener('error', (error) => {
        console.error('[WebAdvisor] EventSource error:', error);
        statusArea.innerHTML = '<div class="advisor-status-error">接続エラーが発生しました</div>';
        this.isStreaming = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
      });

    } catch (error) {
      console.error('[WebAdvisor] Analysis error:', error);
      statusArea.innerHTML = `<div class="advisor-status-error">エラー: ${error.message}</div>`;
      this.isStreaming = false;
    }
  }

  /**
   * メタ情報を表示
   */
  displayMetaInfo(metadata) {
    const metaArea = document.getElementById('webAdvisorMeta');
    if (!metaArea) return;

    const escapeHtml = (str) => {
      if (!str) return '（未設定）';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    metaArea.innerHTML = `
      <div class="advisor-meta-box">
        <h4>ページ情報</h4>
        <div class="advisor-meta-item">
          <strong>タイトル:</strong> ${escapeHtml(metadata.title)}
        </div>
        <div class="advisor-meta-item">
          <strong>説明:</strong> ${escapeHtml(metadata.description)}
        </div>
        <div class="advisor-meta-item">
          <strong>見出し:</strong> H1=${metadata.headings?.h1?.length || 0},
          H2=${metadata.headings?.h2?.length || 0},
          H3=${metadata.headings?.h3?.length || 0}
        </div>
      </div>
    `;
    metaArea.style.display = 'block';
  }

  /**
   * Markdownをレンダリング
   */
  renderMarkdown(container, text) {
    if (!text) return;

    // 簡易的なMarkdown変換
    const html = text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\d+\.\s+(.*)$/gim, '<li>$1</li>')
      .replace(/^-\s+(.*)$/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .split('\n\n')
      .map(para => {
        if (para.startsWith('<h') || para.startsWith('<ul>')) {
          return para;
        }
        return para ? `<p>${para}</p>` : '';
      })
      .join('');

    container.innerHTML = `<div class="advisor-markdown-content">${html}</div>`;
  }

  /**
   * 結果をコピー
   */
  copyResult() {
    if (!this.currentResult) {
      showSnackbar('コピーする内容がありません', 'error', 2000);
      return;
    }

    navigator.clipboard.writeText(this.currentResult).then(() => {
      showSnackbar('結果をクリップボードにコピーしました', 'success', 2000);
    }).catch(err => {
      console.error('[WebAdvisor] Copy failed:', err);
      showSnackbar('コピーに失敗しました', 'error', 2000);
    });
  }

  /**
   * 結果を保存
   */
  saveResult() {
    if (!this.currentResult) {
      showSnackbar('保存する内容がありません', 'error', 2000);
      return;
    }

    const blob = new Blob([this.currentResult], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-advisor-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('結果を保存しました', 'success', 2000);
  }

  // BaseAdvisorManagerのメソッドをオーバーライド

  closeModal(modalType) {
    const modalId = modalType === 'stakeholderPrompt'
      ? 'webAdvisorStakeholderPrompt'
      : 'webAdvisorDeveloperPrompt';

    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);

      if (modal.handleEscape) {
        document.removeEventListener('keydown', modal.handleEscape);
      }
    }
  }

  // 関係者モード、開発者モード関連のメソッドは必要に応じて実装
}

// グローバルインスタンスを作成
const webAdvisorManager = new WebAdvisorManager();