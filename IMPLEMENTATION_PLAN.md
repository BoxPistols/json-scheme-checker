# 実装計画書: SEO・メタ情報分析ツール

## 概要

現在のJSON-LDビューアを段階的に拡張し、包括的なSEO分析ツールを構築する。
各フェーズは独立して動作可能な状態でリリースし、段階的に機能を追加していく。

---

## アーキテクチャ設計

### ファイル構造

```
json-ld-viewer/
├── server.js                    # プロキシサーバー（既存・拡張）
├── package.json
├── vercel.json
├── REQUIREMENTS.md              # 要件定義書
├── IMPLEMENTATION_PLAN.md       # この実装計画書
├── public/
│   ├── index.html              # メインHTML（既存・大幅拡張）
│   ├── styles.css              # スタイル（既存・拡張）
│   ├── app.js                  # メインJavaScript（新規作成）
│   └── modules/                # JavaScriptモジュール（新規）
│       ├── analyzer.js         # 分析エンジン
│       ├── meta-extractor.js   # メタタグ抽出
│       ├── og-extractor.js     # OGタグ抽出
│       ├── heading-analyzer.js # 見出し構造分析
│       ├── link-analyzer.js    # リンク分析
│       ├── image-analyzer.js   # 画像分析
│       ├── scorer.js           # SEOスコア計算
│       ├── ui-renderer.js      # UI描画
│       └── utils.js            # 共通ユーティリティ
└── api/
    └── proxy.js                 # Vercel Serverless Function（既存）
```

### データフロー

```
[ユーザー入力URL]
      ↓
[server.js プロキシ] → HTML取得
      ↓
[analyzer.js] → HTMLを各エクストラクターに渡す
      ↓
[meta-extractor.js] → メタタグ抽出
[og-extractor.js] → OGタグ抽出
[heading-analyzer.js] → 見出し構造分析
[link-analyzer.js] → リンク分析
[image-analyzer.js] → 画像分析
      ↓
[scorer.js] → 各データを集約・スコア計算
      ↓
[ui-renderer.js] → 結果をUIに描画
```

---

## Phase 1: 基本メタタグ分析（優先度: 最高）

### 目標

基本的なメタタグ（title/description/canonical）とSNSタグ（OG/Twitter）の抽出・表示を実装する。

### 実装内容

#### 1.1 バックエンド拡張

**ファイル: `server.js`**

現在の`/proxy`エンドポイントは維持。
新たに`/analyze`エンドポイントを追加し、サーバーサイドでHTML解析を行う。

```javascript
// 新規追加
const cheerio = require('cheerio');

app.post('/analyze', async (req, res) => {
  try {
    const { url, username, password } = req.body;

    // プロキシ経由でHTMLを取得（既存のロジックを再利用）
    const html = await fetchHtmlViaProxy(url, username, password);

    // Cheerioでパース
    const $ = cheerio.load(html);

    // 基本情報を抽出
    const analysis = {
      basic: extractBasicMeta($),
      og: extractOpenGraph($),
      twitter: extractTwitterCards($),
      jsonLd: extractJsonLd($),
      timestamp: new Date().toISOString(),
      url: url
    };

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**追加パッケージ:**

```bash
pnpm add cheerio
```

#### 1.2 フロントエンド: メタタグ抽出モジュール

**ファイル: `public/modules/meta-extractor.js`**

```javascript
export function extractBasicMeta(doc) {
  return {
    title: doc.querySelector('title')?.textContent || '',
    titleLength: doc.querySelector('title')?.textContent?.length || 0,
    description: doc.querySelector('meta[name="description"]')?.content || '',
    descriptionLength: doc.querySelector('meta[name="description"]')?.content?.length || 0,
    keywords: doc.querySelector('meta[name="keywords"]')?.content || '',
    canonical: doc.querySelector('link[rel="canonical"]')?.href || '',
    robots: doc.querySelector('meta[name="robots"]')?.content || '',
    viewport: doc.querySelector('meta[name="viewport"]')?.content || '',
    charset: doc.querySelector('meta[charset]')?.getAttribute('charset') ||
             doc.querySelector('meta[http-equiv="Content-Type"]')?.content || '',
    language: doc.documentElement.lang || ''
  };
}

export function validateBasicMeta(meta) {
  const issues = [];

  if (!meta.title) {
    issues.push({ type: 'error', field: 'title', message: 'タイトルタグが見つかりません' });
  } else if (meta.titleLength > 60) {
    issues.push({ type: 'warning', field: 'title', message: `タイトルが長すぎます（${meta.titleLength}文字、推奨: 50-60文字）` });
  } else if (meta.titleLength < 30) {
    issues.push({ type: 'warning', field: 'title', message: `タイトルが短すぎます（${meta.titleLength}文字、推奨: 50-60文字）` });
  }

  if (!meta.description) {
    issues.push({ type: 'error', field: 'description', message: 'descriptionメタタグが見つかりません' });
  } else if (meta.descriptionLength > 160) {
    issues.push({ type: 'warning', field: 'description', message: `descriptionが長すぎます（${meta.descriptionLength}文字、推奨: 120-160文字）` });
  }

  if (!meta.canonical) {
    issues.push({ type: 'warning', field: 'canonical', message: 'canonicalタグが設定されていません' });
  }

  if (meta.robots && meta.robots.includes('noindex')) {
    issues.push({ type: 'warning', field: 'robots', message: 'このページはnoindexに設定されています' });
  }

  return issues;
}
```

**ファイル: `public/modules/og-extractor.js`**

```javascript
export function extractOpenGraph(doc) {
  const ogTags = {};
  const metaTags = doc.querySelectorAll('meta[property^="og:"]');

  metaTags.forEach(tag => {
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (property && content) {
      const key = property.replace('og:', '');
      ogTags[key] = content;
    }
  });

  return ogTags;
}

export function validateOpenGraph(og) {
  const issues = [];
  const required = ['title', 'description', 'image', 'url', 'type'];

  required.forEach(field => {
    if (!og[field]) {
      issues.push({
        type: 'warning',
        field: `og:${field}`,
        message: `og:${field}が設定されていません`
      });
    }
  });

  if (og.image && !isValidUrl(og.image)) {
    issues.push({ type: 'error', field: 'og:image', message: '画像URLが無効です' });
  }

  return issues;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
```

**ファイル: `public/modules/twitter-extractor.js`**

```javascript
export function extractTwitterCards(doc) {
  const twitterTags = {};
  const metaTags = doc.querySelectorAll('meta[name^="twitter:"]');

  metaTags.forEach(tag => {
    const name = tag.getAttribute('name');
    const content = tag.getAttribute('content');
    if (name && content) {
      const key = name.replace('twitter:', '');
      twitterTags[key] = content;
    }
  });

  return twitterTags;
}

export function validateTwitterCards(twitter) {
  const issues = [];
  const required = ['card', 'title', 'description'];

  required.forEach(field => {
    if (!twitter[field]) {
      issues.push({
        type: 'warning',
        field: `twitter:${field}`,
        message: `twitter:${field}が設定されていません`
      });
    }
  });

  const validCards = ['summary', 'summary_large_image', 'app', 'player'];
  if (twitter.card && !validCards.includes(twitter.card)) {
    issues.push({
      type: 'error',
      field: 'twitter:card',
      message: `無効なカードタイプです: ${twitter.card}`
    });
  }

  return issues;
}
```

#### 1.3 UI実装

**ファイル: `public/index.html`**

既存のHTML構造を拡張し、タブナビゲーションを追加:

```html
<div class="results-section" id="results">
  <!-- 新規追加: サマリーカード -->
  <div class="summary-card" id="summaryCard"></div>

  <!-- 新規追加: タブナビゲーション -->
  <div class="tab-navigation">
    <button class="tab-button active" data-tab="overview">概要</button>
    <button class="tab-button" data-tab="meta">メタタグ</button>
    <button class="tab-button" data-tab="sns">SNS</button>
    <button class="tab-button" data-tab="schema">構造化データ</button>
    <button class="tab-button" data-tab="headings">見出し</button>
    <button class="tab-button" data-tab="links">リンク</button>
    <button class="tab-button" data-tab="images">画像</button>
    <button class="tab-button" data-tab="technical">技術</button>
  </div>

  <!-- タブコンテンツ -->
  <div class="tab-content active" id="tab-overview"></div>
  <div class="tab-content" id="tab-meta"></div>
  <div class="tab-content" id="tab-sns"></div>
  <div class="tab-content" id="tab-schema">
    <!-- 既存のJSON-LD表示をここに移動 -->
    <div id="schemasContainer"></div>
  </div>
  <div class="tab-content" id="tab-headings"></div>
  <div class="tab-content" id="tab-links"></div>
  <div class="tab-content" id="tab-images"></div>
  <div class="tab-content" id="tab-technical"></div>
</div>
```

**ファイル: `public/styles.css`**

タブナビゲーション用のスタイルを追加:

```css
/* タブナビゲーション */
.tab-navigation {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
  overflow-x: auto;
}

.tab-button {
  padding: 12px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
  transition: all 0.2s;
}

.tab-button:hover {
  color: #3b82f6;
  background: #f1f5f9;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-content {
  display: none;
  animation: fadeIn 0.3s;
}

.tab-content.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* サマリーカード */
.summary-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.seo-score {
  font-size: 48px;
  font-weight: bold;
  margin: 16px 0;
}

.score-breakdown {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

/* ステータスバッジ */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.status-badge.success {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.warning {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.error {
  background: #fee2e2;
  color: #991b1b;
}

/* メタタグ表示テーブル */
.meta-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.meta-table th,
.meta-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.meta-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.meta-table td.meta-value {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: #1f2937;
  word-break: break-word;
}

/* SNSプレビューカード */
.sns-preview {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 16px;
  max-width: 500px;
}

.sns-preview-image {
  width: 100%;
  height: 260px;
  object-fit: cover;
  background: #f3f4f6;
}

.sns-preview-content {
  padding: 16px;
}

.sns-preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
}

.sns-preview-description {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
}

.sns-preview-url {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}
```

**ファイル: `public/modules/ui-renderer.js`**

```javascript
export function renderSummaryCard(analysisData, score) {
  const summaryCard = document.getElementById('summaryCard');

  summaryCard.innerHTML = `
    <div class="summary-card">
      <h2>SEO分析結果</h2>
      <div class="seo-score">${score}/100</div>
      <div class="score-breakdown">
        <div>
          <div class="score-label">メタタグ</div>
          <div class="score-value">${analysisData.scores.meta}/25</div>
        </div>
        <div>
          <div class="score-label">SNS最適化</div>
          <div class="score-value">${analysisData.scores.sns}/15</div>
        </div>
        <div>
          <div class="score-label">構造化データ</div>
          <div class="score-value">${analysisData.scores.schema}/20</div>
        </div>
      </div>
    </div>
  `;
}

export function renderMetaTab(meta, issues) {
  const metaTab = document.getElementById('tab-meta');

  let issuesHtml = '';
  if (issues.length > 0) {
    issuesHtml = `
      <div class="issues-section">
        <h3>検出された問題</h3>
        ${issues.map(issue => `
          <div class="status-badge ${issue.type}">
            ${issue.type === 'error' ? '✗' : '⚠'} ${issue.message}
          </div>
        `).join('')}
      </div>
    `;
  }

  metaTab.innerHTML = `
    <h2>基本メタタグ</h2>
    ${issuesHtml}
    <table class="meta-table">
      <thead>
        <tr>
          <th>項目</th>
          <th>値</th>
          <th>ステータス</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Title</td>
          <td class="meta-value">${escapeHtml(meta.title)} <span style="color: #64748b;">(${meta.titleLength}文字)</span></td>
          <td>${getMetaStatus('title', meta, issues)}</td>
        </tr>
        <tr>
          <td>Description</td>
          <td class="meta-value">${escapeHtml(meta.description)} <span style="color: #64748b;">(${meta.descriptionLength}文字)</span></td>
          <td>${getMetaStatus('description', meta, issues)}</td>
        </tr>
        <tr>
          <td>Canonical</td>
          <td class="meta-value">${meta.canonical ? `<a href="${escapeHtml(meta.canonical)}" target="_blank">${escapeHtml(meta.canonical)}</a>` : '未設定'}</td>
          <td>${getMetaStatus('canonical', meta, issues)}</td>
        </tr>
        <tr>
          <td>Robots</td>
          <td class="meta-value">${escapeHtml(meta.robots) || '未設定'}</td>
          <td>${getMetaStatus('robots', meta, issues)}</td>
        </tr>
        <tr>
          <td>Viewport</td>
          <td class="meta-value">${escapeHtml(meta.viewport) || '未設定'}</td>
          <td>${meta.viewport ? '<span class="status-badge success">✓</span>' : '<span class="status-badge warning">⚠</span>'}</td>
        </tr>
      </tbody>
    </table>
  `;
}

export function renderSNSTab(og, twitter, ogIssues, twitterIssues) {
  const snsTab = document.getElementById('tab-sns');

  snsTab.innerHTML = `
    <h2>SNS最適化</h2>

    <section style="margin-bottom: 32px;">
      <h3>Open Graph (Facebook/LinkedIn)</h3>
      ${renderOGPreview(og)}
      ${renderOGTable(og, ogIssues)}
    </section>

    <section>
      <h3>Twitter Cards</h3>
      ${renderTwitterPreview(twitter)}
      ${renderTwitterTable(twitter, twitterIssues)}
    </section>
  `;
}

function renderOGPreview(og) {
  if (!og.title && !og.description && !og.image) {
    return '<p style="color: #64748b;">Open Graphタグが設定されていません</p>';
  }

  return `
    <div class="sns-preview">
      ${og.image ? `<img src="${escapeHtml(og.image)}" alt="OG Image" class="sns-preview-image" onerror="this.style.display='none'">` : ''}
      <div class="sns-preview-content">
        <div class="sns-preview-url">${escapeHtml(og.url || '')}</div>
        <div class="sns-preview-title">${escapeHtml(og.title || '')}</div>
        <div class="sns-preview-description">${escapeHtml(og.description || '')}</div>
      </div>
    </div>
  `;
}

function renderOGTable(og, issues) {
  const required = ['title', 'description', 'image', 'url', 'type'];

  return `
    <table class="meta-table">
      <thead>
        <tr>
          <th>プロパティ</th>
          <th>値</th>
          <th>ステータス</th>
        </tr>
      </thead>
      <tbody>
        ${required.map(key => {
          const value = og[key] || '';
          const hasIssue = issues.some(i => i.field === `og:${key}`);
          const status = value ?
            (hasIssue ? '<span class="status-badge warning">⚠</span>' : '<span class="status-badge success">✓</span>') :
            '<span class="status-badge error">✗</span>';

          return `
            <tr>
              <td>og:${key}</td>
              <td class="meta-value">${key === 'image' && value ? `<img src="${escapeHtml(value)}" style="max-width: 100px; display: block; margin: 4px 0;"><a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
              <td>${status}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function renderTwitterPreview(twitter) {
  if (!twitter.title && !twitter.description && !twitter.image) {
    return '<p style="color: #64748b;">Twitter Cardタグが設定されていません</p>';
  }

  return `
    <div class="sns-preview" style="max-width: 400px;">
      ${twitter.image ? `<img src="${escapeHtml(twitter.image)}" alt="Twitter Image" class="sns-preview-image" style="height: 200px;" onerror="this.style.display='none'">` : ''}
      <div class="sns-preview-content">
        <div class="sns-preview-title">${escapeHtml(twitter.title || '')}</div>
        <div class="sns-preview-description">${escapeHtml(twitter.description || '')}</div>
        <div class="sns-preview-url">${escapeHtml(twitter.site || '')}</div>
      </div>
    </div>
  `;
}

function renderTwitterTable(twitter, issues) {
  const fields = ['card', 'title', 'description', 'image', 'site', 'creator'];

  return `
    <table class="meta-table">
      <thead>
        <tr>
          <th>プロパティ</th>
          <th>値</th>
          <th>ステータス</th>
        </tr>
      </thead>
      <tbody>
        ${fields.map(key => {
          const value = twitter[key] || '';
          const hasIssue = issues.some(i => i.field === `twitter:${key}`);
          const isRequired = ['card', 'title', 'description'].includes(key);
          const status = value ?
            (hasIssue ? '<span class="status-badge error">✗</span>' : '<span class="status-badge success">✓</span>') :
            (isRequired ? '<span class="status-badge error">✗</span>' : '<span class="status-badge warning">-</span>');

          return `
            <tr>
              <td>twitter:${key}</td>
              <td class="meta-value">${key === 'image' && value ? `<img src="${escapeHtml(value)}" style="max-width: 100px; display: block; margin: 4px 0;"><a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
              <td>${status}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function getMetaStatus(field, meta, issues) {
  const hasIssue = issues.some(i => i.field === field);
  if (!meta[field]) {
    return '<span class="status-badge error">✗ 未設定</span>';
  }
  if (hasIssue) {
    const issue = issues.find(i => i.field === field);
    return `<span class="status-badge ${issue.type}">⚠</span>`;
  }
  return '<span class="status-badge success">✓ 正常</span>';
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}
```

#### 1.4 メインロジック統合

**ファイル: `public/app.js`**

```javascript
import { extractBasicMeta, validateBasicMeta } from './modules/meta-extractor.js';
import { extractOpenGraph, validateOpenGraph } from './modules/og-extractor.js';
import { extractTwitterCards, validateTwitterCards } from './modules/twitter-extractor.js';
import { renderSummaryCard, renderMetaTab, renderSNSTab } from './modules/ui-renderer.js';

// タブ切り替え機能
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;

      // すべてのタブを非アクティブ化
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // 選択されたタブをアクティブ化
      button.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
});

// 既存のfetchAndDisplay関数を拡張
window.analyzeAndDisplay = async function() {
  const urlInput = document.getElementById('urlInput');
  const url = urlInput.value.trim();

  if (!url) {
    showError('URLを入力してください');
    return;
  }

  showLoading(true);
  hideError();
  hideResults();

  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // プロキシサーバー経由でHTMLを取得
    let proxyUrl;
    if (isVercel) {
      proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    } else {
      proxyUrl = `${PROXY_SERVER}/proxy?url=${encodeURIComponent(url)}`;
    }

    if (username && password) {
      proxyUrl += `&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    }

    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTPエラー ${response.status}`);
    }

    const html = await response.text();

    // DOMParserでHTMLをパース
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 各種データを抽出
    const basicMeta = extractBasicMeta(doc);
    const basicIssues = validateBasicMeta(basicMeta);

    const og = extractOpenGraph(doc);
    const ogIssues = validateOpenGraph(og);

    const twitter = extractTwitterCards(doc);
    const twitterIssues = validateTwitterCards(twitter);

    const jsonLdSchemas = extractJsonLd(html); // 既存関数

    // スコア計算（簡易版）
    const score = calculateScore({
      basic: basicMeta,
      basicIssues,
      og,
      ogIssues,
      twitter,
      twitterIssues,
      jsonLdSchemas
    });

    // UI描画
    renderSummaryCard({
      scores: {
        meta: score.meta,
        sns: score.sns,
        schema: score.schema
      }
    }, score.total);

    renderMetaTab(basicMeta, basicIssues);
    renderSNSTab(og, twitter, ogIssues, twitterIssues);

    // 既存のJSON-LD表示（既存関数を再利用）
    displaySchemas(jsonLdSchemas, url);

    showResults();

  } catch (error) {
    console.error('Error:', error);
    showError(`エラーが発生しました: ${error.message}`);
  } finally {
    showLoading(false);
  }
};

// 簡易スコア計算
function calculateScore(data) {
  let metaScore = 0;
  let snsScore = 0;
  let schemaScore = 0;

  // メタタグスコア（25点満点）
  if (data.basic.title) metaScore += 8;
  if (data.basic.description) metaScore += 8;
  if (data.basic.canonical) metaScore += 5;
  if (data.basic.viewport) metaScore += 2;
  if (data.basicIssues.filter(i => i.type === 'error').length === 0) metaScore += 2;

  // SNSスコア（15点満点）
  if (data.og.title && data.og.description && data.og.image) snsScore += 8;
  if (data.twitter.card && data.twitter.title) snsScore += 7;

  // 構造化データスコア（20点満点）
  if (data.jsonLdSchemas.length > 0) schemaScore += 20;

  return {
    meta: metaScore,
    sns: snsScore,
    schema: schemaScore,
    total: metaScore + snsScore + schemaScore
  };
}
```

### 完了条件

- [ ] メタタグ（title/description/canonical）の抽出・表示
- [ ] Open Graphタグの抽出・SNSプレビュー表示
- [ ] Twitter Cardsの抽出・プレビュー表示
- [ ] 基本的なバリデーション（文字数チェック等）
- [ ] タブナビゲーションの実装
- [ ] 簡易SEOスコア表示

**推定工数: 2-3日**

---

## Phase 2: 構造分析（優先度: 高）

### 目標

見出し構造・リンク・画像を分析し、より詳細なSEO評価を提供する。

### 実装内容

#### 2.1 見出し構造分析

**ファイル: `public/modules/heading-analyzer.js`**

```javascript
export function analyzeHeadings(doc) {
  const headings = [];
  const headingTags = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

  headingTags.forEach((tag, index) => {
    headings.push({
      level: parseInt(tag.tagName.substring(1)),
      text: tag.textContent.trim(),
      length: tag.textContent.trim().length,
      index: index
    });
  });

  return headings;
}

export function validateHeadings(headings) {
  const issues = [];

  // H1の数をチェック
  const h1Count = headings.filter(h => h.level === 1).length;
  if (h1Count === 0) {
    issues.push({ type: 'error', message: 'H1タグが見つかりません' });
  } else if (h1Count > 1) {
    issues.push({ type: 'warning', message: `H1タグが${h1Count}個あります（推奨: 1個）` });
  }

  // 階層スキップをチェック
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];
    if (curr.level - prev.level > 1) {
      issues.push({
        type: 'warning',
        message: `H${prev.level}の後にH${curr.level}が来ています（階層がスキップされています）`
      });
    }
  }

  // 空の見出しをチェック
  const emptyHeadings = headings.filter(h => h.length === 0);
  if (emptyHeadings.length > 0) {
    issues.push({
      type: 'error',
      message: `空の見出しタグが${emptyHeadings.length}個あります`
    });
  }

  return issues;
}

export function buildHeadingTree(headings) {
  // ツリー構造の構築（ネストされた配列）
  const tree = [];
  const stack = [{ level: 0, children: tree }];

  headings.forEach(heading => {
    const node = { ...heading, children: [] };

    // 適切な親を見つける
    while (stack.length > 1 && stack[stack.length - 1].level >= heading.level) {
      stack.pop();
    }

    stack[stack.length - 1].children.push(node);
    stack.push(node);
  });

  return tree;
}
```

#### 2.2 リンク分析

**ファイル: `public/modules/link-analyzer.js`**

```javascript
export function analyzeLinks(doc, currentUrl) {
  const links = [];
  const anchorTags = doc.querySelectorAll('a[href]');

  const currentDomain = new URL(currentUrl).hostname;

  anchorTags.forEach(tag => {
    const href = tag.getAttribute('href');
    const text = tag.textContent.trim();
    const rel = tag.getAttribute('rel') || '';
    const target = tag.getAttribute('target') || '';

    let type = 'internal';
    let isValid = true;

    try {
      const linkUrl = new URL(href, currentUrl);
      if (linkUrl.hostname !== currentDomain) {
        type = 'external';
      }
    } catch (e) {
      if (href.startsWith('#') || href === '') {
        type = 'anchor';
        isValid = href !== '#' && href !== '';
      } else if (href.startsWith('mailto:') || href.startsWith('tel:')) {
        type = 'special';
      } else {
        isValid = false;
      }
    }

    links.push({
      href,
      text,
      type,
      isValid,
      rel,
      target,
      nofollow: rel.includes('nofollow'),
      sponsored: rel.includes('sponsored'),
      ugc: rel.includes('ugc')
    });
  });

  return links;
}

export function summarizeLinks(links) {
  return {
    total: links.length,
    internal: links.filter(l => l.type === 'internal').length,
    external: links.filter(l => l.type === 'external').length,
    nofollow: links.filter(l => l.nofollow).length,
    sponsored: links.filter(l => l.sponsored).length,
    broken: links.filter(l => !l.isValid).length
  };
}
```

#### 2.3 画像分析

**ファイル: `public/modules/image-analyzer.js`**

```javascript
export function analyzeImages(doc) {
  const images = [];
  const imgTags = doc.querySelectorAll('img');

  imgTags.forEach((tag, index) => {
    const src = tag.getAttribute('src') || '';
    const alt = tag.getAttribute('alt');
    const width = tag.getAttribute('width');
    const height = tag.getAttribute('height');
    const loading = tag.getAttribute('loading');

    let format = 'unknown';
    try {
      const url = new URL(src, window.location.href);
      const pathname = url.pathname.toLowerCase();
      if (pathname.match(/\.(jpe?g)$/)) format = 'jpeg';
      else if (pathname.match(/\.png$/)) format = 'png';
      else if (pathname.match(/\.gif$/)) format = 'gif';
      else if (pathname.match(/\.webp$/)) format = 'webp';
      else if (pathname.match(/\.svg$/)) format = 'svg';
    } catch (e) {
      // invalid URL
    }

    images.push({
      src,
      alt,
      hasAlt: alt !== null && alt !== undefined,
      altLength: alt ? alt.length : 0,
      width,
      height,
      hasDimensions: width && height,
      loading,
      format,
      index
    });
  });

  return images;
}

export function summarizeImages(images) {
  const formatCount = {};
  images.forEach(img => {
    formatCount[img.format] = (formatCount[img.format] || 0) + 1;
  });

  return {
    total: images.length,
    withoutAlt: images.filter(i => !i.hasAlt).length,
    withoutDimensions: images.filter(i => !i.hasDimensions).length,
    withLazyLoading: images.filter(i => i.loading === 'lazy').length,
    formats: formatCount
  };
}
```

#### 2.4 UI実装

**ファイル: `public/modules/ui-renderer.js`** に追加:

```javascript
export function renderHeadingsTab(headings, issues, tree) {
  const headingsTab = document.getElementById('tab-headings');

  let issuesHtml = '';
  if (issues.length > 0) {
    issuesHtml = `
      <div class="issues-section">
        <h3>検出された問題</h3>
        ${issues.map(issue => `
          <div class="status-badge ${issue.type}">
            ${issue.type === 'error' ? '✗' : '⚠'} ${issue.message}
          </div>
        `).join('')}
      </div>
    `;
  }

  headingsTab.innerHTML = `
    <h2>見出し構造</h2>
    ${issuesHtml}
    <div class="heading-tree">
      ${renderHeadingTree(tree)}
    </div>
    <table class="meta-table">
      <thead>
        <tr>
          <th>レベル</th>
          <th>テキスト</th>
          <th>文字数</th>
        </tr>
      </thead>
      <tbody>
        ${headings.map(h => `
          <tr>
            <td><span class="heading-badge">H${h.level}</span></td>
            <td>${escapeHtml(h.text)}</td>
            <td>${h.length}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderHeadingTree(tree, indent = 0) {
  return tree.map(node => `
    <div class="heading-tree-node" style="margin-left: ${indent * 24}px;">
      <span class="heading-badge">H${node.level}</span>
      <span class="heading-text">${escapeHtml(node.text)}</span>
      <span class="heading-length">(${node.length}文字)</span>
      ${node.children && node.children.length > 0 ? renderHeadingTree(node.children, indent + 1) : ''}
    </div>
  `).join('');
}

export function renderLinksTab(links, summary) {
  const linksTab = document.getElementById('tab-links');

  linksTab.innerHTML = `
    <h2>リンク分析</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">総リンク数</div>
        <div class="stat-value">${summary.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">内部リンク</div>
        <div class="stat-value">${summary.internal}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">外部リンク</div>
        <div class="stat-value">${summary.external}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">nofollow</div>
        <div class="stat-value">${summary.nofollow}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">sponsored</div>
        <div class="stat-value">${summary.sponsored}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">壊れたリンク</div>
        <div class="stat-value ${summary.broken > 0 ? 'error' : ''}">${summary.broken}</div>
      </div>
    </div>

    <details>
      <summary style="cursor: pointer; font-size: 16px; font-weight: 600; margin: 24px 0 16px;">リンク一覧を表示</summary>
      <table class="meta-table">
        <thead>
          <tr>
            <th>URL</th>
            <th>アンカーテキスト</th>
            <th>種類</th>
            <th>属性</th>
          </tr>
        </thead>
        <tbody>
          ${links.slice(0, 100).map(link => `
            <tr>
              <td class="meta-value"><a href="${escapeHtml(link.href)}" target="_blank">${escapeHtml(link.href.substring(0, 80))}</a></td>
              <td>${escapeHtml(link.text.substring(0, 50))}</td>
              <td><span class="link-type ${link.type}">${link.type}</span></td>
              <td>
                ${link.nofollow ? '<span class="badge">nofollow</span>' : ''}
                ${link.sponsored ? '<span class="badge">sponsored</span>' : ''}
                ${link.target === '_blank' ? '<span class="badge">_blank</span>' : ''}
              </td>
            </tr>
          `).join('')}
          ${links.length > 100 ? `<tr><td colspan="4" style="text-align: center; color: #64748b;">...他${links.length - 100}件</td></tr>` : ''}
        </tbody>
      </table>
    </details>
  `;
}

export function renderImagesTab(images, summary) {
  const imagesTab = document.getElementById('tab-images');

  imagesTab.innerHTML = `
    <h2>画像分析</h2>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">総画像数</div>
        <div class="stat-value">${summary.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">alt属性なし</div>
        <div class="stat-value ${summary.withoutAlt > 0 ? 'error' : ''}">${summary.withoutAlt}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">寸法指定なし</div>
        <div class="stat-value ${summary.withoutDimensions > 0 ? 'warning' : ''}">${summary.withoutDimensions}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">lazy loading</div>
        <div class="stat-value">${summary.withLazyLoading}</div>
      </div>
    </div>

    ${summary.withoutAlt > 0 ? `
      <div class="issues-section">
        <h3>alt属性が設定されていない画像</h3>
        <div class="image-grid">
          ${images.filter(i => !i.hasAlt).slice(0, 20).map(img => `
            <div class="image-item">
              <img src="${escapeHtml(img.src)}" alt="No alt" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23ddd%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
              <div class="image-url">${escapeHtml(img.src.substring(0, 50))}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <h3>画像形式の分布</h3>
    <div class="format-chart">
      ${Object.entries(summary.formats).map(([format, count]) => `
        <div class="format-bar">
          <span class="format-label">${format}</span>
          <div class="format-progress">
            <div class="format-fill" style="width: ${(count / summary.total * 100).toFixed(1)}%"></div>
          </div>
          <span class="format-count">${count}</span>
        </div>
      `).join('')}
    </div>
  `;
}
```

**ファイル: `public/styles.css`** に追加:

```css
/* 統計グリッド */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.stat-card {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  text-align: center;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #1f2937;
}

.stat-value.error {
  color: #ef4444;
}

.stat-value.warning {
  color: #f59e0b;
}

/* 見出しツリー */
.heading-tree {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin: 16px 0;
  font-family: 'Monaco', 'Courier New', monospace;
}

.heading-tree-node {
  padding: 6px 0;
  line-height: 1.8;
}

.heading-badge {
  display: inline-block;
  background: #3b82f6;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  margin-right: 8px;
}

.heading-text {
  color: #1f2937;
}

.heading-length {
  color: #9ca3af;
  font-size: 13px;
  margin-left: 8px;
}

/* リンクタイプ */
.link-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.link-type.internal {
  background: #dbeafe;
  color: #1e40af;
}

.link-type.external {
  background: #fef3c7;
  color: #92400e;
}

.link-type.anchor {
  background: #e0e7ff;
  color: #3730a3;
}

.badge {
  display: inline-block;
  background: #f3f4f6;
  color: #4b5563;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  margin-right: 4px;
}

/* 画像グリッド */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.image-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.image-item img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  background: #f3f4f6;
}

.image-url {
  padding: 8px;
  font-size: 11px;
  color: #64748b;
  word-break: break-all;
}

/* 形式チャート */
.format-chart {
  margin-top: 16px;
}

.format-bar {
  display: grid;
  grid-template-columns: 80px 1fr 60px;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.format-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  text-transform: uppercase;
}

.format-progress {
  background: #e5e7eb;
  height: 24px;
  border-radius: 4px;
  overflow: hidden;
}

.format-fill {
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  height: 100%;
  transition: width 0.3s;
}

.format-count {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  text-align: right;
}
```

### 完了条件

- [ ] 見出し構造（H1-H6）の抽出・階層表示
- [ ] リンク分析（内部/外部/nofollow統計）
- [ ] 画像分析（alt属性チェック・形式統計）
- [ ] スコア計算への反映

**推定工数: 2-3日**

---

## Phase 3: UI強化とスコアリング（優先度: 中）

### 実装内容

- 総合SEOスコアの精緻化
- 問題検出アラートの強化
- エクスポート機能（JSON/CSV）
- レスポンシブデザイン最適化
- パフォーマンス最適化（Web Worker検討）

**推定工数: 2-3日**

---

## Phase 4: URL比較・差分検出機能（優先度: 中）

### 目標

2つのURLを比較し、SEO要素の差分を視覚的に表示する。求人ページの比較や、リニューアル前後の比較などに活用できる。

### 実装内容

#### 4.1 UI実装: 比較モード切り替え

**ファイル: `public/index.html`** に追加:

```html
<!-- 分析モード切り替え -->
<div class="mode-toggle" style="margin-bottom: 16px;">
  <button class="mode-button active" data-mode="single" onclick="switchMode('single')">
    単一URL分析
  </button>
  <button class="mode-button" data-mode="compare" onclick="switchMode('compare')">
    URL比較
  </button>
</div>

<!-- 単一URL入力（既存） -->
<div id="single-mode" class="input-mode">
  <div class="input-group">
    <input type="url" id="urlInput" placeholder="URLを入力してください" value="">
    <button id="fetchButton" onclick="fetchAndDisplay()">取得</button>
  </div>
</div>

<!-- 比較モード入力（新規） -->
<div id="compare-mode" class="input-mode" style="display: none;">
  <div class="compare-inputs">
    <div class="input-group">
      <label>URL 1:</label>
      <input type="url" id="url1Input" placeholder="比較元URL" value="">
      <button onclick="analyzeUrl(1)">分析</button>
    </div>
    <div class="input-group">
      <label>URL 2:</label>
      <input type="url" id="url2Input" placeholder="比較先URL" value="">
      <button onclick="analyzeUrl(2)">分析</button>
    </div>
  </div>
  <button id="compareButton" onclick="compareUrls()" class="compare-execute-button">
    比較を実行
  </button>
</div>
```

**スタイル追加: `public/styles.css`**

```css
/* モード切り替えボタン */
.mode-toggle {
  display: flex;
  gap: 8px;
  background: #f3f4f6;
  padding: 4px;
  border-radius: 8px;
  width: fit-content;
}

.mode-button {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.2s;
}

.mode-button.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* 比較モード入力 */
.compare-inputs {
  display: grid;
  gap: 12px;
  margin-bottom: 16px;
}

.compare-inputs .input-group {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  gap: 12px;
  align-items: center;
}

.compare-inputs label {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.compare-execute-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.compare-execute-button:hover {
  transform: translateY(-2px);
}

/* 比較結果表示 */
.diff-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
}

.diff-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
}

.diff-stat-item {
  text-align: center;
}

.diff-stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.diff-stat-value.same { color: #10b981; }
.diff-stat-value.changed { color: #f59e0b; }
.diff-stat-value.added { color: #3b82f6; }
.diff-stat-value.removed { color: #ef4444; }

.diff-stat-label {
  font-size: 13px;
  color: #64748b;
}

/* 比較テーブル */
.comparison-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
}

.comparison-table th,
.comparison-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.comparison-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
}

.comparison-table td.item-name {
  width: 200px;
  font-weight: 500;
  color: #1f2937;
}

.comparison-table td.value-cell {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 13px;
}

/* 差分ハイライト */
.diff-highlight {
  padding: 8px;
  border-radius: 4px;
  margin: 4px 0;
}

.diff-highlight.same {
  background: #d1fae5;
  color: #065f46;
}

.diff-highlight.changed {
  background: #fef3c7;
  color: #92400e;
}

.diff-highlight.added {
  background: #dbeafe;
  color: #1e40af;
}

.diff-highlight.removed {
  background: #fee2e2;
  color: #991b1b;
}

.diff-icon {
  margin-right: 6px;
  font-weight: bold;
}

/* 求人比較モード */
.job-comparison-card {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.job-details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 16px;
}

.job-detail-item {
  background: rgba(255, 255, 255, 0.2);
  padding: 12px;
  border-radius: 8px;
}

.job-diff-list {
  margin-top: 16px;
  padding-left: 20px;
}

.job-diff-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}
```

#### 4.2 差分検出モジュール

**ファイル: `public/modules/diff-detector.js`**

```javascript
/**
 * 2つの分析データを比較し、差分を検出する
 */
export function detectDiff(data1, data2) {
  return {
    meta: diffMeta(data1.basic, data2.basic),
    og: diffObject(data1.og, data2.og),
    twitter: diffObject(data1.twitter, data2.twitter),
    jsonLd: diffJsonLd(data1.jsonLdSchemas, data2.jsonLdSchemas),
    headings: diffHeadings(data1.headings, data2.headings),
    links: diffLinks(data1.links, data2.links),
    images: diffImages(data1.images, data2.images),
    score: diffScore(data1.score, data2.score)
  };
}

/**
 * メタタグの差分検出
 */
function diffMeta(meta1, meta2) {
  const fields = ['title', 'description', 'canonical', 'robots', 'viewport'];
  const diff = [];

  fields.forEach(field => {
    const val1 = meta1[field] || '';
    const val2 = meta2[field] || '';

    if (val1 === val2) {
      diff.push({ field, status: 'same', value1: val1, value2: val2 });
    } else if (val1 && !val2) {
      diff.push({ field, status: 'removed', value1: val1, value2: null });
    } else if (!val1 && val2) {
      diff.push({ field, status: 'added', value1: null, value2: val2 });
    } else {
      diff.push({ field, status: 'changed', value1: val1, value2: val2 });
    }
  });

  return diff;
}

/**
 * オブジェクトの差分検出（OG/Twitterタグ用）
 */
function diffObject(obj1, obj2) {
  const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  const diff = [];

  allKeys.forEach(key => {
    const val1 = obj1[key];
    const val2 = obj2[key];

    if (val1 === val2) {
      diff.push({ field: key, status: 'same', value1: val1, value2: val2 });
    } else if (val1 && !val2) {
      diff.push({ field: key, status: 'removed', value1: val1, value2: null });
    } else if (!val1 && val2) {
      diff.push({ field: key, status: 'added', value1: null, value2: val2 });
    } else {
      diff.push({ field: key, status: 'changed', value1: val1, value2: val2 });
    }
  });

  return diff;
}

/**
 * JSON-LDスキーマの差分検出
 */
function diffJsonLd(schemas1, schemas2) {
  const types1 = schemas1.map(s => s['@type']).filter(Boolean);
  const types2 = schemas2.map(s => s['@type']).filter(Boolean);

  const diff = {
    schemas1: schemas1.length,
    schemas2: schemas2.length,
    typesAdded: types2.filter(t => !types1.includes(t)),
    typesRemoved: types1.filter(t => !types2.includes(t)),
    details: []
  };

  // スキーマごとの詳細差分（JobPostingなど）
  schemas1.forEach((schema1, i) => {
    const schema2 = schemas2[i];
    if (schema2 && schema1['@type'] === schema2['@type']) {
      const schemaDiff = diffSchemaProperties(schema1, schema2);
      if (schemaDiff.length > 0) {
        diff.details.push({
          type: schema1['@type'],
          properties: schemaDiff
        });
      }
    }
  });

  return diff;
}

/**
 * スキーマプロパティの差分検出
 */
function diffSchemaProperties(schema1, schema2, path = '') {
  const diff = [];
  const allKeys = new Set([...Object.keys(schema1), ...Object.keys(schema2)]);

  allKeys.forEach(key => {
    if (key === '@context' || key === '@type') return; // スキップ

    const val1 = schema1[key];
    const val2 = schema2[key];
    const fullPath = path ? `${path}.${key}` : key;

    if (typeof val1 === 'object' && typeof val2 === 'object' && val1 && val2) {
      // ネストされたオブジェクトの場合は再帰
      diff.push(...diffSchemaProperties(val1, val2, fullPath));
    } else if (val1 !== val2) {
      if (val1 && !val2) {
        diff.push({ property: fullPath, status: 'removed', value1: val1, value2: null });
      } else if (!val1 && val2) {
        diff.push({ property: fullPath, status: 'added', value1: null, value2: val2 });
      } else {
        diff.push({ property: fullPath, status: 'changed', value1: val1, value2: val2 });
      }
    }
  });

  return diff;
}

/**
 * 見出し構造の差分検出
 */
function diffHeadings(headings1, headings2) {
  // 見出しテキストの差分
  const texts1 = headings1.map(h => h.text);
  const texts2 = headings2.map(h => h.text);

  return {
    count1: headings1.length,
    count2: headings2.length,
    added: texts2.filter(t => !texts1.includes(t)),
    removed: texts1.filter(t => !texts2.includes(t))
  };
}

/**
 * リンクの差分検出
 */
function diffLinks(links1, links2) {
  const hrefs1 = links1.map(l => l.href);
  const hrefs2 = links2.map(l => l.href);

  return {
    total1: links1.length,
    total2: links2.length,
    added: hrefs2.filter(h => !hrefs1.includes(h)).length,
    removed: hrefs1.filter(h => !hrefs2.includes(h)).length
  };
}

/**
 * 画像の差分検出
 */
function diffImages(images1, images2) {
  const srcs1 = images1.map(i => i.src);
  const srcs2 = images2.map(i => i.src);

  return {
    total1: images1.length,
    total2: images2.length,
    added: srcs2.filter(s => !srcs1.includes(s)).length,
    removed: srcs1.filter(s => !srcs2.includes(s)).length
  };
}

/**
 * スコアの差分計算
 */
function diffScore(score1, score2) {
  return {
    total: score2.total - score1.total,
    meta: score2.meta - score1.meta,
    sns: score2.sns - score1.sns,
    schema: score2.schema - score1.schema
  };
}

/**
 * 求人特化の差分検出
 */
export function detectJobDiff(schema1, schema2) {
  if (!schema1 || !schema2 || schema1['@type'] !== 'JobPosting' || schema2['@type'] !== 'JobPosting') {
    return null;
  }

  const jobFields = [
    'title',
    'baseSalary',
    'jobLocation',
    'employmentType',
    'skills',
    'experienceRequirements',
    'educationRequirements',
    'validThrough',
    'hiringOrganization'
  ];

  const diff = {};

  jobFields.forEach(field => {
    const val1 = getNestedValue(schema1, field);
    const val2 = getNestedValue(schema2, field);

    if (val1 !== val2) {
      diff[field] = { from: val1, to: val2 };
    }
  });

  return diff;
}

function getNestedValue(obj, path) {
  if (typeof obj !== 'object' || !obj) return null;

  // baseSalary.value のようなネストされたパスに対応
  const keys = path.split('.');
  let value = obj;

  for (const key of keys) {
    if (value && typeof value === 'object') {
      value = value[key];
    } else {
      return null;
    }
  }

  // オブジェクトの場合は文字列化
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return value;
}
```

#### 4.3 比較UI描画モジュール

**ファイル: `public/modules/comparison-renderer.js`**

```javascript
export function renderComparisonResult(diff, data1, data2) {
  const resultsContainer = document.getElementById('results');

  // 差分サマリー
  const summary = calculateDiffSummary(diff);

  resultsContainer.innerHTML = `
    <div class="diff-summary">
      <h2>比較結果サマリー</h2>
      <div class="diff-stats">
        <div class="diff-stat-item">
          <div class="diff-stat-value same">${summary.same}</div>
          <div class="diff-stat-label">同一項目</div>
        </div>
        <div class="diff-stat-item">
          <div class="diff-stat-value changed">${summary.changed}</div>
          <div class="diff-stat-label">変更項目</div>
        </div>
        <div class="diff-stat-item">
          <div class="diff-stat-value added">${summary.added}</div>
          <div class="diff-stat-label">追加項目</div>
        </div>
        <div class="diff-stat-item">
          <div class="diff-stat-value removed">${summary.removed}</div>
          <div class="diff-stat-label">削除項目</div>
        </div>
      </div>
    </div>

    ${renderJobComparison(data1, data2)}

    <h2>詳細比較</h2>

    <!-- メタタグ比較 -->
    <section style="margin-bottom: 32px;">
      <h3>基本メタタグ</h3>
      ${renderMetaComparison(diff.meta)}
    </section>

    <!-- OGタグ比較 -->
    <section style="margin-bottom: 32px;">
      <h3>Open Graphタグ</h3>
      ${renderOGComparison(diff.og)}
    </section>

    <!-- JSON-LD比較 -->
    <section style="margin-bottom: 32px;">
      <h3>構造化データ（JSON-LD）</h3>
      ${renderJsonLdComparison(diff.jsonLd)}
    </section>

    <!-- スコア比較 -->
    <section>
      <h3>SEOスコア</h3>
      ${renderScoreComparison(diff.score, data1.score, data2.score)}
    </section>
  `;

  resultsContainer.classList.add('active');
}

function calculateDiffSummary(diff) {
  let same = 0, changed = 0, added = 0, removed = 0;

  // メタタグの差分をカウント
  diff.meta.forEach(item => {
    if (item.status === 'same') same++;
    else if (item.status === 'changed') changed++;
    else if (item.status === 'added') added++;
    else if (item.status === 'removed') removed++;
  });

  // OG/Twitterタグも同様にカウント
  diff.og.forEach(item => {
    if (item.status === 'same') same++;
    else if (item.status === 'changed') changed++;
    else if (item.status === 'added') added++;
    else if (item.status === 'removed') removed++;
  });

  return { same, changed, added, removed };
}

function renderMetaComparison(metaDiff) {
  return `
    <table class="comparison-table">
      <thead>
        <tr>
          <th>項目</th>
          <th>URL 1</th>
          <th>URL 2</th>
          <th>差分</th>
        </tr>
      </thead>
      <tbody>
        ${metaDiff.map(item => `
          <tr>
            <td class="item-name">${item.field}</td>
            <td class="value-cell">${escapeHtml(item.value1 || '-')}</td>
            <td class="value-cell">${escapeHtml(item.value2 || '-')}</td>
            <td>${renderDiffStatus(item.status)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderDiffStatus(status) {
  const icons = {
    same: '✓',
    changed: '🔄',
    added: '➕',
    removed: '➖'
  };

  const labels = {
    same: '同一',
    changed: '変更',
    added: '追加',
    removed: '削除'
  };

  return `
    <div class="diff-highlight ${status}">
      <span class="diff-icon">${icons[status]}</span>
      ${labels[status]}
    </div>
  `;
}

function renderJobComparison(data1, data2) {
  // JobPostingスキーマを探す
  const job1 = data1.jsonLdSchemas?.find(s => s['@type'] === 'JobPosting');
  const job2 = data2.jsonLdSchemas?.find(s => s['@type'] === 'JobPosting');

  if (!job1 || !job2) return '';

  return `
    <div class="job-comparison-card">
      <h2>求人比較モード</h2>
      <div class="job-details-grid">
        <div>
          <h4>URL 1: ${escapeHtml(job1.title || '')}</h4>
          <p>給与: ${formatSalary(job1.baseSalary)}</p>
          <p>勤務地: ${formatLocation(job1.jobLocation)}</p>
          <p>雇用形態: ${escapeHtml(job1.employmentType || '-')}</p>
        </div>
        <div>
          <h4>URL 2: ${escapeHtml(job2.title || '')}</h4>
          <p>給与: ${formatSalary(job2.baseSalary)}</p>
          <p>勤務地: ${formatLocation(job2.jobLocation)}</p>
          <p>雇用形態: ${escapeHtml(job2.employmentType || '-')}</p>
        </div>
      </div>
      ${renderJobDiffList(job1, job2)}
    </div>
  `;
}

function renderJobDiffList(job1, job2) {
  const diffs = [];

  if (job1.title !== job2.title) {
    diffs.push(`職種: ${job1.title} → ${job2.title}`);
  }

  const salary1 = formatSalary(job1.baseSalary);
  const salary2 = formatSalary(job2.baseSalary);
  if (salary1 !== salary2) {
    diffs.push(`給与: ${salary1} → ${salary2}`);
  }

  if (diffs.length === 0) return '';

  return `
    <div>
      <h4 style="margin-top: 20px;">主な差分:</h4>
      <ul class="job-diff-list">
        ${diffs.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
      </ul>
    </div>
  `;
}

function formatSalary(baseSalary) {
  if (!baseSalary) return '-';
  if (typeof baseSalary === 'object' && baseSalary.value) {
    return `${baseSalary.value}${baseSalary.currency || ''}`;
  }
  return String(baseSalary);
}

function formatLocation(jobLocation) {
  if (!jobLocation) return '-';
  if (typeof jobLocation === 'object' && jobLocation.address) {
    const addr = jobLocation.address;
    return addr.addressLocality || addr.addressRegion || '-';
  }
  return String(jobLocation);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text || '').replace(/[&<>"']/g, m => map[m]);
}
```

#### 4.4 メインロジック統合

**ファイル: `public/app.js`** に追加:

```javascript
import { detectDiff } from './modules/diff-detector.js';
import { renderComparisonResult } from './modules/comparison-renderer.js';

// 比較用データ保存
let analysisData1 = null;
let analysisData2 = null;

// モード切り替え
window.switchMode = function(mode) {
  const singleMode = document.getElementById('single-mode');
  const compareMode = document.getElementById('compare-mode');
  const buttons = document.querySelectorAll('.mode-button');

  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });

  if (mode === 'single') {
    singleMode.style.display = 'block';
    compareMode.style.display = 'none';
  } else {
    singleMode.style.display = 'none';
    compareMode.style.display = 'block';
  }
};

// 個別URL分析（比較モード用）
window.analyzeUrl = async function(urlNumber) {
  const urlInput = document.getElementById(`url${urlNumber}Input`);
  const url = urlInput.value.trim();

  if (!url) {
    showError('URLを入力してください');
    return;
  }

  showLoading(true);

  try {
    // HTMLを取得し分析
    const html = await fetchHtml(url);
    const analysisData = await analyzeHtml(html, url);

    if (urlNumber === 1) {
      analysisData1 = analysisData;
      showMessage(`URL 1の分析が完了しました`, 'success');
    } else {
      analysisData2 = analysisData;
      showMessage(`URL 2の分析が完了しました`, 'success');
    }

  } catch (error) {
    showError(`URL ${urlNumber}の分析に失敗しました: ${error.message}`);
  } finally {
    showLoading(false);
  }
};

// 比較実行
window.compareUrls = function() {
  if (!analysisData1 || !analysisData2) {
    showError('両方のURLを分析してから比較を実行してください');
    return;
  }

  // 差分検出
  const diff = detectDiff(analysisData1, analysisData2);

  // 比較結果を描画
  renderComparisonResult(diff, analysisData1, analysisData2);
};
```

### 完了条件

- [ ] 比較モードUI実装（2URL入力）
- [ ] 差分検出アルゴリズム実装
- [ ] メタタグ・OG・Twitter・JSON-LDの差分表示
- [ ] 差分サマリー表示（同一/変更/追加/削除）
- [ ] 求人比較モード実装
- [ ] 差分ハイライト表示（色分け）
- [ ] エクスポート機能（JSON/CSV/Markdown）

**推定工数: 2-3日**

---

## Phase 5: 高度な機能（優先度: 低）

### 実装内容

- hreflang分析
- パフォーマンス指標（ページサイズ・リソース数）
- ヒストリー機能（過去の分析結果保存）
- 3つ以上のURL比較機能
- PDFレポート出力
- テキスト差分の詳細表示（diff-match-patch使用）

**推定工数: 3-5日**

---

## 技術的考慮事項

### パフォーマンス最適化

1. **大規模HTML処理**:
   - 1MB以上のHTMLはWeb Workerで処理
   - プログレスバー表示

2. **画像遅延読み込み**:
   - 画像一覧は`loading="lazy"`属性を使用
   - Intersection Observer APIで段階的に表示

3. **UIレンダリング最適化**:
   - Virtual Scrolling（1000件以上のリンク/画像表示時）
   - requestAnimationFrameで描画最適化

### セキュリティ

- すべてのユーザー入力値をエスケープ
- Content Security Policy (CSP) ヘッダー設定
- XSS対策の徹底

### アクセシビリティ

- ARIA属性の適切な使用
- キーボードナビゲーション対応
- スクリーンリーダー対応

---

## テスト計画

### Phase 1 テストケース

1. **メタタグ抽出テスト**
   - title/description/canonicalが正しく抽出されるか
   - 文字数カウントが正確か
   - 複数canonicalタグのエラー検出

2. **OGタグテスト**
   - 必須タグの欠落検出
   - 画像プレビュー表示
   - SNSシミュレーション表示

3. **Twitter Cardsテスト**
   - カードタイプの検証
   - 必須フィールドのチェック

4. **バリデーションテスト**
   - エラー/警告の正確な分類
   - ステータスバッジの表示

### テスト対象URL

- <https://freelance-hub.jp/project/detail/281563/>
- <https://developers.google.com/search/docs>
- <https://detailed.com/extension/>
- localhost開発サイト

---

## リリース計画

### Phase 1 リリース

- 機能テスト完了後、mainブランチにマージ
- Vercelに自動デプロイ
- README.mdを更新（新機能説明追加）

### Phase 2以降

- 各フェーズ完了ごとにリリース
- CHANGELOG.mdに変更履歴を記録

---

## 今後の拡張可能性

- Lighthouse統合（パフォーマンススコア）
- Google Search Console API連携
- SEOレコメンデーション機能
- 競合サイト比較機能
- Chrome拡張機能版の開発
- AI による SEO 改善提案

---

## まとめ

このSEO分析ツールは、現在のJSON-LDビューアをベースに、段階的に機能を追加していきます。

**Phase 1（最優先）** で基本的なメタタグ・SNSタグ分析を実装し、すぐに実用的なツールとして使用可能になります。

その後、**Phase 2**で見出し・リンク・画像分析を追加し、より包括的なSEO評価を提供します。

各フェーズは独立して動作するため、段階的なリリースが可能です。
