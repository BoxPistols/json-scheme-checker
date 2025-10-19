/**
 * Twitter Cards抽出モジュール
 * HTMLドキュメントからTwitter Cardsメタタグを抽出し、バリデーションを行う
 */

/**
 * Twitter Cardsメタタグを抽出
 * @param {Document} doc - DOMパーサーで解析したHTMLドキュメント
 * @returns {Object} 抽出されたTwitter Cards情報
 */
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

/**
 * Twitter Cardsのバリデーション
 * @param {Object} twitter - extractTwitterCardsで抽出したTwitter Cards情報
 * @param {Object} og - Open Graphタグ情報（代替チェック用）
 * @returns {Array} 検出された問題のリスト
 */
export function validateTwitterCards(twitter, og = {}) {
  const issues = [];

  // Twitter Cardsは必須ではない。OGPで基本情報が揃っていれば問題なし
  // ただし、Twitter Cardsが設定されている場合は検証する

  if (twitter.card || twitter.title || twitter.description) {
    // Twitter Cardsが部分的に設定されている場合のみ検証

    // カードタイプのバリデーション（設定されている場合）
    const validCards = ['summary', 'summary_large_image', 'app', 'player'];
    if (twitter.card && !validCards.includes(twitter.card)) {
      issues.push({
        type: 'error',
        field: 'twitter:card',
        message: `twitter:cardの値が無効です: ${twitter.card}`,
      });
    }

    // 画像URLのバリデーション（設定されている場合）
    if (twitter.image && !isValidUrl(twitter.image)) {
      issues.push({
        type: 'error',
        field: 'twitter:image',
        message: 'twitter:imageのURLが無効です',
      });
    }
  }
  // Twitter Cardsが一切設定されていなくても、OGPで対応可能なので警告なし

  return issues;
}

/**
 * URLの妥当性をチェック
 * @param {string} string - チェックするURL文字列
 * @returns {boolean} 有効なURLの場合true
 */
function isValidUrl(string) {
  // 相対パスの判定
  if (string.startsWith('/') || string.startsWith('./') || string.startsWith('../') || string.startsWith('data:')) {
    return true;
  }

  // 絶対URLの判定
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
