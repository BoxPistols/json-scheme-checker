/**
 * UI描画モジュール
 * 分析結果をHTMLとして描画する
 */

/**
 * サマリーカードを描画
 * @param {Object} analysisData - 分析データ
 * @param {number} score - 総合スコア
 */
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

/**
 * メタタグタブを描画
 * @param {Object} meta - メタタグ情報
 * @param {Array} issues - 検出された問題のリスト
 */
export function renderMetaTab(meta, issues) {
  const metaTab = document.getElementById('tab-meta');

  let issuesHtml = '';
  if (issues.length > 0) {
    issuesHtml = `
      <div class="issues-section">
        <h3>検出された問題</h3>
        ${issues
          .map(
            issue => `
          <div class="status-badge ${issue.type}">
            ${issue.type === 'error' ? '✗' : '⚠'} ${issue.message}
          </div>
        `
          )
          .join('')}
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

/**
 * SNSタブを描画
 * @param {Object} og - Open Graphタグ情報
 * @param {Object} twitter - Twitter Cards情報
 * @param {Array} ogIssues - OGタグの問題リスト
 * @param {Array} twitterIssues - Twitterタグの問題リスト
 */
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

/**
 * Open Graphプレビューを描画（Facebook風）
 */
function renderOGPreview(og) {
  if (!og.title && !og.description && !og.image) {
    return '<p style="color: #64748b;">Open Graphタグが設定されていません</p>';
  }

  const domain = og.url ? new URL(og.url).hostname : '';

  return `
    <div class="preview-container">
      <div class="preview-label">Facebookプレビュー</div>
      <div class="og-preview">
        ${og.image ? `<div class="og-preview-image"><img src="${escapeHtml(og.image)}" alt="OG Image" onerror="this.style.display='none'"></div>` : ''}
        <div class="og-preview-content">
          <div class="og-preview-domain">${escapeHtml(domain)}</div>
          <div class="og-preview-title">${escapeHtml(og.title || '')}</div>
          <div class="og-preview-description">${escapeHtml(og.description || '')}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Open Graphテーブルを描画
 */
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
        ${required
          .map(key => {
            const value = og[key] || '';
            const hasIssue = issues.some(i => i.field === `og:${key}`);
            const status = value
              ? hasIssue
                ? '<span class="status-badge warning">⚠</span>'
                : '<span class="status-badge success">✓</span>'
              : '<span class="status-badge error">✗</span>';

            return `
            <tr>
              <td>og:${key}</td>
              <td class="meta-value">${key === 'image' && value ? `<img src="${escapeHtml(value)}" style="max-width: 100px; display: block; margin: 4px 0;"><a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
              <td>${status}</td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

/**
 * Twitter Cardsプレビューを描画
 */
function renderTwitterPreview(twitter) {
  if (!twitter.title && !twitter.description && !twitter.image) {
    return '<p style="color: #64748b;">Twitter Cardタグが設定されていません</p>';
  }

  const isSummaryLarge = twitter.card === 'summary_large_image';

  return `
    <div class="preview-container">
      <div class="preview-label">Twitterプレビュー (${twitter.card || 'summary'})</div>
      <div class="twitter-preview ${isSummaryLarge ? 'large' : ''}">
        ${twitter.image ? `<div class="twitter-preview-image"><img src="${escapeHtml(twitter.image)}" alt="Twitter Image" onerror="this.style.display='none'"></div>` : ''}
        <div class="twitter-preview-content">
          <div class="twitter-preview-title">${escapeHtml(twitter.title || '')}</div>
          <div class="twitter-preview-description">${escapeHtml(twitter.description || '')}</div>
          <div class="twitter-preview-domain">${escapeHtml(twitter.domain || '')}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Twitter Cardsテーブルを描画
 */
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
        ${fields
          .map(key => {
            const value = twitter[key] || '';
            const hasIssue = issues.some(i => i.field === `twitter:${key}`);
            const isRequired = ['card', 'title', 'description'].includes(key);
            const status = value
              ? hasIssue
                ? '<span class="status-badge error">✗</span>'
                : '<span class="status-badge success">✓</span>'
              : isRequired
                ? '<span class="status-badge error">✗</span>'
                : '<span class="status-badge warning">-</span>';

            return `
            <tr>
              <td>twitter:${key}</td>
              <td class="meta-value">${key === 'image' && value ? `<img src="${escapeHtml(value)}" style="max-width: 100px; display: block; margin: 4px 0;"><a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
              <td>${status}</td>
            </tr>
          `;
          })
          .join('')}
      </tbody>
    </table>
  `;
}

/**
 * メタタグのステータスバッジを取得
 */
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

/**
 * HTMLエスケープ
 */
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
