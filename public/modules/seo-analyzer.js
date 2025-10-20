// SEO分析モジュールをインポート
import { extractBasicMeta, validateBasicMeta } from './meta-extractor.js';
import { extractOpenGraph, validateOpenGraph } from './og-extractor.js';
import { extractTwitterCards, validateTwitterCards } from './twitter-extractor.js';
import { renderSummaryCard, renderMetaTab, renderSNSTab } from './ui-renderer.js';
import {
  getSchemaScoreGuidance,
  getMetaScoreGuidance,
  getSNSScoreGuidance,
  getOverallSEOSuggestions,
  getScoreColor,
} from './guidance-provider.js';
import { getSchemaRequirements, analyzeSchemaDetail } from './schema-requirements.js';

// HTMLエスケープ
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

// タブ切り替え機能
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

// SEO分析を実行
function analyzeSEO(html, schemas) {
  console.log('[analyzeSEO] Called with schemas:', schemas);
  console.log('[analyzeSEO] Schemas count:', schemas ? schemas.length : 0);

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const meta = extractBasicMeta(doc);
  const og = extractOpenGraph(doc);
  const twitter = extractTwitterCards(doc);

  const metaIssues = validateBasicMeta(meta);
  const ogIssues = validateOpenGraph(og);
  const twitterIssues = validateTwitterCards(twitter, og);

  const scores = calculateScores(meta, og, twitter, metaIssues, ogIssues, twitterIssues, schemas);
  console.log('[analyzeSEO] Calculated scores:', scores);
  // 各スコアを0-100にスケーリングして加算し、3で割って総合スコアを算出
  const normalizedMeta = (scores.meta / 25) * 100;
  const normalizedSns = (scores.sns / 15) * 100;
  const normalizedSchema = (scores.schema / 20) * 100;
  const totalScore = Math.round((normalizedMeta + normalizedSns + normalizedSchema) / 3);

  // ガイダンス情報を取得
  const analysisData = { meta, og, twitter, metaIssues, ogIssues, twitterIssues, scores };
  const schemaGuidance = getSchemaScoreGuidance(scores.schema, schemas);
  const metaGuidance = getMetaScoreGuidance(scores.meta, meta, metaIssues);
  const snsGuidance = getSNSScoreGuidance(scores.sns, og, twitter);
  const overallSuggestions = getOverallSEOSuggestions(totalScore, analysisData);

  return {
    analysisData,
    totalScore,
    guidance: {
      schema: schemaGuidance,
      meta: metaGuidance,
      sns: snsGuidance,
      overall: overallSuggestions,
    },
  };
}

// SEOスコアを計算
function calculateScores(meta, og, twitter, metaIssues, ogIssues, twitterIssues, schemas) {
  // メタタグスコア (25点満点)
  let metaScore = 25;
  const metaErrors = metaIssues.filter(i => i.type === 'error').length;
  const metaWarnings = metaIssues.filter(i => i.type === 'warning').length;
  metaScore -= metaErrors * 5;
  metaScore -= metaWarnings * 2;
  metaScore = Math.max(0, metaScore);

  // SNSスコア (15点満点) - Open Graphのみで判定
  let snsScore = 15;
  const ogRequired = ['title', 'description', 'image', 'url', 'type'];
  const ogMissing = ogRequired.filter(field => !og[field]).length;
  snsScore -= ogMissing * 1.5;
  snsScore = Math.max(0, snsScore);

  // 構造化データスコア - 詳細分析
  const schemaAnalysis = analyzeSchemas(schemas);

  return {
    meta: Math.round(metaScore),
    sns: Math.round(snsScore),
    schema: schemaAnalysis.score,
    schemaDetails: schemaAnalysis.details,
    schemaAnalysis: schemaAnalysis.fullAnalysis,
  };
}

/**
 * スキーマを詳細分析
 * @param {Array} schemas - スキーマ配列
 * @returns {Object} 分析結果
 */
function analyzeSchemas(schemas) {
  const fullAnalysis = [];
  let totalScore = 0;
  let totalMaxScore = 0;
  let hasCriticalError = false;
  const missingMainProperties = new Set();
  const recommendations = [];

  if (!schemas || schemas.length === 0) {
    return {
      score: 0,
      details: {
        hasType: false,
        missingMainProperties: [],
        recommendations: ['スキーマが設定されていません'],
      },
      fullAnalysis: [],
    };
  }

  schemas.forEach((schema, idx) => {
    let schemaType = schema['@type'];

    // @type が配列の場合、最初の要素を使用
    if (Array.isArray(schemaType)) {
      schemaType = schemaType[0];
    }

    const requirements = getSchemaRequirements(schemaType);

    // デバッグログ
    console.log(
      `[Schema Analysis] Type: ${schemaType}, Requirements found: ${requirements ? 'Yes' : 'No'}`
    );
    if (requirements) {
      console.log(
        `[Schema Analysis] Required properties: ${requirements.required.map(r => r.key).join(', ')}`
      );
    }

    const analysis = analyzeSchemaDetail(schema, requirements);
    console.log(
      `[Schema Analysis] Score: ${analysis.score}/${analysis.maxScore}, Severity: ${analysis.severity}`
    );

    fullAnalysis.push({
      index: idx + 1,
      type: schemaType || '不明なタイプ',
      ...analysis,
    });

    totalScore += analysis.score;
    totalMaxScore += analysis.maxScore;

    if (analysis.severity === 'error') {
      hasCriticalError = true;
      analysis.missingRequired.forEach(prop => missingMainProperties.add(prop));
    }

    if (analysis.message) {
      recommendations.push(`スキーマ ${idx + 1} (${schemaType}): ${analysis.message}`);
    }
  });

  // スコアを 0-20 の範囲に正規化
  let normalizedScore = 0;
  if (totalMaxScore > 0) {
    const percentage = totalScore / totalMaxScore;
    normalizedScore = Math.round(percentage * 20);
  }

  return {
    score: normalizedScore,
    details: {
      hasType: fullAnalysis.some(a => a.type && a.type !== '不明なタイプ'),
      missingMainProperties: Array.from(missingMainProperties),
      recommendations,
    },
    fullAnalysis,
  };
}

// 概要タブの内容を描画
function renderOverviewTab(analysisData, totalScore, guidance) {
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
                        <details class="issues-section" open>
                            <summary class="issues-header">
                                <h3 class="issues-title">検出された問題 (全${allIssues.length}件)</h3>
                            </summary>
                            <div class="issues-badges">
                                <span class="status-badge error">エラー: ${errorCount}件</span>
                                <span class="status-badge warning badge-spacing">警告: ${warningCount}件</span>
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
                            ${allIssues.length > 10 ? `<p class="text-muted-xsmall">他${allIssues.length - 10}件の問題があります。各タブで詳細を確認してください。</p>` : ''}
                        </details>
                    `;
  }

  // メタタグのステータスを取得する関数
  function getMetaStatus(field, meta, issues) {
    const hasIssue = issues.some(i => i.field === field);
    if (!meta[field]) {
      // Robots タグが未設定の場合、クリック可能なガイドリンクを表示
      if (field === 'robots') {
        return '<span class="status-badge error robots-guide-link" style="cursor: pointer;" title="クリックして設定方法を確認" role="button" tabindex="0">x 未設定 (ガイド)</span>';
      }
      return '<span class="status-badge error">x 未設定</span>';
    }
    if (hasIssue) {
      const issue = issues.find(i => i.field === field);
      return `<span class="status-badge ${issue.type}">! 問題あり</span>`;
    }
    return '<span class="status-badge success">○ 正常</span>';
  }

  const scoreColorClass =
    totalScore >= 80
      ? 'score-card-value--success'
      : totalScore >= 60
        ? 'score-card-value--warning'
        : 'score-card-value--danger';

  const schemaGuidanceHtml =
    guidance && guidance.schema
      ? `
      <div class="guidance-section guidance-${guidance.schema.level}">
        <h4>構造化データについて</h4>
        <p class="guidance-message">${escapeHtml(guidance.schema.message)}</p>
        <p class="guidance-impact"><strong>SEO影響度:</strong> ${escapeHtml(guidance.schema.seoImpact)}</p>
        <div class="guidance-details">
          ${guidance.schema.details.map(detail => `<p>・ ${escapeHtml(detail)}</p>`).join('')}
        </div>
      </div>
    `
      : '';

  overviewTab.innerHTML = `
                    <h2>概要・メタタグ</h2>
                    <div class="score-grid">
                        <div class="score-card">
                            <div class="score-card-label">総合スコア</div>
                            <div class="score-card-value score-card-value--large ${scoreColorClass}">${totalScore}/100</div>
                        </div>
                        <div class="score-card">
                            <div class="score-card-label">メタタグ</div>
                            <div class="score-card-value">${analysisData.scores.meta}/25</div>
                        </div>
                        <div class="score-card">
                            <div class="score-card-label">SNS最適化</div>
                            <div class="score-card-value">${analysisData.scores.sns}/15</div>
                        </div>
                        <div class="score-card">
                            <div class="score-card-label">構造化データ</div>
                            <div class="score-card-value">${analysisData.scores.schema}/20</div>
                        </div>
                    </div>
                    ${schemaGuidanceHtml}
                    ${issuesHtml}
                    <div class="section-spacing">
                        <h3>基本メタタグ</h3>
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
                                    <td class="meta-value">${escapeHtml(analysisData.meta.title)} <span class="meta-length">(${analysisData.meta.titleLength}文字)</span></td>
                                    <td>${getMetaStatus('title', analysisData.meta, analysisData.metaIssues)}</td>
                                </tr>
                                <tr>
                                    <td>Description</td>
                                    <td class="meta-value">${escapeHtml(analysisData.meta.description)} <span class="meta-length">(${analysisData.meta.descriptionLength}文字)</span></td>
                                    <td>${getMetaStatus('description', analysisData.meta, analysisData.metaIssues)}</td>
                                </tr>
                                <tr>
                                    <td>Canonical</td>
                                    <td class="meta-value">${analysisData.meta.canonical ? `<a href="${escapeHtml(analysisData.meta.canonical)}" target="_blank" class="link-primary">${escapeHtml(analysisData.meta.canonical)}</a>` : '未設定'}</td>
                                    <td>${getMetaStatus('canonical', analysisData.meta, analysisData.metaIssues)}</td>
                                </tr>
                                <tr>
                                    <td>Robots</td>
                                    <td class="meta-value">${escapeHtml(analysisData.meta.robots) || '未設定'}</td>
                                    <td>${getMetaStatus('robots', analysisData.meta, analysisData.metaIssues)}</td>
                                </tr>
                                <tr>
                                    <td>Viewport</td>
                                    <td class="meta-value">${escapeHtml(analysisData.meta.viewport) || '未設定'}</td>
                                    <td>${analysisData.meta.viewport ? '<span class="status-badge success">○ 設定済</span>' : '<span class="status-badge warning">! 未設定</span>'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
}

// HTML構造タブを描画
function renderHTMLTab(html) {
  const htmlTab = document.getElementById('tab-html');
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // HTML構造を解析
  const structure = {
    headTags: Array.from(doc.head.children).length,
    metaTags: doc.querySelectorAll('meta').length,
    linkTags: doc.querySelectorAll('link').length,
    scriptTags: doc.querySelectorAll('script').length,
    headings: {
      h1: Array.from(doc.querySelectorAll('h1')).map(el => el.textContent.trim()),
      h2: Array.from(doc.querySelectorAll('h2')).map(el => el.textContent.trim()),
      h3: Array.from(doc.querySelectorAll('h3')).map(el => el.textContent.trim()),
      h4: Array.from(doc.querySelectorAll('h4')).map(el => el.textContent.trim()),
      h5: Array.from(doc.querySelectorAll('h5')).map(el => el.textContent.trim()),
      h6: Array.from(doc.querySelectorAll('h6')).map(el => el.textContent.trim()),
    },
    images: doc.querySelectorAll('img').length,
    links: doc.querySelectorAll('a').length,
  };

  htmlTab.innerHTML = `
                    <h2>HTML構造</h2>
                    <div class="score-grid">
                        <div class="score-card">
                            <div class="score-card-label">Headタグ</div>
                            <div class="score-card-value">${structure.headTags}個</div>
                        </div>
                        <div class="score-card">
                            <div class="score-card-label">Metaタグ</div>
                            <div class="score-card-value">${structure.metaTags}個</div>
                        </div>
                        <div class="score-card">
                            <div class="score-card-label">Linkタグ</div>
                            <div class="score-card-value">${structure.linkTags}個</div>
                        </div>
                        <div class="score-card">
                            <div class="score-card-label">Scriptタグ</div>
                            <div class="score-card-value">${structure.scriptTags}個</div>
                        </div>
                    </div>

                    <div class="section-spacing">
                        <h3>見出しタグ</h3>
                        <table class="meta-table">
                            <thead>
                                <tr>
                                    <th class="table-col-narrow">タグ</th>
                                    <th class="table-col-narrow">数</th>
                                    <th>内容</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>H1</td>
                                    <td>${structure.headings.h1.length}個</td>
                                    <td class="meta-value">${structure.headings.h1.length > 0 ? structure.headings.h1.map(text => escapeHtml(text)).join('<br>') : '-'}</td>
                                </tr>
                                <tr>
                                    <td>H2</td>
                                    <td>${structure.headings.h2.length}個</td>
                                    <td class="meta-value">${
                                      structure.headings.h2.length > 0
                                        ? structure.headings.h2
                                            .slice(0, 5)
                                            .map(text => escapeHtml(text))
                                            .join('<br>') +
                                          (structure.headings.h2.length > 5
                                            ? `<br><span class="text-muted-small">...他${structure.headings.h2.length - 5}件</span>`
                                            : '')
                                        : '-'
                                    }</td>
                                </tr>
                                <tr>
                                    <td>H3</td>
                                    <td>${structure.headings.h3.length}個</td>
                                    <td class="meta-value">${
                                      structure.headings.h3.length > 0
                                        ? structure.headings.h3
                                            .slice(0, 5)
                                            .map(text => escapeHtml(text))
                                            .join('<br>') +
                                          (structure.headings.h3.length > 5
                                            ? `<br><span class="text-muted-small">...他${structure.headings.h3.length - 5}件</span>`
                                            : '')
                                        : '-'
                                    }</td>
                                </tr>
                                <tr>
                                    <td>H4</td>
                                    <td>${structure.headings.h4.length}個</td>
                                    <td class="meta-value">${
                                      structure.headings.h4.length > 0
                                        ? structure.headings.h4
                                            .slice(0, 3)
                                            .map(text => escapeHtml(text))
                                            .join('<br>') +
                                          (structure.headings.h4.length > 3
                                            ? `<br><span class="text-muted-small">...他${structure.headings.h4.length - 3}件</span>`
                                            : '')
                                        : '-'
                                    }</td>
                                </tr>
                                <tr>
                                    <td>H5</td>
                                    <td>${structure.headings.h5.length}個</td>
                                    <td class="meta-value">${
                                      structure.headings.h5.length > 0
                                        ? structure.headings.h5
                                            .slice(0, 3)
                                            .map(text => escapeHtml(text))
                                            .join('<br>') +
                                          (structure.headings.h5.length > 3
                                            ? `<br><span class="text-muted-small">...他${structure.headings.h5.length - 3}件</span>`
                                            : '')
                                        : '-'
                                    }</td>
                                </tr>
                                <tr>
                                    <td>H6</td>
                                    <td>${structure.headings.h6.length}個</td>
                                    <td class="meta-value">${
                                      structure.headings.h6.length > 0
                                        ? structure.headings.h6
                                            .slice(0, 3)
                                            .map(text => escapeHtml(text))
                                            .join('<br>') +
                                          (structure.headings.h6.length > 3
                                            ? `<br><span class="text-muted-small">...他${structure.headings.h6.length - 3}件</span>`
                                            : '')
                                        : '-'
                                    }</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="section-spacing">
                        <h3>その他の要素</h3>
                        <table class="meta-table">
                            <thead>
                                <tr>
                                    <th>要素</th>
                                    <th>数</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>画像 (img)</td>
                                    <td>${structure.images}個</td>
                                </tr>
                                <tr>
                                    <td>リンク (a)</td>
                                    <td>${structure.links}個</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `;
}

// SEO分析結果を表示
window.displaySEOAnalysis = function (html, schemas) {
  const { analysisData, totalScore, guidance } = analyzeSEO(html, schemas);
  renderSummaryCard(analysisData, totalScore, guidance.schema, analysisData.schemaAnalysis);
  renderSNSTab(
    analysisData.og,
    analysisData.twitter,
    analysisData.ogIssues,
    analysisData.twitterIssues
  );
  renderOverviewTab(analysisData, totalScore, guidance);
  renderHTMLTab(html);
  renderGuidanceTab(guidance);

  document.getElementById('seoSummarySection').classList.remove('section-hidden');
  document.getElementById('tabNavigation').classList.remove('section-hidden');
};

// Developタブを描画（詳細ログ）
function renderDevelopTab(schemaAnalysis, schemas) {
  const developTab = document.getElementById('tab-develop');
  if (!developTab) return;

  if (!schemaAnalysis || schemaAnalysis.length === 0) {
    developTab.innerHTML = '<h2>Develop</h2><p class="text-muted">スキーマが設定されていません</p>';
    return;
  }

  let analysisHtml = '';

  schemaAnalysis.forEach(analysis => {
    const checklist = analysis.checklist || [];
    const requiredItems = checklist.filter(item => item.level === 'required');
    const recommendedItems = checklist.filter(item => item.level === 'recommended');
    const optimizationItems = checklist.filter(item => item.level === 'optimization');

    const severityBadge =
      {
        error: '<span class="status-badge error">致命的欠損</span>',
        warning: '<span class="status-badge warning">推奨不足</span>',
        success: '<span class="status-badge success">完璧</span>',
        info: '<span class="status-badge info">部分対応</span>',
      }[analysis.severity] || '';

    const scorePercentage =
      analysis.maxScore > 0 ? Math.round((analysis.score / analysis.maxScore) * 100) : 0;

    analysisHtml += `
      <div class="develop-schema-section" style="margin-bottom: 24px; border: 1px solid var(--border-color); border-radius: 4px; padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div>
            <h3 style="margin: 0 0 4px 0;">スキーマ ${analysis.index}: ${escapeHtml(analysis.type)}</h3>
            <small style="color: var(--secondary-text-color);">Score: ${analysis.score}/${analysis.maxScore} (${scorePercentage}%)</small>
          </div>
          <div>${severityBadge}</div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: rgba(59, 130, 246, 0.05); border-radius: 4px; border-left: 3px solid #3b82f6;">
          <strong>${analysis.message}</strong>
        </div>

        ${
          requiredItems.length > 0
            ? `
          <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 0.9375rem;">必須プロパティ (各3点)</h4>
            <div style="display: grid; gap: 8px;">
              ${requiredItems
                .map(
                  item => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: ${item.present ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)'}; border-radius: 4px;">
                  <span style="font-weight: bold; width: 24px;">${item.present ? '✓' : '✗'}</span>
                  <div style="flex: 1;">
                    <strong>${escapeHtml(item.label)}</strong>
                    <div style="font-size: 0.8125rem; color: var(--secondary-text-color);">${escapeHtml(item.description)}</div>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--secondary-text-color);">${item.present ? '+3' : '-3'}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          recommendedItems.length > 0
            ? `
          <div style="margin-bottom: 16px;">
            <h4 style="margin: 0 0 8px 0; font-size: 0.9375rem;">推奨プロパティ (各2点)</h4>
            <div style="display: grid; gap: 8px;">
              ${recommendedItems
                .map(
                  item => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: ${item.present ? 'rgba(34, 197, 94, 0.05)' : 'rgba(156, 163, 175, 0.05)'}; border-radius: 4px;">
                  <span style="font-weight: bold; width: 24px;">${item.present ? '✓' : '◯'}</span>
                  <div style="flex: 1;">
                    <strong>${escapeHtml(item.label)}</strong>
                    <div style="font-size: 0.8125rem; color: var(--secondary-text-color);">${escapeHtml(item.description)}</div>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--secondary-text-color);">${item.present ? '+2' : '0'}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }

        ${
          optimizationItems.length > 0
            ? `
          <div>
            <h4 style="margin: 0 0 8px 0; font-size: 0.9375rem;">最適化プロパティ (各1点)</h4>
            <div style="display: grid; gap: 8px;">
              ${optimizationItems
                .map(
                  item => `
                <div style="display: flex; align-items: center; gap: 8px; padding: 8px; background: ${item.present ? 'rgba(34, 197, 94, 0.05)' : 'rgba(156, 163, 175, 0.05)'}; border-radius: 4px;">
                  <span style="font-weight: bold; width: 24px;">${item.present ? '✓' : '◯'}</span>
                  <div style="flex: 1;">
                    <strong>${escapeHtml(item.label)}</strong>
                    <div style="font-size: 0.8125rem; color: var(--secondary-text-color);">${escapeHtml(item.description)}</div>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--secondary-text-color);">${item.present ? '+1' : '0'}</span>
                </div>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>
    `;
  });

  developTab.innerHTML = `
    <h2>Develop - スキーマ詳細分析</h2>
    <div style="margin-bottom: 16px; padding: 12px; background: rgba(99, 102, 241, 0.05); border-radius: 4px; border-left: 3px solid #6366f1;">
      <p style="margin: 0; font-size: 0.9375rem;">
        このタブでは、各スキーマの詳細な分析結果を確認できます。
        <strong>必須</strong>プロパティが不足している場合、検索エンジンでの表示が正しく行われない可能性があります。
      </p>
    </div>
    <div>${analysisHtml}</div>
  `;
}

// ガイダンスタブを描画
function renderGuidanceTab(guidance) {
  const guidanceTab = document.getElementById('tab-guidance');
  if (!guidanceTab) return;

  let recommendationsHtml = '';
  const allRecommendations = [
    ...(guidance.meta?.recommendations || []),
    ...(guidance.schema?.recommendations || []),
    ...(guidance.sns?.recommendations || []),
  ];

  if (allRecommendations.length > 0) {
    recommendationsHtml = `
      <div class="section-spacing">
        <h3>改善提案</h3>
        <div class="recommendations-list">
          ${allRecommendations
            .map(
              rec => `
            <div class="recommendation-card recommendation-priority-${rec.priority}">
              <div class="recommendation-header">
                <span class="priority-badge">${rec.priority}</span>
                <h4>${escapeHtml(rec.title)}</h4>
              </div>
              <p class="recommendation-description">${escapeHtml(rec.description)}</p>
              <p class="recommendation-example"><strong>例:</strong> ${escapeHtml(rec.example)}</p>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  let tipsHtml = '';
  if (guidance.overall?.tips && guidance.overall.tips.length > 0) {
    tipsHtml = `
      <div class="section-spacing">
        <h3>SEO最適化のヒント</h3>
        <div class="tips-list">
          ${guidance.overall.tips.map(tip => `<p class="tip-item">・ ${escapeHtml(tip)}</p>`).join('')}
        </div>
      </div>
    `;
  }

  guidanceTab.innerHTML = `
    <h2>SEO改善ガイダンス</h2>

    <div class="section-spacing">
      <h3>スコア別の改善方針</h3>
      <div class="guidance-cards">
        <div class="guidance-score-card">
          <div class="guidance-score-category">メタタグ</div>
          <div class="guidance-score-value">${guidance.meta?.score || 0}/25</div>
          <p class="guidance-score-message">${escapeHtml(guidance.meta?.message || '')}</p>
          <p class="guidance-score-impact"><small>${escapeHtml(guidance.meta?.seoImpact || '')}</small></p>
        </div>

        <div class="guidance-score-card">
          <div class="guidance-score-category">SNS最適化</div>
          <div class="guidance-score-value">${guidance.sns?.score || 0}/15</div>
          <p class="guidance-score-message">${escapeHtml(guidance.sns?.message || '')}</p>
          <p class="guidance-score-impact"><small>${escapeHtml(guidance.sns?.seoImpact || '')}</small></p>
        </div>

        <div class="guidance-score-card">
          <div class="guidance-score-category">構造化データ</div>
          <div class="guidance-score-value">${guidance.schema?.score || 0}/20</div>
          <p class="guidance-score-message">${escapeHtml(guidance.schema?.message || '')}</p>
          <p class="guidance-score-impact"><small>${escapeHtml(guidance.schema?.seoImpact || '')}</small></p>
        </div>
      </div>
    </div>

    ${tipsHtml}
    ${recommendationsHtml}
  `;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();

  // 概要タブ内の動的要素のイベント委譲
  const overviewTab = document.getElementById('tab-overview');
  if (overviewTab) {
    overviewTab.addEventListener('click', e => {
      // Robotsガイドリンクのクリック
      if (e.target.classList.contains('robots-guide-link')) {
        if (typeof window.showRobotsModal === 'function') {
          window.showRobotsModal();
        }
      }
    });

    // キーボード操作対応（Enter/Spaceキー）
    overviewTab.addEventListener('keydown', e => {
      if (e.target.classList.contains('robots-guide-link')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof window.showRobotsModal === 'function') {
            window.showRobotsModal();
          }
        }
      }
    });
  }

  // サマリーカード内の動的要素のイベント委譲
  const summaryCard = document.getElementById('summaryCard');
  if (summaryCard) {
    summaryCard.addEventListener('click', e => {
      // Developタブリンクのクリック
      if (e.target.classList.contains('develop-tab-link')) {
        e.preventDefault();
        const developTabButton = document.querySelector('[data-tab="tab-develop"]');
        if (developTabButton) {
          developTabButton.click();
        }
      }
    });
  }

  // SNSタブ内の動的要素のイベント委譲
  const snsTab = document.getElementById('tab-sns');
  if (snsTab) {
    snsTab.addEventListener('click', e => {
      // Open Graphガイドリンクのクリック
      if (e.target.classList.contains('og-guide-link')) {
        if (typeof window.showOpenGraphModal === 'function') {
          window.showOpenGraphModal();
        }
      }
      // Twitter Cardガイドリンクのクリック
      else if (e.target.classList.contains('twitter-guide-link')) {
        if (typeof window.showTwitterCardModal === 'function') {
          window.showTwitterCardModal();
        }
      }
    });

    // キーボード操作対応（Enter/Spaceキー）
    snsTab.addEventListener('keydown', e => {
      if (e.target.classList.contains('og-guide-link')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof window.showOpenGraphModal === 'function') {
            window.showOpenGraphModal();
          }
        }
      } else if (e.target.classList.contains('twitter-guide-link')) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (typeof window.showTwitterCardModal === 'function') {
            window.showTwitterCardModal();
          }
        }
      }
    });
  }
});
