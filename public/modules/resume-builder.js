// Resume Builder Module
const BaseAdvisorManager = window.BaseAdvisorManager || globalThis.BaseAdvisorManager;

class ResumeBuilderManager extends BaseAdvisorManager {
  constructor() {
    const config = {
      RATE_LIMIT_KEY: 'jsonld_resume_builder_usage',
      USER_API_KEY: 'jsonld_resume_builder_openai_key',
      USAGE_TOTAL_KEY: 'jsonld_usage_resume_builder_total',
      USAGE_MODE_KEY: 'jsonld_usage_mode',
      MAX_REQUESTS_PER_DAY: 50,
      elemIdPrefix: 'resumeBuilder',
      ui: {
        showConfirmDialog: () => this.showConfirmDialog(),
        closeDeveloperPrompt: () => this.closeModal('developerPrompt'),
      },
      actionHandlers: {
        'resume-builder-close-developer-prompt': () => this.closeModal('developerPrompt'),
        'resume-builder-toggle-developer-key-visibility': () =>
          this.toggleDeveloperKeyVisibility(),
        'resume-builder-save-developer-key': () => this.saveDeveloperKey(),
        'resume-builder-test-developer-connection': () => this.testDeveloperConnection(),
        'resume-builder-reset-developer-settings': () => this.resetDeveloperSettings(),
        'resume-builder-show-developer-prompt': () => this.showDeveloperPrompt(),
        'resume-builder-reset-to-free-mode': () => this.resetToFreeMode(),
        'resume-builder-close-confirm-dialog': () => this.closeConfirmDialog(),
        'resume-builder-close-modal': () => this.closeResumeBuilderModal(),
        'resume-builder-send-message': () => this.sendMessage(),
        'resume-builder-start-new': () => this.startNewConversation(),
        'resume-builder-copy-result': () => this.copyResult(),
        'resume-builder-download-result': () => this.downloadResult(),
      },
      actions: {
        closeDeveloperPrompt: 'resume-builder-close-developer-prompt',
        toggleDeveloperKeyVisibility: 'resume-builder-toggle-developer-key-visibility',
        saveDeveloperKey: 'resume-builder-save-developer-key',
        testDeveloperConnection: 'resume-builder-test-developer-connection',
        resetDeveloperSettings: 'resume-builder-reset-developer-settings',
      },
    };
    super(config);

    this.messages = [];
    this.isStreaming = false;
    this.currentUsage = null;
    this.model = this.getSelectedModel();
    this.projectExperience = '';
  }

  getSelectedModel() {
    return (
      localStorage.getItem('jsonld_resume_builder_model') ||
      window.ADVISOR_CONST.DEFAULT_MODEL
    );
  }

  setSelectedModel(model) {
    this.model = model;
    localStorage.setItem('jsonld_resume_builder_model', model);
  }

  showResumeBuilderModal() {
    const existingModal = document.getElementById('resumeBuilderModal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = this.createResumeBuilderModal();
    document.body.appendChild(modal);
    modal.style.display = 'flex';

    this.addEscapeKeyListener(modal, () => this.closeResumeBuilderModal());
    modal.addEventListener('click', e => {
      if (e.target === modal) {
        this.closeResumeBuilderModal();
      }
    });

    // 初回メッセージを送信
    if (this.messages.length === 0) {
      this.startConversation();
    }
  }

  createResumeBuilderModal() {
    const overlay = document.createElement('div');
    overlay.id = 'resumeBuilderModal';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';

    const container = document.createElement('div');
    container.className = 'modal-container modal-container--fullscreen';

    const header = this._createModalHeader();
    container.appendChild(header);

    const body = this._createModalBody();
    container.appendChild(body);

    const footer = this._createModalFooter();
    container.appendChild(footer);

    overlay.appendChild(container);
    return overlay;
  }

  _createModalHeader() {
    const header = document.createElement('div');
    header.className = 'modal-header modal-header--sticky';

    const title = document.createElement('h2');
    title.textContent = 'レジュメビルダー ';

    const betaBadge = document.createElement('span');
    betaBadge.className = 'badge-beta';
    betaBadge.textContent = 'Beta';
    title.appendChild(betaBadge);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-modal-close';
    closeBtn.textContent = '×';
    closeBtn.dataset.action = 'resume-builder-close-modal';

    header.appendChild(title);
    header.appendChild(closeBtn);
    return header;
  }

  _createModalBody() {
    const body = document.createElement('div');
    body.className = 'modal-body';

    const infoBox = this._createInfoBox();
    body.appendChild(infoBox);

    const chatContainer = this._createChatContainer();
    body.appendChild(chatContainer);

    return body;
  }

  _createInfoBox() {
    const infoBox = document.createElement('div');
    infoBox.className = 'modal-info-box modal-info-box--blue modal-info-box--spacing';

    const heading = document.createElement('h4');
    heading.textContent = 'AIと対話してプロジェクト経験を作成';

    const para1 = document.createElement('p');
    para1.textContent =
      'AIが6つの質問を投げかけます。質問に答えていくだけで、プロジェクト経験の文章が自動生成されます。';

    const para2 = document.createElement('p');
    para2.className = 'modal-info-box-secondary-text';
    para2.textContent = '無料プランでは50回/24時間まで利用できます。';

    infoBox.appendChild(heading);
    infoBox.appendChild(para1);
    infoBox.appendChild(para2);
    return infoBox;
  }

  _createChatContainer() {
    const container = document.createElement('div');
    container.className = 'chat-container';

    const messagesArea = document.createElement('div');
    messagesArea.className = 'chat-messages';
    messagesArea.id = 'chatMessages';

    const statusArea = document.createElement('div');
    statusArea.className = 'chat-status';
    statusArea.id = 'chatStatus';
    statusArea.style.display = 'none';
    statusArea.innerHTML = `
      <div class="spinner"></div>
      <p>AIが回答を生成中...</p>
    `;

    container.appendChild(messagesArea);
    container.appendChild(statusArea);

    return container;
  }

  _createModalFooter() {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';

    const textarea = document.createElement('textarea');
    textarea.id = 'chatInput';
    textarea.className = 'chat-input';
    textarea.placeholder = '回答を入力してください...';
    textarea.rows = 3;

    textarea.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'chat-button-group';

    const sendBtn = document.createElement('button');
    sendBtn.className = 'btn-primary';
    sendBtn.dataset.action = 'resume-builder-send-message';
    sendBtn.textContent = '送信';

    const newBtn = document.createElement('button');
    newBtn.className = 'btn-secondary';
    newBtn.dataset.action = 'resume-builder-start-new';
    newBtn.textContent = '新規作成';

    buttonGroup.appendChild(newBtn);
    buttonGroup.appendChild(sendBtn);

    inputArea.appendChild(textarea);
    inputArea.appendChild(buttonGroup);

    footer.appendChild(inputArea);
    return footer;
  }

  closeResumeBuilderModal() {
    const modal = document.getElementById('resumeBuilderModal');
    if (modal) {
      modal.remove();
    }
  }

  async startConversation() {
    // 初回メッセージを送信
    this.messages = [];
    await this.callResumeBuilderAPI('こんにちは。プロジェクト経験を作成したいです。');
  }

  startNewConversation() {
    if (
      this.messages.length > 0 &&
      !confirm('現在の会話をクリアして新規作成しますか？')
    ) {
      return;
    }

    this.messages = [];
    this.projectExperience = '';

    const messagesArea = document.getElementById('chatMessages');
    if (messagesArea) {
      messagesArea.innerHTML = '';
    }

    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.value = '';
    }

    this.startConversation();
  }

  async sendMessage() {
    const chatInput = document.getElementById('chatInput');
    if (!chatInput) return;

    const message = chatInput.value.trim();
    if (!message) {
      this.showError('メッセージを入力してください');
      return;
    }

    // レート制限チェック
    const rateLimit = this.checkRateLimit();
    if (!rateLimit.allowed) {
      this.showError(
        `レート制限に達しました。リセット時刻: ${rateLimit.resetTime.toLocaleString('ja-JP')}`
      );
      return;
    }

    // ユーザーメッセージを追加
    this.addMessageToUI('user', message);
    chatInput.value = '';

    // APIを呼び出し
    await this.callResumeBuilderAPI(message);
    this.recordUsage();
  }

  addMessageToUI(role, content) {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = role === 'user' ? 'あなた' : 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-message-content';

    if (role === 'assistant') {
      contentDiv.innerHTML = this.renderMarkdownCommon(content);
    } else {
      contentDiv.textContent = content;
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);

    messagesArea.appendChild(messageDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  async callResumeBuilderAPI(userMessage) {
    if (!canStartAnalysis('resume-builder')) {
      this.showError('他の分析が実行中です。完了してから再度お試しください。');
      return;
    }

    const controller = new AbortController();
    window.ANALYSIS_STATE.abortControllers['resume-builder'] = controller;
    setAnalysisActive('resume-builder');

    this.isStreaming = true;

    try {
      // メッセージ履歴に追加
      this.messages.push({
        role: 'user',
        content: userMessage,
      });

      const apiUrl = this.getApiUrl('resume-builder');
      const userApiKey = this.getUserApiKey();
      const baseUrl = this.getUserApiBaseUrl();

      const requestBody = {
        messages: this.messages,
        userApiKey,
        baseUrl,
        model: this.model,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      await this.processStreamingResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        this.showError('処理がキャンセルされました');
      } else {
        this.showError(`エラーが発生しました: ${error.message}`);
      }
    } finally {
      this.ensureAnalysisCleanup('resume-builder');
    }
  }

  async processStreamingResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let receivedModel = null;

    const statusEl = document.getElementById('chatStatus');
    if (statusEl) {
      statusEl.style.display = 'flex';
    }

    // AIメッセージのプレースホルダーを作成
    const messagesArea = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message chat-message--assistant';

    const avatar = document.createElement('div');
    avatar.className = 'chat-avatar';
    avatar.textContent = 'AI';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'chat-message-content';

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(contentDiv);
    messagesArea.appendChild(messageDiv);

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.model) {
              receivedModel = parsed.model;
            }

            if (parsed.content) {
              fullText += parsed.content;

              if (statusEl && statusEl.style.display !== 'none') {
                statusEl.style.display = 'none';
              }

              contentDiv.innerHTML = this.renderMarkdownCommon(fullText);
              messagesArea.scrollTop = messagesArea.scrollHeight;
            }

            if (parsed.usage) {
              this.currentUsage = parsed.usage;
              this.displayUsageInfo(parsed.usage, receivedModel);
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    }

    // アシスタントメッセージを履歴に追加
    this.messages.push({
      role: 'assistant',
      content: fullText,
    });

    // プロジェクト経験が含まれているかチェック
    if (fullText.includes('## プロジェクト経験')) {
      this.projectExperience = fullText;
      this.showResultActions();
    }

    this.showAnalysisCompleteNotification('resume-builder');
  }

  displayUsageInfo(usage, model) {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    // 既存の使用量パネルを削除
    const existingPanel = messagesArea.querySelector('.chat-usage-panel');
    if (existingPanel) {
      existingPanel.remove();
    }

    const usagePanel = document.createElement('div');
    usagePanel.className = 'chat-usage-panel';
    usagePanel.innerHTML = this.renderApiUsagePanel(usage, model);

    messagesArea.appendChild(usagePanel);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  showResultActions() {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    // 既存のアクションボタンを削除
    const existingActions = messagesArea.querySelector('.chat-result-actions');
    if (existingActions) {
      existingActions.remove();
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'chat-result-actions';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn-secondary btn-sm';
    copyBtn.dataset.action = 'resume-builder-copy-result';
    copyBtn.textContent = 'コピー';

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-secondary btn-sm';
    downloadBtn.dataset.action = 'resume-builder-download-result';
    downloadBtn.textContent = 'ダウンロード';

    actionsDiv.appendChild(copyBtn);
    actionsDiv.appendChild(downloadBtn);

    messagesArea.appendChild(actionsDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  copyResult() {
    if (!this.projectExperience) {
      this.showError('プロジェクト経験がまだ生成されていません');
      return;
    }

    navigator.clipboard
      .writeText(this.projectExperience)
      .then(() => {
        this.showSnackbar('プロジェクト経験をコピーしました');
      })
      .catch(() => {
        this.showError('コピーに失敗しました');
      });
  }

  downloadResult() {
    if (!this.projectExperience) {
      this.showError('プロジェクト経験がまだ生成されていません');
      return;
    }

    const blob = new Blob([this.projectExperience], {
      type: 'text/markdown;charset=utf-8',
    });
    const filename = `プロジェクト経験_${new Date().toISOString().slice(0, 10)}.md`;
    this.downloadFile(blob, filename);
  }

  showError(message) {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message;
      snackbar.className = 'snackbar show error';
      setTimeout(() => {
        snackbar.className = 'snackbar';
      }, 3000);
    }
  }

  showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    if (snackbar) {
      snackbar.textContent = message;
      snackbar.className = 'snackbar show';
      setTimeout(() => {
        snackbar.className = 'snackbar';
      }, 3000);
    }
  }
}

window.ResumeBuilderManager = ResumeBuilderManager;
window.resumeBuilderManager = new ResumeBuilderManager();

export { ResumeBuilderManager };
export default ResumeBuilderManager;
