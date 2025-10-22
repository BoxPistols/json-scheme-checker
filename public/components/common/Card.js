/**
 * カードコンポーネント（Presentational）
 *
 * 再利用可能なカードUI（ボーダー付きコンテナ）
 * データ取得やビジネスロジックを持たず、propsのみでレンダリング
 */

/**
 * カードを生成
 * @param {Object} props
 * @param {string} props.title - カードタイトル（オプション）
 * @param {string|HTMLElement} props.content - カードコンテンツ
 * @param {string} props.className - 追加CSSクラス
 * @param {string} props.elevation - エレベーション（なし|low|medium|high）
 * @returns {HTMLElement}
 */
export function Card({
  title = '',
  content = '',
  className = '',
  elevation = 'low',
}) {
  const card = document.createElement('div');
  card.className = `card card-elevation-${elevation} ${className}`.trim();

  // ヘッダー
  if (title) {
    const header = document.createElement('div');
    header.className = 'card-header';
    header.innerHTML = `<h3 class="card-title">${title}</h3>`;
    card.appendChild(header);
  }

  // コンテンツ
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';
  if (typeof content === 'string') {
    cardContent.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    cardContent.appendChild(content);
  }
  card.appendChild(cardContent);

  return card;
}

/**
 * カード列を生成（グリッドレイアウト）
 * @param {Object} props
 * @param {Array} props.cards - カード配列（各要素は Card props）
 * @param {number} props.columns - グリッド列数（デフォルト: 3）
 * @param {string} props.className - 追加CSSクラス
 * @returns {HTMLElement}
 */
export function CardGrid({
  cards = [],
  columns = 3,
  className = '',
}) {
  const grid = document.createElement('div');
  grid.className = `card-grid card-grid-cols-${columns} ${className}`.trim();

  cards.forEach((cardProps) => {
    const card = Card(cardProps);
    grid.appendChild(card);
  });

  return grid;
}

/**
 * カードのコンテンツを更新
 * @param {HTMLElement} card - カード要素
 * @param {string|HTMLElement} content - 新しいコンテンツ
 */
export function updateCardContent(card, content) {
  if (!card) return;
  const cardContent = card.querySelector('.card-content');
  if (!cardContent) return;

  cardContent.innerHTML = '';
  if (typeof content === 'string') {
    cardContent.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    cardContent.appendChild(content);
  }
}

/**
 * カードのタイトルを更新
 * @param {HTMLElement} card - カード要素
 * @param {string} title - 新しいタイトル
 */
export function updateCardTitle(card, title) {
  if (!card) return;
  const cardTitle = card.querySelector('.card-title');
  if (cardTitle) {
    cardTitle.textContent = title;
  }
}
