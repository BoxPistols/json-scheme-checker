// AI Advisor Module

class AdvisorManager {
  constructor() {
    this.currentJobPosting = null;
    this.currentMode = null;
    this.isStreaming = false;
  }

  /**
   * JobPostingスキーマを検出してアドバイスボタンを表示
   * @param {Array} jsonLdData - 抽出されたJSON-LDデータ
   */
  detectJobPosting(jsonLdData) {
    console.log('[AdvisorManager] detectJobPosting called with:', jsonLdData);

    // 既存のボタンを削除
    this.hideAdvisorButton();

    // JobPostingを検索
    const jobPosting = jsonLdData.find(
      item => item['@type'] === 'JobPosting' || item['@type']?.includes('JobPosting')
    );

    console.log('[AdvisorManager] JobPosting detected:', jobPosting);

    if (jobPosting) {
      this.currentJobPosting = jobPosting;
      this.showAdvisorButton();
      console.log('[AdvisorManager] Advisor button shown');
    } else {
      console.log('[AdvisorManager] No JobPosting found in schemas');
    }
  }

  /**
   * アドバイスボタンを表示
   */
  showAdvisorButton() {
    const resultDiv = document.getElementById('results');
    console.log('[AdvisorManager] showAdvisorButton - results div:', resultDiv);

    if (!resultDiv) {
      console.error('[AdvisorManager] ERROR: results div not found');
      return;
    }

    const existingBtn = document.getElementById('advisorTriggerBtn');
    if (existingBtn) {
      console.log('[AdvisorManager] Advisor button already exists');
      return;
    }

    const button = document.createElement('button');
    button.id = 'advisorTriggerBtn';
    button.className = 'advisor-trigger-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      AIアドバイスを受ける
    `;
    button.onclick = () => this.showModeSelector();

    resultDiv.insertBefore(button, resultDiv.firstChild);
    console.log('[AdvisorManager] Advisor button inserted into DOM');
  }

  /**
   * アドバイスボタンを非表示
   */
  hideAdvisorButton() {
    const btn = document.getElementById('advisorTriggerBtn');
    if (btn) btn.remove();
  }

  /**
   * モード選択UIを表示
   */
  showModeSelector() {
    const overlay = document.createElement('div');
    overlay.id = 'advisorModeOverlay';
    overlay.className = 'advisor-overlay';
    overlay.innerHTML = `
      <div class="advisor-modal">
        <div class="advisor-modal-header">
          <h2>どちらの視点でアドバイスしますか？</h2>
          <button class="advisor-modal-close" onclick="advisorManager.closeModeSelector()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="advisor-modal-body">
          <button class="advisor-mode-btn advisor-mode-employer" onclick="advisorManager.startAnalysis('employer')">
            <div class="advisor-mode-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2h12v4H6zM4 6h16v2H4zM5 9h14v10H5zM7 13h2v4H7zM11 13h2v4h-2zM15 13h2v4h-2zM3 20h18v1H3z" stroke="currentColor" stroke-width="1.5" fill="none"/>
              </svg>
            </div>
            <h3>採用側向け</h3>
            <p>求人票の内容をレビューし、<br>改善提案を提供します</p>
          </button>
          <button class="advisor-mode-btn advisor-mode-applicant" onclick="advisorManager.startAnalysis('applicant')">
            <div class="advisor-mode-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" stroke="currentColor" stroke-width="1" fill="none"/>
              </svg>
            </div>
            <h3>応募者向け</h3>
            <p>面接対策と要件傾向の<br>分析を提供します</p>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('active'), 10);
  }

  /**
   * モード選択UIを閉じる
   */
  closeModeSelector() {
    const overlay = document.getElementById('advisorModeOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      setTimeout(() => overlay.remove(), 300);
    }
  }

  /**
   * AI分析を開始
   * @param {string} mode - 'employer' or 'applicant'
   */
  async startAnalysis(mode) {
    this.currentMode = mode;
    this.closeModeSelector();
    this.showAdvisorView(mode);
    await this.fetchAdvice(mode);
  }

  /**
   * アドバイス表示画面を表示
   * @param {string} mode - 'employer' or 'applicant'
   */
  showAdvisorView(mode) {
    const container = document.querySelector('.container');
    if (!container) return;

    const modeTitle = mode === 'employer' ? '採用側向けアドバイス' : '応募者向けアドバイス';

    const advisorView = document.createElement('div');
    advisorView.id = 'advisorView';
    advisorView.className = 'advisor-view';
    const modeIconSvg =
      mode === 'employer'
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h12v4H6zM4 6h16v2H4zM5 9h14v10H5zM7 13h2v4H7zM11 13h2v4h-2zM15 13h2v4h-2zM3 20h18v1H3z" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>'
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" stroke="currentColor" stroke-width="1" fill="none"/></svg>';
    advisorView.innerHTML = `
      <div class="advisor-view-header">
        <h2><span style="display: inline-flex; align-items: center; margin-right: 8px;">${modeIconSvg}</span> ${modeTitle}</h2>
        <div class="advisor-view-actions">
          <button class="advisor-btn-secondary" onclick="advisorManager.closeAdvisorView()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            戻る
          </button>
        </div>
      </div>
      <div class="advisor-view-content">
        <div class="advisor-job-panel">
          <h3>求人票</h3>
          <div class="advisor-job-content" id="advisorJobContent">
            ${this.formatJobPosting(this.currentJobPosting)}
          </div>
        </div>
        <div class="advisor-advice-panel">
          <h3>AI分析結果</h3>
          <div class="advisor-advice-content" id="advisorAdviceContent">
            <div class="advisor-loading">
              <div class="advisor-spinner"></div>
              <p>AI分析中...</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.style.display = 'none';
    document.body.appendChild(advisorView);

    setTimeout(() => advisorView.classList.add('active'), 10);
  }

  /**
   * JobPostingデータをHTMLフォーマット
   * @param {Object} jobPosting - JobPostingオブジェクト
   * @returns {string} HTML文字列
   */
  formatJobPosting(jobPosting) {
    const title = jobPosting.title || '不明';
    const description = jobPosting.description || '説明なし';
    const employmentType = jobPosting.employmentType || '不明';
    const location =
      jobPosting.jobLocation?.address?.addressLocality || jobPosting.jobLocation?.address || '不明';

    let salary = '記載なし';
    if (jobPosting.baseSalary) {
      const sal = jobPosting.baseSalary;
      const currency = sal.currency || 'JPY';
      const value = sal.value;
      if (value?.minValue && value?.maxValue) {
        salary = `${currency} ${value.minValue.toLocaleString()} - ${value.maxValue.toLocaleString()}`;
      } else if (value?.value) {
        salary = `${currency} ${value.value.toLocaleString()}`;
      }
    }

    // descriptionをHTMLに変換
    const formattedDescription = this.formatDescription(description);

    return `
      <div class="job-field">
        <label>職種</label>
        <div class="job-value">${this.escapeHtml(title)}</div>
      </div>
      <div class="job-field">
        <label>雇用形態</label>
        <div class="job-value">${this.escapeHtml(employmentType)}</div>
      </div>
      <div class="job-field">
        <label>勤務地</label>
        <div class="job-value">${this.escapeHtml(location)}</div>
      </div>
      <div class="job-field">
        <label>給与</label>
        <div class="job-value">${this.escapeHtml(salary)}</div>
      </div>
      <div class="job-field">
        <label>職務内容</label>
        <div class="job-value job-description">${formattedDescription}</div>
      </div>
    `;
  }

  /**
   * description を HTML に変換
   * @param {string} text - description テキスト
   * @returns {string} HTML文字列
   */
  formatDescription(text) {
    if (!text) return '';

    // HTMLエスケープ
    let html = this.escapeHtml(text);

    // <br /> タグを改行に変換
    html = html.replace(/&lt;br\s*\/?&gt;/gi, '<br>');

    // 複数の改行を段落に変換
    const paragraphs = html.split(/\n\n+/);

    return paragraphs
      .map(paragraph => {
        // 箇条書きを検出（・、-、*で始まる行）
        const lines = paragraph.split('\n');
        const listItems = [];
        const normalLines = [];

        lines.forEach(line => {
          const trimmed = line.trim();
          if (/^[・\-\*]/.test(trimmed)) {
            // 箇条書き
            const content = trimmed.replace(/^[・\-\*]\s*/, '');
            listItems.push(`<li>${content}</li>`);
          } else if (trimmed) {
            normalLines.push(trimmed);
          }
        });

        let result = '';
        if (normalLines.length > 0) {
          result += `<p>${normalLines.join('<br>')}</p>`;
        }
        if (listItems.length > 0) {
          result += `<ul>${listItems.join('')}</ul>`;
        }
        return result;
      })
      .join('');
  }

  /**
   * AIアドバイスを取得（ストリーミング）
   * @param {string} mode - 'employer' or 'applicant'
   */
  async fetchAdvice(mode) {
    const adviceContent = document.getElementById('advisorAdviceContent');
    if (!adviceContent) return;

    this.isStreaming = true;

    try {
      const isVercel = window.location.hostname.includes('vercel.app');
      const apiUrl = isVercel ? '/api/advisor' : 'http://127.0.0.1:3333/api/advisor';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobPosting: this.currentJobPosting,
          mode: mode,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      adviceContent.innerHTML = '<div class="advisor-markdown"></div>';
      const markdownDiv = adviceContent.querySelector('.advisor-markdown');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

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
    } catch (error) {
      console.error('Advisor fetch error:', error);
      adviceContent.innerHTML = `
        <div class="advisor-error">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>AI分析に失敗しました</p>
          <p class="advisor-error-detail">${this.escapeHtml(error.message)}</p>
          <button class="advisor-btn-primary" onclick="advisorManager.fetchAdvice('${mode}')">
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

    // リスト
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // 番号付きリスト
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // 改行
    html = html.replace(/\n/g, '<br>');

    return html;
  }

  /**
   * アドバイス画面を閉じる
   */
  closeAdvisorView() {
    this.isStreaming = false;
    const view = document.getElementById('advisorView');
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
const advisorManager = new AdvisorManager();
