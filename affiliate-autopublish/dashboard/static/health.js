/* ════════════════════════════════════════════════════════════
 *  HEALTH CHECK TAB
 * ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('health-refresh');
  if (btn) {
    btn.addEventListener('click', runHealthCheck);
  }

  // Auto-load when tab is clicked
  const healthTab = document.querySelector('[data-tab="health"]');
  if (healthTab) {
    healthTab.addEventListener('click', () => {
      setTimeout(runHealthCheck, 100);
    });
  }
});

async function runHealthCheck() {
  const summary = document.getElementById('health-summary');
  summary.innerHTML = '<p>⏳ Running checks...</p>';

  try {
    // Parallel fetches
    const [health, queue, platforms] = await Promise.all([
      fetch('/api/health').then(r => r.json()),
      fetch('/api/queue/status').then(r => r.json()),
      fetch('/api/analytics/platform-breakdown?days=7').then(r => r.json()),
    ]);

    renderHealthSummary(health);
    renderQueueStatus(queue);
    renderPlatformBreakdown(platforms);
  } catch (err) {
    summary.innerHTML = `<p>ERROR: ${err.message}</p>`;
  }
}

function renderHealthSummary(data) {
  const summary = document.getElementById('health-summary');
  const ready = data.ready_for_publish || [];
  const needs = data.needs_setup || [];

  let html = `
    <div style="display:flex;gap:24px;margin-bottom:24px">
      <div class="health-stat ok">
        <div class="big">${ready.length}</div>
        <div>Ready</div>
      </div>
      <div class="health-stat warn">
        <div class="big">${needs.length}</div>
        <div>Needs setup</div>
      </div>
    </div>
    <table class="health-table">
      <thead><tr><th>Service</th><th>Status</th><th>Details</th></tr></thead>
      <tbody>
  `;

  for (const c of data.checks) {
    const dot = c.ok ? '🟢' : '🔴';
    html += `
      <tr>
        <td><strong>${c.service}</strong></td>
        <td>${dot} ${c.ok ? 'OK' : 'Setup needed'}</td>
        <td style="opacity:0.85">${c.message || ''}</td>
      </tr>
    `;
  }

  html += '</tbody></table>';
  summary.innerHTML = html;
}

function renderQueueStatus(data) {
  const grid = document.getElementById('queue-status-grid');
  grid.innerHTML = `
    <div class="queue-card"><div class="qc-num">${data.queued || 0}</div><div>Queued</div></div>
    <div class="queue-card"><div class="qc-num">${data.ready || 0}</div><div>Ready</div></div>
    <div class="queue-card success"><div class="qc-num">${data.published || 0}</div><div>Published</div></div>
    <div class="queue-card error"><div class="qc-num">${data.failed || 0}</div><div>Failed</div></div>
  `;
}

function renderPlatformBreakdown(data) {
  const box = document.getElementById('platform-breakdown');
  const platforms = Object.entries(data || {});
  if (platforms.length === 0) {
    box.innerHTML = '<p style="opacity:0.6">No data yet — publish a video first.</p>';
    return;
  }

  let html = '<table class="health-table" style="margin-top:12px"><thead><tr><th>Platform</th><th>Published</th><th>Failed</th><th>Success Rate</th></tr></thead><tbody>';
  for (const [name, stats] of platforms) {
    const rate = stats.success_rate || 0;
    const color = rate >= 90 ? '#22c55e' : rate >= 60 ? '#eab308' : '#ef4444';
    html += `
      <tr>
        <td><strong>${name}</strong></td>
        <td>${stats.published || 0}</td>
        <td>${stats.failed || 0}</td>
        <td style="color:${color}">${rate}%</td>
      </tr>
    `;
  }
  html += '</tbody></table>';
  box.innerHTML = html;
}
