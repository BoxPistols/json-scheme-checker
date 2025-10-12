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
 * @returns {Array} 検出された問題のリスト
 */
export function validateTwitterCards(twitter) {
  const issues = [];
  const required = ['card', 'title', 'description', 'image'];

  // 必須項目のチェック
  required.forEach(field => {
    if (!twitter[field]) {
      issues.push({
        type: 'warning',
        field: `twitter:${field}`,
        message: `twitter:${field}が設定されていません`,
      });
    }
  });

  // カードタイプのバリデーション
  const validCards = ['summary', 'summary_large_image', 'app', 'player'];
  if (twitter.card && !validCards.includes(twitter.card)) {
    issues.push({
      type: 'error',
      field: 'twitter:card',
      message: `twitter:cardの値が無効です: ${twitter.card}`,
    });
  }

  // 画像URLのバリデーション
  if (twitter.image && !isValidUrl(twitter.image)) {
    issues.push({
      type: 'error',
      field: 'twitter:image',
      message: 'twitter:imageのURLが無効です',
    });
  }

  return issues;
}

/**
 * URLの妥当性をチェック
 * @param {string} string - チェックするURL文字列
 * @returns {boolean} 有効なURLの場合true
 */
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}
