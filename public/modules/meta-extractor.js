/**
 * メタタグ抽出モジュール
 * HTMLドキュメントから基本的なメタタグを抽出し、バリデーションを行う
 */

/**
 * 基本メタタグを抽出
 * @param {Document} doc - DOMパーサーで解析したHTMLドキュメント
 * @returns {Object} 抽出されたメタタグ情報
 */
export function extractBasicMeta(doc) {
  const title = doc.querySelector('title')?.textContent || '';
  const description = doc.querySelector('meta[name="description"]')?.content || '';

  return {
    title: title,
    titleLength: title.length,
    description: description,
    descriptionLength: description.length,
    keywords: doc.querySelector('meta[name="keywords"]')?.content || '',
    canonical: doc.querySelector('link[rel="canonical"]')?.href || '',
    robots: doc.querySelector('meta[name="robots"]')?.content || '',
    viewport: doc.querySelector('meta[name="viewport"]')?.content || '',
    charset:
      doc.querySelector('meta[charset]')?.getAttribute('charset') ||
      doc.querySelector('meta[http-equiv="Content-Type"]')?.content ||
      '',
    language: doc.documentElement.lang || '',
  };
}

/**
 * 基本メタタグのバリデーション
 * @param {Object} meta - extractBasicMetaで抽出したメタタグ情報
 * @returns {Array} 検出された問題のリスト
 */
export function validateBasicMeta(meta) {
  const issues = [];

  // Title検証
  if (!meta.title) {
    issues.push({
      type: 'error',
      field: 'title',
      message: 'Titleが設定されていません',
    });
  } else if (meta.titleLength < 30) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: 'Titleが短すぎます（30文字未満）',
    });
  } else if (meta.titleLength > 70) {
    issues.push({
      type: 'warning',
      field: 'title',
      message: 'Titleが長すぎます（70文字超）',
    });
  }

  // Description検証
  if (!meta.description) {
    issues.push({
      type: 'error',
      field: 'description',
      message: 'Descriptionが設定されていません',
    });
  } else if (meta.descriptionLength < 70) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: 'Descriptionが短すぎます（70文字未満）',
    });
  } else if (meta.descriptionLength > 200) {
    issues.push({
      type: 'warning',
      field: 'description',
      message: 'Descriptionが長すぎます（200文字超）',
    });
  }

  // Canonical URL検証
  if (meta.canonical && !isValidUrl(meta.canonical)) {
    issues.push({
      type: 'error',
      field: 'canonical',
      message: 'Canonical URLが無効です',
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
