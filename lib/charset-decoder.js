const iconv = require('iconv-lite');
const jschardet = require('jschardet');

/**
 * HTMLからcharsetを検出
 * @param {Buffer} buffer - HTMLのバイナリデータ
 * @returns {string|null} 検出されたcharset
 */
function detectCharsetFromHtml(buffer) {
  // まずASCII互換として読み取る（metaタグ検出用）
  const asciiText = buffer.toString('ascii').substring(0, 2000);

  // <meta charset="..."> パターン
  const charsetMatch = asciiText.match(/<meta\s+charset=["']?([^"'\s>]+)/i);
  if (charsetMatch) {
    return charsetMatch[1].toUpperCase();
  }

  // <meta http-equiv="Content-Type" content="...; charset=..."> パターン
  const httpEquivMatch = asciiText.match(
    /<meta\s+http-equiv=["']?content-type["']?\s+content=["'][^"']*charset=([^"'\s;>]+)/i
  );
  if (httpEquivMatch) {
    return httpEquivMatch[1].toUpperCase();
  }

  return null;
}

/**
 * Content-Typeヘッダーからcharsetを検出
 * @param {string} contentType - Content-Typeヘッダーの値
 * @returns {string|null} 検出されたcharset
 */
function detectCharsetFromContentType(contentType) {
  if (!contentType) return null;
  const match = contentType.match(/charset=([^;,\s]+)/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * エンコーディングでデコードを試行するヘルパー関数
 * @param {Buffer} buffer - デコードするバッファ
 * @param {string} encoding - エンコーディング名
 * @param {string} source - デコード元の情報（ログ用）
 * @returns {string|null} デコードされた文字列、または失敗時はnull
 */
function tryDecode(buffer, encoding, source) {
  if (encoding && iconv.encodingExists(encoding)) {
    try {
      console.log(`Attempting to decode with ${encoding} from ${source}`);
      return iconv.decode(buffer, encoding);
    } catch (e) {
      console.warn(`Failed to decode with ${encoding} from ${source}:`, e.message);
    }
  }
  return null;
}

/**
 * バイナリデータを適切なエンコーディングでUTF-8に変換
 * @param {Buffer} buffer - HTMLのバイナリデータ
 * @param {string} contentType - Content-Typeヘッダー
 * @returns {string} UTF-8に変換されたHTML
 */
function decodeHtmlBuffer(buffer, contentType) {
  let decoded;

  // 1. Content-Typeヘッダーから検出
  decoded = tryDecode(buffer, detectCharsetFromContentType(contentType), 'Content-Type');
  if (decoded) return decoded;

  // 2. HTMLのmetaタグから検出
  decoded = tryDecode(buffer, detectCharsetFromHtml(buffer), 'HTML meta');
  if (decoded) return decoded;

  // 3. jschardetで自動検出
  const detected = jschardet.detect(buffer);
  if (detected && detected.encoding && detected.confidence > 0.7) {
    const encoding = detected.encoding.toUpperCase();
    decoded = tryDecode(buffer, encoding, `auto-detection (confidence: ${detected.confidence})`);
    if (decoded) return decoded;
  }

  // 4. 日本語サイトの一般的なエンコーディングを試行
  const fallbackEncodings = ['UTF-8', 'EUC-JP', 'SHIFT_JIS', 'ISO-2022-JP'];
  for (const enc of fallbackEncodings) {
    try {
      const decodedAttempt = iconv.decode(buffer, enc);
      // 日本語文字が含まれているか確認
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(decodedAttempt)) {
        console.log(`Successfully decoded with fallback encoding: ${enc}`);
        return decodedAttempt;
      }
    } catch (e) {
      // 次のエンコーディングを試行
    }
  }

  // 5. 最終フォールバック: UTF-8として扱う
  console.warn('Using UTF-8 as final fallback');
  return iconv.decode(buffer, 'UTF-8');
}

module.exports = {
  detectCharsetFromHtml,
  detectCharsetFromContentType,
  decodeHtmlBuffer,
};
