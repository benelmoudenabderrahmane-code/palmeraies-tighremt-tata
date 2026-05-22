/* ════════════════════════════════════════════════════════════
 *  MULTI-PLATFORM PIPELINE
 *  Upload video → SEO → Publish (YT/TT/IG/FB)
 * ════════════════════════════════════════════════════════════ */

let mpUploadedVideo = null;

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('mp-video-file');
  if (fileInput) fileInput.addEventListener('change', mpUploadVideo);

  const previewBtn = document.getElementById('mp-preview-btn');
  if (previewBtn) previewBtn.addEventListener('click', mpPreviewSeo);

  const publishBtn = document.getElementById('mp-publish-btn');
  if (publishBtn) publishBtn.addEventListener('click', mpPublishAll);

  const refreshBtn = document.getElementById('trending-refresh');
  if (refreshBtn) refreshBtn.addEventListener('click', loadTrendingProducts);
});

async function mpUploadVideo(e) {
  const file = e.target.files[0];
  if (!file) return;

  const status = document.getElementById('mp-upload-status');
  status.textContent = `Uploading ${file.name} (${(file.size/1024/1024).toFixed(1)} MB)...`;

  const fd = new FormData();
  fd.append('video', file);
  try {
    const r = await fetch('/api/multi-platform/upload', { method: 'POST', body: fd });
    const data = await r.json();
    if (!r.ok) throw new Error(data.detail || 'Upload failed');

    mpUploadedVideo = data;
    status.innerHTML = `<span class="status-dot live"></span>Uploaded · ${data.size_mb} MB`;
    if (window.toast) toast('Video uploaded', `${data.size_mb} MB ready to publish`, 'success', 3000);

    const preview = document.getElementById('mp-video-preview');
    preview.innerHTML = `<video src="${data.video_url}" controls style="max-width:300px;border-radius:8px"></video>`;
    document.getElementById('mp-product-card').style.display = 'block';
    document.getElementById('mp-product-card').scrollIntoView({behavior:'smooth', block:'start'});
  } catch (err) {
    status.innerHTML = `<span class="status-dot down"></span>${err.message}`;
    if (window.toast) toast('Upload failed', err.message, 'error');
  }
}

function _mpFormData() {
  const platforms = Array.from(document.querySelectorAll('.mp-platform:checked'))
    .map(c => c.value).join(',');
  const fd = new FormData();
  fd.append('product_name', document.getElementById('mp-product-name').value);
  fd.append('niche', document.getElementById('mp-niche').value);
  fd.append('price', document.getElementById('mp-price').value || '0');
  fd.append('affiliate_link', document.getElementById('mp-affiliate').value);
  fd.append('features', JSON.stringify(
    document.getElementById('mp-features').value.split('\n').map(s => s.trim()).filter(Boolean)
  ));
  fd.append('platforms', platforms);
  return fd;
}

async function mpPreviewSeo() {
  const fd = _mpFormData();
  fd.delete('platforms');
  const r = await fetch('/api/multi-platform/seo-preview', { method: 'POST', body: fd });
  const data = await r.json();

  const box = document.getElementById('mp-seo-preview');
  const c = document.getElementById('mp-seo-content');
  c.innerHTML = `
    <p><strong>Vercel redirect:</strong> <a href="${data.vercel_url}" target="_blank">${data.vercel_url}</a></p>
    <h4>YouTube</h4>
    <p><strong>Title:</strong> ${data.seo.youtube.title}</p>
    <pre style="white-space:pre-wrap;background:#0001;padding:8px;border-radius:6px">${data.seo.youtube.description}</pre>
    <p><strong>Tags:</strong> ${data.seo.youtube.tags.join(', ')}</p>
    <h4>TikTok</h4>
    <p>${data.seo.tiktok.caption}</p>
    <p><strong>Hashtags:</strong> ${data.seo.tiktok.hashtags.join(' ')}</p>
    <h4>Instagram</h4>
    <pre style="white-space:pre-wrap;background:#0001;padding:8px;border-radius:6px">${data.seo.instagram.caption}</pre>
    <p><strong>Hashtags:</strong> ${data.seo.instagram.hashtags.join(' ')}</p>
    <h4>Facebook</h4>
    <pre style="white-space:pre-wrap;background:#0001;padding:8px;border-radius:6px">${data.seo.facebook.post_text}</pre>
  `;
  box.style.display = 'block';
}

async function mpPublishAll() {
  if (!mpUploadedVideo) {
    if (window.toast) toast('No video', 'Upload a video first', 'warn');
    else alert('Upload a video first');
    return;
  }
  const fd = _mpFormData();
  fd.append('video_path', mpUploadedVideo.video_path);
  const platforms = Array.from(document.querySelectorAll('.mp-platform:checked')).map(c => c.value);

  const btn = document.getElementById('mp-publish-btn');
  btn.disabled = true;
  btn.textContent = 'Publishing...';

  // Show animated progress overlay
  if (window.showPublishProgress) {
    showPublishProgress(platforms);
    setTimeout(() => updatePublishStep('redirect', 'active'), 100);
    setTimeout(() => { updatePublishStep('redirect', 'done'); updatePublishStep('seo', 'active'); }, 2500);
    setTimeout(() => {
      updatePublishStep('seo', 'done');
      platforms.forEach((p, i) => setTimeout(() => updatePublishStep(`pub-${p}`, 'active'), i * 400));
    }, 8000);
  }

  try {
    const r = await fetch('/api/multi-platform/publish', { method: 'POST', body: fd });
    const data = await r.json();
    pollJobStatus(data.job_id, (result) => {
      // Mark all platforms done
      if (window.updatePublishStep) {
        platforms.forEach(p => updatePublishStep(`pub-${p}`, 'done'));
        updatePublishStep('done', 'done');
      }
      setTimeout(() => {
        if (window.hidePublishProgress) hidePublishProgress();
        renderMpResults(result);
        if (window.toast) {
          const ok = Object.values(result.publish || {}).filter(p => p.status === 'success').length;
          const fail = Object.keys(result.publish || {}).length - ok;
          toast(`Published to ${ok}/${ok + fail} platforms`,
            fail ? `${fail} platform(s) failed — check results` : 'Affiliate link live everywhere',
            fail ? 'warn' : 'success', 6000);
        }
      }, 1200);
    });
  } catch (err) {
    if (window.hidePublishProgress) hidePublishProgress();
    if (window.toast) toast('Publish error', err.message, 'error', 6000);
    else alert(`Publish error: ${err.message}`);
    btn.disabled = false;
    btn.textContent = 'Publish to all platforms';
  }
}

function renderMpResults(result) {
  const box = document.getElementById('mp-results');
  const c = document.getElementById('mp-results-content');
  const publish = result.publish || {};
  c.innerHTML = `
    <p>Affiliate URL: <a href="${result.vercel_url}" target="_blank">${result.vercel_url}</a></p>
    <table style="width:100%;border-collapse:collapse">
      <tr><th>Platform</th><th>Status</th><th>URL / Error</th></tr>
      ${Object.entries(publish).map(([p, r]) => `
        <tr>
          <td>${p}</td>
          <td>${r.status === 'success' ? 'OK' : 'FAIL'} ${r.status}</td>
          <td>${r.url ? `<a href="${r.url}" target="_blank">${r.url}</a>` : (r.error || '')}</td>
        </tr>
      `).join('')}
    </table>
  `;
  box.style.display = 'block';
  const btn = document.getElementById('mp-publish-btn');
  btn.disabled = false;
  btn.textContent = 'Publish to all platforms';
}

async function pollJobStatus(jobId, onDone) {
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const r = await fetch(`/api/job/${jobId}/status`);
    const data = await r.json();
    if (data.status === 'done') {
      try { return onDone(JSON.parse(data.result || '{}')); }
      catch { return onDone({}); }
    }
    if (data.status === 'failed') {
      alert(`Job failed: ${data.result || 'unknown'}`);
      return;
    }
  }
}

/* ════════════════════════════════════════════════════════════
 *  TRENDING PRODUCTS DISCOVERY
 * ════════════════════════════════════════════════════════════ */

async function loadTrendingProducts() {
  const cat = document.getElementById('trending-category').value;
  const grid = document.getElementById('trending-grid');
  const count = document.getElementById('trending-count');

  grid.innerHTML = '<p>Scanning Amazon best sellers...</p>';
  count.textContent = '';

  try {
    const url = cat ? `/api/trending/products?category=${cat}` : '/api/trending/products';
    const r = await fetch(url);
    const data = await r.json();

    if (data.error) {
      grid.innerHTML = `<p>ERROR: ${data.error}</p>`;
      return;
    }

    count.textContent = `${data.count} products found`;
    grid.innerHTML = data.products.map(p => {
      const titleSafe = p.title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return `
        <div class="trending-card">
          ${p.image_url ? `<img src="${p.image_url}" alt=""/>` : ''}
          <div class="t-body">
            <div class="t-category">${p.category} · #${p.rank_in_category}</div>
            <h4>${p.title}</h4>
            <div class="t-meta">
              ${p.rating > 0 ? `★ ${p.rating}` : ''}
              ${p.price > 0 ? `· €${p.price.toFixed(2)}` : ''}
              · score ${p.score}
            </div>
            <div class="t-actions">
              <a href="${p.amazon_url}" target="_blank" class="btn-secondary">Amazon →</a>
              <button class="btn-primary" onclick="useThisProduct('${p.asin}', '${titleSafe}', ${p.price}, '${p.category}')">Use for video</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = `<p>ERROR: ${err.message}</p>`;
  }
}

function useThisProduct(asin, title, price, category) {
  document.querySelector('[data-tab="multi"]').click();
  document.getElementById('mp-product-name').value = title;
  document.getElementById('mp-niche').value = category;
  document.getElementById('mp-price').value = price;
  document.getElementById('mp-affiliate').value = `https://www.amazon.fr/dp/${asin}`;
  document.getElementById('mp-product-card').scrollIntoView({behavior:'smooth'});
}
