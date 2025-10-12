// SEO分析モジュール
import { extractBasicMeta, validateBasicMeta } from './modules/meta-extractor.js';
import { extractOpenGraph, validateOpenGraph } from './modules/og-extractor.js';
import { extractTwitterCards, validateTwitterCards } from './modules/twitter-extractor.js';
import { renderSummaryCard, renderMetaTab, renderSNSTab } from './modules/ui-renderer.js';

// 環境検出
const currentHost = window.location.hostname;
const isVercel = currentHost.includes('vercel.app') || currentHost.includes('vercel.sh');
const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';

// プロキシURL
let PROXY_SERVER;
if (isVercel) {
  PROXY_SERVER = '';
} else if (isLocalhost) {
  PROXY_SERVER = 'http://localhost:3333';
} else {
  PROXY_SERVER = `http://${currentHost}:3333`;
}

console.log('Environment:', isVercel ? 'Vercel' : 'Local', 'Proxy:', PROXY_SERVER || 'API Routes');

// パスワード表示/非表示
function togglePasswordVisibility() {
  const passwordField = document.getElementById('password');
  const toggleButton = document.getElementById('togglePassword');
  const iconEye = document.getElementById('iconEye');
  const iconEyeOff = document.getElementById('iconEyeOff');
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    if (iconEye && iconEyeOff) {
      iconEye.style.display = 'none';
      iconEyeOff.style.display = 'inline-flex';
    }
    toggleButton.title = 'パスワードを非表示';
  } else {
    passwordField.type = 'password';
    if (iconEye && iconEyeOff) {
      iconEye.style.display = 'inline-flex';
      iconEyeOff.style.display = 'none';
    }
    toggleButton.title = 'パスワードを表示';
  }
}

// 認証情報
const AUTH_STORAGE_KEY = 'jsonld_basic_auth';
const DOMAIN_AUTH_PREFIX = 'jsonld_auth_';

function loadStoredAuth() {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return;
  try {
    const auth = JSON.parse(stored);
    document.getElementById('username').value = auth.username || '';
    document.getElementById('password').value = auth.password || '';
    document.getElementById('rememberAuth').checked = true;
    updateAuthStatus(true);
  } catch (e) {
    console.error('Failed to load stored auth:', e);
  }
}

function handleRememberAuth() {
  const remember = document.getElementById('rememberAuth').checked;
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (remember) {
    if (username || password) {
      const auth = { username, password, timestamp: Date.now() };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      updateAuthStatus(true);
    }
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateAuthStatus(false);
  }
}

function clearAuth() {
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';
  document.getElementById('rememberAuth').checked = false;

  localStorage.removeItem(AUTH_STORAGE_KEY);
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith(DOMAIN_AUTH_PREFIX)) localStorage.removeItem(key);
  });
  updateAuthStatus(false);
  showMessage('すべての認証情報をクリアしました', 'success');
}

function updateAuthStatus(isStored) {
  const statusEl = document.getElementById('authStatus');
  statusEl.textContent = isStored ? '(保存済み)' : '';
  if (isStored) statusEl.style.color = '#10b981';
}

function showMessage(message, type = 'info') {
  const errorEl = document.getElementById('errorMessage');
  errorEl.textContent = message;
  errorEl.style.background = type === 'success' ? '#d1fae5' : '#fef2f2';
  errorEl.style.borderColor = type === 'success' ? '#86efac' : '#fecaca';
  errorEl.style.color = type === 'success' ? '#065f46' : '#dc2626';
  errorEl.classList.add('active');
  setTimeout(() => {
    errorEl.classList.remove('active');
  }, 3000);
}

async function checkServerStatus() {
  const statusElement = document.getElementById('serverStatus');
  try {
    const healthUrl = isVercel ? '/api/health' : `${PROXY_SERVER}/health`;
    const response = await fetch(healthUrl);
    if (response.ok) {
      statusElement.textContent = isVercel ? 'Vercel API稼働中' : 'サーバー稼働中';
      statusElement.className = 'server-status';
      return true;
    }
  } catch (error) {
    statusElement.textContent = isVercel ? 'API エラー' : 'サーバーオフライン';
    statusElement.className = 'server-status offline';
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
      showMessage(`${urlObj.hostname}の認証情報を自動入力しました`, 'success');
      const authSection = document.getElementById('authSection');
      if (authSection) authSection.open = true;
      return true;
    }
  } catch (e) {
    console.log('Could not auto-fill auth:', e);
  }
  return false;
}

function loadSample(url) {
  document.getElementById('urlInput').value = url;
  autoFillAuthForUrl(url);
  fetchAndDisplay();
}

/**
 * 入力URLから対象ページを取得し、JSON-LDを抽出して描画する。
 * - サーバー稼働確認
 * - Basic認証の保存/付与
 * - エラー表示とローディング制御
 */
async function fetchAndDisplay() {
  const urlInput = document.getElementById('urlInput');
  const url = urlInput.value.trim();
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
    if (isVercel) showError('Vercel APIに接続できません。しばらくお待ちください。');
    else
      showError(
        'プロキシサーバーがオフラインです."pnpm install && pnpm start" を実行してください。'
      );
    return;
  }

  showLoading(true);
  hideError();
  hideResults();
  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const remember = document.getElementById('rememberAuth').checked;
    if (remember && (username || password)) {
      const auth = { username, password, timestamp: Date.now() };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      try {
        const urlObj = new URL(url);
        const domainKey = DOMAIN_AUTH_PREFIX + urlObj.hostname;
        localStorage.setItem(domainKey, JSON.stringify(auth));
      } catch (e) {
        console.error('Failed to save domain-specific auth:', e);
      }
      updateAuthStatus(true);
    }

    let proxyUrl = isVercel
      ? `/api/proxy?url=${encodeURIComponent(url)}`
      : `${PROXY_SERVER}/proxy?url=${encodeURIComponent(url)}`;
    if (username && password) {
      proxyUrl += `&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    }

    const response = await fetch(proxyUrl);
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
      if (response.status === 401)
        throw new Error('Basic認証が失敗しました。ユーザー名とパスワードを確認してください。');
      throw new Error(errorMessage);
    }

    const html = await response.text();
    const schemas = extractJsonLd(html);
    if (schemas.length === 0) {
      showNoData();
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
  } catch {
    return false;
  }
}

function extractJsonLd(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemas = [];
  scripts.forEach(script => {
    try {
      schemas.push(JSON.parse(script.textContent));
    } catch (e) {
      console.error('Failed to parse JSON-LD:', e);
    }
  });
  return schemas;
}

function displaySchemas(schemas, url) {
  const container = document.getElementById('schemasContainer');
  const statsContainer = document.getElementById('stats');
  const totalProperties = schemas.reduce((acc, schema) => acc + countProperties(schema), 0);
  statsContainer.innerHTML = `
    <div class="stat-item"><span class="stat-label">スキーマ数</span><span class="stat-value">${schemas.length}</span></div>
    <div class="stat-item"><span class="stat-label">プロパティ総数</span><span class="stat-value">${totalProperties}</span></div>
    <div class="stat-item"><span class="stat-label">ドメイン</span><span class="stat-value">${new URL(url).hostname}</span></div>
  `;
  container.innerHTML = '';
  schemas.forEach((schema, index) => container.appendChild(createSchemaCard(schema, index + 1)));
  showResults();
}

function countProperties(obj) {
  if (typeof obj !== 'object' || obj === null) return 0;
  let count = 0;
  for (let key in obj) {
    count++;
    if (typeof obj[key] === 'object' && obj[key] !== null) count += countProperties(obj[key]);
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
        <span class="schema-type">${escapeHtml(type)}</span>
        <span class="schema-index">Schema #${index}</span>
      </div>
      <div class="schema-controls">
        <div class="view-toggle">
          <button class="active" onclick="toggleView('${id}', 'table', this)">テーブル</button>
          <button onclick="toggleView('${id}', 'json', this)">JSON</button>
        </div>
        <div class="doc-links">${buildDocLinks(schema)}</div>
        <button class="copy-button" onclick="copyToClipboard('${id}', this)">コピー</button>
      </div>
    </div>
    <div class="schema-content" id="${id}" data-raw='${JSON.stringify(schema)}'>
      <div class="table-view" id="${id}-table">${createTableView(schema)}</div>
      <div class="json-view hidden" id="${id}-json">${formatJson(schema)}</div>
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
  if (Array.isArray(obj)) return createArrayView(obj, depth);
  if (typeof obj === 'object' && obj !== null) return createObjectTable(obj, depth);
  return formatValue(obj);
}

function createObjectTable(obj, depth) {
  const entries = Object.entries(obj);
  if (entries.length === 0) return '<span class="property-value">空のオブジェクト</span>';
  let html =
    '<table class="data-table"><colgroup><col class="col-prop"><col class="col-value"><col class="col-type"></colgroup>';
  html += '<thead><tr><th>プロパティ</th><th>値</th><th>型</th></tr></thead><tbody>';
  entries.forEach(([key, value]) => {
    const type = getValueType(value);
    html += '<tr>';
    html += `<td class="property-name">${escapeHtml(key)}</td>`;
    html += '<td>';
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) html += createArrayView(value, depth + 1);
      else html += createNestedObjectView(value, depth + 1);
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
  html += `<div style="margin-bottom: 8px; color: #64748b; font-size: 13px;">配列 (${arr.length}項目)</div>`;
  arr.forEach((item, index) => {
    html += `<div class="array-list-item">`;
    html += `<strong style="color: #64748b; font-size: 12px;">Item ${index + 1}</strong>`;
    if (typeof item === 'object' && item !== null) {
      html += `<div style="margin-top: 8px;">${createTableView(item, depth + 1)}</div>`;
    } else {
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
  return `
    <div>
      <span class="expandable" onclick="toggleNested('${id}', this)">オブジェクト {${preview}}</span>
      <div class="nested-content" id="${id}"><div class="nested-object"><div class="table-view">${createTableView(obj, depth)}</div></div></div>
    </div>
  `;
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
        return `<span class="image-value"><img src="${safe}" alt="image" class="image-thumb" loading="lazy" referrerpolicy="no-referrer" /><a href="${safe}" target="_blank" class="url-value">${safe}</a></span>`;
      }
      return `<a href="${escapeHtml(value)}" target="_blank" class="url-value">${escapeHtml(value)}</a>`;
    }
    return `<span class="property-value">${escapeHtml(value)}</span>`;
  }
  if (typeof value === 'boolean')
    return `<span class="property-value" style="color: #dc2626;">${value}</span>`;
  if (typeof value === 'number')
    return `<span class="property-value" style="color: #ea580c;">${value}</span>`;
  return `<span class="property-value">${escapeHtml(String(value))}</span>`;
}

function isImageUrl(url) {
  try {
    const u = new URL(url);
    return u.pathname.toLowerCase().match(/\.(png|jpe?g|gif|webp|svg)$/);
  } catch {
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
    } catch {}
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
  if (typeof value === 'string') return value.length > 20 ? value.slice(0, 20) + '...' : value;
  return String(value);
}
function getValueType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}
function getSchemaType(schema) {
  if (Array.isArray(schema)) return 'Array';
  if (schema['@type'])
    return Array.isArray(schema['@type']) ? schema['@type'].join(', ') : schema['@type'];
  if (schema['@graph']) return '@graph';
  return 'Object';
}

function formatJson(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  if (obj === null) return `<span class="json-null">null</span>`;
  if (typeof obj === 'boolean') return `<span class="json-boolean">${obj}</span>`;
  if (typeof obj === 'number') return `<span class="json-number">${obj}</span>`;
  if (typeof obj === 'string') return `<span class="json-string">"${escapeHtml(obj)}"</span>`;
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
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
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

function showNoData() {
  const container = document.getElementById('schemasContainer');
  container.innerHTML = `<div class="no-data"><h3>JSON-LDスキーマが見つかりませんでした</h3><p>このページには構造化データが含まれていないようです</p></div>`;
  showResults();
}

function showLoading(show) {
  document.getElementById('loading').classList.toggle('active', show);
  document.getElementById('fetchButton').disabled = show;
}
function showError(message) {
  const el = document.getElementById('errorMessage');
  el.textContent = message;
  el.style.background = '#fef2f2';
  el.style.borderColor = '#fecaca';
  el.style.color = '#dc2626';
  el.classList.add('active');
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
  if (e.key === 'Enter') fetchAndDisplay();
});
document.getElementById('urlInput').addEventListener('blur', function (e) {
  const url = e.target.value.trim();
  if (url) autoFillAuthForUrl(url);
});

/**
 * タブ切り替え機能の初期化
 */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      tabButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      button.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

/**
 * SEO分析を実行
 */
function analyzeSEO(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const meta = extractBasicMeta(doc);
  const og = extractOpenGraph(doc);
  const twitter = extractTwitterCards(doc);

  const metaIssues = validateBasicMeta(meta);
  const ogIssues = validateOpenGraph(og);
  const twitterIssues = validateTwitterCards(twitter);

  const scores = calculateScores(meta, og, twitter, metaIssues, ogIssues, twitterIssues);
  const totalScore = scores.meta + scores.sns + scores.schema;

  return {
    analysisData: { meta, og, twitter, metaIssues, ogIssues, twitterIssues, scores },
    totalScore,
  };
}

/**
 * SEOスコアを計算
 */
function calculateScores(meta, og, twitter, metaIssues, ogIssues, twitterIssues) {
  let metaScore = 25;
  const metaErrors = metaIssues.filter(i => i.type === 'error').length;
  const metaWarnings = metaIssues.filter(i => i.type === 'warning').length;
  metaScore -= metaErrors * 5;
  metaScore -= metaWarnings * 2;
  metaScore = Math.max(0, metaScore);

  let snsScore = 15;
  const ogRequired = ['title', 'description', 'image', 'url', 'type'];
  const twitterRequired = ['card', 'title', 'description'];
  const ogMissing = ogRequired.filter(field => !og[field]).length;
  const twitterMissing = twitterRequired.filter(field => !twitter[field]).length;
  snsScore -= ogMissing * 1.5;
  snsScore -= twitterMissing * 1;
  snsScore = Math.max(0, snsScore);

  const schemasContainer = document.getElementById('schemasContainer');
  const hasSchema = schemasContainer && schemasContainer.children.length > 0;
  const schemaScore = hasSchema ? 20 : 0;

  return {
    meta: Math.round(metaScore),
    sns: Math.round(snsScore),
    schema: schemaScore,
  };
}

/**
 * 概要タブの内容を描画
 */
function renderOverviewTab(analysisData, totalScore) {
  const overviewTab = document.getElementById('tab-overview');
  const allIssues = [
    ...analysisData.metaIssues,
    ...analysisData.ogIssues,
    ...analysisData.twitterIssues,
  ];
  const errorCount = allIssues.filter(i => i.type === 'error').length;
  const warningCount = allIssues.filter(i => i.type === 'warning').length;

  let issuesHtml = '';
  if (allIssues.length > 0) {
    issuesHtml = `
      <div class="issues-section">
        <h3>検出された問題 (全${allIssues.length}件)</h3>
        <div style="margin-bottom: 12px;">
          <span class="status-badge error">エラー: ${errorCount}件</span>
          <span class="status-badge warning" style="margin-left: 8px;">警告: ${warningCount}件</span>
        </div>
        ${allIssues
          .slice(0, 10)
          .map(
            issue => `
          <div class="status-badge ${issue.type}">
            ${issue.type === 'error' ? 'x' : '!'} ${issue.message}
          </div>
        `
          )
          .join('')}
        ${allIssues.length > 10 ? `<p style="color: #64748b; font-size: 13px; margin-top: 8px;">他${allIssues.length - 10}件の問題があります。各タブで詳細を確認してください。</p>` : ''}
      </div>
    `;
  }

  overviewTab.innerHTML = `
    <h2>分析概要</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 20px 0;">
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px;">
        <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">総合スコア</div>
        <div style="font-size: 32px; font-weight: 700; color: ${totalScore >= 80 ? '#10b981' : totalScore >= 60 ? '#f59e0b' : '#ef4444'};">${totalScore}/100</div>
      </div>
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px;">
        <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">メタタグ</div>
        <div style="font-size: 24px; font-weight: 600; color: #334155;">${analysisData.scores.meta}/25</div>
      </div>
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px;">
        <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">SNS最適化</div>
        <div style="font-size: 24px; font-weight: 600; color: #334155;">${analysisData.scores.sns}/15</div>
      </div>
      <div style="background: #f8fafc; padding: 16px; border-radius: 6px;">
        <div style="color: #64748b; font-size: 13px; margin-bottom: 4px;">構造化データ</div>
        <div style="font-size: 24px; font-weight: 600; color: #334155;">${analysisData.scores.schema}/20</div>
      </div>
    </div>
    ${issuesHtml}
    <div style="margin-top: 24px;">
      <h3>基本情報</h3>
      <table class="meta-table">
        <tbody>
          <tr>
            <td style="font-weight: 500;">Title</td>
            <td>${escapeHtml(analysisData.meta.title)} <span style="color: #64748b;">(${analysisData.meta.titleLength}文字)</span></td>
          </tr>
          <tr>
            <td style="font-weight: 500;">Description</td>
            <td>${escapeHtml(analysisData.meta.description)} <span style="color: #64748b;">(${analysisData.meta.descriptionLength}文字)</span></td>
          </tr>
          <tr>
            <td style="font-weight: 500;">Canonical</td>
            <td>${analysisData.meta.canonical ? `<a href="${escapeHtml(analysisData.meta.canonical)}" target="_blank" style="color: #3b82f6;">${escapeHtml(analysisData.meta.canonical)}</a>` : '<span style="color: #94a3b8;">未設定</span>'}</td>
          </tr>
          <tr>
            <td style="font-weight: 500;">Language</td>
            <td>${escapeHtml(analysisData.meta.language) || '<span style="color: #94a3b8;">未設定</span>'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/**
 * SEO分析結果を表示
 */
function displaySEOAnalysis(html) {
  const { analysisData, totalScore } = analyzeSEO(html);
  renderSummaryCard(analysisData, totalScore);
  renderMetaTab(analysisData.meta, analysisData.metaIssues);
  renderSNSTab(
    analysisData.og,
    analysisData.twitter,
    analysisData.ogIssues,
    analysisData.twitterIssues
  );
  renderOverviewTab(analysisData, totalScore);

  document.getElementById('seoSummarySection').style.display = 'block';
  document.getElementById('tabNavigation').style.display = 'flex';
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
});

// グローバル公開（インラインHTMLのonclickと連携するため）
window.togglePasswordVisibility = togglePasswordVisibility;
window.loadSample = loadSample;
window.fetchAndDisplay = fetchAndDisplay;
window.displaySEOAnalysis = displaySEOAnalysis;
