// ── Theme system (auto + manual, persisted) ────────────────────────────────────
(() => {
  const KEY = 'aap_theme';
  const stored = localStorage.getItem(KEY);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const initial = stored || (prefersLight ? 'light' : 'dark');
  if (initial === 'light') document.documentElement.setAttribute('data-theme', 'light');
  // Listen for system changes if user hasn't manually picked
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(KEY)) {
      document.documentElement.toggleAttribute('data-theme', e.matches);
      if (e.matches) document.documentElement.setAttribute('data-theme', 'light');
      else document.documentElement.removeAttribute('data-theme');
    }
  });
})();
window.toggleTheme = function() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('aap_theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('aap_theme', 'light');
  }
  window.sfx?.tab();
};

// ── Lucide icon system ─────────────────────────────────────────────────────────
// Premium hairline icons replacing every emoji. Paths from lucide.dev (ISC license, free).
// Usage in HTML: <i data-icon="film"></i>   → auto-replaced with inline <svg/> at load.
const LUCIDE = {
  film:        '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"/>',
  tag:         '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  clock:       '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  package:     '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" x2="12" y1="22" y2="12"/>',
  chart:       '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  settings:    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  flame:       '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  zap:         '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  star:        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  refresh:     '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  sparkles:    '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',
  send:        '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  calendar:    '<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
  pen:         '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  palette:     '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  bot:         '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  mic:         '<rect width="6" height="13" x="9" y="2" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  video:       '<path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>',
  coins:       '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  facebook:    '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
  search:      '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  save:        '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  info:        '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  loader:      '<line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><line x1="4.93" x2="7.76" y1="4.93" y2="7.76"/><line x1="16.24" x2="19.07" y1="16.24" y2="19.07"/><line x1="2" x2="6" y1="12" y2="12"/><line x1="18" x2="22" y1="12" y2="12"/><line x1="4.93" x2="7.76" y1="19.07" y2="16.24"/><line x1="16.24" x2="19.07" y1="7.76" y2="4.93"/>',
  rocket:      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
  music:       '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  users:       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};

function renderIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => {
    const name = el.dataset.icon;
    const d = LUCIDE[name];
    if (!d) return;
    const size = el.dataset.size || '16';
    el.innerHTML = `<svg class="icon" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
    el.removeAttribute('data-icon');   // prevent re-render
  });
}
document.addEventListener('DOMContentLoaded', () => renderIcons());

// ── State ──────────────────────────────────────────────────────────────────────
const _savedState = (() => { try { return JSON.parse(localStorage.getItem('aap_state') || '{}'); } catch { return {}; } })();
const state = {
  video: { productId: _savedState.video?.productId || null, affiliateLink: _savedState.video?.affiliateLink || '' },
  deal:  { productId: _savedState.deal?.productId || null, affiliateLink: _savedState.deal?.affiliateLink || '', postId: _savedState.deal?.postId || null },
};

function _persistState() {
  try { localStorage.setItem('aap_state', JSON.stringify(state)); } catch {}
}

// ── Tab switching (with View Transitions API for native crossfade) ─────────────
function _doSwitchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  const pane = document.getElementById('tab-' + name);
  btn?.classList.add('active');
  pane?.classList.add('active');
  if (name === 'products')  loadProducts();
  if (name === 'analytics') loadAnalytics();
  if (name === 'scheduler') loadQueuedPosts();
}
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const name = btn.dataset.tab;
    if (document.startViewTransition) {
      document.startViewTransition(() => _doSwitchTab(name));
    } else {
      _doSwitchTab(name);
    }
  });
});

// ── Scrape product ──────────────────────────────────────────────────────────────
async function scrapeProduct(ctx) {
  const urlEl = document.getElementById(`${ctx}-url`);
  const url = urlEl.value.trim();
  if (!url) { toast('Hold on', 'Enter a product URL first.', 'info'); return; }

  const btn = document.getElementById(`${ctx}-scrape-btn`);
  btn.textContent = 'Scraping…'; btn.disabled = true;

  try {
    const fd = new FormData(); fd.append('url', url);
    const res = await fetch('/api/scrape', { method: 'POST', body: fd });
    if (!res.ok) { toast('Scrape failed', await res.text(), 'error'); return; }
    const { product } = await res.json();

    state[ctx].productId = product.id; _persistState();

    // Render preview
    const images = product.images || [];
    const imgSrc = images[0] || '';
    const discount = product.discount_pct > 0
      ? `<span class="was-price">$${product.original_price?.toFixed(2)}</span>
         <span class="discount">-${product.discount_pct}% OFF</span>`
      : '';
    const rating = product.star_rating > 0
      ? `⭐ ${product.star_rating}/5 (${product.review_count?.toLocaleString()} reviews)`
      : '';

    document.getElementById(`${ctx}-product-preview`).innerHTML = `
      <img src="${imgSrc}" onerror="this.style.display='none'" alt=""/>
      <div class="product-info">
        <h3>${product.name}</h3>
        <div><span class="price">$${product.price?.toFixed(2)}</span>${discount}</div>
        <div class="rating">${rating}</div>
      </div>`;
    document.getElementById(`${ctx}-product-preview`).classList.remove('hidden');

    // Show next sections
    document.getElementById(`${ctx}-affiliate-section`).style.display = 'block';
    if (ctx === 'deal')  document.getElementById('deal-style-section').style.display = 'block';
    if (ctx === 'video') document.getElementById('video-platforms-section').style.display = 'block';

    // Auto-generate Amazon link if associate tag is likely set
    onNetworkChange(ctx);
  } finally {
    btn.textContent = 'Scrape'; btn.disabled = false;
  }
}

// ── Network selection ──────────────────────────────────────────────────────────
function onNetworkChange(ctx) {
  const net        = document.getElementById(`${ctx}-network`).value;
  const howlNote   = document.getElementById(`${ctx}-howl-note`);
  const mavelyNote = document.getElementById(`${ctx}-mavely-note`);
  const customLink = document.getElementById(`${ctx}-custom-link`);

  // Show paste-field for manual networks (howl / mavely / custom)
  const isManual = net === 'howl' || net === 'mavely' || net === 'custom';
  if (howlNote)   howlNote.classList.toggle('hidden', net !== 'howl');
  if (mavelyNote) mavelyNote.classList.toggle('hidden', net !== 'mavely');
  if (customLink) customLink.classList.toggle('hidden', !isManual);

  // Clear stale link display
  document.getElementById(`${ctx}-link-display`).textContent = '';
  state[ctx].affiliateLink = '';

  // Amazon: auto-generate tag link immediately (no paste needed)
  if (net === 'amazon') {
    generateAffiliateLink(ctx);
  }
}

// ── Generate affiliate link ─────────────────────────────────────────────────────
async function generateAffiliateLink(ctx) {
  const pid = state[ctx].productId;
  if (!pid) return;
  const net = document.getElementById(`${ctx}-network`).value;
  const customInput = document.getElementById(`${ctx}-custom-link`);
  const customLink = customInput ? customInput.value.trim() : '';

  const fd = new FormData();
  fd.append('product_id', pid);
  fd.append('network', net);
  if (customLink) fd.append('custom_link', customLink);

  const res = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
  if (!res.ok) return;
  const data = await res.json();
  state[ctx].affiliateLink = data.redirect_url; _persistState();
  document.getElementById(`${ctx}-link-display`).textContent = '✅ ' + data.redirect_url;
}

// ── Start video campaign ────────────────────────────────────────────────────────
async function startVideoCampaign() {
  const pid = state.video.productId;
  if (!pid) { toast('Need a product', 'Scrape one first — paste the URL above.', 'info'); return; }

  // Use state link or generate one
  let link = state.video.affiliateLink;
  if (!link) {
    const net = document.getElementById('video-network').value;
    const custom = document.getElementById('video-custom-link').value.trim();
    const fd = new FormData();
    fd.append('product_id', pid); fd.append('network', net);
    if (custom) fd.append('custom_link', custom);
    const r = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
    if (!r.ok) { toast('Link failed', 'Could not generate affiliate link.', 'error'); return; }
    link = (await r.json()).redirect_url;
    state.video.affiliateLink = link; _persistState();
  }

  const platforms = [...document.querySelectorAll('input[name=vplatform]:checked')]
    .map(c => c.value).join(',');
  if (!platforms) { toast('Pick a platform', 'Tick at least one box.', 'info'); return; }

  const useEl = document.getElementById('use-elevenlabs').checked;
  const fd = new FormData();
  fd.append('product_id', pid);
  fd.append('affiliate_link', link);
  fd.append('platforms', platforms);
  fd.append('use_elevenlabs', useEl);

  const btn = document.querySelector('#tab-video .btn-primary');
  btn.textContent = '⏳ Queuing…'; btn.disabled = true;

  const res = await fetch('/api/video/generate', { method: 'POST', body: fd });
  btn.textContent = '🎬 Generate Videos'; btn.disabled = false;
  if (!res.ok) { toast('Job failed to start', await res.text(), 'error'); return; }

  const { job_id } = await res.json();
  trackJob(job_id, 'video-job-status', 'video-job-msg');
}

// ── Generate deal post ──────────────────────────────────────────────────────────
async function generateDealPost() {
  const pid = state.deal.productId;
  if (!pid) { toast('Need a product', 'Scrape one first — paste the URL above.', 'info'); return; }

  let link = state.deal.affiliateLink;
  if (!link) {
    const net = document.getElementById('deal-network').value;
    const custom = document.getElementById('deal-custom-link').value.trim();
    const fd = new FormData();
    fd.append('product_id', pid); fd.append('network', net);
    if (custom) fd.append('custom_link', custom);
    const r = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
    if (!r.ok) { toast('Link failed', 'Could not generate affiliate link.', 'error'); return; }
    link = (await r.json()).redirect_url;
    state.deal.affiliateLink = link; _persistState();
  }

  const style   = document.getElementById('deal-style').value;
  const network = document.getElementById('deal-network').value;
  const priceOverride = parseFloat(document.getElementById('deal-price-override').value) || 0;
  const fd = new FormData();
  fd.append('product_id', pid);
  fd.append('affiliate_link', link);
  fd.append('style', style);
  fd.append('network', network);
  if (priceOverride > 0) fd.append('price_override', priceOverride);

  const btn = document.getElementById('deal-gen-btn');
  btn.textContent = '⏳ Generating…'; btn.disabled = true;

  const res = await fetch('/api/deal-post/generate', { method: 'POST', body: fd });
  btn.textContent = '✍️ Generate Deal Post'; btn.disabled = false;
  if (!res.ok) { toast('Generation failed', await res.text(), 'error'); return; }

  const { job_id } = await res.json();

  // Poll until done
  const pollInterval = setInterval(async () => {
    const s = await fetch(`/api/job/${job_id}/status`).then(r => r.json());
    if (s.status === 'done' && s.result) {
      clearInterval(pollInterval);
      const result = typeof s.result === 'string' ? JSON.parse(s.result) : s.result;
      state.deal.postId = result.post_id; _persistState();
      document.getElementById('deal-text-preview').value = result.post_text || '';
      const imgPath = (result.image_path || '').replace(/\\/g, '/');
      if (imgPath) document.getElementById('deal-image-preview').src = '/' + imgPath;
      document.getElementById('deal-preview').classList.remove('hidden');
    } else if (s.status === 'failed') {
      clearInterval(pollInterval);
      toast('Generation failed', s.error || 'unknown error', 'error');
    }
  }, 1500);
}

// ── Publish deal post now ───────────────────────────────────────────────────────
async function publishDealNow() {
  const postId = state.deal.postId;
  if (!postId) { toast('No post yet', 'Generate a deal post first.', 'info'); return; }

  const statusEl = document.getElementById('deal-publish-status');
  statusEl.textContent = '⏳ Publishing…';
  statusEl.style.color = 'var(--muted)';

  const fd = new FormData(); fd.append('post_id', postId);
  const res = await fetch('/api/deal-post/publish-now', { method: 'POST', body: fd });
  const data = await res.json();

  if (res.ok && data.url) {
    statusEl.textContent = '✅ Published! ' + data.url;
    statusEl.style.color = 'var(--green)';
  } else {
    statusEl.textContent = '❌ Error: ' + (data.detail || JSON.stringify(data));
    statusEl.style.color = 'var(--red)';
  }
}

// ── Add to auto-queue ───────────────────────────────────────────────────────────
function addToQueue() {
  toast('In the queue', 'It\'ll auto-post on your next scheduled slot.', 'success');
}

// ── Job tracking via SSE ────────────────────────────────────────────────────────
function trackJob(jobId, containerId, msgId) {
  const container = document.getElementById(containerId);
  const msgEl = document.getElementById(msgId);
  container.classList.remove('hidden', 'done', 'failed');
  msgEl.textContent = '⏳ Job queued — video generation takes 2–5 minutes…';

  const es = new EventSource(`/api/job/${jobId}/stream`);
  es.onmessage = (e) => {
    const data = JSON.parse(e.data);
    if (data.status === 'running') {
      msgEl.textContent = '⚙️ Generating video(s)… please wait.';
    } else if (data.status === 'done') {
      container.classList.add('done');
      msgEl.textContent = '✅ Done! Check the Products tab — your videos are ready.';
      es.close();
    } else if (data.status === 'failed') {
      container.classList.add('failed');
      msgEl.textContent = '❌ Failed: ' + (data.error || 'unknown error');
      es.close();
    }
  };
  es.onerror = () => es.close();
}

// ── Scheduler ──────────────────────────────────────────────────────────────────
async function saveScheduler() {
  const ppd  = document.getElementById('posts-per-day').value;
  const hrs  = document.getElementById('posting-hours').value;
  const fd = new FormData(); fd.append('posts_per_day', ppd); fd.append('hours', hrs);
  const res = await fetch('/api/scheduler/config', { method: 'POST', body: fd });
  const data = await res.json();
  const el = document.getElementById('scheduler-status');
  el.textContent = res.ok ? '✅ ' + data.message : '❌ ' + (data.detail || 'Error');
  el.style.color = res.ok ? 'var(--green)' : 'var(--red)';
}

async function loadQueuedPosts() {
  const res = await fetch('/api/posts?status=ready');
  const { posts } = await res.json();
  const el = document.getElementById('queued-posts-table');
  if (!posts.length) {
    el.innerHTML = '<p class="muted">No posts in queue. Generate deal posts to add them.</p>';
    return;
  }
  el.innerHTML = `<table>
    <thead><tr><th>ID</th><th>Platform</th><th>Text preview</th><th>Created</th></tr></thead>
    <tbody>${posts.map(p => `<tr>
      <td>${p.id}</td>
      <td>${p.platform}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${(p.post_text || '').substring(0, 80)}</td>
      <td>${new Date(p.created_at).toLocaleDateString()}</td>
    </tr>`).join('')}</tbody>
  </table>`;
}

// ── Products library ────────────────────────────────────────────────────────────
async function loadProducts() {
  const el = document.getElementById('products-table');
  el.innerHTML = '<p class="muted">Loading…</p>';
  const res = await fetch('/api/products');
  const { products } = await res.json();

  if (!products.length) {
    el.innerHTML = '<p class="muted">No products yet. Scrape a product URL to get started.</p>';
    return;
  }

  el.innerHTML = `<table>
    <thead><tr><th>Image</th><th>Name</th><th>Price</th><th>Added</th><th>Actions</th></tr></thead>
    <tbody>${products.map(p => {
      const img = (p.images || [])[0] || '';
      return `<tr>
        <td><img src="${img}" width="48" height="48" style="object-fit:cover;border-radius:6px" onerror="this.style.display='none'"/></td>
        <td style="max-width:280px">${p.name}</td>
        <td>$${p.price?.toFixed(2)}</td>
        <td>${new Date(p.created_at).toLocaleDateString()}</td>
        <td>
          <button onclick="useProductForVideo(${p.id}, '${p.name.replace(/'/g,'')}')" style="font-size:.78rem;padding:5px 10px">🎬 Video</button>
          <button onclick="useProductForDeal(${p.id}, '${p.name.replace(/'/g,'')}')" style="font-size:.78rem;padding:5px 10px;margin-left:4px">🛍️ Deal</button>
        </td>
      </tr>`;
    }).join('')}</tbody>
  </table>`;
}

async function publishPost(postId, platform) {
  let videoUrl = '';
  if (platform === 'instagram' || platform === 'facebook') {
    videoUrl = prompt(
      platform === 'instagram'
        ? 'Instagram Reels need a PUBLIC HTTPS video URL. Paste it here (use ngrok or cloud storage):'
        : 'Optional: paste a public video URL (or leave blank to upload the file directly):',
      ''
    );
    if (platform === 'instagram' && !videoUrl) return;
  }
  const fd = new FormData();
  if (videoUrl) fd.append('video_url', videoUrl);
  const res = await fetch(`/api/post/${postId}/publish`, { method: 'POST', body: fd });
  const data = await res.json();
  if (res.ok) {
    toast('Published', data.url, 'success');
    loadProducts();
  } else {
    toast('Publish failed', data.detail || JSON.stringify(data), 'error');
  }
}

function useProductForVideo(id, name) {
  document.querySelector('[data-tab="video"]').click();
  state.video.productId = id;
  document.getElementById('video-affiliate-section').style.display = 'block';
  document.getElementById('video-platforms-section').style.display = 'block';
  document.getElementById('video-product-preview').innerHTML =
    `<div class="product-info"><h3>${name}</h3><p class="muted">ID: ${id}</p></div>`;
  document.getElementById('video-product-preview').classList.remove('hidden');
}

function useProductForDeal(id, name) {
  document.querySelector('[data-tab="deal"]').click();
  state.deal.productId = id;
  document.getElementById('deal-affiliate-section').style.display = 'block';
  document.getElementById('deal-style-section').style.display = 'block';
  document.getElementById('deal-product-preview').innerHTML =
    `<div class="product-info"><h3>${name}</h3><p class="muted">ID: ${id}</p></div>`;
  document.getElementById('deal-product-preview').classList.remove('hidden');
}

// ── Settings Manager ───────────────────────────────────────────────────────────

const _SERVICE_LABELS = {
  groq_api_key:              { label: 'Groq AI',       icon: '🤖' },
  meta_user_access_token:    { label: 'Meta Token',    icon: '📘' },
  meta_group_id:             { label: 'FB Group ID',   icon: '👥' },
  amazon_associate_tag:      { label: 'Amazon Tag',    icon: '🛍️' },
  canva_api_token:           { label: 'Canva',         icon: '🎨' },
  youtube_refresh_token:     { label: 'YouTube',       icon: '📹' },
  tiktok_refresh_token:      { label: 'TikTok',        icon: '🎵' },
  elevenlabs_api_key:        { label: 'ElevenLabs',    icon: '🎙️' },
};

async function loadSettingsStatus() {
  try {
    const res = await fetch('/api/settings');
    if (!res.ok) return;
    const data = await res.json();
    const grid = document.getElementById('settings-status-grid');
    grid.innerHTML = Object.entries(_SERVICE_LABELS).map(([key, meta]) => {
      const info = data[key] || { set: false, preview: '' };
      const dot = info.set ? '🟢' : '⚪';
      const preview = info.set ? `<span style="color:var(--muted);font-size:.75rem">${info.preview}</span>` : '<span style="color:var(--muted);font-size:.75rem">not set</span>';
      return `<div class="status-chip">${dot} ${meta.icon} ${meta.label} ${preview}</div>`;
    }).join('');
  } catch (_) {}
}

async function testService(service) {
  const btnId    = { meta: 's-meta-test-btn', groq: 's-groq-test-btn', canva: 's-canva-test-btn', elevenlabs: 's-el-test-btn' }[service];
  const resultId = { meta: 's-meta-test-result', groq: 's-groq-test-result', canva: 's-canva-test-result', elevenlabs: 's-el-test-result' }[service];
  const btn = document.getElementById(btnId);
  const resultEl = document.getElementById(resultId);
  if (btn) { btn.textContent = '⏳'; btn.disabled = true; }
  if (resultEl) resultEl.textContent = '';
  try {
    const res = await fetch(`/api/settings/test/${service}`);
    const data = await res.json();
    if (resultEl) {
      if (data.ok) {
        const detail = data.name ? ` (${data.name})` : data.tier ? ` (${data.tier})` : data.models ? ` (${data.models} models)` : data.user ? ` (${data.user})` : '';
        resultEl.textContent = `✅ Connected${detail}`;
        resultEl.style.color = 'var(--green)';
      } else {
        resultEl.textContent = `❌ ${data.error}`;
        resultEl.style.color = 'var(--red)';
      }
    }
  } catch (e) {
    if (resultEl) { resultEl.textContent = '❌ Request failed'; resultEl.style.color = 'var(--red)'; }
  } finally {
    if (btn) { btn.textContent = '🔍 Test'; btn.disabled = false; }
  }
}

async function saveSection(section) {
  const payload = {};
  const resultEl = document.getElementById(`s-${section.replace('_', '-')}-save-result`) ||
                   document.getElementById(`s-${section}-save-result`);

  if (section === 'meta') {
    const token = document.getElementById('s-meta-token').value.trim();
    const group  = document.getElementById('s-meta-group-id').value.trim();
    const page   = document.getElementById('s-meta-page-id').value.trim();
    const ig     = document.getElementById('s-meta-ig-id').value.trim();
    if (token)  payload.meta_user_access_token = token;
    if (group)  payload.meta_group_id = group;
    if (page)   payload.meta_page_id = page;
    if (ig)     payload.meta_instagram_account_id = ig;
  } else if (section === 'amazon') {
    const tag = document.getElementById('s-amazon-tag').value.trim();
    if (tag) payload.amazon_associate_tag = tag;
  } else if (section === 'canva') {
    const token    = document.getElementById('s-canva-token').value.trim();
    const template = document.getElementById('s-canva-template').value.trim();
    if (token)    payload.canva_api_token = token;
    if (template) payload.canva_brand_template_id = template;
  } else if (section === 'ai') {
    const groq = document.getElementById('s-groq-key').value.trim();
    const el   = document.getElementById('s-el-key').value.trim();
    if (groq) payload.groq_api_key = groq;
    if (el)   payload.elevenlabs_api_key = el;
  } else if (section === 'video_platforms') {
    const yt = document.getElementById('s-yt-token').value.trim();
    const tt = document.getElementById('s-tt-token').value.trim();
    if (yt) payload.youtube_refresh_token = yt;
    if (tt) payload.tiktok_refresh_token = tt;
  }

  if (!Object.keys(payload).length) {
    if (resultEl) { resultEl.textContent = 'Nothing to save — fill at least one field.'; resultEl.style.color = 'var(--muted)'; }
    return;
  }

  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (resultEl) {
      resultEl.textContent = res.ok
        ? `✅ Saved ${data.count} key(s): ${data.updated.join(', ')}`
        : `❌ ${data.detail || 'Save failed'}`;
      resultEl.style.color = res.ok ? 'var(--green)' : 'var(--red)';
    }
    if (res.ok) {
      // Clear fields + refresh status
      document.querySelectorAll(`#tab-settings input[type=password]`).forEach(el => { el.value = ''; });
      loadSettingsStatus();
    }
  } catch (e) {
    if (resultEl) { resultEl.textContent = '❌ Request failed'; resultEl.style.color = 'var(--red)'; }
  }
}

// Auto-load settings when switching to the settings tab
document.querySelector('[data-tab="settings"]').addEventListener('click', loadSettingsStatus);

// ── Analytics ──────────────────────────────────────────────────────────────────
async function loadAnalytics() {
  const res = await fetch('/api/analytics');
  const { clicks_by_network, posts_by_platform } = await res.json();
  renderBarChart('clicks-chart', clicks_by_network, 'clicks');
  renderBarChart('posts-chart', posts_by_platform, 'posts');
}

// ── The Desk Ticker (with animated count-up) ──────────────────────────────────
function animateNumber(el, to, opts = {}) {
  const prefix   = opts.prefix || '';
  const suffix   = opts.suffix || '';
  const decimals = opts.decimals ?? 0;
  const duration = opts.duration || 1200;
  const from = parseFloat((el.dataset.value || '0'));
  if (from === to) return;
  el.dataset.value = String(to);
  const start = performance.now();
  // easeOutExpo — characteristic premium count-up curve
  const ease = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const v = from + (to - from) * ease(t);
    el.textContent = prefix + v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function refreshTicker() {
  try {
    const [analytics, posts] = await Promise.all([
      fetch('/api/analytics').then(r => r.ok ? r.json() : null),
      fetch('/api/posts').then(r => r.ok ? r.json() : null),
    ]);
    if (!analytics || !posts) return;

    const totalClicks = Object.values(analytics.clicks_by_network || {}).reduce((a, b) => a + b, 0);
    const totalPosts  = (posts.posts || []).length;
    const revenue     = totalClicks * 0.85;   // €0.85 avg commission per click

    const rev  = document.getElementById('ticker-revenue');
    const pst  = document.getElementById('ticker-posts');
    const ctr  = document.getElementById('ticker-ctr');
    if (rev) animateNumber(rev, revenue,    { prefix: '€', decimals: 2 });
    if (pst) animateNumber(pst, totalPosts, { decimals: 0 });
    if (ctr) animateNumber(ctr, totalClicks,{ decimals: 0 });
  } catch (_) { /* silent — ticker is decorative */ }
}
refreshTicker();
setInterval(refreshTicker, 30000);

// ── Toast notification system ─────────────────────────────────────────────────
// Usage: toast('Saved', 'Your meta token is live', 'success')
//        toast('Oops', 'Something broke', 'error')
//        toast(null, 'Quick info', 'info')
window.toast = function toast(title, body, type = 'info', duration = 4200) {
  const stack = document.getElementById('toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toast-icon"></div>
    <div class="toast-body">${title ? `<strong>${title}</strong>` : ''}${body || ''}</div>
  `;
  stack.appendChild(el);
  const close = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 250);
  };
  el.addEventListener('click', close);
  setTimeout(close, duration);
};

// ── Cursor spotlight (subtle halo following the mouse) ────────────────────────
(() => {
  const spot = document.getElementById('cursor-spot');
  if (!spot) return;
  let tx = window.innerWidth / 2, ty = window.innerHeight / 2;
  let cx = tx, cy = ty;
  document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
  document.addEventListener('mouseleave', () => { spot.style.opacity = 0; });
  document.addEventListener('mouseenter', () => { spot.style.opacity = 1; });
  function loop() {
    cx += (tx - cx) * 0.12;   // smooth follow easing
    cy += (ty - cy) * 0.12;
    spot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  }
  loop();
})();

// ── Cmd+K command palette ─────────────────────────────────────────────────────
const CMDK_COMMANDS = [
  { group: 'Navigation', label: 'Spin up a video',        action: () => switchTab('video'),     icon: '01' },
  { group: 'Navigation', label: 'Cook a deal post',       action: () => switchTab('deal'),      icon: '02' },
  { group: 'Navigation', label: 'Auto-pilot & queue',     action: () => switchTab('scheduler'), icon: '03' },
  { group: 'Navigation', label: "What we've scraped",     action: () => switchTab('products'),  icon: '04' },
  { group: 'Navigation', label: 'The numbers',            action: () => switchTab('analytics'), icon: '05' },
  { group: 'Navigation', label: 'Keys & plumbing',        action: () => switchTab('settings'),  icon: '06' },
  { group: 'Actions',    label: 'Refresh products library', action: () => { switchTab('products'); loadProducts?.(); }, icon: '↻' },
  { group: 'Actions',    label: 'Refresh analytics',        action: () => { switchTab('analytics'); loadAnalytics?.(); }, icon: '↻' },
  { group: 'Actions',    label: 'Reload settings status',   action: () => { switchTab('settings'); loadSettingsStatus?.(); }, icon: '↻' },
  { group: 'Actions',    label: 'Toggle theme (dark/light)', action: () => window.toggleTheme(), icon: '◐' },
  { group: 'Actions',    label: 'Toggle sound effects',     action: () => { window.sfx.enabled = !window.sfx.enabled; toast('Sound', window.sfx.enabled ? 'On' : 'Off', 'info'); }, icon: '♪' },
  { group: 'Actions',    label: 'Show keyboard shortcuts',  action: () => window.openShortcuts(), icon: '?' },
  { group: 'External',   label: 'Open Facebook Group',    action: () => window.open('https://facebook.com/groups/1174813066850818', '_blank'), icon: '↗' },
  { group: 'External',   label: 'Open Canva template',    action: () => window.open('https://www.canva.com/design/DAG543g8dLc/edit', '_blank'), icon: '↗' },
  { group: 'External',   label: 'Open Groq console',      action: () => window.open('https://console.groq.com', '_blank'), icon: '↗' },
  { group: 'External',   label: 'Open Meta Graph Explorer', action: () => window.open('https://developers.facebook.com/tools/explorer/', '_blank'), icon: '↗' },
];

function switchTab(name) {
  const btn = document.querySelector(`.tab-btn[data-tab="${name}"]`);
  if (btn) btn.click();
}

let _cmdkIdx = 0;
let _cmdkFiltered = [];

function openCmdK() {
  const bd = document.getElementById('cmdk-backdrop');
  bd.classList.add('open');
  const input = document.getElementById('cmdk-input');
  input.value = '';
  _cmdkIdx = 0;
  renderCmdK('');
  setTimeout(() => input.focus(), 30);
}
function closeCmdK() {
  document.getElementById('cmdk-backdrop')?.classList.remove('open');
}
window.openCmdK = openCmdK;
window.closeCmdK = closeCmdK;

function renderCmdK(query) {
  const q = query.trim().toLowerCase();
  _cmdkFiltered = q
    ? CMDK_COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
    : CMDK_COMMANDS;
  if (_cmdkIdx >= _cmdkFiltered.length) _cmdkIdx = 0;

  const grouped = {};
  _cmdkFiltered.forEach(c => { (grouped[c.group] ??= []).push(c); });
  const res = document.getElementById('cmdk-results');

  if (!_cmdkFiltered.length) {
    res.innerHTML = `<div class="cmdk-item" style="opacity:.55;cursor:default">No results for "${query}".</div>`;
    return;
  }

  let html = '';
  let runningIdx = 0;
  Object.entries(grouped).forEach(([group, items]) => {
    html += `<div class="cmdk-group-label">${group}</div>`;
    items.forEach(c => {
      const isActive = runningIdx === _cmdkIdx;
      html += `
        <div class="cmdk-item ${isActive ? 'active' : ''}" data-idx="${runningIdx}">
          <div class="cmdk-item-icon">${c.icon}</div>
          <div class="cmdk-item-label">${c.label}</div>
          <div class="cmdk-item-shortcut">Enter ↵</div>
        </div>`;
      runningIdx++;
    });
  });
  res.innerHTML = html;

  res.querySelectorAll('.cmdk-item[data-idx]').forEach(el => {
    el.addEventListener('mouseenter', () => {
      _cmdkIdx = parseInt(el.dataset.idx);
      renderCmdK(query);
    });
    el.addEventListener('click', () => executeCmdK(query));
  });
}

function executeCmdK(query) {
  const cmd = _cmdkFiltered[_cmdkIdx];
  if (!cmd) return;
  closeCmdK();
  cmd.action();
}

document.addEventListener('keydown', (e) => {
  // Open palette
  if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    const bd = document.getElementById('cmdk-backdrop');
    if (bd.classList.contains('open')) closeCmdK(); else openCmdK();
    return;
  }
  // Close on Escape
  if (e.key === 'Escape') {
    closeCmdK();
    return;
  }
  // Navigation inside palette
  const bd = document.getElementById('cmdk-backdrop');
  if (!bd?.classList.contains('open')) return;
  const input = document.getElementById('cmdk-input');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    _cmdkIdx = Math.min(_cmdkIdx + 1, _cmdkFiltered.length - 1);
    renderCmdK(input.value);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    _cmdkIdx = Math.max(_cmdkIdx - 1, 0);
    renderCmdK(input.value);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    executeCmdK(input.value);
  }
});

document.getElementById('cmdk-input')?.addEventListener('input', (e) => {
  _cmdkIdx = 0;
  renderCmdK(e.target.value);
});

// ── Keyboard shortcuts overlay + bindings ───────────────────────────────────
window.openShortcuts  = () => { document.getElementById('kbd-overlay')?.classList.add('open');    window.sfx?.open(); };
window.closeShortcuts = () => { document.getElementById('kbd-overlay')?.classList.remove('open'); window.sfx?.close(); };

// G-then-X chord state
let _chord = null;
let _chordTimeout = null;
const TAB_FROM_KEY = { v: 'video', d: 'deal', q: 'scheduler', l: 'products', n: 'analytics', s: 'settings' };

document.addEventListener('keydown', (e) => {
  // Skip when typing in any input/textarea/contenteditable
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

  // ESC closes the kbd overlay
  if (e.key === 'Escape') {
    window.closeShortcuts();
    return;
  }

  // ? opens shortcuts (shift+/ in many layouts)
  if (e.key === '?' || (e.shiftKey && e.key === '/')) {
    e.preventDefault();
    const el = document.getElementById('kbd-overlay');
    el?.classList.contains('open') ? window.closeShortcuts() : window.openShortcuts();
    return;
  }

  // T → toggle theme,  M → toggle sound
  if (!e.metaKey && !e.ctrlKey && !e.altKey) {
    if (e.key === 't' || e.key === 'T') { window.toggleTheme(); return; }
    if (e.key === 'm' || e.key === 'M') {
      window.sfx.enabled = !window.sfx.enabled;
      toast('Sound', window.sfx.enabled ? 'On' : 'Off', 'info');
      return;
    }
  }

  // G-then-X chord
  if (_chord === 'g' && TAB_FROM_KEY[e.key.toLowerCase()]) {
    e.preventDefault();
    switchTab(TAB_FROM_KEY[e.key.toLowerCase()]);
    _chord = null;
    clearTimeout(_chordTimeout);
    return;
  }
  if (e.key === 'g' || e.key === 'G') {
    _chord = 'g';
    clearTimeout(_chordTimeout);
    _chordTimeout = setTimeout(() => { _chord = null; }, 1200);
    return;
  }
});

// ── UI sound system (Web Audio, synthesized, no files) ─────────────────────
// Subtle Superhuman-style clicks. Volume capped low so it never annoys.
// Toggle: window.sfx.enabled = false  (stored in localStorage)
window.sfx = (() => {
  let ctx = null;
  let enabled = localStorage.getItem('aap_sfx') !== 'off';
  let userInteracted = false;
  // Audio needs user interaction first (browser policy)
  const unlock = () => { userInteracted = true; document.removeEventListener('pointerdown', unlock); };
  document.addEventListener('pointerdown', unlock, { once: true });

  function tone(freq, dur = 0.1, type = 'sine', gain = 0.06, attack = 0.005) {
    if (!enabled || !userInteracted) return;
    try {
      ctx ??= new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ctx.currentTime);
      g.gain.linearRampToValueAtTime(gain, ctx.currentTime + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch (_) {}
  }

  return {
    click:   () => tone(880, 0.04, 'square', 0.025, 0.001),
    tab:     () => tone(660, 0.05, 'sine',   0.04,  0.002),
    success: () => { tone(523, 0.08, 'sine', 0.05); setTimeout(() => tone(659, 0.08, 'sine', 0.05), 60); setTimeout(() => tone(784, 0.14, 'sine', 0.05), 120); },
    error:   () => { tone(330, 0.08, 'sawtooth', 0.04); setTimeout(() => tone(220, 0.12, 'sawtooth', 0.04), 70); },
    open:    () => tone(440, 0.18, 'sine',   0.035, 0.01),   // cmd-K open
    close:   () => tone(330, 0.10, 'sine',   0.025, 0.005),
    set enabled(v) { enabled = v; localStorage.setItem('aap_sfx', v ? 'on' : 'off'); },
    get enabled() { return enabled; },
  };
})();

// Wire sounds to UI events globally — minimal noise, max signal
document.addEventListener('click', (e) => {
  const t = e.target.closest('button, .tab-btn, .cmdk-item, .status-chip');
  if (!t) return;
  if (t.classList?.contains('tab-btn'))      window.sfx.tab();
  else if (t.classList?.contains('cmdk-item')) window.sfx.tab();
  else if (t.classList?.contains('btn-primary')) window.sfx.click();
  else window.sfx.click();
});

// Wrap toast() so success/error play their tones
(() => {
  const _toast = window.toast;
  window.toast = function(title, body, type, dur) {
    if (type === 'success') window.sfx?.success();
    else if (type === 'error') window.sfx?.error();
    return _toast(title, body, type, dur);
  };
})();

// Wrap cmd-K open/close
(() => {
  const _open = window.openCmdK, _close = window.closeCmdK;
  window.openCmdK  = () => { window.sfx?.open();  _open(); };
  window.closeCmdK = () => { window.sfx?.close(); _close(); };
})();

// ── 3D card tilt (Apple-magic-mouse style) ──────────────────────────────────
(() => {
  const MAX_TILT = 4;   // degrees — subtle, never gimmicky
  document.addEventListener('mousemove', (e) => {
    const card = e.target.closest?.('.card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;     // 0..1
    const y = (e.clientY - rect.top)  / rect.height;
    const rx = (0.5 - y) * MAX_TILT;
    const ry = (x - 0.5) * MAX_TILT;
    card.style.transform = `translateY(-2px) perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  }, { passive: true });

  // Reset on leave — use mouseleave on each card individually for fast reset
  document.addEventListener('mouseout', (e) => {
    const card = e.target.closest?.('.card');
    if (!card) return;
    // Only reset if pointer truly left the card
    if (!card.contains(e.relatedTarget)) {
      card.style.transform = '';
    }
  });
})();

function renderBarChart(containerId, data, unit) {
  const el = document.getElementById(containerId);
  const entries = Object.entries(data || {});
  if (!entries.length) {
    el.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 120 60" width="100%" height="80" style="opacity:.35">
          <path d="M5 50 Q 25 30, 45 35 T 85 25 T 115 15" stroke="url(#emptyG)" stroke-width="2" fill="none" stroke-dasharray="3 5"/>
          <defs><linearGradient id="emptyG" x1="0" x2="1"><stop offset="0" stop-color="#8b67ff"/><stop offset="1" stop-color="#e068ff"/></linearGradient></defs>
        </svg>
        <p class="muted" style="text-align:center;margin-top:8px">No data yet — waiting on first clicks.</p>
      </div>`;
    return;
  }

  const total = entries.reduce((a, [, v]) => a + v, 0) || 1;
  const max = Math.max(...entries.map(([, v]) => v)) || 1;

  // Premium animated bars — gradient + stroke-dasharray reveal
  const bars = entries.map(([k, v], i) => {
    const pct = (v / max) * 100;
    const share = ((v / total) * 100).toFixed(1);
    const delay = i * 80;
    return `
      <div class="bar-row premium">
        <span class="bar-label">${k}</span>
        <div class="bar-track">
          <svg class="bar-svg" viewBox="0 0 100 8" preserveAspectRatio="none">
            <defs>
              <linearGradient id="bg-${containerId}-${i}" x1="0" x2="1">
                <stop offset="0" stop-color="#8b67ff"/>
                <stop offset=".55" stop-color="#e068ff"/>
                <stop offset="1" stop-color="#e6c478"/>
              </linearGradient>
            </defs>
            <line x1="0" y1="4" x2="100" y2="4" stroke="rgba(255,255,255,.04)" stroke-width="8"/>
            <line x1="0" y1="4" x2="${pct}" y2="4"
                  stroke="url(#bg-${containerId}-${i})" stroke-width="8" stroke-linecap="round"
                  style="stroke-dasharray:${pct} 100; stroke-dashoffset:${pct}; animation: bar-grow .9s cubic-bezier(.16,1,.3,1) ${delay}ms forwards"/>
          </svg>
        </div>
        <span class="bar-val"><strong>${v.toLocaleString()}</strong><em>${share}%</em></span>
      </div>`;
  }).join('');

  el.innerHTML = `<div class="bar-chart">${bars}</div>`;
}
