/* ════════════════════════════════════════════════════════════
 *  Cmd+K Command Palette
 *  Quick navigation + actions via keyboard
 * ════════════════════════════════════════════════════════════ */

const COMMANDS = [
  { id: 'tab-multi',     label: '🚀 Multi-Platform publish', kind: 'tab',    keys: ['publish', 'multi'] },
  { id: 'tab-trending',  label: '🔥 Trending products',      kind: 'tab',    keys: ['trending', 'amazon'] },
  { id: 'tab-shoe',      label: '👟 Shoe Short pipeline',    kind: 'tab',    keys: ['shoe', 'short'] },
  { id: 'tab-video',     label: '🎬 New video campaign',     kind: 'tab',    keys: ['video', 'campaign'] },
  { id: 'tab-deal',      label: '🏷️ Deal post',              kind: 'tab',    keys: ['deal'] },
  { id: 'tab-analytics', label: '📊 Analytics & numbers',    kind: 'tab',    keys: ['analytics', 'numbers', 'charts'] },
  { id: 'tab-health',    label: '💚 System health',          kind: 'tab',    keys: ['health', 'status'] },
  { id: 'tab-products',  label: '📦 Product library',        kind: 'tab',    keys: ['library', 'products'] },
  { id: 'tab-settings',  label: '🔑 Settings & API keys',    kind: 'tab',    keys: ['settings', 'keys', 'api'] },

  { id: 'action-upload',     label: '⬆️ Upload new video',      kind: 'action', keys: ['upload'] },
  { id: 'action-refresh-kpi',label: '🔄 Refresh KPIs',           kind: 'action', keys: ['refresh'] },
  { id: 'action-health',     label: '🩺 Run health check',       kind: 'action', keys: ['check'] },
  { id: 'action-trending',   label: '🔥 Reload trending',        kind: 'action', keys: ['reload'] },
];

let paletteEl = null;
let currentResults = [];
let selectedIndex = 0;

function buildPalette() {
  if (paletteEl) return paletteEl;
  paletteEl = document.createElement('div');
  paletteEl.id = 'cmdk-overlay';
  paletteEl.innerHTML = `
    <div class="cmdk-box">
      <input type="text" id="cmdk-search" placeholder="🔍 Search commands, products, settings..." autocomplete="off"/>
      <div id="cmdk-results"></div>
      <div class="cmdk-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
        <span><kbd>↵</kbd> select</span>
        <span><kbd>esc</kbd> close</span>
      </div>
    </div>
  `;
  document.body.appendChild(paletteEl);

  const input = paletteEl.querySelector('#cmdk-search');
  input.addEventListener('input', renderResults);
  input.addEventListener('keydown', handleKeyNav);
  paletteEl.addEventListener('click', (e) => {
    if (e.target === paletteEl) closePalette();
  });
  return paletteEl;
}

function openPalette() {
  buildPalette();
  paletteEl.classList.add('open');
  const input = paletteEl.querySelector('#cmdk-search');
  input.value = '';
  input.focus();
  selectedIndex = 0;
  renderResults();
}

function closePalette() {
  if (paletteEl) paletteEl.classList.remove('open');
}

function renderResults() {
  const q = (paletteEl.querySelector('#cmdk-search').value || '').toLowerCase().trim();
  const list = paletteEl.querySelector('#cmdk-results');

  currentResults = COMMANDS.filter(cmd => {
    if (!q) return true;
    return cmd.label.toLowerCase().includes(q) ||
            cmd.keys.some(k => k.includes(q));
  });

  if (selectedIndex >= currentResults.length) selectedIndex = 0;

  list.innerHTML = currentResults.map((cmd, i) => `
    <div class="cmdk-row ${i === selectedIndex ? 'selected' : ''}" data-idx="${i}">
      <span>${cmd.label}</span>
      <span class="cmdk-kind">${cmd.kind}</span>
    </div>
  `).join('') || '<div class="cmdk-empty">No matches</div>';

  list.querySelectorAll('.cmdk-row').forEach(row => {
    row.addEventListener('mouseenter', () => {
      selectedIndex = parseInt(row.dataset.idx);
      renderResults();
    });
    row.addEventListener('click', () => execute(currentResults[parseInt(row.dataset.idx)]));
  });
}

function handleKeyNav(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = Math.min(selectedIndex + 1, currentResults.length - 1);
    renderResults();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = Math.max(selectedIndex - 1, 0);
    renderResults();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentResults[selectedIndex]) execute(currentResults[selectedIndex]);
  } else if (e.key === 'Escape') {
    closePalette();
  }
}

function execute(cmd) {
  closePalette();
  if (cmd.kind === 'tab') {
    document.querySelector(`[data-tab="${cmd.id.replace('tab-', '')}"]`)?.click();
  } else if (cmd.kind === 'action') {
    switch (cmd.id) {
      case 'action-upload':      document.getElementById('mp-video-file')?.click(); break;
      case 'action-refresh-kpi': if (window.loadKPIs) loadKPIs(); break;
      case 'action-health':      if (window.runHealthCheck) runHealthCheck(); break;
      case 'action-trending':    if (window.loadTrendingProducts) loadTrendingProducts(); break;
    }
  }
}

// Global keyboard shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openPalette();
  }
});

window.openPalette = openPalette;
