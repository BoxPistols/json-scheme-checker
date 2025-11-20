/**
 * カラートークンのストーリー
 */

export default {
  title: 'デザイントークン/カラー',
  parameters: {
    layout: 'padded',
  },
};

const colorTokens = {
  primary: {
    '--bg-color': '背景色',
    '--text-color': 'テキスト色',
    '--card-bg-color': 'カード背景色',
    '--header-bg-color': 'ヘッダー背景色',
    '--border-color': 'ボーダー色',
  },
  brand: {
    '--primary-color': 'プライマリ色',
    '--primary-text-color': 'プライマリテキスト色',
    '--accent-color': 'アクセント色',
  },
  semantic: {
    '--error-color': 'エラー色',
    '--success-color': '成功色',
    '--warning-color': '警告色',
  },
  json: {
    '--json-bg': 'JSONビュー背景',
    '--json-key': 'JSONキー',
    '--json-string': 'JSON文字列',
    '--json-number': 'JSON数値',
    '--json-boolean': 'JSONブール値',
    '--json-null': 'JSONヌル',
  },
};

const createColorSwatch = (token, label) => {
  const swatch = document.createElement('div');
  swatch.style.cssText = `
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    margin: 8px;
  `;

  const color = document.createElement('div');
  color.style.cssText = `
    width: 100px;
    height: 100px;
    background: var(${token});
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  `;

  const tokenName = document.createElement('div');
  tokenName.textContent = token;
  tokenName.style.cssText = `
    margin-top: 8px;
    font-size: 12px;
    font-family: monospace;
    color: var(--text-color);
  `;

  const labelName = document.createElement('div');
  labelName.textContent = label;
  labelName.style.cssText = `
    margin-top: 4px;
    font-size: 11px;
    color: var(--secondary-text-color);
  `;

  swatch.appendChild(color);
  swatch.appendChild(tokenName);
  swatch.appendChild(labelName);

  return swatch;
};

export const Primary = () => {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  `;

  Object.entries(colorTokens.primary).forEach(([token, label]) => {
    container.appendChild(createColorSwatch(token, label));
  });

  return container;
};

export const Brand = () => {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  `;

  Object.entries(colorTokens.brand).forEach(([token, label]) => {
    container.appendChild(createColorSwatch(token, label));
  });

  return container;
};

export const Semantic = () => {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  `;

  Object.entries(colorTokens.semantic).forEach(([token, label]) => {
    container.appendChild(createColorSwatch(token, label));
  });

  return container;
};

export const JSONColors = () => {
  const container = document.createElement('div');
  container.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  `;

  Object.entries(colorTokens.json).forEach(([token, label]) => {
    container.appendChild(createColorSwatch(token, label));
  });

  return container;
};

JSONColors.storyName = 'JSON表示用カラー';
