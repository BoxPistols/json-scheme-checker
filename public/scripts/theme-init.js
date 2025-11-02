// テーマ適用の初期化（FOUC防止）
(() => {
  try {
    const themeKey = 'jsonld_theme';
    const osPreferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    const savedTheme = localStorage.getItem(themeKey) || osPreferredTheme;
    document.documentElement.dataset.theme = savedTheme;
  } catch (e) {
    const osPreferredTheme = window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    document.documentElement.dataset.theme = osPreferredTheme;
  }
})();
