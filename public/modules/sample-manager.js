/**
 * サンプル管理モジュール
 * ローカルCRUD操作を提供
 */

// 環境判定
const isVercel = window.location.hostname.includes('vercel.app');
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);

// API URLの決定
const API_BASE = isVercel
  ? '/api/samples'
  : isLocalhost
    ? 'http://localhost:3333/api/samples'
    : `http://${window.location.hostname}:3333/api/samples`;

/**
 * 全サンプルを取得
 * @returns {Promise<Array>} サンプルの配列
 */
export async function getAllSamples() {
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.samples || [];
  } catch (error) {
    console.error('サンプル取得エラー:', error);
    throw error;
  }
}

/**
 * 特定のサンプルを取得
 * @param {number} id - サンプルID
 * @returns {Promise<Object>} サンプルデータ
 */
export async function getSample(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('サンプル取得エラー:', error);
    throw error;
  }
}

/**
 * 新しいサンプルを作成
 * @param {string} name - サンプル名
 * @param {string} url - 分析したURL
 * @param {Object} data - 分析データ
 * @returns {Promise<Object>} 作成されたサンプル
 */
export async function createSample(name, url, data) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, url, data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const newSample = await response.json();
    console.log('サンプル作成成功:', newSample);
    return newSample;
  } catch (error) {
    console.error('サンプル作成エラー:', error);
    throw error;
  }
}

/**
 * サンプルを更新
 * @param {number} id - サンプルID
 * @param {string} name - サンプル名
 * @param {string} url - 分析したURL
 * @param {Object} data - 分析データ
 * @returns {Promise<Object>} 更新されたサンプル
 */
export async function updateSample(id, name, url, data) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, url, data }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const updatedSample = await response.json();
    console.log('サンプル更新成功:', updatedSample);
    return updatedSample;
  } catch (error) {
    console.error('サンプル更新エラー:', error);
    throw error;
  }
}

/**
 * サンプルを削除
 * @param {number} id - サンプルID
 * @returns {Promise<Object>} 削除結果
 */
export async function deleteSample(id) {
  try {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('サンプル削除成功:', result);
    return result;
  } catch (error) {
    console.error('サンプル削除エラー:', error);
    throw error;
  }
}
