/**
 * PurgeCSS設定
 *
 * 未使用のCSSを自動的に削除して、本番ビルドのファイルサイズを最小化します。
 */

module.exports = {
  // スキャン対象のファイル（クラス名を検索）
  content: [
    './public/**/*.html',
    './public/**/*.js',
    './api/**/*.js', // サーバーレス関数でもクラス名を使用している場合
  ],

  // PurgeCSSの対象となるCSSファイル
  css: ['./public/styles/**/*.css'],

  // 削除されないようにするクラス名（セーフリスト）
  safelist: {
    // 完全一致でセーフリストに追加
    standard: [
      'active',
      'hidden',
      'visible',
      'open',
      'closed',
      'loading',
      'disabled',
      'selected',
      'error',
      'success',
      'warning',
      'info',
      'dark',
      'light',
    ],

    // 前方一致パターン（これらで始まるクラスは削除しない）
    greedy: [
      /^icon-/,           // icon-visible, icon-hidden など
      /^status-/,         // status-high, status-medium, status-low など
      /^modal-/,          // modal-overlay, modal-container など
      /^btn-/,            // btn-primary, btn-secondary など
      /^tab-/,            // tab-button, tab-content など
      /^auth-/,           // auth-details, auth-summary など
      /^advisor-/,        // advisor-card, advisor-header など
      /^chat-/,           // chat-container, chat-message など
      /^json-/,           // json-key, json-string など
      /^schema-/,         // schema-card, schema-header など
      /^feature-/,        // feature-card, feature-list など
      /^sample-/,         // sample-link, sample-item など
      /^collapsible/,     // collapsible, collapsible[open] など
      /^error-/,          // error-message, error-container など
      /^loading/,         // loading, loading-spinner など
      /data-theme/,       // data-theme属性に関連するスタイル
    ],
  },

  // デフォルトの抽出パターン（カスタマイズ可能）
  defaultExtractor: (content) => {
    // クラス名を抽出する正規表現
    // class="foo bar", className='baz', classList.add('qux') などに対応
    const broadMatches = content.match(/[^<>"'`\s]*[^<>"'`\s:]/g) || [];
    const innerMatches = content.match(/[^<>"'`\s.()[\]{}]*[^<>"'`\s.()[\]{}:]/g) || [];

    return broadMatches.concat(innerMatches);
  },

  // 疑似クラスと疑似要素も保持
  keyframes: true,
  fontFace: true,
  variables: true,

  // 出力設定
  output: './public/styles/dist/',

  // 詳細なログを出力
  rejected: false, // trueにすると削除されたセレクタを表示

  // レガシーブラウザのサポート
  legacySelector: true,
};
