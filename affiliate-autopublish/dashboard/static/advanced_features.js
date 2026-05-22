/* ════════════════════════════════════════════════════════════
 *  Advanced UI features wiring
 *  Predictor score · Thumbnail · Schedule · Translator
 * ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  injectAdvancedControls();
});

function injectAdvancedControls() {
  const productCard = document.getElementById('mp-product-card');
  if (!productCard) return;

  // Insert advanced panel before the Preview/Publish buttons
  const panel = document.createElement('div');
  panel.style.marginTop = '20px';
  panel.style.paddingTop = '20px';
  panel.style.borderTop = '1px solid rgba(255,255,255,0.08)';
  panel.innerHTML = `
    <h4>⚡ Advanced</h4>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:10px">
      <button id="mp-score-btn" class="btn-secondary">🎯 Predict performance</button>
      <button id="mp-thumb-btn" class="btn-secondary">🖼️ Generate thumbnail</button>
      <button id="mp-translate-btn" class="btn-secondary">🌐 Translate</button>
      <button id="mp-schedule-btn" class="btn-secondary">📅 Schedule publish</button>
    </div>

    <div id="predictor-result" style="margin-top:14px"></div>
    <div id="thumbnail-result" style="margin-top:14px"></div>
    <div id="translator-result" style="margin-top:14px"></div>
    <div id="schedule-panel" style="display:none;margin-top:14px" class="schedule-card">
      <label>Publish at (your local time)</label>
      <input type="datetime-local" id="mp-schedule-time"/>
      <button id="mp-schedule-confirm" class="btn-primary" style="margin-top:10px">📅 Schedule</button>
    </div>
  `;
  productCard.appendChild(panel);

  document.getElementById('mp-score-btn')?.addEventListener('click', runPredictor);
  document.getElementById('mp-thumb-btn')?.addEventListener('click', generateThumbnail);
  document.getElementById('mp-translate-btn')?.addEventListener('click', runTranslator);
  document.getElementById('mp-schedule-btn')?.addEventListener('click', () => {
    document.getElementById('schedule-panel').style.display = 'block';
  });
  document.getElementById('mp-schedule-confirm')?.addEventListener('click', schedulePublish);
}

async function runPredictor() {
  const fd = new FormData();
  fd.append('title', document.getElementById('mp-product-name').value + ' #Shorts');
  fd.append('caption', document.getElementById('mp-features').value);
  fd.append('hashtags', '#fyp #viral #' + (document.getElementById('mp-niche').value || 'product'));
  fd.append('niche', document.getElementById('mp-niche').value);
  fd.append('product_name', document.getElementById('mp-product-name').value);
  fd.append('features', document.getElementById('mp-features').value);

  const target = document.getElementById('predictor-result');
  target.innerHTML = '<p>⏳ Scoring...</p>';

  try {
    const r = await fetch('/api/predictor/score', { method: 'POST', body: fd });
    const data = await r.json();
    renderPredictor(data);
  } catch (err) {
    target.innerHTML = `<p>ERROR: ${err.message}</p>`;
  }
}

function renderPredictor(data) {
  const target = document.getElementById('predictor-result');
  const b = data.breakdown;
  target.innerHTML = `
    <div class="predictor-badge ${data.grade}">
      <span class="predictor-score">${data.score}/100</span>
      <span>Grade ${data.grade}</span>
      <span>${data.verdict}</span>
    </div>
    <div class="predictor-bar-list" style="margin-top:12px">
      ${Object.entries(b).map(([k, v]) => {
        const pct = (v.score / v.max) * 100;
        const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#eab308' : '#ef4444';
        return `
          <div class="breakdown-row">
            <div style="text-transform:capitalize">${k}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div>
            <div class="bar-value">${v.score}/${v.max}</div>
          </div>
        `;
      }).join('')}
    </div>
    ${data.improvements.length ? `
      <details style="margin-top:14px;font-size:0.9em">
        <summary style="cursor:pointer;color:#d4af37">💡 ${data.improvements.length} improvements</summary>
        <ul style="margin-top:8px;line-height:1.6">
          ${data.improvements.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </details>
    ` : ''}
  `;
}

async function generateThumbnail() {
  const target = document.getElementById('thumbnail-result');
  target.innerHTML = '<p>⏳ Generating thumbnail...</p>';

  const fd = new FormData();
  fd.append('product_name', document.getElementById('mp-product-name').value);
  fd.append('price', document.getElementById('mp-price').value || '0');
  fd.append('niche', document.getElementById('mp-niche').value || 'default');
  fd.append('format', 'shorts');

  try {
    const r = await fetch('/api/thumbnail/generate', { method: 'POST', body: fd });
    const data = await r.json();
    target.innerHTML = `
      <p style="margin-bottom:8px">✨ Thumbnail generated</p>
      <img src="${data.thumbnail_url}" style="max-width:200px;border-radius:8px;border:1px solid rgba(212,175,55,0.4)"/>
      <p style="margin-top:8px"><a href="${data.thumbnail_url}" target="_blank" class="btn-secondary">Open full size →</a></p>
    `;
    if (window.toast) toast('Thumbnail ready', 'Auto-generated for Shorts', 'success');
  } catch (err) {
    target.innerHTML = `<p>ERROR: ${err.message}</p>`;
  }
}

async function runTranslator() {
  const target = document.getElementById('translator-result');
  target.innerHTML = '<p>⏳ Generating SEO + translating...</p>';

  // First get the base SEO
  const fd = new FormData();
  fd.append('product_name', document.getElementById('mp-product-name').value);
  fd.append('affiliate_link', document.getElementById('mp-affiliate').value);
  fd.append('niche', document.getElementById('mp-niche').value);
  fd.append('price', document.getElementById('mp-price').value || '0');
  fd.append('features', document.getElementById('mp-features').value);

  try {
    const r1 = await fetch('/api/multi-platform/seo-preview', { method: 'POST', body: fd });
    const baseData = await r1.json();

    // Translate to EN + ES
    const tfd = new FormData();
    tfd.append('seo_json', JSON.stringify(baseData.seo));
    tfd.append('target_languages', 'en,es');
    tfd.append('source_lang', 'fr');

    const r2 = await fetch('/api/translate/seo', { method: 'POST', body: tfd });
    const tdata = await r2.json();
    renderTranslator(tdata.bundle);
    if (window.toast) toast('Translations ready', `${Object.keys(tdata.bundle).length} languages`, 'success');
  } catch (err) {
    target.innerHTML = `<p>ERROR: ${err.message}</p>`;
  }
}

function renderTranslator(bundle) {
  const target = document.getElementById('translator-result');
  const langs = Object.keys(bundle);
  target.innerHTML = `
    <div class="lang-tabs">
      ${langs.map((l, i) => `<button class="lang-tab ${i === 0 ? 'active' : ''}" data-lang="${l}">${l.toUpperCase()}</button>`).join('')}
    </div>
    <div id="lang-content"></div>
  `;
  showLang(langs[0], bundle);
  target.querySelectorAll('.lang-tab').forEach(t => {
    t.addEventListener('click', () => {
      target.querySelectorAll('.lang-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      showLang(t.dataset.lang, bundle);
    });
  });
}

function showLang(lang, bundle) {
  const seo = bundle[lang];
  document.getElementById('lang-content').innerHTML = `
    <p><strong>YouTube:</strong> ${seo.youtube?.title || '—'}</p>
    <pre style="background:#0001;padding:8px;border-radius:6px;white-space:pre-wrap;max-height:120px;overflow:auto">${seo.youtube?.description || ''}</pre>
    <p><strong>TikTok:</strong> ${seo.tiktok?.caption || '—'}</p>
    <p><strong>IG:</strong></p>
    <pre style="background:#0001;padding:8px;border-radius:6px;white-space:pre-wrap;max-height:120px;overflow:auto">${seo.instagram?.caption || ''}</pre>
  `;
}

async function schedulePublish() {
  if (!window.mpUploadedVideo) {
    if (window.toast) toast('No video', 'Upload a video first', 'warn');
    return;
  }
  const time = document.getElementById('mp-schedule-time').value;
  if (!time) {
    if (window.toast) toast('Pick a time', 'Select date+time first', 'warn');
    return;
  }

  const fd = new FormData();
  fd.append('video_path', window.mpUploadedVideo.video_path);
  fd.append('product_name', document.getElementById('mp-product-name').value);
  fd.append('affiliate_link', document.getElementById('mp-affiliate').value);
  fd.append('niche', document.getElementById('mp-niche').value);
  fd.append('price', document.getElementById('mp-price').value || '0');
  fd.append('features', document.getElementById('mp-features').value);
  fd.append('publish_at', time + ':00');
  const platforms = Array.from(document.querySelectorAll('.mp-platform:checked')).map(c => c.value).join(',');
  fd.append('platforms', platforms);

  try {
    const r = await fetch('/api/schedule/publish', { method: 'POST', body: fd });
    const data = await r.json();
    if (data.scheduled) {
      if (window.toast) toast('Scheduled', `Publish #${data.post_id} queued for ${time}`, 'success');
      document.getElementById('schedule-panel').style.display = 'none';
    }
  } catch (err) {
    if (window.toast) toast('Schedule failed', err.message, 'error');
  }
}
