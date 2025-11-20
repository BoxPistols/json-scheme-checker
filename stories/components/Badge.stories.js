/**
 * バッジ・ピルコンポーネントのストーリー
 */

export default {
  title: 'コンポーネント/バッジ',
  parameters: {
    layout: 'centered',
  },
};

// スキーマタイプバッジ
export const SchemaType = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; gap: 12px; flex-wrap: wrap;';

  const types = ['JobPosting', 'Article', 'Organization', 'WebPage', 'BreadcrumbList'];

  types.forEach(type => {
    const badge = document.createElement('span');
    badge.className = 'schema-type';
    badge.textContent = type;
    container.appendChild(badge);
  });

  return container;
};

SchemaType.storyName = 'スキーマタイプバッジ';

// ドキュメントピル
export const DocPill = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; gap: 12px; flex-wrap: wrap;';

  const links = [
    { label: 'Google Doc', icon: 'G' },
    { label: 'Schema.org', icon: 'S' },
    { label: 'JobPost', icon: 'J' },
  ];

  links.forEach(({ label }) => {
    const pill = document.createElement('a');
    pill.className = 'doc-pill';
    pill.href = '#';
    pill.innerHTML = `
      <svg class="icon-inline" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      ${label}
    `;
    container.appendChild(pill);
  });

  return container;
};

DocPill.storyName = 'ドキュメントピル';

// APIステータスチップ
export const APIStatusChip = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; gap: 12px; flex-wrap: wrap; align-items: center;';

  // モデル表示
  const modelChip = document.createElement('span');
  modelChip.className = 'api-status-chip';
  modelChip.innerHTML = `
    <span class="api-status-label">Model:</span>
    <span>gpt-5-nano</span>
  `;

  // 使用回数表示
  const usageChip = document.createElement('span');
  usageChip.className = 'api-status-chip';
  usageChip.textContent = '25 / 50';

  container.appendChild(modelChip);
  container.appendChild(usageChip);

  return container;
};

APIStatusChip.storyName = 'APIステータスチップ';

// ベータバッジ
export const BetaBadge = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; gap: 12px; align-items: center;';

  const badge = document.createElement('span');
  badge.className = 'badge-beta';
  badge.textContent = 'Beta';

  const button = document.createElement('button');
  button.className = 'btn-content-upload-subtle';
  button.innerHTML = `
    コンテンツをアップロード
    <span class="badge-beta">Beta</span>
  `;

  container.appendChild(badge);
  container.appendChild(button);

  return container;
};

BetaBadge.storyName = 'ベータバッジ';

// サーバーステータス
export const ServerStatus = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

  const statuses = [
    { text: 'Checking...', color: '#f59e0b' },
    { text: 'Online', color: '#10b981' },
    { text: 'Offline', color: '#ef4444' },
  ];

  statuses.forEach(({ text, color }) => {
    const status = document.createElement('span');
    status.className = 'server-status';
    status.textContent = text;
    status.style.color = color;
    container.appendChild(status);
  });

  return container;
};

ServerStatus.storyName = 'サーバーステータス';

// プロパティタイプバッジ
export const PropertyType = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';

  const types = ['string', 'number', 'boolean', 'object', 'array', 'null'];

  types.forEach(type => {
    const badge = document.createElement('span');
    badge.className = 'property-type';
    badge.textContent = type;
    container.appendChild(badge);
  });

  return container;
};

PropertyType.storyName = 'プロパティタイプバッジ';

// 全バッジバリエーション
export const AllVariants = () => {
  const container = document.createElement('div');
  container.style.cssText = 'display: flex; flex-direction: column; gap: 24px; padding: 20px;';

  // セクションヘッダー関数
  const createSection = (title, content) => {
    const section = document.createElement('div');
    const heading = document.createElement('h3');
    heading.textContent = title;
    heading.style.cssText = 'margin: 0 0 12px 0; color: var(--text-color); font-size: 14px;';
    section.appendChild(heading);
    section.appendChild(content);
    return section;
  };

  // スキーマタイプ
  const schemaTypes = document.createElement('div');
  schemaTypes.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
  ['JobPosting', 'Article', 'Organization'].forEach(type => {
    const badge = document.createElement('span');
    badge.className = 'schema-type';
    badge.textContent = type;
    schemaTypes.appendChild(badge);
  });

  // APIステータス
  const apiStatus = document.createElement('div');
  apiStatus.style.cssText = 'display: flex; gap: 12px;';
  const modelChip = document.createElement('span');
  modelChip.className = 'api-status-chip';
  modelChip.innerHTML = '<span class="api-status-label">Model:</span><span>gpt-5-nano</span>';
  apiStatus.appendChild(modelChip);

  // プロパティタイプ
  const propTypes = document.createElement('div');
  propTypes.style.cssText = 'display: flex; gap: 8px; flex-wrap: wrap;';
  ['string', 'number', 'boolean', 'object'].forEach(type => {
    const badge = document.createElement('span');
    badge.className = 'property-type';
    badge.textContent = type;
    propTypes.appendChild(badge);
  });

  container.appendChild(createSection('スキーマタイプバッジ', schemaTypes));
  container.appendChild(createSection('APIステータスチップ', apiStatus));
  container.appendChild(createSection('プロパティタイプバッジ', propTypes));

  return container;
};

AllVariants.storyName = '全バリエーション';
