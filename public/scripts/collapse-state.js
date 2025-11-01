// details.collapsible の開閉状態を永続化
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('details.collapsible[id]').forEach((details) => {
      const key = `collapsible_${details.id}`;
      try {
        const saved = localStorage.getItem(key);
        if (saved !== null) details.open = saved === 'open';
      } catch (_) {}
      details.addEventListener('toggle', () => {
        try { localStorage.setItem(key, details.open ? 'open' : 'closed'); } catch (_) {}
      });
    });
  });
})();