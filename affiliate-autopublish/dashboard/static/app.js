// ── State ──────────────────────────────────────────────────────────────────────
const state = {
  video: { productId: null, affiliateLink: '' },
  deal:  { productId: null, affiliateLink: '', postId: null },
};

// ── Tab switching ──────────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'products')  loadProducts();
    if (btn.dataset.tab === 'analytics') loadAnalytics();
    if (btn.dataset.tab === 'scheduler') loadQueuedPosts();
  });
});

// ── Scrape product ──────────────────────────────────────────────────────────────
async function scrapeProduct(ctx) {
  const urlEl = document.getElementById(`${ctx}-url`);
  const url = urlEl.value.trim();
  if (!url) { alert('Enter a product URL first.'); return; }

  const btn = document.getElementById(`${ctx}-scrape-btn`);
  btn.textContent = 'Scraping…'; btn.disabled = true;

  try {
    const fd = new FormData(); fd.append('url', url);
    const res = await fetch('/api/scrape', { method: 'POST', body: fd });
    if (!res.ok) { alert('Scrape failed: ' + await res.text()); return; }
    const { product } = await res.json();

    state[ctx].productId = product.id;

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
  const net = document.getElementById(`${ctx}-network`).value;
  const mavelyNote  = document.getElementById(`${ctx}-mavely-note`);
  const customLink  = document.getElementById(`${ctx}-custom-link`);
  const howlBtn     = document.getElementById(`${ctx}-gen-howl`);

  mavelyNote.classList.toggle('hidden', net !== 'mavely');
  customLink.classList.toggle('hidden', net !== 'mavely' && net !== 'custom');
  if (howlBtn) howlBtn.classList.toggle('hidden', net !== 'howl');

  // Clear stale link display
  document.getElementById(`${ctx}-link-display`).textContent = '';
  state[ctx].affiliateLink = '';

  // Auto-generate non-manual links
  if (net === 'amazon' || net === 'walmart') {
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
  state[ctx].affiliateLink = data.redirect_url;
  document.getElementById(`${ctx}-link-display`).textContent = '✅ ' + data.redirect_url;
}

// ── Start video campaign ────────────────────────────────────────────────────────
async function startVideoCampaign() {
  const pid = state.video.productId;
  if (!pid) { alert('Scrape a product first.'); return; }

  // Use state link or generate one
  let link = state.video.affiliateLink;
  if (!link) {
    const net = document.getElementById('video-network').value;
    const custom = document.getElementById('video-custom-link').value.trim();
    const fd = new FormData();
    fd.append('product_id', pid); fd.append('network', net);
    if (custom) fd.append('custom_link', custom);
    const r = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
    if (!r.ok) { alert('Could not generate affiliate link.'); return; }
    link = (await r.json()).redirect_url;
    state.video.affiliateLink = link;
  }

  const platforms = [...document.querySelectorAll('input[name=vplatform]:checked')]
    .map(c => c.value).join(',');
  if (!platforms) { alert('Select at least one platform.'); return; }

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
  if (!res.ok) { alert('Failed to start job: ' + await res.text()); return; }

  const { job_id } = await res.json();
  trackJob(job_id, 'video-job-status', 'video-job-msg');
}

// ── Generate deal post ──────────────────────────────────────────────────────────
async function generateDealPost() {
  const pid = state.deal.productId;
  if (!pid) { alert('Scrape a product first.'); return; }

  let link = state.deal.affiliateLink;
  if (!link) {
    const net = document.getElementById('deal-network').value;
    const custom = document.getElementById('deal-custom-link').value.trim();
    const fd = new FormData();
    fd.append('product_id', pid); fd.append('network', net);
    if (custom) fd.append('custom_link', custom);
    const r = await fetch('/api/affiliate/generate', { method: 'POST', body: fd });
    if (!r.ok) { alert('Could not generate affiliate link.'); return; }
    link = (await r.json()).redirect_url;
    state.deal.affiliateLink = link;
  }

  const style   = document.getElementById('deal-style').value;
  const network = document.getElementById('deal-network').value;
  const fd = new FormData();
  fd.append('product_id', pid);
  fd.append('affiliate_link', link);
  fd.append('style', style);
  fd.append('network', network);

  const btn = document.getElementById('deal-gen-btn');
  btn.textContent = '⏳ Generating…'; btn.disabled = true;

  const res = await fetch('/api/deal-post/generate', { method: 'POST', body: fd });
  btn.textContent = '✍️ Generate Deal Post'; btn.disabled = false;
  if (!res.ok) { alert('Error: ' + await res.text()); return; }

  const { job_id } = await res.json();

  // Poll until done
  const pollInterval = setInterval(async () => {
    const s = await fetch(`/api/job/${job_id}/status`).then(r => r.json());
    if (s.status === 'done' && s.result) {
      clearInterval(pollInterval);
      const result = typeof s.result === 'string' ? JSON.parse(s.result) : s.result;
      state.deal.postId = result.post_id;
      document.getElementById('deal-text-preview').value = result.post_text || '';
      const imgPath = (result.image_path || '').replace(/\\/g, '/');
      if (imgPath) document.getElementById('deal-image-preview').src = '/' + imgPath;
      document.getElementById('deal-preview').classList.remove('hidden');
    } else if (s.status === 'failed') {
      clearInterval(pollInterval);
      alert('Generation failed: ' + (s.error || 'unknown error'));
    }
  }, 1500);
}

// ── Publish deal post now ───────────────────────────────────────────────────────
async function publishDealNow() {
  const postId = state.deal.postId;
  if (!postId) { alert('Generate a deal post first.'); return; }

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
  alert('✅ Post is already in the queue with status "ready".\nIt will be auto-posted according to your scheduler settings.');
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
    alert('✅ Published: ' + data.url);
    loadProducts();
  } else {
    alert('❌ ' + (data.detail || JSON.stringify(data)));
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

// ── Analytics ──────────────────────────────────────────────────────────────────
async function loadAnalytics() {
  const res = await fetch('/api/analytics');
  const { clicks_by_network, posts_by_platform } = await res.json();
  renderBarChart('clicks-chart', clicks_by_network, 'clicks');
  renderBarChart('posts-chart', posts_by_platform, 'posts');
}

function renderBarChart(containerId, data, unit) {
  const el = document.getElementById(containerId);
  const entries = Object.entries(data || {});
  if (!entries.length) {
    el.innerHTML = '<p class="muted">No data yet.</p>';
    return;
  }
  const max = Math.max(...entries.map(([, v]) => v)) || 1;
  el.innerHTML = `<div class="bar-chart">${entries.map(([k, v]) => `
    <div class="bar-row">
      <span class="bar-label">${k}</span>
      <div class="bar-fill" style="width:${Math.max((v / max) * 220, 4).toFixed(0)}px"></div>
      <span class="bar-val">${v} ${unit}</span>
    </div>`).join('')}
  </div>`;
}
