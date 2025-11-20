/**
 * カードコンポーネントのストーリー
 */

export default {
  title: 'コンポーネント/カード',
  parameters: {
    layout: 'padded',
  },
};

// 基本カード
export const Basic = () => {
  const card = document.createElement('div');
  card.style.cssText = `
    background: var(--card-bg-color);
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--border-color);
    max-width: 400px;
  `;

  card.innerHTML = `
    <h3 style="margin: 0 0 12px 0; color: var(--text-color); font-size: 16px;">カードタイトル</h3>
    <p style="margin: 0; color: var(--secondary-text-color); font-size: 14px; line-height: 1.6;">
      これは基本的なカードコンポーネントです。背景、ボーダー、シャドウが適用されています。
    </p>
  `;

  return card;
};

// スキーマカード
export const SchemaCard = () => {
  const card = document.createElement('div');
  card.className = 'schema-card';

  card.innerHTML = `
    <div class="schema-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span class="schema-type">JobPosting</span>
        <span class="schema-index">Schema #1</span>
      </div>
      <div class="schema-controls">
        <div class="view-toggle">
          <button class="active">テーブル</button>
          <button>JSON</button>
        </div>
        <button class="copy-button">コピー</button>
      </div>
    </div>
    <div class="schema-content">
      <p style="color: var(--text-color); margin: 0;">スキーマの内容がここに表示されます</p>
    </div>
  `;

  return card;
};

SchemaCard.storyName = 'スキーマカード';

// 統計カード
export const StatsCard = () => {
  const card = document.createElement('div');
  card.className = 'stats';

  card.innerHTML = `
    <div class="stat-item">
      <span class="stat-label">検出スキーマ数</span>
      <span class="stat-value">3</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">スキーマタイプ</span>
      <span class="stat-value">JobPosting, Organization</span>
    </div>
  `;

  return card;
};

StatsCard.storyName = '統計カード';

// 機能カード（ガイドモーダル内）
export const FeatureCard = () => {
  const container = document.createElement('div');
  container.className = 'feature-cards';
  container.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;';

  const features = [
    {
      title: 'Schema Viewer',
      description: 'JSON-LD構造化データの抽出・可視化。テーブル形式とJSON形式で見やすく表示。',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M9 3v18"/>
        <path d="M3 9h18"/>
      </svg>`,
      className: 'feature-card--primary',
    },
    {
      title: 'AI分析',
      description: '求人票の最適化、ブログ記事のレビュー、WebページのSEO/EEAT分析をAIが支援。',
      icon: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>`,
      className: 'feature-card--secondary',
    },
  ];

  features.forEach(({ title, description, icon, className }) => {
    const card = document.createElement('div');
    card.className = `feature-card ${className}`;

    card.innerHTML = `
      <div class="feature-card-icon">${icon}</div>
      <h4>${title}</h4>
      <p>${description}</p>
    `;

    container.appendChild(card);
  });

  return container;
};

FeatureCard.storyName = '機能カード';

// モーダル情報ボックス
export const InfoBox = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 16px; max-width: 600px;';

  const variants = [
    { color: 'blue', title: '情報', text: 'これは情報メッセージです。' },
    { color: 'green', title: '成功', text: 'これは成功メッセージです。' },
    { color: 'yellow', title: '警告', text: 'これは警告メッセージです。' },
    { color: 'red', title: 'エラー', text: 'これはエラーメッセージです。' },
  ];

  variants.forEach(({ color, title, text }) => {
    const box = document.createElement('div');
    box.className = `modal-info-box modal-info-box--${color}`;

    box.innerHTML = `
      <h4>${title}</h4>
      <p>${text}</p>
    `;

    container.appendChild(box);
  });

  return container;
};

InfoBox.storyName = '情報ボックス';
