// SEO分析モジュールをインポート
import { extractBasicMeta, validateBasicMeta } from './meta-extractor.js';
import { extractOpenGraph, validateOpenGraph } from './og-extractor.js';
import { extractTwitterCards, validateTwitterCards } from './twitter-extractor.js';
import { renderSummaryCard, renderMetaTab, renderSNSTab } from './ui-renderer.js';

// HTMLエスケープ
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
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const meta = extractBasicMeta(doc);
    const og = extractOpenGraph(doc);
    const twitter = extractTwitterCards(doc);

    const metaIssues = validateBasicMeta(meta);
    const ogIssues = validateOpenGraph(og);
    const twitterIssues = validateTwitterCards(twitter, og);

    const scores = calculateScores(meta, og, twitter, metaIssues, ogIssues, twitterIssues, schemas);
    const totalScore = scores.meta + scores.sns + scores.schema;

    return {
        analysisData: { meta, og, twitter, metaIssues, ogIssues, twitterIssues, scores },
        totalScore,
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

    // 構造化データスコア (20点満点)
    let schemaScore = 0;
    if (!schemas || schemas.length === 0) {
        schemaScore = 0;
    } else {
        // 基本点: スキーマが存在する場合 10点
        schemaScore = 10;

        // スキーマの質を評価
        let qualityBonus = 0;
        schemas.forEach(schema => {
            // @typeが存在するか確認 (+2点/スキーマ、最大6点)
            if (schema['@type']) {
                qualityBonus += 2;
            }

            // 主要プロパティの存在確認 (+1点、最大4点)
            const hasMainProperties = ['name', 'description', 'url', 'image'].some(prop => schema[prop]);
            if (hasMainProperties) {
                qualityBonus += 1;
            }
        });

        // 質ボーナスは最大10点
        schemaScore += Math.min(10, qualityBonus);
    }
    schemaScore = Math.min(20, schemaScore);

    return {
        meta: Math.round(metaScore),
        sns: Math.round(snsScore),
        schema: schemaScore,
    };
}

// 概要タブの内容を描画
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
                        <details class="issues-section" open>
                            <summary class="issues-header">
                                <h3 class="issues-title">検出された問題 (全${allIssues.length}件)</h3>
                            </summary>
                            <div class="issues-badges">
                                <span class="status-badge error">エラー: ${errorCount}件</span>
                                <span class="status-badge warning badge-spacing">警告: ${warningCount}件</span>
                            </div>
                            ${allIssues.slice(0, 10).map(issue => `
                                <div class="status-badge ${issue.type}">
                                    ${issue.type === 'error' ? 'x' : '!'} ${issue.message}
                                </div>
                            `).join('')}
                            ${allIssues.length > 10 ? `<p class="text-muted-xsmall">他${allIssues.length - 10}件の問題があります。各タブで詳細を確認してください。</p>` : ''}
                        </details>
                    `;
    }

    // メタタグのステータスを取得する関数
    function getMetaStatus(field, meta, issues) {
        const hasIssue = issues.some(i => i.field === field);
        if (!meta[field]) {
            return '<span class="status-badge error">x 未設定</span>';
        }
        if (hasIssue) {
            const issue = issues.find(i => i.field === field);
            return `<span class="status-badge ${issue.type}">! 問題あり</span>`;
        }
        return '<span class="status-badge success">○ 正常</span>';
    }

    const scoreColorClass = totalScore >= 80 ? 'score-card-value--success' : totalScore >= 60 ? 'score-card-value--warning' : 'score-card-value--danger';

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
                                    <td class="meta-value">${structure.headings.h2.length > 0 ? structure.headings.h2.slice(0, 5).map(text => escapeHtml(text)).join('<br>') + (structure.headings.h2.length > 5 ? `<br><span class="text-muted-small">...他${structure.headings.h2.length - 5}件</span>` : '') : '-'}</td>
                                </tr>
                                <tr>
                                    <td>H3</td>
                                    <td>${structure.headings.h3.length}個</td>
                                    <td class="meta-value">${structure.headings.h3.length > 0 ? structure.headings.h3.slice(0, 5).map(text => escapeHtml(text)).join('<br>') + (structure.headings.h3.length > 5 ? `<br><span class="text-muted-small">...他${structure.headings.h3.length - 5}件</span>` : '') : '-'}</td>
                                </tr>
                                <tr>
                                    <td>H4</td>
                                    <td>${structure.headings.h4.length}個</td>
                                    <td class="meta-value">${structure.headings.h4.length > 0 ? structure.headings.h4.slice(0, 3).map(text => escapeHtml(text)).join('<br>') + (structure.headings.h4.length > 3 ? `<br><span class="text-muted-small">...他${structure.headings.h4.length - 3}件</span>` : '') : '-'}</td>
                                </tr>
                                <tr>
                                    <td>H5</td>
                                    <td>${structure.headings.h5.length}個</td>
                                    <td class="meta-value">${structure.headings.h5.length > 0 ? structure.headings.h5.slice(0, 3).map(text => escapeHtml(text)).join('<br>') + (structure.headings.h5.length > 3 ? `<br><span class="text-muted-small">...他${structure.headings.h5.length - 3}件</span>` : '') : '-'}</td>
                                </tr>
                                <tr>
                                    <td>H6</td>
                                    <td>${structure.headings.h6.length}個</td>
                                    <td class="meta-value">${structure.headings.h6.length > 0 ? structure.headings.h6.slice(0, 3).map(text => escapeHtml(text)).join('<br>') + (structure.headings.h6.length > 3 ? `<br><span class="text-muted-small">...他${structure.headings.h6.length - 3}件</span>` : '') : '-'}</td>
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
    const { analysisData, totalScore } = analyzeSEO(html, schemas);
    renderSummaryCard(analysisData, totalScore);
    renderSNSTab(analysisData.og, analysisData.twitter, analysisData.ogIssues, analysisData.twitterIssues);
    renderOverviewTab(analysisData, totalScore);
    renderHTMLTab(html);

    document.getElementById('seoSummarySection').classList.remove('section-hidden');
    document.getElementById('tabNavigation').classList.remove('section-hidden');
};

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initTabNavigation();
});
