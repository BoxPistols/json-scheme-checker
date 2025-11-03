// プロキシサーバーのURL設定
// Vercelデプロイメントか、ローカル開発かを自動判定
const currentHost = window.location.hostname;
const isVercel = currentHost.includes('vercel.app') || currentHost.includes('vercel.sh');
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

// 環境に応じたプロキシサーバーURL
let PROXY_SERVER;
if (isVercel) {
  // Vercel環境: API Routes を使用
  PROXY_SERVER = ''; // 相対パスでAPIを呼び出す
} else if (isLocalhost) {
  // ローカル開発: localhost:3333
  PROXY_SERVER = 'http://localhost:3333';
} else {
  // LAN内の他デバイス: IPアドレス:3333
  PROXY_SERVER = `http://${currentHost}:3333`;
}

console.log('Environment:', isVercel ? 'Vercel' : 'Local', 'Proxy:', PROXY_SERVER || 'API Routes');

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
    console.error('developerSettingsModalの生成に失敗しました');
    return;
  }

  document.body.appendChild(modal);
}

createDeveloperSettingsModal();

// パスワードの表示/非表示を切り替え
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

// セキュリティ解説Modalを表示
function showSecurityModal() {
  const modal = document.getElementById('securityModal');
  if (modal) {
    modal.classList.add('modal-overlay--visible');
  }
}

// セキュリティ解説Modalを閉じる
function closeSecurityModal() {
  const modal = document.getElementById('securityModal');
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
  }
}

// 使い方解説Modalを表示
function showGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) {
    modal.classList.add('modal-overlay--visible');
  }
}

// 使い方解説Modalを閉じる
function closeGuideModal() {
  const modal = document.getElementById('guideModal');
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
  }
}

// Robots メタタグ設定ガイド Modal を開く
function showRobotsModal() {
  const modal = document.getElementById('robotsGuideModal');
  if (modal) {
    modal.classList.add('modal-overlay--visible');
  }
}

// Robots メタタグ設定ガイド Modal を閉じる
function closeRobotsModal() {
  const modal = document.getElementById('robotsGuideModal');
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
  }
}

// Twitter Card 設定ガイド Modal を開く
function showTwitterCardModal() {
  const modal = document.getElementById('twitterCardGuideModal');
  if (modal) {
    modal.classList.add('modal-overlay--visible');
  }
}

// Twitter Card 設定ガイド Modal を閉じる
function closeTwitterCardModal() {
  const modal = document.getElementById('twitterCardGuideModal');
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
  }
}

// Open Graph 設定ガイド Modal を開く
function showOpenGraphModal() {
  const modal = document.getElementById('openGraphGuideModal');
  if (modal) {
    modal.classList.add('modal-overlay--visible');
  }
}

// Open Graph 設定ガイド Modal を閉じる
function closeOpenGraphModal() {
  const modal = document.getElementById('openGraphGuideModal');
  if (modal) {
    modal.classList.remove('modal-overlay--visible');
  }
}

// Modalの背景クリックで閉じる
document.addEventListener('DOMContentLoaded', () => {
  // モーダル関連のイベントリスナー
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

  // ボタンイベントリスナー登録
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

  // 認証ストレージ方法変更のイベントリスナー
  document.querySelectorAll('input[name="authStorage"]').forEach(radio => {
    radio.addEventListener('change', handleStorageMethodChange);
  });

  // サンプルリンクのイベント委譲（動的に生成される要素に対応）
  const sampleLinksContainer = document.querySelector('.sample-links');
  if (sampleLinksContainer) {
    sampleLinksContainer.addEventListener('click', e => {
      // サンプルリンクのクリック
      if (e.target.classList.contains('sample-link')) {
        e.preventDefault();
        const url = e.target.dataset.sampleUrl;
        if (url) loadSample(url);
      }
      // 編集ボタンのクリック
      else if (e.target.classList.contains('sample-edit-btn')) {
        e.preventDefault();
        const index = parseInt(e.target.dataset.index);
        editSampleUrl(index);
      }
      // 削除ボタンのクリック
      else if (e.target.classList.contains('sample-delete-btn')) {
        e.preventDefault();
        const index = parseInt(e.target.dataset.index);
        deleteSampleUrl(index);
      }
      // 追加ボタンのクリック
      else if (e.target.classList.contains('sample-add-btn')) {
        e.preventDefault();
        addSampleUrl();
      }
      // 初期化ボタンのクリック
      else if (e.target.classList.contains('sample-reset-btn')) {
        e.preventDefault();
        resetSampleUrls();
      }
      // 移動ボタンのクリック
      else if (e.target.classList.contains('sample-move-btn')) {
        e.preventDefault();
        const index = parseInt(e.target.dataset.index);
        const direction = e.target.dataset.direction;
        moveSampleUrl(index, direction);
      }
    });
  }

  // 動的生成される要素のイベント委譲（schemasContainer）
  const schemasContainer = document.getElementById('schemasContainer');
  if (schemasContainer) {
    schemasContainer.addEventListener('click', e => {
      const target = e.target;

      // view-toggle buttons
      if (target.closest('.view-toggle button')) {
        const button = target.closest('button');
        const schemaContent = button.closest('.schema-card').querySelector('.schema-content');
        const schemaId = schemaContent.id;
        const view = button.textContent.toLowerCase().includes('テーブル') ? 'table' : 'json';
        toggleView(schemaId, view, button);
      }

      // copy-button
      if (target.closest('.copy-button')) {
        const button = target.closest('.copy-button');
        const schemaContent = button.closest('.schema-card').querySelector('.schema-content');
        copyToClipboard(schemaContent.id, button);
      }

      // expandable (nested content toggle)
      if (target.classList.contains('expandable')) {
        const nextElement = target.nextElementSibling;
        if (nextElement && nextElement.classList.contains('nested-content')) {
          toggleNested(nextElement.id, target);
        }
      }
    });
  }

  // 保存された認証ストレージ方法を復元
  restoreStorageMethod();

  // 初回訪問時に使い方Modalを自動表示
  const GUIDE_SHOWN_KEY = 'jsonld_guide_shown';
  const hasSeenGuide = localStorage.getItem(GUIDE_SHOWN_KEY);
  if (!hasSeenGuide) {
    setTimeout(() => {
      showGuideModal();
      localStorage.setItem(GUIDE_SHOWN_KEY, 'true');
    }, 500);
  }

  // サンプルURLリストを初期化
  renderSampleLinks();

  // ===== Dark Mode Toggle =====
  const themeToggleButton = document.getElementById('btnThemeToggle');
  const lightIcon = document.getElementById('theme-icon-light');
  const darkIcon = document.getElementById('theme-icon-dark');
  const THEME_KEY = 'jsonld_theme';

  // 現在のテーマを適用する
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

  // テーマを切り替える
  function toggleTheme() {
    const currentTheme = document.documentElement.dataset.theme;
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch (error) {
      console.warn('テーマの保存に失敗しました:', error);
    }
    applyTheme(newTheme);
  }

  // FOUC対策スクリプトで初期テーマが設定されているので、ここではaria-labelの更新のみ
  if (document.documentElement.dataset.theme && themeToggleButton) {
    const currentTheme = document.documentElement.dataset.theme;
    const isDark = currentTheme === 'dark';
    const newLabel = `テーマを切り替え（現在: ${isDark ? 'ダーク' : 'ライト'}モード）`;
    themeToggleButton.setAttribute('aria-label', newLabel);
    // アイコンの表示も同期
    if (lightIcon) lightIcon.style.display = isDark ? 'none' : 'inline-block';
    if (darkIcon) darkIcon.style.display = isDark ? 'inline-block' : 'none';
  }

  // イベントリスナー登録
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', toggleTheme);
  }

  // OSのテーマ変更を監視
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      // ユーザーが明示的に設定していない場合のみ反映
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? 'dark' : 'light');
        }
      } catch (error) {
        console.warn('localStorageの読み取りに失敗しました:', error);
      }
    });
  }

  // ESCキーでモーダルを閉じる
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

  // ヘッダーのAPI状態表示を初期化
  updateHeaderApiStatus();
});

// 認証情報の保存方法を復元
function restoreStorageMethod() {
  const savedMethod = localStorage.getItem(STORAGE_METHOD_KEY) || 'none';
  const radio = document.querySelector(`input[name="authStorage"][value="${savedMethod}"]`);
  if (radio) {
    radio.checked = true;
  }
}

// ストレージ方法の変更を処理
function handleStorageMethodChange() {
  const selectedMethod =
    document.querySelector('input[name="authStorage"]:checked')?.value || 'none';
  localStorage.setItem(STORAGE_METHOD_KEY, selectedMethod);

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  // 既存の認証情報がある場合は、新しい方法で再保存
  if (username || password) {
    saveAuth(username, password);
  }

  // フィードバックメッセージ
  const messages = {
    none: '認証情報を保存しない設定に変更しました',
    session: 'タブを閉じるまで保存する設定に変更しました',
    persistent: '24時間保存する設定に変更しました',
    permanent: '永続保存する設定に変更しました（期限なし）',
  };
  showSnackbar(messages[selectedMethod] || '設定を変更しました', 'success');
}

// 認証情報の管理
const AUTH_STORAGE_KEY = 'jsonld_basic_auth';
const DOMAIN_AUTH_PREFIX = 'jsonld_auth_';
const STORAGE_METHOD_KEY = 'jsonld_storage_method';
// 折りたたみ状態の保存キー
const COLLAPSE_SAMPLE_LINKS_KEY = 'jsonld_ui_sample_links_open';
const COLLAPSE_SUMMARY_CARD_KEY = 'jsonld_ui_summary_card_open';

// サンプルURLの管理
const SAMPLE_URLS_KEY = 'jsonld_sample_urls';
const DEFAULT_SAMPLE_URLS = [
  { label: 'f-hub', url: 'https://freelance-hub.jp/project/detail/281563/' },
  { label: 'f-job', url: 'https://freelance-job.com/job/detail/146243' },
  { label: 'PE-BANK', url: 'https://pe-bank.jp/project/aws/47302-18/' },
  { label: 'RecruitAgent', url: 'https://www.r-agent.com/kensaku/kyujin/20250107-188-01-052.html' },
  { label: 'levtech', url: 'https://freelance.levtech.jp/project/detail/28421/' },
  { label: 'レバテックLAB', url: 'https://levtech.jp/media/article/focus/detail_680/' },
];

// サンプルURLリストを読み込み
function loadSampleUrls() {
  const stored = localStorage.getItem(SAMPLE_URLS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse sample URLs:', e);
    }
  }
  // 初回またはエラー時はデフォルト値を保存して返す
  localStorage.setItem(SAMPLE_URLS_KEY, JSON.stringify(DEFAULT_SAMPLE_URLS));
  return DEFAULT_SAMPLE_URLS;
}

// サンプルURLリストを保存
function saveSampleUrls(urls) {
  localStorage.setItem(SAMPLE_URLS_KEY, JSON.stringify(urls));
}

// サンプルURLリストを描画
function renderSampleLinks() {
  const container = document.querySelector('.sample-links');
  if (!container) return;

  // 既存のコンテンツをクリア（"サンプル:"以外）
  const existingElements = container.querySelectorAll('.sample-item, .sample-buttons');
  existingElements.forEach(el => el.remove());

  const urls = loadSampleUrls();

  urls.forEach((item, index) => {
    // サンプルアイテムのコンテナ
    const itemContainer = document.createElement('div');
    itemContainer.className = 'sample-item';
    itemContainer.draggable = true;
    itemContainer.dataset.index = index;

    // サンプルリンク
    const link = document.createElement('a');
    link.className = 'sample-link';
    link.textContent = item.label;
    link.dataset.sampleUrl = item.url;
    link.href = '#';
    link.title = item.url;
    itemContainer.appendChild(link);

    // アクションボタンコンテナ
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'sample-actions';

    // 編集ボタン
    const editBtn = document.createElement('button');
    editBtn.className = 'sample-edit-btn';
    editBtn.textContent = '編集';
    editBtn.dataset.index = index;
    editBtn.title = 'このサンプルURLを編集';
    actionsContainer.appendChild(editBtn);

    // 削除ボタン
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sample-delete-btn';
    deleteBtn.textContent = '削除';
    deleteBtn.dataset.index = index;
    deleteBtn.title = 'このサンプルURLを削除';
    actionsContainer.appendChild(deleteBtn);

    itemContainer.appendChild(actionsContainer);
    container.appendChild(itemContainer);
  });

  // ボタンコンテナ
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'sample-buttons';

  // 追加ボタン
  const addBtn = document.createElement('button');
  addBtn.className = 'sample-add-btn';
  addBtn.textContent = '+ 追加';
  addBtn.title = '新しいサンプルURLを追加';
  buttonsContainer.appendChild(addBtn);

  // 初期化ボタン
  const resetBtn = document.createElement('button');
  resetBtn.className = 'sample-reset-btn';
  resetBtn.textContent = '初期化';
  resetBtn.title = 'デフォルトのサンプルURLに戻す';
  buttonsContainer.appendChild(resetBtn);

  container.appendChild(buttonsContainer);

  // Drag & Dropイベントを設定
  setupDragAndDrop();
}

// サンプルURLを編集
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

// サンプルURLを削除
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

// サンプルURLを追加
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

// サンプルURLを初期化（デフォルトに戻す）
function resetSampleUrls() {
  const message = `サンプルURLをデフォルトの${DEFAULT_SAMPLE_URLS.length}個に戻します。\n現在のカスタマイズは失われます。よろしいですか？`;

  if (confirm(message)) {
    localStorage.removeItem(SAMPLE_URLS_KEY);
    saveSampleUrls(DEFAULT_SAMPLE_URLS);
    renderSampleLinks();
    showSnackbar('サンプルURLを初期化しました', 'success');
  }
}

// サンプルURLの位置を移動
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

  // 配列の要素を入れ替え
  const temp = urls[index];
  urls[index] = urls[newIndex];
  urls[newIndex] = temp;

  saveSampleUrls(urls);
  renderSampleLinks();
  showSnackbar('サンプルURLの位置を変更しました', 'success');
}

// Drag & Dropの設定
let draggedElement = null;
let draggedIndex = null;

function setupDragAndDrop() {
  const container = document.querySelector('.sample-links');
  if (!container) return;

  const items = container.querySelectorAll('.sample-item');

  items.forEach(item => {
    // ドラッグ開始
    item.addEventListener('dragstart', e => {
      draggedElement = item;
      draggedIndex = parseInt(item.dataset.index);
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item.innerHTML);
    });

    // ドラッグ終了
    item.addEventListener('dragend', e => {
      item.classList.remove('dragging');
      draggedElement = null;
      draggedIndex = null;
    });

    // ドラッグオーバー
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

    // ドラッグリーブ
    item.addEventListener('dragleave', e => {
      item.classList.remove('drag-over-left', 'drag-over-right');
    });

    // ドロップ
    item.addEventListener('drop', e => {
      e.preventDefault();
      e.stopPropagation();

      item.classList.remove('drag-over-left', 'drag-over-right');

      if (draggedElement && draggedElement !== item) {
        const targetIndex = parseInt(item.dataset.index);
        const rect = item.getBoundingClientRect();
        const midpoint = rect.left + rect.width / 2;

        // ドロップ位置に応じて挿入位置を決定
        let insertIndex = targetIndex;
        if (e.clientX >= midpoint) {
          insertIndex = targetIndex + 1;
        }

        // 移動処理
        const urls = loadSampleUrls();
        const draggedItem = urls[draggedIndex];

        // 元の位置から削除
        urls.splice(draggedIndex, 1);

        // 新しい位置を調整（元の位置より後ろの場合）
        if (draggedIndex < insertIndex) {
          insertIndex--;
        }

        // 新しい位置に挿入
        urls.splice(insertIndex, 0, draggedItem);

        saveSampleUrls(urls);
        renderSampleLinks();
        showSnackbar('サンプルURLの順序を変更しました', 'success');
      }
    });
  });
}

// Web Crypto APIを使った暗号化
// 返り値: { success: boolean, data: string }
//
// セキュリティ上の注意:
// この実装はMyAPIツールでの閲覧を防ぐための簡易的な難読化であり、
// 完全なセキュリティを保証するものではありません。
// - 固定の暗号化キーとソルトを使用しているため、すべてのユーザーで同じ鍵が生成されます
// - ソースコードに暗号化キーが含まれているため、攻撃者が容易に復号化できます
// - クライアントサイド暗号化の根本的な制限により、XSS攻撃で認証情報が盗まれる可能性があります
//
// 重要な認証情報は「保存しない」オプションを選択することを強く推奨します。
async function encryptPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);

    // ランダムなIVを生成
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 固定キーを使用（セキュリティ制限: すべてのユーザーで同じ鍵）
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

    // IVと暗号化データを結合してBase64エンコード
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    return { success: true, data: btoa(String.fromCharCode(...combined)) };
  } catch (error) {
    console.error('Encryption failed:', error);
    return { success: false, data: password }; // フォールバック: 平文を返す
  }
}

// Web Crypto APIを使った復号化
// 返り値: { success: boolean, data: string }
//
// セキュリティ上の注意: 暗号化と同じ制限が適用されます（上記のencryptPassword参照）
async function decryptPassword(encryptedData) {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // IVと暗号化データを分離
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
    console.error('Decryption failed:', error);
    return { success: false, data: encryptedData }; // フォールバック: 暗号化データをそのまま返す
  }
}

// 認証情報を保存
async function saveAuth(username, password) {
  const storageMethod =
    document.querySelector('input[name="authStorage"]:checked')?.value || 'none';

  // 「保存しない」の場合は何もしない
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
    // sessionStorage に保存
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    updateAuthStatus(true);
  } else if (storageMethod === 'persistent' || storageMethod === 'permanent') {
    // localStorage に保存（persistentは24時間期限付き、permanentは期限なし）
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    updateAuthStatus(true);
  }
}

// ページ読み込み時に保存された認証情報を復元
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

      // 24時間チェック（persistentモードのみ、permanentは期限なし）
      if (storageMethod === 'persistent') {
        const elapsed = Date.now() - (auth.timestamp || 0);
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        if (elapsed > TWENTY_FOUR_HOURS) {
          console.log('認証情報の有効期限が切れています');
          localStorage.removeItem(AUTH_STORAGE_KEY);
          updateAuthStatus(false);
          return;
        }
      }

      // パスワードを復号化
      const decryptionResult = auth.encrypted
        ? await decryptPassword(auth.password)
        : { success: true, data: auth.password };

      document.getElementById('username').value = auth.username || '';
      document.getElementById('password').value = decryptionResult.data || '';
      updateAuthStatus(true);
    } catch (e) {
      console.error('Failed to load stored auth:', e);
    }
  }
}

// 認証情報をクリア
function clearAuth() {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';

  // すべてのストレージから削除
  localStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_STORAGE_KEY);

  // ドメイン別の認証情報もすべて削除
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(DOMAIN_AUTH_PREFIX)) {
      localStorage.removeItem(key);
    }
  });

  updateAuthStatus(false);
  showSnackbar('すべての認証情報をクリアしました', 'success');
}

// 認証状態の表示を更新
function updateAuthStatus(isStored) {
  const statusEl = document.getElementById('authStatus');
  if (isStored) {
    statusEl.textContent = '(保存済み)';
    statusEl.style.color = '#10b981';
  } else {
    statusEl.textContent = '';
  }
}

// Snackbar通知を表示
let snackbarTimeout;
function showSnackbar(message, type = 'info', duration = 3000) {
  const snackbar = document.getElementById('snackbar');
  if (!snackbar) {
    console.error('Snackbar要素が見つかりません');
    return;
  }

  // テキストノードを使用して安全にメッセージを設定
  snackbar.textContent = '';
  snackbar.appendChild(document.createTextNode(message));

  // 既存のクラスをクリア
  snackbar.className = 'snackbar';

  // タイプ別のクラスを追加
  if (type === 'success' || type === 'error' || type === 'warning' || type === 'info') {
    snackbar.classList.add(type);
  }

  // 表示
  snackbar.classList.add('show');

  // 既存のタイムアウトをクリア
  if (snackbarTimeout) {
    clearTimeout(snackbarTimeout);
  }

  // 指定時間後に非表示
  snackbarTimeout = setTimeout(() => {
    snackbar.classList.remove('show');
  }, duration);
}

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
  if (snackbarTimeout) {
    clearTimeout(snackbarTimeout);
  }
});

// サーバーステータスをチェック
async function checkServerStatus() {
  const statusElement = document.getElementById('serverStatus');
  try {
    // Vercel環境では /api/health、ローカルでは /health
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

// 初期化時にサーバー状態をチェックと認証情報を復元
checkServerStatus();
loadStoredAuth();

// URLに基づいて認証情報を自動入力
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
    console.log('Could not auto-fill auth:', e);
  }
  return false;
}

// Basic認証UIを開く（認証エラー時のみ使用）
function openAuthSection() {
  const authSection = document.getElementById('authSection');
  if (authSection) {
    authSection.open = true;
    // 認証入力欄にフォーカス
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

  // サーバー状態を再チェック
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
    // Basic認証の情報を取得
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // 認証情報がある場合は、選択された方法で保存
    if (username || password) {
      await saveAuth(username, password);
    }

    // localhost URLの判定
    let isLocalhostUrl = false;
    try {
      const urlObj = new URL(url);
      isLocalhostUrl = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
    } catch (e) {
      console.error('URL parsing error:', e);
    }

    let response;

    // Vercel環境でlocalhost URLの場合、ブラウザから直接アクセス
    if (isVercel && isLocalhostUrl) {
      console.log('Vercel環境でlocalhost URLを検出 - ブラウザから直接アクセスします');

      try {
        // Basic認証ヘッダーの準備
        const headers = {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        };

        if (username && password) {
          const auth = btoa(`${username}:${password}`);
          headers['Authorization'] = `Basic ${auth}`;
        }

        // ブラウザから直接localhost URLにアクセス
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

        console.log('localhost URLへの直接アクセスに成功しました');
      } catch (error) {
        // CORS エラーの場合
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
      // 通常のプロキシ経由アクセス
      let proxyUrl;
      if (isVercel) {
        // Vercel環境: /api/proxy エンドポイントを使用
        proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
      } else {
        // ローカル環境: 従来のプロキシサーバーを使用
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

      // 401エラーの場合は明確なメッセージを表示
      if (response.status === 401) {
        openAuthSection();
        throw new Error('Basic認証が失敗しました。ユーザー名とパスワードを確認してください。');
      }

      throw new Error(errorMessage);
    }

    const html = await response.text();
    const schemas = extractJsonLd(html);

    // SEO分析を実行（schemasを渡す）
    if (typeof displaySEOAnalysis === 'function') {
      displaySEOAnalysis(html, schemas);
    }

    // BlogReviewerManagerにリモートHTMLを渡す
    if (typeof blogReviewerManager !== 'undefined' && blogReviewerManager.setRemoteHtml) {
      blogReviewerManager.setRemoteHtml(html);
    }

    if (schemas.length === 0) {
      showNoData(url);
    } else {
      displaySchemas(schemas, url);
    }
  } catch (error) {
    console.error('Error:', error);
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

  console.log(`[extractJsonLd] Found ${scripts.length} JSON-LD script tags`);

  const schemas = [];
  scripts.forEach((script, index) => {
    try {
      const json = JSON.parse(script.textContent);
      console.log(`[extractJsonLd] Raw JSON ${index + 1}:`, json);

      // 配列の場合は展開して個別に追加
      if (Array.isArray(json)) {
        console.log(`[extractJsonLd] JSON is array, expanding ${json.length} items`);
        json.forEach((item, itemIndex) => {
          console.log(`[extractJsonLd] Array item ${itemIndex + 1} @type:`, item['@type']);
          schemas.push(item);
        });
      } else if (json['@graph'] && Array.isArray(json['@graph'])) {
        // @graph 構造の場合は展開
        console.log(`[extractJsonLd] JSON has @graph, expanding ${json['@graph'].length} items`);
        json['@graph'].forEach((item, itemIndex) => {
          console.log(`[extractJsonLd] @graph item ${itemIndex + 1} @type:`, item['@type']);
          schemas.push(item);
        });
      } else {
        console.log(`[extractJsonLd] JSON is object, @type:`, json['@type']);
        schemas.push(json);
      }
    } catch (e) {
      console.error('Failed to parse JSON-LD:', e);
    }
  });

  console.log(`[extractJsonLd] Total schemas extracted: ${schemas.length}`);
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
    console.error('Failed to parse URL for domain display:', e, 'URL:', url);
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

  // 前のページロードからのボタンをすべてクリア（重複表示防止）
  console.log('[App] 以前のボタンをクリア');
  if (typeof advisorManager !== 'undefined') {
    advisorManager.hideAdvisorButton();
  }
  if (typeof blogReviewerManager !== 'undefined') {
    blogReviewerManager.hideReviewButton();
  }
  if (typeof webAdvisorManager !== 'undefined') {
    webAdvisorManager.hideAnalysisButton();
  }

  // AI分析: 専用アドバイザーを優先表示
  let hasSpecializedAdvisor = false;

  // 1. JobPosting検出
  if (typeof advisorManager !== 'undefined') {
    if (advisorManager.detectJobPosting(schemas)) {
      console.log('[App] JobPosting検出 → Advisor');
      hasSpecializedAdvisor = true;
    }
  }

  // 2. Article/BlogPosting検出
  if (typeof blogReviewerManager !== 'undefined') {
    if (blogReviewerManager.detectBlogPost(schemas)) {
      console.log('[App] BlogPost検出 → BlogReviewer');
      hasSpecializedAdvisor = true;
    }
  }

  // 3. Web分析（専用アドバイザーがない場合のみ表示）
  if (!hasSpecializedAdvisor && typeof webAdvisorManager !== 'undefined') {
    if (webAdvisorManager.detectNoSchemaOrWebPageOnly(schemas, url)) {
      console.log('[App] 一般的なWebページ → WebAdvisor');
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
      // オブジェクトの場合は折りたたみ可能にする（デフォルトで展開）
      const itemId = `array-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      html += `<strong class="array-item-label expandable">Item ${index + 1}</strong>`;
      html += `<div class="nested-content" id="${itemId}">`;
      html += `<div class="array-item-content">`;
      html += createTableView(item, depth + 1);
      html += `</div>`;
      html += `</div>`;
    } else {
      // プリミティブ値の場合は折りたためない
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
    // descriptionなど、<br> が含まれる文字列は意図した改行を反映
    if (hasHtmlBr(value) || (key && key.toLowerCase() === 'description')) {
      const escaped = escapeHtml(value);
      const withBreaks = escaped.replace(/&lt;br\s*\/?&gt;/gi, '<br>');
      return `<span class="property-value">${withBreaks}</span>`;
    }
    if (value.match(/^https?:\/\//)) {
      // 画像URLはサムネイル付きで表示
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

// スキーマタイプごとのドキュメントリンク生成
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
    // @graphの場合、代表的な@typeを抽出
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
    // 配列の場合、最初の要素のタイプを取得して表示
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
    console.error('Failed to copy:', err);
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

  // 既存のアドバイザーボタンをクリーンアップ（重複防止）
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

  // Web Advisor: スキーマ無し検出
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
  // 明示的にエラーカラーへリセット（前回の成功スタイルが残らないように）
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

// Enterキーでの送信に対応
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

// ショートカットキー: Cmd+K (Mac) / Ctrl+K (Windows) でURL入力欄にフォーカス
// Escape キーでモーダルを閉じる
document.addEventListener('keydown', function (e) {
  // Cmd+K (Mac) または Ctrl+K (Windows/Linux)
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const urlInput = document.getElementById('urlInput');
    urlInput.focus();
    urlInput.select();
  }

  // Escape キーでモーダルを閉じる
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

// ========================================
// 開発者設定パネル
// ========================================

const STORAGE_KEY_DEVELOPER = 'jsonld_developer_settings';

// My APIボタンのクリックイベント
document.getElementById('btnMyApi')?.addEventListener('click', () => {
  openDeveloperSettingsModal();
});

// モーダルを開く
function openDeveloperSettingsModal() {
  const modal = document.getElementById('developerSettingsModal');
  if (!modal) return;

  // ローカルストレージから設定を読み込む
  loadDeveloperSettings();

  // ラジオボタンの切り替えイベントを設定
  setupApiModeToggle();

  modal.classList.add('modal-overlay--visible');
  document.body.style.overflow = 'hidden';
}

// モーダルを閉じる
function closeDeveloperSettingsModal() {
  const modal = document.getElementById('developerSettingsModal');
  if (!modal) return;

  modal.classList.remove('modal-overlay--visible');
  document.body.style.overflow = '';
}

// APIモードの切り替え設定
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

  // 初期表示
  toggleAreas();
}

// 閉じるボタンのイベント
document
  .getElementById('btnCloseDeveloperSettings')
  ?.addEventListener('click', closeDeveloperSettingsModal);

// オーバーレイクリックで閉じる
document.getElementById('developerSettingsModal')?.addEventListener('click', e => {
  if (e.target.id === 'developerSettingsModal') {
    closeDeveloperSettingsModal();
  }
});

// ローカルストレージから設定を読み込む
function loadDeveloperSettings() {
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_DEVELOPER) || '{}');
    const hasApiKey = !!(settings.apiKey && settings.apiKey.trim());

    // APIキーの有無でモードを判定
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
    console.error('Failed to load developer settings:', error);
  }
}

// 設定を保存
document.getElementById('btnSaveDeveloperSettings')?.addEventListener('click', () => {
  const isFreeMode = document.getElementById('radioModeFree').checked;
  let settings = {};

  if (isFreeMode) {
    // 無料版モード
    const model = document.getElementById('freeModelSelect').value;
    settings = { model };

    // APIキーをクリア
    localStorage.removeItem('jsonld_user_openai_key');
    localStorage.removeItem('jsonld_usage_mode');
  } else {
    // MyAPIモード
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

    // ヘッダー表示を更新
    updateHeaderApiStatus();

    // 2秒後にモーダルを閉じる
    setTimeout(() => {
      closeDeveloperSettingsModal();
    }, 2000);
  } catch (error) {
    showDeveloperStatus('保存に失敗しました: ' + error.message, 'error');
  }
});

// 接続テスト
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

// 設定をクリア
document.getElementById('btnClearDeveloperSettings')?.addEventListener('click', () => {
  if (!confirm('拡張モード設定をすべてクリアしますか？')) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY_DEVELOPER);
  localStorage.removeItem('jsonld_user_openai_key');
  localStorage.removeItem('jsonld_usage_mode');

  // 無料版モードに戻す
  document.getElementById('radioModeFree').checked = true;
  document.getElementById('freeModelSelect').value = 'gpt-5-nano';
  document.getElementById('developerApiKey').value = '';
  document.getElementById('developerModel').value = 'gpt-5-nano';
  document.getElementById('developerBaseUrl').value = '';

  // 表示を更新
  setupApiModeToggle();

  showDeveloperStatus('設定をクリアしました', 'success');

  // ヘッダー表示を更新
  updateHeaderApiStatus();
});

// ステータス表示
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

// ヘッダーのAPI状態表示を更新
function updateHeaderApiStatus() {
  const modelNameEl = document.getElementById('apiModelName');
  const usageCountEl = document.getElementById('apiUsageCount');

  if (!modelNameEl || !usageCountEl) return;

  // モデル名を取得
  try {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY_DEVELOPER) || '{}');
    const modelName = settings.model || 'gpt-5-nano';

    // モデル名を短縮表示（gpt-5-nano-2025-08-07 -> gpt-5-nano）
    const shortModelName = modelName.replace(/-\d{4}-\d{2}-\d{2}$/, '');
    modelNameEl.textContent = shortModelName;
  } catch (error) {
    modelNameEl.textContent = 'gpt-5-nano';
  }

  // 利用回数を取得
  const userApiKey = localStorage.getItem('jsonld_user_openai_key');

  if (userApiKey) {
    // 開発者モード: 無制限
    usageCountEl.textContent = '無制限';
    return;
  }

  // 無料版: 各アドバイザーのレート制限を確認
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;

  // 各アドバイザーのレート制限キー
  const rateLimitKeys = [
    'jsonld_advisor_usage',
    'jsonld_blog_reviewer_usage',
    'jsonld_web_advisor_usage',
  ];

  // すべてのアドバイザーの合計利用回数を計算
  let totalUsed = 0;
  rateLimitKeys.forEach(key => {
    try {
      const usageData = JSON.parse(localStorage.getItem(key) || '[]');
      const recentRequests = usageData.filter(timestamp => now - timestamp < oneDayMs);
      totalUsed += recentRequests.length;
    } catch (error) {
      // エラーは無視
    }
  });

  // 無料版の上限は一律50回/24時間（毎日0:00にリセット）
  const maxRequests = 50;
  const remaining = Math.max(0, maxRequests - totalUsed);

  // 表示（例: "45/50"）
  usageCountEl.textContent = `${remaining}/${maxRequests}`;
}
