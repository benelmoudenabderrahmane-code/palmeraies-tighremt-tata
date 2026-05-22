/* ════════════════════════════════════════════════════════════
 *  PREMIUM VISUAL LAYER — JS
 *  Toast system, animated counters, live progress, charts
 * ════════════════════════════════════════════════════════════ */

// ── Toast notifications ────────────────────────────────────
(function () {
  if (document.querySelector('.toast-stack')) return;
  const stack = document.createElement('div');
  stack.className = 'toast-stack';
  document.body.appendChild(stack);
})();

window.toast = function (title, body = '', type = 'info', duration = 4000) {
  const stack = document.querySelector('.toast-stack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div class="toast-title">${title}</div>
    ${body ? `<div class="toast-body">${body}</div>` : ''}
  `;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 250);
  }, duration);
};

// ── Animated counter ───────────────────────────────────────
window.animateNumber = function (el, target, duration = 1200) {
  if (!el) return;
  const start = parseFloat(el.textContent.replace(/[^\d.-]/g, '')) || 0;
  const startTime = performance.now();
  const isFloat = !Number.isInteger(target);
  function step(now) {
    const elapsed = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3); // ease-out cubic
    const value = start + (target - start) * eased;
    el.textContent = isFloat ? value.toFixed(2) : Math.round(value).toLocaleString();
    if (elapsed < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
};

// ── Live publish progress ──────────────────────────────────
window.showPublishProgress = function (platforms) {
  let overlay = document.querySelector('.publish-progress');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'publish-progress';
    document.body.appendChild(overlay);
  }
  const steps = [
    { id: 'redirect', label: '🔗 Creating Vercel redirect...' },
    { id: 'seo',      label: '✍️ Generating multi-platform SEO...' },
    ...platforms.map(p => ({ id: `pub-${p}`, label: `🚀 Publishing to ${p}...` })),
    { id: 'done',     label: '✅ All published!' },
  ];
  overlay.innerHTML = `
    <h3>Publication en cours</h3>
    <div class="progress-bar"><div class="progress-bar-fill" id="pp-fill"></div></div>
    <div id="pp-steps">
      ${steps.map(s => `
        <div class="progress-step" data-step="${s.id}">
          <span class="step-icon"></span>
          <span>${s.label}</span>
        </div>`).join('')}
    </div>
  `;
  overlay.classList.remove('hidden');
};

window.updatePublishStep = function (stepId, status = 'active') {
  const el = document.querySelector(`.progress-step[data-step="${stepId}"]`);
  if (!el) return;
  el.classList.remove('active', 'done');
  el.classList.add(status);
  // Update fill bar based on done steps
  const steps = document.querySelectorAll('.progress-step');
  const done = document.querySelectorAll('.progress-step.done').length;
  const fill = document.getElementById('pp-fill');
  if (fill) fill.style.width = `${(done / steps.length) * 100}%`;
};

window.hidePublishProgress = function () {
  const overlay = document.querySelector('.publish-progress');
  if (overlay) overlay.classList.add('hidden');
};

// ── Hero KPI strip auto-loader ─────────────────────────────
async function loadKPIs() {
  const target = document.getElementById('kpi-strip');
  if (!target) return;

  // Skeleton first
  target.innerHTML = Array(4).fill(0).map(() => `
    <div class="kpi-card">
      <div class="skeleton skeleton-line w-50"></div>
      <div class="skeleton skeleton-line w-75" style="height:32px;margin-top:12px"></div>
    </div>
  `).join('');

  try {
    const r = await fetch('/api/analytics/overview');
    const data = await r.json();
    target.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-label">Total posts</div>
        <div class="kpi-value" id="kpi-posts">0</div>
        <div class="kpi-trend up">+${data.posts_today || 0} today</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Affiliate clicks</div>
        <div class="kpi-value" id="kpi-clicks">0</div>
        <div class="kpi-trend up">+${data.clicks_today || 0} today</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active platforms</div>
        <div class="kpi-value" id="kpi-platforms">0</div>
        <div class="kpi-trend">${(data.active_platforms || []).join(', ') || '—'}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Top product</div>
        <div class="kpi-value" style="font-size:1.1em;font-family:'Fraunces',serif;font-weight:500">
          ${(data.top_product?.name || '—').slice(0, 28)}${(data.top_product?.name || '').length > 28 ? '…' : ''}
        </div>
        <div class="kpi-trend">${data.top_product?.count || 0} posts</div>
      </div>
    `;
    // Animate
    setTimeout(() => {
      animateNumber(document.getElementById('kpi-posts'), data.total_posts || 0);
      animateNumber(document.getElementById('kpi-clicks'), data.total_clicks || 0);
      animateNumber(document.getElementById('kpi-platforms'), (data.active_platforms || []).length);
    }, 100);
  } catch (err) {
    target.innerHTML = '<p style="opacity:0.5">⚠️ KPIs unavailable</p>';
  }
}

// ── Charts ─────────────────────────────────────────────────
async function loadAnalyticsCharts() {
  const target = document.getElementById('analytics-charts');
  if (!target) return;

  const [timeline, topProducts, platforms] = await Promise.all([
    fetch('/api/analytics/clicks-timeline?days=14').then(r => r.json()).catch(() => ({timeline: []})),
    fetch('/api/analytics/top-products?limit=8').then(r => r.json()).catch(() => ({products: []})),
    fetch('/api/analytics/platform-breakdown?days=30').then(r => r.json()).catch(() => ({})),
  ]);

  let html = '';

  // Sparkline timeline
  if (timeline.timeline?.length) {
    const max = Math.max(...timeline.timeline.map(t => t.clicks), 1);
    html += `
      <div class="chart-card">
        <div class="chart-title">
          Clicks · last 14 days
          <span class="chart-sub">${timeline.timeline.reduce((s, t) => s + t.clicks, 0)} total</span>
        </div>
        <div class="sparkline">
          ${timeline.timeline.map(t => `
            <div class="sparkline-bar" style="height:${(t.clicks / max) * 100}%" title="${t.date}: ${t.clicks}"></div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Top products bars
  if (topProducts.products?.length) {
    const maxC = Math.max(...topProducts.products.map(p => p.clicks), 1);
    html += `
      <div class="chart-card">
        <div class="chart-title">Top clicked products <span class="chart-sub">${topProducts.products.length}</span></div>
        <div class="bar-list">
          ${topProducts.products.map(p => `
            <div class="bar-row">
              <div style="opacity:0.8">${p.network}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${(p.clicks / maxC) * 100}%"></div></div>
              <div class="bar-value">${p.clicks}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Platform performance
  const platEntries = Object.entries(platforms || {});
  if (platEntries.length) {
    html += `
      <div class="chart-card">
        <div class="chart-title">Platform success rate · last 30 days</div>
        <div class="bar-list">
          ${platEntries.map(([name, stats]) => `
            <div class="bar-row">
              <div style="text-transform:capitalize">${name}</div>
              <div class="bar-track"><div class="bar-fill" style="width:${stats.success_rate || 0}%;background:linear-gradient(90deg,${stats.success_rate >= 90 ? '#22c55e' : stats.success_rate >= 60 ? '#eab308' : '#ef4444'},#fff3)"></div></div>
              <div class="bar-value">${stats.success_rate || 0}%</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  if (!html) html = '<p style="opacity:0.5;padding:20px">No analytics data yet — publish a video to populate.</p>';
  target.innerHTML = html;
}

// ── Floating Action Button (quick publish) ─────────────────
(function () {
  if (document.querySelector('.fab')) return;
  const fab = document.createElement('button');
  fab.className = 'fab';
  fab.title = 'Quick publish';
  fab.innerHTML = '🚀';
  fab.addEventListener('click', () => {
    document.querySelector('[data-tab="multi"]')?.click();
    document.getElementById('mp-video-file')?.click();
  });
  document.body.appendChild(fab);
})();

// ── Init on DOM ready ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadKPIs();

  // Refresh KPIs every 30s
  setInterval(loadKPIs, 30000);

  // Load charts when analytics tab is opened
  const aTab = document.querySelector('[data-tab="analytics"]');
  if (aTab) {
    aTab.addEventListener('click', () => setTimeout(loadAnalyticsCharts, 100));
  }

  // Welcome toast
  setTimeout(() => {
    toast('✨ System ready', 'Multi-platform publishing engine online', 'success', 3500);
  }, 600);
});
