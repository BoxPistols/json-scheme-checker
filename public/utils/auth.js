/**
 * 認証ユーティリティ
 *
 * Content Upload ReviewerとMy Skill Sheetページの認証を管理
 */

const AUTH_STORAGE_KEY = 'jsonld_upload_auth';

/**
 * 認証情報をlocalStorageから取得
 * @returns {string|null} Base64エンコードされた認証情報
 */
export function getAuthCredentials() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

/**
 * 認証情報をlocalStorageに保存
 * @param {string} username - ユーザー名
 * @param {string} password - パスワード
 */
export function saveAuthCredentials(username, password) {
  const credentials = btoa(`${username}:${password}`);
  localStorage.setItem(AUTH_STORAGE_KEY, credentials);
}

/**
 * 認証情報をlocalStorageから削除
 */
export function clearAuthCredentials() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

/**
 * 認証済みかどうかをチェック
 * @returns {boolean} 認証情報が存在する場合はtrue
 */
export function isAuthenticated() {
  return !!getAuthCredentials();
}

/**
 * APIリクエストに認証ヘッダーを追加
 * @param {Object} headers - 既存のヘッダーオブジェクト
 * @returns {Object} 認証ヘッダーを含む新しいヘッダーオブジェクト
 */
export function addAuthHeader(headers = {}) {
  const credentials = getAuthCredentials();
  if (credentials) {
    return {
      ...headers,
      Authorization: `Basic ${credentials}`,
    };
  }
  return headers;
}

/**
 * 認証が必要かどうかを環境に応じて判定
 * @returns {boolean} 本番環境の場合はtrue、開発環境の場合はfalse
 */
export function isAuthRequired() {
  // Vercel環境の場合は認証が必要
  const isVercel = window.location.hostname.includes('vercel.app');
  return isVercel;
}
