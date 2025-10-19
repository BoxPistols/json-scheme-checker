/**
 * UI描画モジュール
 * 分析結果をHTMLとして描画する
 */

/**
 * サマリーカードを描画
 * @param {Object} analysisData - 分析データ
 * @param {number} score - 総合スコア
 * @param {Object} schemaGuidance - スキーマガイダンス情報（オプション）
 * @param {Array} schemaAnalysis - スキーマ詳細分析結果（オプション）
 */
export function renderSummaryCard(analysisData, score, schemaGuidance = null, schemaAnalysis = null) {
  const summaryCard = document.getElementById('summaryCard');

  // スキーマの致命的欠損を判定
  let schemaSeverity = 'success';
  if (schemaAnalysis && schemaAnalysis.length > 0) {
    if (schemaAnalysis.some(a => a.severity === 'error')) {
      schemaSeverity = 'error';
    } else if (schemaAnalysis.some(a => a.severity === 'warning')) {
      schemaSeverity = 'warning';
    }
  }

  // Score Card の背景色を決定
  let schemaCardClass = '';
  let schemaCardStyle = '';
  if (schemaSeverity === 'error') {
    schemaCardStyle = 'background-color: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3);';
    schemaCardClass = 'score-card-alert--error';
  } else if (schemaSeverity === 'warning') {
    schemaCardStyle = 'background-color: rgba(251, 146, 60, 0.08); border: 1px solid rgba(251, 146, 60, 0.3);';
    schemaCardClass = 'score-card-alert--warning';
  }

  // スキーマスコアが満点でない場合、改善提案を表示
  let suggestionHtml = '';
  if (analysisData.scores.schema < 20 && schemaGuidance && schemaGuidance.recommendations.length > 0) {
    const topRecommendation = schemaGuidance.recommendations[0];
    suggestionHtml = `
      <div style="margin-top: 8px; padding: 8px; background: rgba(59, 130, 246, 0.05); border: 1px solid #3b82f6; border-radius: 2px;">
        <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-bottom: 2px;">サジェスト</div>
        <div style="font-size: 0.8125rem; color: var(--text-color); font-weight: 500; line-height: 1.4;">
          ${escapeHtml(topRecommendation.title)}: ${escapeHtml(topRecommendation.description.substring(0, 60))}…
        </div>
      </div>
    `;
  }

  // スキーマの不足プロパティを表示
  let schemaDetailsHtml = '';
  if (analysisData.schemaDetails && analysisData.schemaDetails.missingMainProperties.length > 0) {
    const missingProps = analysisData.schemaDetails.missingMainProperties;
    schemaDetailsHtml = `
      <div style="margin-top: 8px; padding: 8px; background: rgba(239, 68, 68, 0.05); border: 1px solid #fca5a5; border-radius: 2px;">
        <div style="font-size: 0.75rem; color: var(--secondary-text-color); margin-bottom: 4px;">不足している主要プロパティ</div>
        <div style="font-size: 0.8125rem; color: var(--text-color); line-height: 1.4;">
          ${missingProps.map(prop => `<div>・ <strong>${escapeHtml(prop)}</strong></div>`).join('')}
        </div>
      </div>
    `;
  }

  // 致命的欠損の警告メッセージ
  let criticalWarningHtml = '';
  if (schemaSeverity === 'error') {
    criticalWarningHtml = `
      <div style="margin-top: 12px; padding: 12px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 4px; color: var(--text-color);">
        <div style="font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 1rem;">!</span> 致命的な構造化データの欠損が検出されました
        </div>
        <div style="font-size: 0.8125rem; line-height: 1.5;">
          スキーマに必須プロパティが不足しています。検索エンジンでの表示が正しく行われない可能性があります。
          <br><a href="#" onclick="document.querySelector('[data-tab=tab-develop]')?.click(); return false;" style="color: #ef4444; text-decoration: underline;">詳細は Develop タブを確認</a>
        </div>
      </div>
    `;
  } else if (schemaSeverity === 'warning') {
    criticalWarningHtml = `
      <div style="margin-top: 12px; padding: 12px; background: rgba(251, 146, 60, 0.1); border: 1px solid rgba(251, 146, 60, 0.4); border-radius: 4px; color: var(--text-color);">
        <div style="font-weight: bold; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 1rem;">!</span> 推奨プロパティが不足しています
        </div>
        <div style="font-size: 0.8125rem; line-height: 1.5;">
          SEO効果を最大化するため、推奨プロパティの追加をお勧めします。
          <br><a href="#" onclick="document.querySelector('[data-tab=tab-develop]')?.click(); return false;" style="color: #f97316; text-decoration: underline;">詳細は Develop タブを確認</a>
        </div>
      </div>
    `;
  }

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
        <div style="${schemaCardStyle}; border-radius: 4px; padding: 8px;">
          <div class="score-label">構造化データ</div>
          <div class="score-value">${analysisData.scores.schema}/20</div>
        </div>
      </div>
      ${criticalWarningHtml}
      ${suggestionHtml}
      ${schemaDetailsHtml}
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
          <td class="meta-value">${escapeHtml(meta.title)} <span class="text-muted">(${meta.titleLength}文字)</span></td>
          <td>${getMetaStatus('title', meta, issues)}</td>
        </tr>
        <tr>
          <td>Description</td>
          <td class="meta-value">${escapeHtml(meta.description)} <span class="text-muted">(${meta.descriptionLength}文字)</span></td>
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

    <section class="section-bottom-spacing">
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
    return '<p class="text-muted">Open Graphタグが設定されていません</p>';
  }

  let domain = '';
  if (og.url) {
    try {
      domain = new URL(og.url).hostname;
    } catch (e) {
      console.warn('Invalid OG URL:', og.url);
      domain = og.url; // フォールバック: URLをそのまま表示
    }
  }

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
            let status;

            if (value) {
              status = hasIssue
                ? '<span class="status-badge warning">⚠ 問題あり</span>'
                : '<span class="status-badge success">✓ 正常</span>';
            } else {
              // og:type は(ガイド)を付けない（Open Graph全体のModalを別途作成）
              if (key === 'type') {
                status = '<span class="status-badge error">✗ 未設定</span>';
              } else {
                status = '<span class="status-badge error" style="cursor: pointer;" onclick="showOpenGraphModal()" title="クリックして設定方法を確認">✗ 未設定 (ガイド)</span>';
              }
            }

            return `
            <tr>
              <td>og:${key}</td>
              <td class="meta-value">${key === 'image' && value ? `<img src="${escapeHtml(value)}" class="meta-image-preview"><a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
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
    return '<p class="text-muted">Twitter Cardタグが設定されていません</p>';
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
            let status;

            if (value) {
              status = hasIssue
                ? '<span class="status-badge error">✗ 問題あり</span>'
                : '<span class="status-badge success">✓ 正常</span>';
            } else if (isRequired) {
              status = '<span class="status-badge error" style="cursor: pointer;" onclick="showTwitterCardModal()" title="クリックして設定方法を確認">✗ 未設定 (ガイド)</span>';
            } else {
              status = '<span class="status-badge warning">- オプション</span>';
            }

            return `
            <tr>
              <td>twitter:${key}</td>
              <td class="meta-value">${key === 'image' && value ? `<img src="${escapeHtml(value)}" class="meta-image-preview"><a href="${escapeHtml(value)}" target="_blank">${escapeHtml(value)}</a>` : escapeHtml(value)}</td>
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
