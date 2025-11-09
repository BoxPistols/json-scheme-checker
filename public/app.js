// プロキシサーバーのURL設定
const currentHost = window.location.hostname;
const isVercel = currentHost.includes('vercel.app') || currentHost.includes('vercel.sh');
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
let PROXY_SERVER;
if (isVercel) {
  PROXY_SERVER = ''; // 相対パスでAPIを呼び出す
} else if (isLocalhost) {
  PROXY_SERVER = 'http://localhost:3333';
} else {
  PROXY_SERVER = `http://${currentHost}:3333`;
}
function createDeveloperSettingsModal() {
  if (document.getElementById('developerSettingsModal')) {
    return;
  }
  const template = document.createElement('template');
  template.innerHTML = `
    <div id="developerSettingsModal" class="modal-overlay">
      <div class="modal-container" style="max-width: 600px;">
        <div class="modal-header">
          <div>
            <h2>API設定</h2>
            <div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 4px;">
              API設定を、無料版と自身で取得したAPIキーを使用するモードで切り替えることができます
            </div>
          </div>
          <button type="button" class="modal-close-btn" id="btnCloseDeveloperSettings" aria-label="閉じる">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <section class="modal-section">
            <div style="margin-bottom: 24px; padding: 16px; background: var(--secondary-bg-color); border-radius: 8px; border: 1px solid var(--border-color);">
              <label style="display: block; margin-bottom: 12px; font-weight: 600; font-size: 0.9rem;">利用モード</label>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; border-radius: 6px; border: 2px solid var(--border-color); transition: all 0.2s;" class="mode-radio-label">
                  <input type="radio" name="apiMode" value="free" id="radioModeFree" checked style="margin-top: 2px; margin-right: 8px; cursor: pointer;">
                  <div>
                    <div style="font-weight: 500;">無料版を使用（サーバー負担）</div>
                    <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-top: 2px;">
                      gpt-5-nano（最新世代低レイテンシ）を利用可能。レート制限あり（50回/24時間、毎日0:00にリセット）
                    </div>
                  </div>
                </label>
                <label style="display: flex; align-items: start; cursor: pointer; padding: 12px; border-radius: 6px; border: 2px solid var(--border-color); transition: all 0.2s;" class="mode-radio-label">
                  <input type="radio" name="apiMode" value="myapi" id="radioModeMyAPI" style="margin-top: 2px; margin-right: 8px; cursor: pointer;">
                  <div>
                    <div style="font-weight: 500;">MyAPIを使用（ユーザー負担）</div>
                    <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-top: 2px;">
                      独自のOpenAI APIキーを使用。全モデル選択可能、レート制限なし
                    </div>
                  </div>
                </label>
              </div>
            </div>
            <div id="freeModelArea" style="margin-bottom: 16px;">
              <div class="form-group">
                <label for="freeModelSelect" style="display: block; margin-bottom: 4px; font-weight: 500;">
                  モデル選択
                </label>
                <select
                  id="freeModelSelect"
                  class="form-select"
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px;"
                >
                  <option value="gpt-5-nano">gpt-5-nano（最速、簡潔な回答）</option>
                  <option value="gpt-4.1-nano">gpt-4.1-nano（やや遅い、詳細な回答）</option>
                </select>
                <p style="margin: 8px 0 4px 0; font-size: 12px; color: var(--secondary-text-color);">
                  gpt-5-nano: 超低レイテンシで最速応答、要点重視の分析（推奨）
                </p>
                <p style="margin: 4px 0 0; font-size: 12px; color: var(--secondary-text-color);">
                  gpt-4.1-nano: やや遅い、より詳細な説明が必要な場合
                </p>
              </div>
            </div>
            <div id="myApiArea" style="display: none;">
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="developerApiKey" style="display: block; margin-bottom: 4px; font-weight: 500;">
                  OpenAI APIキー
                </label>
                <input
                  type="password"
                  id="developerApiKey"
                  class="form-input"
                  placeholder="sk-..."
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px;"
                />
                <p style="margin: 4px 0 0; font-size: 12px; color: var(--secondary-text-color);">
                  APIキーは安全にローカルストレージに保存されます
                </p>
              </div>
              <div class="form-group" style="margin-bottom: 16px;">
                <label for="developerModel" style="display: block; margin-bottom: 4px; font-weight: 500;">
                  モデル
                </label>
                <select
                  id="developerModel"
                  class="form-select"
                  style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px;"
                >
                  <option value="gpt-5-nano">gpt-5-nano（超低レイテンシ: $0.05/1M入力）</option>
                  <option value="gpt-4.1-nano">gpt-4.1-nano（レガシー互換: $0.08/1M入力）</option>
                  <option value="gpt-4.1-mini">gpt-4.1-mini（$0.40/1M入力）</option>
                  <option value="gpt-5-mini">gpt-5-mini（$0.30/1M入力・推定）</option>
                  <option value="gpt-4o">gpt-4o（品質重視: $2.50/1M入力）</option>
                  <option value="gpt-5">gpt-5（最高品質: $1.25/1M入力）</option>
                </select>
                <p style="margin: 4px 0 0; font-size: 12px; color: var(--secondary-text-color);">
                  GPT-5シリーズは超低レイテンシですが、temperatureパラメータは非対応です
                </p>
              </div>
              <details style="margin-bottom: 16px;">
                <summary style="cursor: pointer; font-weight: 500; margin-bottom: 8px;">
                  詳細設定（オプション）
                </summary>
                <div style="padding-left: 16px;">
                  <div class="form-group">
                    <label for="developerBaseUrl" style="display: block; margin-bottom: 4px; font-weight: 500;">
                      Base URL
                    </label>
                    <input
                      type="url"
                      id="developerBaseUrl"
                      class="form-input"
                      placeholder="https://api.openai.com/v1"
                      style="width: 100%; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 14px;"
                    />
                    <p style="margin: 4px 0 0; font-size: 12px; color: var(--secondary-text-color);">
                      OpenAI互換APIを使用する場合のみ指定
                    </p>
                  </div>
                </div>
              </details>
            </div>
            <div id="developerSettingsStatus" style="margin-bottom: 16px; padding: 12px; border-radius: 4px; display: none;">
              <p style="margin: 0; font-size: 0.875rem;"></p>
            </div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button type="button" id="btnTestConnection" class="btn-modal-secondary">
                接続テスト
              </button>
              <button type="button" id="btnClearDeveloperSettings" class="btn-modal-secondary">
                クリア
              </button>
              <button type="button" id="btnSaveDeveloperSettings" class="btn-modal-primary">
                保存
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  `.trim();
  const modal = template.content.firstElementChild;
  if (!modal) {
    return;
  }
  document.body.appendChild(modal);
}
createDeveloperSettingsModal();
function togglePasswordVisibility() {
  const passwordField = document.getElementById('password');
  const toggleButton = document.getElementById('togglePassword');
  const iconEye = document.getElementById('iconEye');
  const iconEyeOff = document.getElementById('iconEyeOff');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    if (iconEye && iconEyeOff) {
      iconEye.classList.remove('icon-visible');
      iconEye.classList.add('icon-hidden');
      iconEyeOff.classList.remove('icon-hidden');
      iconEyeOff.classList.add('icon-visible');
    }
    toggleButton.title = 'パスワードを非表示';
  } else {
    passwordField.type = 'password';
    if (iconEye && iconEyeOff) {
      iconEye.classList.remove('icon-hidden');
      iconEye.classList.add('icon-visible');
      iconEyeOff.classList.remove('icon-visible');
      iconEyeOff.classList.add('icon-hidden');
    }
    toggleButton.title = 'パスワードを表示';
  }
}
/**
 * モーダルを開く共通関数
 * - モーダルを表示
 * - 背景（body）のスクロールを無効化
 * @param {string} modalId - モーダル要素のID
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('modal-overlay--visible');
    document.body.style.overflow = 'hidden';
  }
}
/**
 * モーダルを閉じる共通関数
 * - モーダルを非表示
 * - 背景（body）のスクロールを有効化
 * @param {string} modalId - モーダル要素のID
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
    document.body.style.overflow = '';
  }
}
function showSecurityModal() {
  openModal('securityModal');
}
function closeSecurityModal() {
  closeModal('securityModal');
}
function showGuideModal() {
  openModal('guideModal');
}
function closeGuideModal() {
  closeModal('guideModal');
}
function showRobotsModal() {
  openModal('robotsGuideModal');
}
function closeRobotsModal() {
  closeModal('robotsGuideModal');
}
function showTwitterCardModal() {
  openModal('twitterCardGuideModal');
}
function closeTwitterCardModal() {
  closeModal('twitterCardGuideModal');
}
function showOpenGraphModal() {
  openModal('openGraphGuideModal');
}
function closeOpenGraphModal() {
  closeModal('openGraphGuideModal');
}
document.addEventListener('DOMContentLoaded', () => {
  if (window.isDebugMode && window.isDebugMode()) {
    const header = document.querySelector('header');
    if (header) {
      const debugBadge = document.createElement('div');
      debugBadge.className = 'debug-mode-badge';
      debugBadge.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Debug Mode
      `;
      header.appendChild(debugBadge);
    } else {
    }
    const subtitle = document.querySelector('.subtitle');
    if (subtitle) {
      subtitle.style.color = '#ff6b6b';
      subtitle.textContent += ' [デバッグモード: モックデータを使用]';
    }
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = 'https://example.com/mock-jobposting';
    }
    setTimeout(() => {
      if (window.advisorManager && window.DEBUG_MOCK_DATA?.jobPosting?.sample1) {
        const mockData = window.DEBUG_MOCK_DATA.jobPosting.sample1;
        window.advisorManager.currentJobPosting = mockData.data;
        window.advisorManager.startAnalysis('employer');
      }
      if (window.blogReviewerManager && window.DEBUG_MOCK_DATA?.blog?.sample1) {
        const mockData = window.DEBUG_MOCK_DATA.blog.sample1;
        window.blogReviewerManager.jsonldData = mockData.data;
      }
      if (window.webAdvisorManager && window.DEBUG_MOCK_DATA?.web?.sample1) {
        const mockData = window.DEBUG_MOCK_DATA.web.sample1;
        window.webAdvisorManager.pageData = mockData.data;
      }
    }, 500);
  }
  const securityModal = document.getElementById('securityModal');
  if (securityModal) {
    securityModal.addEventListener('click', e => {
      if (e.target === securityModal) {
        closeSecurityModal();
      }
    });
  }
  const guideModal = document.getElementById('guideModal');
  if (guideModal) {
    guideModal.addEventListener('click', e => {
      if (e.target === guideModal) {
        closeGuideModal();
      }
    });
  }
  const robotsModal = document.getElementById('robotsGuideModal');
  if (robotsModal) {
    robotsModal.addEventListener('click', e => {
      if (e.target === robotsModal) {
        closeRobotsModal();
      }
    });
  }
  const twitterCardModal = document.getElementById('twitterCardGuideModal');
  if (twitterCardModal) {
    twitterCardModal.addEventListener('click', e => {
      if (e.target === twitterCardModal) {
        closeTwitterCardModal();
      }
    });
  }
  const openGraphModal = document.getElementById('openGraphGuideModal');
  if (openGraphModal) {
    openGraphModal.addEventListener('click', e => {
      if (e.target === openGraphModal) {
        closeOpenGraphModal();
      }
    });
  }
  document.getElementById('btnGuide')?.addEventListener('click', showGuideModal);
  document.getElementById('fetchButton')?.addEventListener('click', fetchAndDisplay);
  document.getElementById('togglePassword')?.addEventListener('click', togglePasswordVisibility);
  document.getElementById('btnShowSecurityModal')?.addEventListener('click', showSecurityModal);
  document.getElementById('btnClearAuth')?.addEventListener('click', clearAuth);
  document.getElementById('btnCloseSecurityModal')?.addEventListener('click', closeSecurityModal);
  document.getElementById('btnCloseGuideModal')?.addEventListener('click', closeGuideModal);
  document.getElementById('btnCloseRobotsModal')?.addEventListener('click', closeRobotsModal);
  document
    .getElementById('btnCloseTwitterCardModal')
    ?.addEventListener('click', closeTwitterCardModal);
  document.getElementById('btnCloseOpenGraphModal')?.addEventListener('click', closeOpenGraphModal);
  document.getElementById('btnHideError')?.addEventListener('click', hideError);
  document.getElementById('contentUploadButton')?.addEventListener('click', () => {
    window.contentUploadReviewerManager?.showUploadModal();
  });
  const headerRow = document.querySelector('.header-row');
  if (headerRow) {
    headerRow.addEventListener('click', () => {
      window.location.href = '/';
    });
  }
  document.querySelectorAll('input[name="authStorage"]').forEach(radio => {
    radio.addEventListener('change', handleStorageMethodChange);
  });
  const sampleLinksContainer = document.querySelector('.sample-links');
  if (sampleLinksContainer) {
    sampleLinksContainer.addEventListener('click', e => {
      if (e.target.classList.contains('sample-link')) {
        e.preventDefault();
        const url = e.target.dataset.sampleUrl;
        if (url) loadSample(url);
      }
      else if (e.target.classList.contains('sample-edit-btn')) {
        e.preventDefault();
        const index = parseInt(e.target.dataset.index);
        editSampleUrl(index);
      }
      else if (e.target.classList.contains('sample-delete-btn')) {
        e.preventDefault();
        const index = parseInt(e.target.dataset.index);
        deleteSampleUrl(index);
      }
      else if (e.target.classList.contains('sample-add-btn')) {
        e.preventDefault();
        addSampleUrl();
      }
      else if (e.target.classList.contains('sample-reset-btn')) {
        e.preventDefault();
        resetSampleUrls();
      }
      else if (e.target.classList.contains('sample-move-btn')) {
        e.preventDefault();
        const index = parseInt(e.target.dataset.index);
        const direction = e.target.dataset.direction;
        moveSampleUrl(index, direction);
      }
    });
  }
  const schemasContainer = document.getElementById('schemasContainer');
  if (schemasContainer) {
    schemasContainer.addEventListener('click', e => {
      const target = e.target;
      if (target.closest('.view-toggle button')) {
        const button = target.closest('button');
        const schemaContent = button.closest('.schema-card').querySelector('.schema-content');
        const schemaId = schemaContent.id;
        const view = button.textContent.toLowerCase().includes('テーブル') ? 'table' : 'json';
        toggleView(schemaId, view, button);
      }
      if (target.closest('.copy-button')) {
        const button = target.closest('.copy-button');
        const schemaContent = button.closest('.schema-card').querySelector('.schema-content');
        copyToClipboard(schemaContent.id, button);
      }
      if (target.classList.contains('expandable')) {
        const nextElement = target.nextElementSibling;
        if (nextElement && nextElement.classList.contains('nested-content')) {
          toggleNested(nextElement.id, target);
        }
      }
    });
  }
  restoreStorageMethod();
  const GUIDE_SHOWN_KEY = 'jsonld_guide_shown';
  const hasSeenGuide = localStorage.getItem(GUIDE_SHOWN_KEY);
  if (!hasSeenGuide) {
    setTimeout(() => {
      showGuideModal();
      localStorage.setItem(GUIDE_SHOWN_KEY, 'true');
    }, 500);
  }
  renderSampleLinks();
  const themeToggleButton = document.getElementById('btnThemeToggle');
  const lightIcon = document.getElementById('theme-icon-light');
  const darkIcon = document.getElementById('theme-icon-dark');
  const THEME_KEY = 'jsonld_theme';
  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = theme; // bodyではなくhtml(documentElement)に設定
    if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'inline-block';
    if (darkIcon) darkIcon.style.display = isDark ? 'inline-block' : 'none';
    if (themeToggleButton) {
      const newLabel = `テーマを切り替え（現在: ${isDark ? 'ダーク' : 'ライト'}モード）`;
      themeToggleButton.setAttribute('aria-label', newLabel);
    }
  }
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
    }
    applyTheme(newTheme);
  }
  if (document.documentElement.dataset.theme && themeToggleButton) {
    const currentTheme = document.documentElement.dataset.theme;
    const isDark = currentTheme === 'dark';
    const newLabel = `テーマを切り替え（現在: ${isDark ? 'ダーク' : 'ライト'}モード）`;
    themeToggleButton.setAttribute('aria-label', newLabel);
    if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'inline-block';
    if (darkIcon) darkIcon.style.display = isDark ? 'inline-block' : 'none';
  }
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  }
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch (error) {
      }
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      const securityModal = document.getElementById('securityModal');
      const guideModal = document.getElementById('guideModal');
      if (securityModal?.classList.contains('modal-overlay--visible')) {
        closeSecurityModal();
      }
      if (guideModal?.classList.contains('modal-overlay--visible')) {
        closeGuideModal();
      }
    }
  });
  updateHeaderApiStatus();
});
function restoreStorageMethod() {
  const savedMethod = localStorage.getItem(STORAGE_METHOD_KEY) || 'none';
  const radio = document.querySelector(`input[name="authStorage"][value="${savedMethod}"]`);
  if (radio) {
    radio.checked = true;
  }
}
function handleStorageMethodChange() {
  const selectedMethod =
    document.querySelector('input[name="authStorage"]:checked')?.value || 'none';
  localStorage.setItem(STORAGE_METHOD_KEY, selectedMethod);
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (username || password) {
    saveAuth(username, password);
  }
  const messages = {
    none: '認証情報を保存しない設定に変更しました',
    session: 'タブを閉じるまで保存する設定に変更しました',
    persistent: '24時間保存する設定に変更しました',
    permanent: '永続保存する設定に変更しました（期限なし）',
  };
  showSnackbar(messages[selectedMethod] || '設定を変更しました', 'success');
}
const AUTH_STORAGE_KEY = 'jsonld_basic_auth';
const DOMAIN_AUTH_PREFIX = 'jsonld_auth_';
const STORAGE_METHOD_KEY = 'jsonld_storage_method';
const COLLAPSE_SAMPLE_LINKS_KEY = 'jsonld_ui_sample_links_open';
const COLLAPSE_SUMMARY_CARD_KEY = 'jsonld_ui_summary_card_open';
const SAMPLE_URLS_KEY = 'jsonld_sample_urls';
const DEFAULT_SAMPLE_URLS = [
  { label: '求人: レバテック', url: 'https://freelance.levtech.jp/project/detail/28421/' },
  { label: '求人: PE-BANK', url: 'https://pe-bank.jp/project/aws/47302-18/' },
  { label: 'Tech: Zenn React', url: 'https://zenn.dev/topics/react' },
  { label: 'Tech: Qiita TS', url: 'https://qiita.com/tags/typescript' },
  { label: 'Blog: レバテックLAB', url: 'https://levtech.jp/media/article/focus/detail_680/' },
  { label: 'News: ITmedia', url: 'https://www.itmedia.co.jp/news/' },
  { label: '企業: サイボウズ', url: 'https://cybozu.co.jp/company/' },
];
function loadSampleUrls() {
  const stored = localStorage.getItem(SAMPLE_URLS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
    }
  }
  localStorage.setItem(SAMPLE_URLS_KEY, JSON.stringify(DEFAULT_SAMPLE_URLS));
  return DEFAULT_SAMPLE_URLS;
}
function saveSampleUrls(urls) {
  localStorage.setItem(SAMPLE_URLS_KEY, JSON.stringify(urls));
}
function renderSampleLinks() {
  const container = document.querySelector('.sample-links');
  if (!container) return;
  const existingElements = container.querySelectorAll('.sample-item, .sample-buttons');
  existingElements.forEach(el => el.remove());
  const urls = loadSampleUrls();
  urls.forEach((item, index) => {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'sample-item';
    itemContainer.draggable = true;
    itemContainer.dataset.index = index;
    const link = document.createElement('a');
    link.className = 'sample-link';
    link.textContent = item.label;
    link.dataset.sampleUrl = item.url;
    link.href = '#';
    link.title = item.url;
    itemContainer.appendChild(link);
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'sample-actions';
    const editBtn = document.createElement('button');
    editBtn.className = 'sample-edit-btn';
    editBtn.textContent = '編集';
    editBtn.dataset.index = index;
    editBtn.title = 'このサンプルURLを編集';
    actionsContainer.appendChild(editBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sample-delete-btn';
    deleteBtn.textContent = '削除';
    deleteBtn.dataset.index = index;
    deleteBtn.title = 'このサンプルURLを削除';
    actionsContainer.appendChild(deleteBtn);
    itemContainer.appendChild(actionsContainer);
    container.appendChild(itemContainer);
  });
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'sample-buttons';
  const addBtn = document.createElement('button');
  addBtn.className = 'sample-add-btn';
  addBtn.textContent = '+ 追加';
  addBtn.title = '新しいサンプルURLを追加';
  buttonsContainer.appendChild(addBtn);
  const resetBtn = document.createElement('button');
  resetBtn.className = 'sample-reset-btn';
  resetBtn.textContent = '初期化';
  resetBtn.title = 'デフォルトのサンプルURLに戻す';
  buttonsContainer.appendChild(resetBtn);
  container.appendChild(buttonsContainer);
  setupDragAndDrop();
}
function editSampleUrl(index) {
  const urls = loadSampleUrls();
  if (index < 0 || index >= urls.length) return;
  const item = urls[index];
  const newLabel = prompt('表示名を入力してください:', item.label);
  if (newLabel === null) return; // キャンセル
  const newUrl = prompt('URLを入力してください:', item.url);
  if (newUrl === null) return; // キャンセル
  if (newLabel.trim() && newUrl.trim()) {
    urls[index] = { label: newLabel.trim(), url: newUrl.trim() };
    saveSampleUrls(urls);
    renderSampleLinks();
    showSnackbar('サンプルURLを更新しました', 'success');
  } else {
    showSnackbar('表示名とURLは必須です', 'error');
  }
}
function deleteSampleUrl(index) {
  const urls = loadSampleUrls();
  if (index < 0 || index >= urls.length) return;
  const item = urls[index];
  if (confirm(`"${item.label}" を削除してもよろしいですか？`)) {
    urls.splice(index, 1);
    saveSampleUrls(urls);
    renderSampleLinks();
    showSnackbar('サンプルURLを削除しました', 'success');
  }
}
function addSampleUrl() {
  const newLabel = prompt('表示名を入力してください:');
  if (newLabel === null) return; // キャンセル
  const newUrl = prompt('URLを入力してください:');
  if (newUrl === null) return; // キャンセル
  if (newLabel.trim() && newUrl.trim()) {
    const urls = loadSampleUrls();
    urls.push({ label: newLabel.trim(), url: newUrl.trim() });
    saveSampleUrls(urls);
    renderSampleLinks();
    showSnackbar('サンプルURLを追加しました', 'success');
  } else {
    showSnackbar('表示名とURLは必須です', 'error');
  }
}
function resetSampleUrls() {
  const message = `サンプルURLをデフォルトの${DEFAULT_SAMPLE_URLS.length}個に戻します。\n現在のカスタマイズは失われます。よろしいですか？`;
  if (confirm(message)) {
    localStorage.removeItem(SAMPLE_URLS_KEY);
    saveSampleUrls(DEFAULT_SAMPLE_URLS);
    renderSampleLinks();
    showSnackbar('サンプルURLを初期化しました', 'success');
  }
}
function moveSampleUrl(index, direction) {
  const urls = loadSampleUrls();
  if (index < 0 || index >= urls.length) return;
  let newIndex;
  if (direction === 'left' && index > 0) {
    newIndex = index - 1;
  } else if (direction === 'right' && index < urls.length - 1) {
    newIndex = index + 1;
  } else {
    return; // 移動不可
  }
  const temp = urls[index];
  urls[index] = urls[newIndex];
  urls[newIndex] = temp;
  saveSampleUrls(urls);
  renderSampleLinks();
  showSnackbar('サンプルURLの位置を変更しました', 'success');
}
let draggedElement = null;
let draggedIndex = null;
function setupDragAndDrop() {
  const container = document.querySelector('.sample-links');
  if (!container) return;
  const items = container.querySelectorAll('.sample-item');
  items.forEach(item => {
    item.addEventListener('dragstart', e => {
      draggedElement = item;
      draggedIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item.innerHTML);
    });
    item.addEventListener('dragend', e => {
      item.classList.remove('dragging');
      draggedElement = null;
      draggedIndex = null;
    });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (draggedElement && draggedElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        if (e.clientX < midpoint) {
          item.classList.add('drag-over-left');
          item.classList.remove('drag-over-right');
        } else {
          item.classList.add('drag-over-right');
          item.classList.remove('drag-over-left');
        }
      }
    });
    item.addEventListener('dragleave', e => {
      item.classList.remove('drag-over-left', 'drag-over-right');
    });
    item.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();
      item.classList.remove('drag-over-left', 'drag-over-right');
      if (draggedElement && draggedElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;
        let insertIndex = targetIndex;
        if (e.clientX >= midpoint) {
          insertIndex = targetIndex + 1;
        }
        const urls = loadSampleUrls();
        const draggedItem = urls[draggedIndex];
        urls.splice(draggedIndex, 1);
        if (draggedIndex < insertIndex) {
          insertIndex--;
        }
        urls.splice(insertIndex, 0, draggedItem);
        saveSampleUrls(urls);
        renderSampleLinks();
        showSnackbar('サンプルURLの順序を変更しました', 'success');
      }
    });
  });
}
async function encryptPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('jsonld-viewer-key-2025'),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('jsonld-salt'), // 固定ソルト（セキュリティ制限）
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data);
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return { success: true, data: btoa(String.fromCharCode(...combined)) };
  } catch (error) {
    return { success: false, data: password }; // フォールバック: 平文を返す
  }
}
async function decryptPassword(encryptedData) {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('jsonld-viewer-key-2025'),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('jsonld-salt'),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encrypted);
    const decoder = new TextDecoder();
    return { success: true, data: decoder.decode(decrypted) };
  } catch (error) {
    return { success: false, data: encryptedData }; // フォールバック: 暗号化データをそのまま返す
  }
}
async function saveAuth(username, password) {
  const storageMethod =
    document.querySelector('input[name="authStorage"]:checked')?.value || 'none';
  if (storageMethod === 'none') {
    return;
  }
  const encryptionResult = await encryptPassword(password);
  const auth = {
    username,
    password: encryptionResult.data,
    timestamp: Date.now(),
    encrypted: encryptionResult.success,
  };
  if (storageMethod === 'session') {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    updateAuthStatus(true);
  } else if (storageMethod === 'persistent' || storageMethod === 'permanent') {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    updateAuthStatus(true);
  }
}
async function loadStoredAuth() {
  const storageMethod = localStorage.getItem(STORAGE_METHOD_KEY) || 'none';
  if (storageMethod === 'none') {
    return;
  }
  let stored = null;
  if (storageMethod === 'session') {
    stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
  } else if (storageMethod === 'persistent' || storageMethod === 'permanent') {
    stored = localStorage.getItem(AUTH_STORAGE_KEY);
  }
  if (stored) {
    try {
      const auth = JSON.parse(stored);
      if (storageMethod === 'persistent') {
        const elapsed = Date.now() - (auth.timestamp || 0);
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
        if (elapsed > TWENTY_FOUR_HOURS) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          updateAuthStatus(false);
          return;
        }
      }
      const decryptionResult = auth.encrypted
        ? await decryptPassword(auth.password)
        : { success: true, data: auth.password };
      document.getElementById('username').value = auth.username || '';
      document.getElementById('password').value = decryptionResult.data || '';
      updateAuthStatus(true);
    } catch (e) {
    }
  }
}
function clearAuth() {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(DOMAIN_AUTH_PREFIX)) {
      localStorage.removeItem(key);
    }
  });
  updateAuthStatus(false);
  showSnackbar('すべての認証情報をクリアしました', 'success');
}
function updateAuthStatus(isStored) {
  const statusEl = document.getElementById('authStatus');
  if (isStored) {
    statusEl.textContent = '(保存済み)';
    statusEl.style.color = '#10b981';
  } else {
    statusEl.textContent = '';
  }
}
let snackbarTimeout;
function showSnackbar(message, type = 'info', duration = 3000) {
  const snackbar = document.getElementById('snackbar');
  if (!snackbar) {
    return;
  }
  snackbar.textContent = '';
  snackbar.appendChild(document.createTextNode(message));
  snackbar.className = 'snackbar';
  if (type === 'success' || type === 'error' || type === 'warning' || type === 'info') {
    snackbar.classList.add(type);
  }
  snackbar.classList.add('show');
  if (snackbarTimeout) {
    clearTimeout(snackbarTimeout);
  }
  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove('show');
  }, duration);
}
window.addEventListener('beforeunload', () => {
  if (snackbarTimeout) {
    clearTimeout(snackbarTimeout);
  }
});
async function checkServerStatus() {
  const statusElement = document.getElementById('serverStatus');
  try {
    const healthUrl = isVercel ? '/api/health' : `${PROXY_SERVER}/health`;
    const response = await fetch(healthUrl);
    if (response.ok) {
      statusElement.textContent = 'Server OK';
      statusElement.className = 'server-status';
      return true;
    }
  } catch (error) {
    statusElement.textContent = 'Offline';
    statusElement.className = 'server-status offline';
    return false;
  }
  return false;
}
checkServerStatus();
loadStoredAuth();
function autoFillAuthForUrl(url) {
  try {
    const urlObj = new URL(url);
    const domainKey = DOMAIN_AUTH_PREFIX + urlObj.hostname;
    const domainAuth = localStorage.getItem(domainKey);
    if (domainAuth) {
      const auth = JSON.parse(domainAuth);
      document.getElementById('username').value = auth.username || '';
      document.getElementById('password').value = auth.password || '';
      showSnackbar(`${urlObj.hostname}の認証情報を自動入力しました`, 'success');
      return true;
    }
  } catch (e) {
  }
  return false;
}
function openAuthSection() {
  const authSection = document.getElementById('authSection');
  if (authSection) {
    authSection.open = true;
    setTimeout(() => {
      document.getElementById('username').focus();
    }, 100);
  }
}
function loadSample(url) {
  document.getElementById('urlInput').value = url;
  autoFillAuthForUrl(url);
  fetchAndDisplay();
}
async function fetchAndDisplay() {
  const urlInput = document.getElementById('urlInput');
  let url = urlInput.value.trim();
  if (!url) {
    showError('URLを入力してください');
    return;
  }
  if (!isValidUrl(url)) {
    showError('有効なURLを入力してください');
    return;
  }
  const serverOnline = await checkServerStatus();
  if (!serverOnline) {
    if (isVercel) {
      showError('Vercel APIに接続できません。しばらくお待ちください。');
    } else {
      showError(
        'プロキシサーバーがオフラインです。"npm install && npm start" を実行してください。'
      );
    }
    return;
  }
  showLoading(true);
  hideError();
  hideResults();
  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (username || password) {
      await saveAuth(username, password);
    }
    let isLocalhostUrl = false;
    try {
      const urlObj = new URL(url);
      isLocalhostUrl = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
    } catch (e) {
    }
    let response;
    if (isVercel && isLocalhostUrl) {
      try {
        const headers = {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        };
        if (username && password) {
          const auth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${auth}`;
        }
        response = await fetch(url, {
          method: 'GET',
          headers: headers,
          mode: 'cors',
          credentials: 'include',
        });
        if (!response.ok && response.status === 401) {
          openAuthSection();
          throw new Error('Basic認証が失敗しました。ユーザー名とパスワードを確認してください。');
        }
      } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
          throw new Error(`localhost URLにアクセスできません。
アクセス先のlocalhost開発サーバー側でCORSを有効化してください。
【アクセス先サーバーでの設定例】
Next.js: next.config.js に headers 設定を追加
Nuxt 3: nuxt.config.ts で vite.server.cors = true を設定
Express: server.js に app.use(cors()) を追加
設定後、アクセス先の開発サーバーを再起動してください。
詳細な設定手順は CORS_SETUP.md をご覧ください。`);
        }
        throw error;
      }
    } else {
      let proxyUrl;
      if (isVercel) {
        proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      } else {
        proxyUrl = `${PROXY_SERVER}/proxy?url=${encodeURIComponent(url)}`;
      }
      if (username && password) {
        proxyUrl += `&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      }
      response = await fetch(proxyUrl);
    }
    if (!response.ok) {
      let errorMessage;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || `HTTPエラー ${response.status}`;
        } catch {
          errorMessage = await response.text();
        }
      } else {
        errorMessage = await response.text();
      }
      if (response.status === 401) {
        openAuthSection();
        throw new Error('Basic認証が失敗しました。ユーザー名とパスワードを確認してください。');
      }
      throw new Error(errorMessage);
    }
    const html = await response.text();
    const schemas = extractJsonLd(html);
    if (typeof displaySEOAnalysis === 'function') {
      displaySEOAnalysis(html, schemas);
    }
    if (typeof blogReviewerManager !== 'undefined' && blogReviewerManager.setRemoteHtml) {
      blogReviewerManager.setRemoteHtml(html);
    }
    if (schemas.length === 0) {
      showNoData(url);
    } else {
      displaySchemas(schemas, url);
    }
  } catch (error) {
    showError(`エラーが発生しました: ${error.message}`);
  } finally {
    showLoading(false);
  }
}
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
function extractJsonLd(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemas = [];
  scripts.forEach((script, index) => {
    try {
      const json = JSON.parse(script.textContent);
      if (Array.isArray(json)) {
        json.forEach((item, itemIndex) => {
          schemas.push(item);
        });
      } else if (json['@graph'] && Array.isArray(json['@graph'])) {
        json['@graph'].forEach((item, itemIndex) => {
          schemas.push(item);
        });
      } else {
        schemas.push(json);
      }
    } catch (e) {
    }
  });
  return schemas;
}
function displaySchemas(schemas, url) {
  const container = document.getElementById('schemasContainer');
  const statsContainer = document.getElementById('stats');
  const totalProperties = schemas.reduce((acc, schema) => {
    return acc + countProperties(schema);
  }, 0);
  let domainHtml = '-';
  try {
    if (url) {
      domainHtml = new URL(url).hostname;
    }
  } catch (e) {
  }
  statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-label">スキーマ数</span>
                    <span class="stat-value">${schemas.length}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">プロパティ総数</span>
                    <span class="stat-value">${totalProperties}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">ドメイン</span>
                    <span class="stat-value">${domainHtml}</span>
                </div>
            `;
  container.innerHTML = '';
  schemas.forEach((schema, index) => {
    const card = createSchemaCard(schema, index + 1);
    container.appendChild(card);
  });
  showResults();
  if (typeof advisorManager !== 'undefined') {
    advisorManager.hideAdvisorButton();
  }
  if (typeof blogReviewerManager !== 'undefined') {
    blogReviewerManager.hideReviewButton();
  }
  if (typeof webAdvisorManager !== 'undefined') {
    webAdvisorManager.hideAnalysisButton();
  }
  let hasSpecializedAdvisor = false;
  if (typeof advisorManager !== 'undefined') {
    if (advisorManager.detectJobPosting(schemas, url)) {
      hasSpecializedAdvisor = true;
    }
  }
  if (typeof blogReviewerManager !== 'undefined') {
    if (blogReviewerManager.detectBlogPost(schemas, url)) {
      hasSpecializedAdvisor = true;
    }
  }
  if (!hasSpecializedAdvisor && typeof webAdvisorManager !== 'undefined') {
    if (webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas, url)) {
    }
  }
}
function countProperties(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  let count = 0;
  for (let key in obj) {
    count++;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      count += countProperties(obj[key]);
    }
  }
  return count;
}
function createSchemaCard(schema, index) {
  const card = document.createElement('div');
  card.className = 'schema-card';
  const type = getSchemaType(schema);
  const id = `schema-${index}`;
  card.innerHTML = `
                <div class="schema-header">
                    <div>
                        <span class="schema-type">${type}</span>
                        <span class="schema-index">Schema #${index}</span>
                    </div>
                    <div class="schema-controls">
                        <div class="view-toggle">
                            <button class="active">テーブル</button>
                            <button>JSON</button>
                        </div>
                        <div class="doc-links">${buildDocLinks(schema)}</div>
                        <button class="copy-button">
                            コピー
                        </button>
                    </div>
                </div>
                <div class="schema-content" id="${id}" data-raw='${JSON.stringify(schema)}'>
                    <div class="table-view" id="${id}-table">
                        ${createTableView(schema)}
                    </div>
                    <div class="json-view hidden" id="${id}-json">
                        ${formatJson(schema)}
                    </div>
                </div>
            `;
  return card;
}
function toggleView(schemaId, view, button) {
  const tableView = document.getElementById(`${schemaId}-table`);
  const jsonView = document.getElementById(`${schemaId}-json`);
  const toggleButtons = button.parentElement.querySelectorAll('button');
  toggleButtons.forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');
  if (view === 'table') {
    tableView.classList.remove('hidden');
    jsonView.classList.add('hidden');
  } else {
    jsonView.classList.remove('hidden');
    tableView.classList.add('hidden');
  }
}
function createTableView(obj, depth = 0) {
  if (Array.isArray(obj)) {
    return createArrayView(obj, depth);
  }
  if (typeof obj === 'object' && obj !== null) {
    return createObjectTable(obj, depth);
  }
  return formatValue(obj);
}
function createObjectTable(obj, depth) {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '<span class="property-value">空のオブジェクト</span>';
  let html =
    '<table class="data-table"><colgroup><col class="col-prop"><col class="col-value"><col class="col-type"></colgroup>';
  html += '<thead><tr><th>プロパティ</th><th>値</th><th>型</th></tr></thead>';
  html += '<tbody>';
  entries.forEach(([key, value]) => {
    const type = getValueType(value);
    html += '<tr>';
    html += `<td class="property-name">${escapeHtml(key)}</td>`;
    html += '<td>';
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        html += createArrayView(value, depth + 1);
      } else {
        html += createNestedObjectView(value, depth + 1);
      }
    } else {
      html += formatValue(value, key);
    }
    html += '</td>';
    html += `<td><span class="property-type">${type}</span></td>`;
    html += '</tr>';
  });
  html += '</tbody></table>';
  return html;
}
function createArrayView(arr, depth) {
  if (arr.length === 0) return '<span class="property-value">空の配列</span>';
  let html = `<div class="array-list">`;
  html += `<div class="array-header">配列 (${arr.length}項目)</div>`;
  arr.forEach((item, index) => {
    html += `<div class="array-list-item">`;
    if (typeof item === 'object' && item !== null) {
      const itemId = `array-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      html += `<strong class="array-item-label expandable">Item ${index + 1}</strong>`;
      html += `<div class="nested-content" id="${itemId}">`;
      html += `<div class="array-item-content">`;
      html += createTableView(item, depth + 1);
      html += `</div>`;
      html += `</div>`;
    } else {
      html += `<strong class="array-item-label">Item ${index + 1}</strong>`;
      html += `: ${formatValue(item)}`;
    }
    html += `</div>`;
  });
  html += `</div>`;
  return html;
}
function createNestedObjectView(obj, depth) {
  const id = `nested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const entries = Object.entries(obj);
  if (entries.length === 0) return '<span class="property-value">空のオブジェクト</span>';
  let preview = entries
    .slice(0, 3)
    .map(([k, v]) => {
      const val = typeof v === 'object' ? '...' : formatSimpleValue(v);
      return `${k}: ${val}`;
    })
    .join(', ');
  if (entries.length > 3) preview += '...';
  let html = `
                <div>
                    <span class="expandable">
                        オブジェクト {${preview}}
                    </span>
                    <div class="nested-content" id="${id}">
                        <div class="nested-object">
                            <div class="table-view">${createTableView(obj, depth)}</div>
                        </div>
                    </div>
                </div>
            `;
  return html;
}
function toggleNested(id, element) {
  const content = document.getElementById(id);
  element.classList.toggle('collapsed');
  content.classList.toggle('collapsed');
}
function formatValue(value, key) {
  if (value === null) return '<span class="property-value">null</span>';
  if (value === undefined) return '<span class="property-value">undefined</span>';
  if (typeof value === 'string') {
    if (hasHtmlBr(value) || (key && key.toLowerCase() === 'description')) {
      const escaped = escapeHtml(value);
      const withBreaks = escaped.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
      return `<span class="property-value">${withBreaks}</span>`;
    }
    if (value.match(/^https?:\/\//)) {
      if (isImageUrl(value)) {
        const safe = escapeHtml(value);
        return `
                            <span class="image-value">
                                <img src="${safe}" alt="image" class="image-thumb" loading="lazy" referrerpolicy="no-referrer" />
                                <a href="${safe}" target="_blank" class="url-value">${safe}</a>
                            </span>
                        `;
      }
      return `<a href="${escapeHtml(value)}" target="_blank" class="url-value">${escapeHtml(value)}</a>`;
    }
    return `<span class="property-value">${escapeHtml(value)}</span>`;
  }
  if (typeof value === 'boolean') {
    return `<span class="property-value value-boolean">${value}</span>`;
  }
  if (typeof value === 'number') {
    return `<span class="property-value value-number">${value}</span>`;
  }
  return `<span class="property-value">${escapeHtml(String(value))}</span>`;
}
function isImageUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();
    return pathname.match(/\.(png|jpe?g|gif|webp|svg)$/);
  } catch (_) {
    return false;
  }
}
function buildDocLinks(schema) {
  const googleDocsMap = {
    JobPosting:
      'https://developers.google.com/search/docs/appearance/structured-data/job-posting?hl=ja',
    Article: 'https://developers.google.com/search/docs/appearance/structured-data/article?hl=ja',
    BreadcrumbList:
      'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb?hl=ja',
    Product: 'https://developers.google.com/search/docs/appearance/structured-data/product?hl=ja',
    FAQPage: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage?hl=ja',
    HowTo: 'https://developers.google.com/search/docs/appearance/structured-data/how-to?hl=ja',
    Event: 'https://developers.google.com/search/docs/appearance/structured-data/event?hl=ja',
    LocalBusiness:
      'https://developers.google.com/search/docs/appearance/structured-data/local-business?hl=ja',
    Organization: 'https://developers.google.com/search/docs/appearance/structured-data/logo?hl=ja',
    WebSite:
      'https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox?hl=ja',
    VideoObject: 'https://developers.google.com/search/docs/appearance/structured-data/video?hl=ja',
    Recipe: 'https://developers.google.com/search/docs/appearance/structured-data/recipe?hl=ja',
  };
  let types = [];
  if (schema && schema['@type']) {
    types = Array.isArray(schema['@type']) ? schema['@type'] : [schema['@type']];
  } else if (schema && schema['@graph']) {
    try {
      const graph = Array.isArray(schema['@graph']) ? schema['@graph'] : [];
      types = [...new Set(graph.map(n => n['@type']).filter(Boolean))].slice(0, 2);
    } catch (_) {
      /* noop */
    }
  }
  if (types.length === 0) return '';
  const pills = types
    .slice(0, 2)
    .map(t => {
      const sUrl = `https://schema.org/${encodeURIComponent(t)}`;
      const gUrl = googleDocsMap[t];
      const schemaLink = `<a class="doc-pill" target="_blank" rel="noopener noreferrer" href="${sUrl}">schema.org/${t}</a>`;
      const googleLink = gUrl
        ? `<a class=\"doc-pill\" target=\"_blank\" rel=\"noopener noreferrer\" href=\"${gUrl}\">Google ${t}</a>`
        : '';
      return [schemaLink, googleLink].filter(Boolean).join('');
    })
    .join('');
  return pills;
}
function hasHtmlBr(text) {
  return /<br\s*\/?\s*>/i.test(text);
}
function formatSimpleValue(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value.length > 20 ? value.substr(0, 20) + '...' : value;
  return String(value);
}
function getValueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
function getSchemaType(schema) {
  if (Array.isArray(schema)) {
    if (schema.length > 0) {
      const firstItem = schema[0];
      if (firstItem && typeof firstItem === 'object') {
        if (firstItem['@type']) {
          if (Array.isArray(firstItem['@type'])) {
            return firstItem['@type'].join(', ');
          }
          return firstItem['@type'];
        }
        if (firstItem['@graph']) {
          return '@graph';
        }
        return 'Object';
      }
    }
    return 'Array';
  }
  if (schema['@type']) {
    if (Array.isArray(schema['@type'])) {
      return schema['@type'].join(', ');
    }
    return schema['@type'];
  }
  if (schema['@graph']) {
    return '@graph';
  }
  return 'Object';
}
function formatJson(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  if (obj === null) {
    return `<span class="json-null">null</span>`;
  }
  if (typeof obj === 'boolean') {
    return `<span class="json-boolean">${obj}</span>`;
  }
  if (typeof obj === 'number') {
    return `<span class="json-number">${obj}</span>`;
  }
  if (typeof obj === 'string') {
    return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '<span class="json-bracket">[]</span>';
    let result = '<span class="json-bracket">[</span>\n';
    obj.forEach((item, i) => {
      result += spaces + '  ' + formatJson(item, indent + 1);
      if (i < obj.length - 1) result += ',';
      result += '\n';
    });
    result += spaces + '<span class="json-bracket">]</span>';
    return result;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '<span class="json-bracket">{}</span>';
    let result = '<span class="json-bracket">{</span>\n';
    keys.forEach((key, i) => {
      result += spaces + '  ' + `<span class="json-key">"${escapeHtml(key)}"</span>: `;
      result += formatJson(obj[key], indent + 1);
      if (i < keys.length - 1) result += ',';
      result += '\n';
    });
    result += spaces + '<span class="json-bracket">}</span>';
    return result;
  }
  return String(obj);
}
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
async function copyToClipboard(elementId, button) {
  const element = document.getElementById(elementId);
  const rawData = element.dataset.raw;
  try {
    const formatted = JSON.stringify(JSON.parse(rawData), null, 2);
    await navigator.clipboard.writeText(formatted);
    button.textContent = 'コピー完了';
    button.classList.add('copied');
    setTimeout(() => {
      button.textContent = 'コピー';
      button.classList.remove('copied');
    }, 2000);
  } catch (err) {
    button.textContent = 'エラー';
    setTimeout(() => {
      button.textContent = 'コピー';
    }, 2000);
  }
}
function showNoData(url) {
  const container = document.getElementById('schemasContainer');
  container.innerHTML = `
                <div class="no-data">
                    <h3>JSON-LDスキーマが見つかりませんでした</h3>
                    <p>このページには構造化データが含まれていないようです</p>
                </div>
            `;
  if (typeof advisorManager !== 'undefined' && advisorManager?.hideAdvisorButton) {
    advisorManager.hideAdvisorButton();
  }
  if (typeof blogReviewerManager !== 'undefined' && blogReviewerManager?.hideReviewButton) {
    blogReviewerManager.hideReviewButton();
  }
  if (typeof webAdvisorManager !== 'undefined' && webAdvisorManager?.hideAnalysisButton) {
    webAdvisorManager.hideAnalysisButton();
  }
  showResults();
  showSnackbar('JSON-LDスキーマが見つかりませんでした', 'warning', 4000);
  if (typeof webAdvisorManager !== 'undefined' && url) {
    webAdvisorManager.detectNoSchemaOrWebPageOnly([], url);
  }
}
function showLoading(show) {
  document.getElementById('loading').classList.toggle('active', show);
  document.getElementById('fetchButton').disabled = show;
}
function showError(message) {
  const errorEl = document.getElementById('errorMessage');
  const errorTextEl = document.getElementById('errorMessageText');
  errorTextEl.textContent = message;
  errorEl.style.background = '#fef2f2';
  errorEl.style.borderColor = '#fecaca';
  errorEl.style.color = '#dc2626';
  errorEl.classList.add('active');
}
function hideError() {
  document.getElementById('errorMessage').classList.remove('active');
}
function showResults() {
  document.getElementById('results').classList.add('active');
}
function hideResults() {
  document.getElementById('results').classList.remove('active');
}
document.getElementById('urlInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    fetchAndDisplay();
  }
});
document.getElementById('urlInput').addEventListener('blur', function (e) {
  const url = e.target.value.trim();
  if (url) {
    autoFillAuthForUrl(url);
  }
});
document.addEventListener('keydown', function (e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const urlInput = document.getElementById('urlInput');
    urlInput.focus();
    urlInput.select();
  }
  if (e.key === 'Escape') {
    const modals = [
      { id: 'securityModal', close: closeSecurityModal },
      { id: 'guideModal', close: closeGuideModal },
      { id: 'robotsGuideModal', close: closeRobotsModal },
      { id: 'twitterCardGuideModal', close: closeTwitterCardModal },
      { id: 'openGraphGuideModal', close: closeOpenGraphModal },
      { id: 'developerSettingsModal', close: closeDeveloperSettingsModal },
    ];
    modals.forEach(modal => {
      const element = document.getElementById(modal.id);
      if (element && element.classList.contains('modal-overlay--visible')) {
        modal.close();
      }
    });
  }
});
const STORAGE_KEY_DEVELOPER = 'jsonld_developer_settings';
document.getElementById('btnMyApi')?.addEventListener('click', () => {
  openDeveloperSettingsModal();
});
function openDeveloperSettingsModal() {
  const modal = document.getElementById('developerSettingsModal');
  if (!modal) return;
  loadDeveloperSettings();
  setupApiModeToggle();
  openModal('developerSettingsModal');
}
function closeDeveloperSettingsModal() {
  closeModal('developerSettingsModal');
}
function setupApiModeToggle() {
  const radioFree = document.getElementById('radioModeFree');
  const radioMyAPI = document.getElementById('radioModeMyAPI');
  const freeArea = document.getElementById('freeModelArea');
  const myApiArea = document.getElementById('myApiArea');
  if (!radioFree || !radioMyAPI || !freeArea || !myApiArea) return;
  function toggleAreas() {
    if (radioFree.checked) {
      freeArea.style.display = 'block';
      myApiArea.style.display = 'none';
    } else {
      freeArea.style.display = 'none';
      myApiArea.style.display = 'block';
    }
  }
  radioFree.addEventListener('change', toggleAreas);
  radioMyAPI.addEventListener('change', toggleAreas);
  toggleAreas();
}
document
  .getElementById('btnCloseDeveloperSettings')
  ?.addEventListener('click', closeDeveloperSettingsModal);
document.getElementById('developerSettingsModal')?.addEventListener('click', e => {
  if (e.target.id === 'developerSettingsModal') {
    closeDeveloperSettingsModal();
  }
});
function loadDeveloperSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_DEVELOPER) || '{}');
    const hasApiKey = !!(settings.apiKey && settings.apiKey.trim());
    if (hasApiKey) {
      document.getElementById('radioModeMyAPI').checked = true;
      document.getElementById('developerApiKey').value = settings.apiKey || '';
      document.getElementById('developerModel').value = settings.model || 'gpt-5-nano';
      document.getElementById('developerBaseUrl').value = settings.baseUrl || '';
    } else {
      document.getElementById('radioModeFree').checked = true;
      document.getElementById('freeModelSelect').value = settings.model || 'gpt-5-nano';
    }
  } catch (error) {
  }
}
document.getElementById('btnSaveDeveloperSettings')?.addEventListener('click', () => {
  const isFreeMode = document.getElementById('radioModeFree').checked;
  let settings = {};
  if (isFreeMode) {
    const model = document.getElementById('freeModelSelect').value;
    settings = { model };
    localStorage.removeItem('jsonld_user_openai_key');
    localStorage.removeItem('jsonld_usage_mode');
  } else {
    const apiKey = document.getElementById('developerApiKey').value.trim();
    const model = document.getElementById('developerModel').value;
    const baseUrl = document.getElementById('developerBaseUrl').value.trim();
    if (!apiKey) {
      showDeveloperStatus('APIキーを入力してください', 'error');
      return;
    }
    settings = {
      apiKey,
      model,
      baseUrl: baseUrl || undefined,
    };
    localStorage.setItem('jsonld_user_openai_key', apiKey); // 互換性のため
    localStorage.setItem('jsonld_usage_mode', 'permanent'); // 開発者モードを有効化
  }
  try {
    localStorage.setItem(STORAGE_KEY_DEVELOPER, JSON.stringify(settings));
    showDeveloperStatus('設定を保存しました', 'success');
    updateHeaderApiStatus();
    setTimeout(() => {
      closeDeveloperSettingsModal();
    }, 2000);
  } catch (error) {
    showDeveloperStatus('保存に失敗しました: ' + error.message, 'error');
  }
});
document.getElementById('btnTestConnection')?.addEventListener('click', async () => {
  const isFreeMode = document.getElementById('radioModeFree').checked;
  if (isFreeMode) {
    showDeveloperStatus('無料版モードでは接続テストは不要です', 'info');
    return;
  }
  const apiKey = document.getElementById('developerApiKey').value.trim();
  const model = document.getElementById('developerModel').value;
  const baseUrl = document.getElementById('developerBaseUrl').value.trim();
  if (!apiKey) {
    showDeveloperStatus('APIキーを入力してください', 'error');
    return;
  }
  showDeveloperStatus('接続テスト中...', 'info');
  try {
    const endpoint = isVercel ? '/api/test-connection' : `${PROXY_SERVER}/api/test-connection`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userApiKey: apiKey,
        model,
        baseUrl: baseUrl || undefined,
      }),
    });
    const data = await response.json();
    if (data.ok) {
      showDeveloperStatus(`接続成功！モデル: ${data.model}`, 'success');
    } else {
      showDeveloperStatus(`接続失敗: ${data.error}`, 'error');
    }
  } catch (error) {
    showDeveloperStatus(`エラー: ${error.message}`, 'error');
  }
});
document.getElementById('btnClearDeveloperSettings')?.addEventListener('click', () => {
  if (!confirm('拡張モード設定をすべてクリアしますか？')) {
    return;
  }
  localStorage.removeItem(STORAGE_KEY_DEVELOPER);
  localStorage.removeItem('jsonld_user_openai_key');
  localStorage.removeItem('jsonld_usage_mode');
  document.getElementById('radioModeFree').checked = true;
  document.getElementById('freeModelSelect').value = 'gpt-5-nano';
  document.getElementById('developerApiKey').value = '';
  document.getElementById('developerModel').value = 'gpt-5-nano';
  document.getElementById('developerBaseUrl').value = '';
  setupApiModeToggle();
  showDeveloperStatus('設定をクリアしました', 'success');
  updateHeaderApiStatus();
});
function showDeveloperStatus(message, type = 'info') {
  const statusDiv = document.getElementById('developerSettingsStatus');
  if (!statusDiv) return;
  const colors = {
    success: { bg: '#d4edda', text: '#155724', border: '#c3e6cb' },
    error: { bg: '#f8d7da', text: '#721c24', border: '#f5c6cb' },
    info: { bg: '#d1ecf1', text: '#0c5460', border: '#bee5eb' },
  };
  const color = colors[type] || colors.info;
  statusDiv.style.display = 'block';
  statusDiv.style.background = color.bg;
  statusDiv.style.color = color.text;
  statusDiv.style.border = `1px solid ${color.border}`;
  statusDiv.querySelector('p').textContent = message;
}
function updateHeaderApiStatus() {
  const modelNameEl = document.getElementById('apiModelName');
  const usageCountEl = document.getElementById('apiUsageCount');
  if (!modelNameEl || !usageCountEl) return;
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_DEVELOPER) || '{}');
    const modelName = settings.model || 'gpt-5-nano';
    const shortModelName = modelName.replace(/-\d{4}-\d{2}-\d{2}$/, '');
    modelNameEl.textContent = shortModelName;
  } catch (error) {
    modelNameEl.textContent = 'gpt-5-nano';
  }
  const userApiKey = localStorage.getItem('jsonld_user_openai_key');
  if (userApiKey) {
    usageCountEl.textContent = '無制限';
    return;
  }
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const rateLimitKeys = [
    'jsonld_advisor_usage',
    'jsonld_blog_reviewer_usage',
    'jsonld_web_advisor_usage',
  ];
  let totalUsed = 0;
  rateLimitKeys.forEach(key => {
    try {
      const usageData = JSON.parse(localStorage.getItem(key) || '[]');
      const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
      totalUsed += recentRequests.length;
    } catch (error) {
    }
  });
  const maxRequests = 50;
  const remaining = Math.max(0, maxRequests - totalUsed);
  usageCountEl.textContent = `${remaining}/${maxRequests}`;
}