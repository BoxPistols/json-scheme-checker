// 共通UIコンポーネント - アドバイザー機能用
// Advisor と BlogReviewer で共有する UI コンポーネントを提供

/**
 * モーダルヘッダーを生成
 * @param {Object} options - ヘッダーオプション
 * @param {string} options.prefix - アクションプレフィックス (例: 'advisor', 'blog')
 * @param {string} options.title - モーダルタイトル
 * @param {string} options.closeAction - 閉じるボタンのアクション名
 * @returns {string} ヘッダーHTML
 */
function createModalHeader({ prefix, title, closeAction }) {
  return `
    <div class="advisor-modal-header" style="flex-direction: column; align-items: stretch;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px;">
        <div class="advisor-mode-buttons-small">
          <button class="advisor-mode-btn-small" data-action="${prefix}-reset-to-normal-mode" title="通常モード（10回/24時間）に戻す">通常モード</button>
          <button class="advisor-mode-btn-small" data-action="${prefix}-show-stakeholder-prompt" title="関係者は30回/24時間まで利用可能">関係者</button>
          <button class="advisor-mode-btn-small" data-action="${prefix}-show-developer-prompt" title="自分のAPIキーで無制限利用">MyAPI</button>
        </div>
        <button class="advisor-modal-close" data-action="${closeAction}">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor"/>
          </svg>
        </button>
      </div>
      <h2>${title}</h2>
    </div>
  `;
}

/**
 * レート制限情報を生成
 * @param {Object} rateLimit - レート制限情報
 * @returns {string} レート制限HTML
 */
function createRateLimitInfo(rateLimit) {
  if (rateLimit.mode === 'developer') {
    return '<div class="advisor-rate-info advisor-rate-unlimited">MyAPIモード（無制限）</div>';
  }

  if (!rateLimit.allowed) {
    const resetTimeStr = rateLimit.resetTime
      ? rateLimit.resetTime.toLocaleString('ja-JP')
      : '不明';
    return `<div class="advisor-rate-info advisor-rate-exceeded">利用制限に達しました（リセット: ${resetTimeStr}）</div>`;
  }

  if (rateLimit.mode === 'stakeholder') {
    return `<div class="advisor-rate-info advisor-rate-stakeholder">関係者モード - 残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
  }

  return `<div class="advisor-rate-info">残り ${rateLimit.remaining} 回 / ${rateLimit.maxRequests} 回（24時間）</div>`;
}

/**
 * 確認ボタンを生成
 * @param {Object} options - ボタンオプション
 * @param {string} options.cancelAction - キャンセルボタンのアクション名
 * @param {string} options.confirmAction - 確認ボタンのアクション名
 * @param {string} options.confirmText - 確認ボタンのテキスト
 * @returns {string} ボタンHTML
 */
function createConfirmButtons({ cancelAction, confirmAction, confirmText }) {
  return `
    <div class="advisor-confirm-buttons">
      <button class="advisor-btn-secondary" data-action="${cancelAction}">キャンセル</button>
      <button class="advisor-btn-primary" data-action="${confirmAction}">${confirmText}</button>
    </div>
  `;
}
