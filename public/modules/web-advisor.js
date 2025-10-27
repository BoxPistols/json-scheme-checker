// Web Advisor Module - AI-powered advice for pages with no schema or only WebPage schema

class WebAdvisorManager {
  constructor() {
    this.currentUrl = null;
    this.isStreaming = false;
    this.currentResult = '';
  }

  /**
   * スキーマが無いか、WebPageのみの場合にCTAを表示
   */
  detectNoSchemaOrWebPageOnly(schemas, url) {
    this.hideCTA();
    
    // スキーマが無い、またはWebPageのみの場合
    const hasOnlyWebPage = schemas.length === 1 && 
      (schemas[0]['@type'] === 'WebPage' || schemas[0]['@type']?.includes('WebPage'));
    const hasNoSchema = schemas.length === 0;
    
    if (hasNoSchema || hasOnlyWebPage) {
      this.currentUrl = url;
      this.showCTA();
    }
  }

  /**
   * CTAボタンを表示
   */
  showCTA() {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // 既存のCTAボタンがあれば削除
    const existingBtn = document.getElementById('webAdvisorCTA');
    if (existingBtn) existingBtn.remove();

    const button = document.createElement('button');
    button.id = 'webAdvisorCTA';
    button.className = 'web-advisor-cta-btn';
    button.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      Webアドバイザー（汎用）
    `;
    button.onclick = () => this.startAnalysis();

    // resultsの最初の子要素の前に挿入
    const firstChild = resultsDiv.firstElementChild;
    if (firstChild) {
      resultsDiv.insertBefore(button, firstChild);
    } else {
      resultsDiv.appendChild(button);
    }
  }

  /**
   * CTAボタンを非表示
   */
  hideCTA() {
    const btn = document.getElementById('webAdvisorCTA');
    if (btn) btn.remove();
  }

  /**
   * 分析を開始
   */
  async startAnalysis() {
    if (!this.currentUrl) {
      alert('URLが設定されていません');
      return;
    }

    if (this.isStreaming) {
      alert('分析実行中です');
      return;
    }

    this.showAnalysisView();
    this.isStreaming = true;
    this.currentResult = '';

    const resultArea = document.getElementById('webAdvisorResult');
    const statusArea = document.getElementById('webAdvisorStatus');
    
    resultArea.innerHTML = '';
    statusArea.innerHTML = '<div class="status-info">分析を開始します...</div>';

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

      const eventSource = new EventSource(apiUrl);

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'init':
              statusArea.innerHTML = `<div class="status-info">${data.message}</div>`;
              break;
            
            case 'progress':
              statusArea.innerHTML = `<div class="status-info">${data.message}</div>`;
              break;
            
            case 'meta':
              this.displayMetaInfo(data.data);
              break;
            
            case 'token':
              this.currentResult += data.content;
              this.renderMarkdown(resultArea, this.currentResult);
              break;
            
            case 'done':
              statusArea.innerHTML = '<div class="status-success">分析が完了しました</div>';
              this.isStreaming = false;
              this.showActionButtons();
              eventSource.close();
              break;
            
            case 'error':
              statusArea.innerHTML = `<div class="status-error">エラー: ${data.message}</div>`;
              this.isStreaming = false;
              eventSource.close();
              break;
          }
        } catch (error) {
          console.error('Parse error:', error);
        }
      });

      eventSource.addEventListener('error', (error) => {
        console.error('EventSource error:', error);
        statusArea.innerHTML = '<div class="status-error">接続エラーが発生しました</div>';
        this.isStreaming = false;
        eventSource.close();
      });

    } catch (error) {
      console.error('Analysis error:', error);
      statusArea.innerHTML = `<div class="status-error">エラー: ${error.message}</div>`;
      this.isStreaming = false;
    }
  }

  /**
   * メタ情報を表示
   */
  displayMetaInfo(metadata) {
    const metaArea = document.getElementById('webAdvisorMeta');
    if (!metaArea) return;

    // XSS対策: HTMLエスケープ
    const escapeHtml = (str) => {
      if (!str) return '（未設定）';
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };

    metaArea.innerHTML = `
      <div class="meta-info-box">
        <h4>ページ情報</h4>
        <div class="meta-item">
          <strong>タイトル:</strong> ${escapeHtml(metadata.title)}
        </div>
        <div class="meta-item">
          <strong>説明:</strong> ${escapeHtml(metadata.description)}
        </div>
        <div class="meta-item">
          <strong>見出し:</strong> H1=${metadata.headings.h1.length}, H2=${metadata.headings.h2.length}, H3=${metadata.headings.h3.length}
        </div>
      </div>
    `;
  }

  /**
   * Markdownを簡易レンダリング
   */
  renderMarkdown(container, text) {
    // 各行を処理してリストをグループ化
    const lines = text.split('\n');
    let inList = false;
    let processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isListItem = /^[\d]+\.\s/.test(line) || /^-\s/.test(line);
      
      if (isListItem && !inList) {
        processedLines.push('<ul>');
        inList = true;
      } else if (!isListItem && inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      
      processedLines.push(line);
    }
    
    if (inList) {
      processedLines.push('</ul>');
    }
    
    const processedText = processedLines.join('\n');
    
    const html = processedText
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\d+\.\s+(.*)$/gim, '<li>$1</li>')
      .replace(/^-\s+(.*)$/gim, '<li>$1</li>')
      .split('\n\n')
      .map(para => para.trim())
      .filter(para => para)
      .map(para => {
        if (para.startsWith('<h') || para.startsWith('<ul')) {
          return para;
        }
        return `<p>${para}</p>`;
      })
      .join('');
    
    container.innerHTML = `<div class="markdown-content">${html}</div>`;
  }

  /**
   * 分析ビューを表示
   */
  showAnalysisView() {
    const resultsDiv = document.getElementById('results');
    if (!resultsDiv) return;

    // 既存のビューがあれば削除
    let viewDiv = document.getElementById('webAdvisorView');
    if (viewDiv) {
      viewDiv.remove();
    }

    viewDiv = document.createElement('div');
    viewDiv.id = 'webAdvisorView';
    viewDiv.className = 'web-advisor-view';
    viewDiv.innerHTML = `
      <div class="web-advisor-header">
        <h2>Webアドバイザー分析結果</h2>
        <button class="close-btn" onclick="webAdvisorManager.closeView()">✕</button>
      </div>
      <div id="webAdvisorStatus"></div>
      <div id="webAdvisorMeta"></div>
      <div id="webAdvisorResult" class="advisor-result"></div>
      <div id="webAdvisorActions" class="advisor-actions" style="display: none;"></div>
    `;

    resultsDiv.appendChild(viewDiv);
    
    // スクロールして表示
    viewDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * アクションボタンを表示
   */
  showActionButtons() {
    const actionsArea = document.getElementById('webAdvisorActions');
    if (!actionsArea) return;

    actionsArea.innerHTML = `
      <button onclick="webAdvisorManager.copyResult()">コピー</button>
      <button onclick="webAdvisorManager.saveResult()">保存</button>
      <button onclick="webAdvisorManager.rerun()">再実行</button>
    `;
    actionsArea.style.display = 'flex';
  }

  /**
   * 結果をコピー
   */
  copyResult() {
    navigator.clipboard.writeText(this.currentResult).then(() => {
      showSnackbar('結果をクリップボードにコピーしました', 'success', 2000);
    }).catch(err => {
      console.error('Copy failed:', err);
      showSnackbar('コピーに失敗しました', 'error', 2000);
    });
  }

  /**
   * 結果を保存
   */
  saveResult() {
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

  /**
   * 再実行
   */
  rerun() {
    this.startAnalysis();
  }

  /**
   * ビューを閉じる
   */
  closeView() {
    const viewDiv = document.getElementById('webAdvisorView');
    if (viewDiv) {
      viewDiv.remove();
    }
  }
}

// グローバルインスタンスを作成
const webAdvisorManager = new WebAdvisorManager();
