/* ════════════════════════════════════════════════════════════
 *  PLATFORM LOGOS — monochrome editorial set
 *  Returns inline SVG strings that fit the night-edition aesthetic
 * ════════════════════════════════════════════════════════════ */

window.PLATFORM_LOGOS = {
  youtube: `<svg viewBox="0 0 256 180" width="20" height="14" fill="currentColor" aria-label="YouTube"><path d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z"/><path fill="#0a0a0c" d="m102.421 128.06 66.328-38.418-66.328-38.418z"/></svg>`,

  tiktok: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-label="TikTok"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.13a8.16 8.16 0 0 0 4.77 1.53V6.21a4.85 4.85 0 0 1-1.84-.52Z"/></svg>`,

  instagram: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-label="Instagram"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>`,

  facebook: `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-label="Facebook"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15h-2v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>`,
};

window.platformLogo = function (name) {
  const key = (name || '').toLowerCase().replace(/_shorts|_reels/g, '').trim();
  return window.PLATFORM_LOGOS[key] || `<span style="font-family:var(--mono);font-size:10px;letter-spacing:0.2em">${name?.toUpperCase()}</span>`;
};

/* ── Patch the multi-platform result table to use logos ───── */
document.addEventListener('DOMContentLoaded', () => {
  // Monkey-patch renderMpResults if it exists
  const origRender = window.renderMpResults;
  if (typeof origRender === 'function') {
    window.renderMpResults = function (result) {
      origRender(result);
      const tbl = document.querySelector('#mp-results table');
      if (!tbl) return;
      tbl.querySelectorAll('tbody tr td:first-child').forEach(td => {
        const plat = td.textContent.trim();
        const logo = window.platformLogo(plat);
        td.innerHTML = `<span style="display:inline-flex;align-items:center;gap:10px;color:var(--bone)">${logo}<span style="font-family:var(--mono);font-size:10px;letter-spacing:0.2em;text-transform:uppercase">${plat}</span></span>`;
      });
    };
  }
});
