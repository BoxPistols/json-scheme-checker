/**
 * Open Graphタグ抽出モジュール
 * HTMLドキュメントからOpen Graphタグを抽出し、バリデーションを行う
 */

/**
 * Open Graphタグを抽出
 * @param {Document} doc - DOMパーサーで解析したHTMLドキュメント
 * @returns {Object} 抽出されたOGタグ情報
 */
export function extractOpenGraph(doc) {
  const ogTags = {};

  // 正規の property 属性を持つタグを取得
  const propertyTags = doc.querySelectorAll('meta[property^="og:"]');
  propertyTags.forEach(tag => {
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (property && content) {
      const key = property.replace('og:', '');
      ogTags[key] = content;
    }
  });

  // 誤った name 属性を持つタグも取得（一部サイトで使用されている）
  const nameTags = doc.querySelectorAll('meta[name^="og:"]');
  nameTags.forEach(tag => {
    const name = tag.getAttribute('name');
    const content = tag.getAttribute('content');
    if (name && content) {
      const key = name.replace('og:', '');
      // property 属性で既に設定されていない場合のみ追加
      if (!ogTags[key]) {
        ogTags[key] = content;
      }
    }
  });

  return ogTags;
}

/**
 * Open Graphタグのバリデーション
 * @param {Object} og - extractOpenGraphで抽出したOGタグ情報
 * @returns {Array} 検出された問題のリスト
 */
export function validateOpenGraph(og) {
  const issues = [];
  const required = ['title', 'description', 'image', 'url', 'type'];

  // 必須項目のチェック
  required.forEach(field => {
    if (!og[field]) {
      issues.push({
        type: 'error',
        field: `og:${field}`,
        message: `og:${field}が設定されていません`,
      });
    }
  });

  // 画像URLのバリデーション
  if (og.image && !isValidUrl(og.image)) {
    issues.push({
      type: 'error',
      field: 'og:image',
      message: 'og:imageのURLが無効です',
    });
  }

  // URLのバリデーション
  if (og.url && !isValidUrl(og.url)) {
    issues.push({
      type: 'error',
      field: 'og:url',
      message: 'og:urlが無効です',
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
