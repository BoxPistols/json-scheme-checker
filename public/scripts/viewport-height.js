// iPhoneなどのモバイルブラウザでの正確なビューポート高さを設定
// ブラウザのアドレスバーやナビゲーションバーを除いた実際の高さをCSS変数に設定
(() => {
  const setViewportHeight = () => {
    // 実際の表示可能な高さを取得
    const vh = window.innerHeight * 0.01;
    // CSS変数に設定
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // デバッグ用
    console.log('[Viewport] Height updated:', window.innerHeight, 'px, --vh:', vh, 'px');
  };

  // 初回設定
  setViewportHeight();

  // リサイズ時に更新
  window.addEventListener('resize', setViewportHeight);

  // 画面回転時に更新
  window.addEventListener('orientationchange', () => {
    // orientationchange後に少し待ってから更新（ブラウザUIの再描画を待つ）
    setTimeout(setViewportHeight, 100);
  });

  // iOS対応: visualViewport APIがあれば使用
  if ('visualViewport' in window) {
    window.visualViewport.addEventListener('resize', setViewportHeight);
  }
})();
