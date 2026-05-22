/* ════════════════════════════════════════════════════════════
 *  NIGHT EDITION — editorial behavior layer
 *  Live ticker · marginalia · numbered headings
 * ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  injectTicker();
  injectMarginalia();
  numberMultiPlatformSteps();
  refreshTicker();
  setInterval(refreshTicker, 30000);
});

// ── Live ticker strip ─────────────────────────────────────────
function injectTicker() {
  if (document.querySelector('.editorial-ticker')) return;

  const header = document.querySelector('header');
  if (!header) return;

  const tick = document.createElement('div');
  tick.className = 'editorial-ticker';
  tick.innerHTML = `
    <div class="editorial-ticker-track" id="ticker-track">
      <span class="editorial-ticker-item">
        <span class="lab">LOADING</span><span class="val">···</span>
      </span>
    </div>
  `;
  header.insertAdjacentElement('afterend', tick);
}

async function refreshTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  try {
    const [ov, queue] = await Promise.all([
      fetch('/api/analytics/overview').then(r => r.json()).catch(() => ({})),
      fetch('/api/queue/status').then(r => r.json()).catch(() => ({})),
    ]);

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    const items = [
      ['EDITION', `${now.toLocaleDateString('fr-FR', {day:'2-digit', month:'short'}).toUpperCase()}`],
      ['HOUR',    `${hh}:${mm} CET`],
      ['POSTS',   `${ov.total_posts || 0}`, ov.posts_today ? `+${ov.posts_today}` : null],
      ['CLICKS',  `${ov.total_clicks || 0}`, ov.clicks_today ? `+${ov.clicks_today}` : null],
      ['QUEUE',   `${queue.queued || 0}`],
      ['LIVE',    `${queue.published || 0}`],
      ['FAILED',  `${queue.failed || 0}`, (queue.failed || 0) > 0 ? '!' : null],
      ['PLATFORMS', `${(ov.active_platforms || []).length}/4`],
      ['SYSTEM',  'NOMINAL'],
      ['TRAFFIC', 'OPEN'],
    ];

    const html = items.map(([lab, val, delta]) => `
      <span class="editorial-ticker-item">
        <span class="lab">${lab}</span><span class="val">${val}</span>
        ${delta ? `<span class="${delta.startsWith('+') ? 'delta-up' : 'delta-dn'}">${delta}</span>` : ''}
      </span>
      <span class="sep">·</span>
    `).join('');

    // Duplicate for seamless loop
    track.innerHTML = html + html;
  } catch (err) {
    // silent
  }
}

// ── Marginalia — running vertical label ───────────────────────
function injectMarginalia() {
  if (document.querySelector('.editorial-margin-label')) return;

  const label = document.createElement('div');
  label.className = 'editorial-margin-label';
  label.textContent = 'AFFILIATE · INTELLIGENCE · ENGINE · v.4 · ' +
                       new Date().getFullYear() + ' · CONFIDENTIAL';
  document.body.appendChild(label);
}

// ── Number the multi-platform step headings ───────────────────
function numberMultiPlatformSteps() {
  document.querySelectorAll('#tab-multi .card h3').forEach((h3, i) => {
    // Skip if already prefixed
    if (h3.textContent.trim().startsWith('§')) return;
    const num = String(i + 1).padStart(2, '0');
    const txt = h3.textContent.trim().replace(/^[0-9]+️⃣\s*/, '');
    h3.innerHTML = `<span style="display:block;font-family:var(--mono);font-style:normal;font-size:11px;letter-spacing:0.25em;color:var(--stamp);margin-bottom:8px">§ ${num} · DISPATCH</span>${txt}`;
  });
}
