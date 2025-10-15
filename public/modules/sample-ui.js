/**
 * サンプルUI管理モジュール
 * サンプルの表示・操作UIを提供
 */

import {
  getAllSamples,
  getSample,
  createSample,
  updateSample,
  deleteSample,
} from './sample-manager.js';

/**
 * サンプル一覧を表示
 * @param {HTMLElement} container - 表示先のコンテナ
 */
export async function renderSampleList(container) {
  try {
    const samples = await getAllSamples();

    if (samples.length === 0) {
      container.innerHTML = `
        <div class="sample-empty">
          <p>保存されたサンプルはありません</p>
          <p class="sample-empty-hint">分析結果を「サンプルとして保存」ボタンで保存できます</p>
        </div>
      `;
      return;
    }

    const listHTML = samples
      .map(
        sample => `
      <div class="sample-item" data-id="${sample.id}">
        <div class="sample-header">
          <h3 class="sample-name">${escapeHtml(sample.name)}</h3>
          <span class="sample-date">${formatDate(sample.createdAt)}</span>
        </div>
        <div class="sample-url">${escapeHtml(sample.url)}</div>
        <div class="sample-actions">
          <button class="btn-sample-load" data-id="${sample.id}">読み込む</button>
          <button class="btn-sample-delete" data-id="${sample.id}">削除</button>
        </div>
      </div>
    `,
      )
      .join('');

    container.innerHTML = `<div class="sample-list">${listHTML}</div>`;

    // イベントリスナーを追加
    container.querySelectorAll('.btn-sample-load').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = parseInt(e.target.dataset.id);
        await loadSample(id);
      });
    });

    container.querySelectorAll('.btn-sample-delete').forEach(btn => {
      btn.addEventListener('click', async e => {
        const id = parseInt(e.target.dataset.id);
        await deleteSampleWithConfirm(id, container);
      });
    });
  } catch (error) {
    container.innerHTML = `
      <div class="sample-error">
        <p>サンプルの読み込みに失敗しました</p>
        <p class="sample-error-detail">${escapeHtml(error.message)}</p>
      </div>
    `;
  }
}

/**
 * サンプルを読み込んで分析結果を表示
 * @param {number} id - サンプルID
 */
async function loadSample(id) {
  try {
    const sample = await getSample(id);

    // URLフィールドに設定
    const urlInput = document.getElementById('urlInput');
    if (urlInput) {
      urlInput.value = sample.url;
    }

    // 保存されたデータを使って再描画
    if (sample.data) {
      // カスタムイベントを発火して分析結果を表示
      const event = new CustomEvent('sample-loaded', {
        detail: { sample },
      });
      document.dispatchEvent(event);
    }

    // サンプルパネルを閉じる
    const panel = document.getElementById('samplePanel');
    if (panel) {
      panel.classList.remove('active');
    }

    showNotification(`サンプル「${sample.name}」を読み込みました`);
  } catch (error) {
    console.error('サンプル読み込みエラー:', error);
    showNotification(`読み込みエラー: ${error.message}`, 'error');
  }
}

/**
 * サンプルを削除（確認あり）
 * @param {number} id - サンプルID
 * @param {HTMLElement} container - 一覧のコンテナ（再描画用）
 */
async function deleteSampleWithConfirm(id, container) {
  if (!confirm('このサンプルを削除しますか？')) {
    return;
  }

  try {
    await deleteSample(id);
    showNotification('サンプルを削除しました');
    // 一覧を再描画
    await renderSampleList(container);
  } catch (error) {
    console.error('サンプル削除エラー:', error);
    showNotification(`削除エラー: ${error.message}`, 'error');
  }
}

/**
 * 現在の分析結果をサンプルとして保存
 * @param {string} url - 分析したURL
 * @param {Object} data - 分析データ
 */
export async function saveCurrentAsSample(url, data) {
  const name = prompt('サンプル名を入力してください:', `分析結果 - ${new Date().toLocaleString('ja-JP')}`);

  if (!name) {
    return; // キャンセル
  }

  try {
    await createSample(name, url, data);
    showNotification(`サンプル「${name}」を保存しました`);
  } catch (error) {
    console.error('サンプル保存エラー:', error);
    showNotification(`保存エラー: ${error.message}`, 'error');
  }
}

/**
 * HTMLエスケープ
 * @param {string} str - エスケープする文字列
 * @returns {string} エスケープされた文字列
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * 日付をフォーマット
 * @param {string} dateString - ISO 8601形式の日付文字列
 * @returns {string} フォーマットされた日付
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 通知を表示
 * @param {string} message - 通知メッセージ
 * @param {string} type - 通知タイプ ('success' | 'error')
 */
function showNotification(message, type = 'success') {
  // 既存の通知を削除
  const existing = document.querySelector('.notification');
  if (existing) {
    existing.remove();
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  // 3秒後に自動削除
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
