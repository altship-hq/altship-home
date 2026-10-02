// altship.io/mcp — nav behaviour for the MCP Creator landing page.
(() => {
  const nav = document.getElementById('mx-nav');
  const toggle = document.getElementById('mx-nav-toggle');
  const menu = document.getElementById('mx-nav-menu');
  const hero = document.getElementById('mx-hero');

  // Locally, "Start building" goes to the dashboard's Vite dev server instead of pilot.altship.io.
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    document.querySelectorAll('[data-dashboard-link]').forEach((a) => { a.href = 'http://localhost:5173/mcp'; });
  }

  // Swap the wordmark for the logo mark once the hero scrolls away, as on altship.io.
  new IntersectionObserver(([entry]) => nav.classList.toggle('is-scrolled', !entry.isIntersecting)).observe(hero);

  const setOpen = (open) => {
    nav.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setOpen(!nav.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setOpen(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
})();
