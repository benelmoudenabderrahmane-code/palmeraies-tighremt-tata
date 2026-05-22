/* ════════════════════════════════════════════════════════════
 *  TRENDING ENHANCED — editorial product clippings
 *  Adapted from 21st.dev components into night-edition aesthetic
 *  Adds: badge stack, hover-reveal actions, image carousel,
 *        score indicator, editorial frame
 * ════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // Monkey-patch loadTrendingProducts result rendering
  const orig = window.loadTrendingProducts;
  if (typeof orig === 'function') {
    window.loadTrendingProducts = async function () {
      await orig.apply(this, arguments);
      enhanceTrendingCards();
    };
  }

  // Inject the enhancement CSS once
  injectEnhancementStyles();

  // Auto-enhance any existing cards
  enhanceTrendingCards();
});

function enhanceTrendingCards() {
  const grid = document.getElementById('trending-grid');
  if (!grid) return;

  grid.querySelectorAll('.trending-card').forEach((card, idx) => {
    if (card.dataset.enhanced) return;
    card.dataset.enhanced = '1';

    // Pull the existing badge info
    const cat = card.querySelector('.t-category')?.textContent || '';
    const meta = card.querySelector('.t-meta')?.textContent || '';

    // Parse rank from "category · #5"
    const rankMatch = cat.match(/#(\d+)/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : null;

    // Parse rating
    const ratingMatch = meta.match(/[★⭐]\s*([\d.]+)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    // Build badge stack (top-left)
    const badges = document.createElement('div');
    badges.className = 'trend-badges';
    if (rank && rank <= 3) {
      badges.innerHTML += `<span class="trend-badge stamp">[TOP ${rank}]</span>`;
    } else if (rank && rank <= 10) {
      badges.innerHTML += `<span class="trend-badge">[#${rank}]</span>`;
    }
    if (rating && rating >= 4.5) {
      badges.innerHTML += `<span class="trend-badge stamp">[VIRAL]</span>`;
    } else if (rating && rating >= 4.0) {
      badges.innerHTML += `<span class="trend-badge">[VERIFIED]</span>`;
    }

    const imageWrap = card.querySelector('img')?.parentElement || card.firstElementChild;
    if (badges.children.length && !card.querySelector('.trend-badges')) {
      card.style.position = 'relative';
      card.insertBefore(badges, card.firstChild);
    }

    // Add score indicator (vertical line on left)
    if (rank) {
      const score = document.createElement('div');
      score.className = 'trend-score-rail';
      const intensity = Math.min(1, (30 - rank) / 30);
      score.innerHTML = `
        <div class="rail-track">
          <div class="rail-fill" style="height:${intensity * 100}%"></div>
        </div>
        <div class="rail-label">SIGNAL · ${(intensity * 100).toFixed(0)}%</div>
      `;
      card.appendChild(score);
    }

    // Editorial frame number
    const num = document.createElement('div');
    num.className = 'trend-num';
    num.textContent = String(idx + 1).padStart(3, '0');
    card.appendChild(num);
  });
}

function injectEnhancementStyles() {
  if (document.getElementById('trending-enhanced-styles')) return;
  const style = document.createElement('style');
  style.id = 'trending-enhanced-styles';
  style.textContent = `
    .trending-card { position: relative; }

    /* Badge stack — top-left, stamped brackets */
    .trend-badges {
      position: absolute;
      top: 12px; left: 12px;
      z-index: 3;
      display: flex;
      flex-direction: column;
      gap: 4px;
      pointer-events: none;
    }
    .trend-badge {
      background: var(--ink);
      color: var(--bone);
      font-family: var(--mono);
      font-size: 8px;
      letter-spacing: 0.2em;
      padding: 4px 8px;
      border: 1px solid var(--rule);
      text-transform: uppercase;
      align-self: flex-start;
    }
    .trend-badge.stamp {
      background: var(--stamp);
      color: var(--bone);
      border-color: var(--stamp);
    }

    /* Editorial frame number — bottom-right */
    .trend-num {
      position: absolute;
      bottom: 10px;
      right: 14px;
      font-family: var(--serif);
      font-style: italic;
      font-size: 24px;
      color: var(--bone-mute);
      opacity: 0.3;
      pointer-events: none;
      line-height: 1;
    }

    /* Score signal rail — bottom-left */
    .trend-score-rail {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 4px;
      height: 60%;
      pointer-events: none;
    }
    .rail-track {
      position: relative;
      width: 100%;
      height: 100%;
      background: var(--rule-soft);
    }
    .rail-fill {
      position: absolute;
      left: 0; bottom: 0;
      width: 100%;
      background: var(--stamp);
      transition: height 0.6s cubic-bezier(0.22,1,0.36,1);
    }
    .rail-label {
      position: absolute;
      left: 10px;
      bottom: 10px;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-family: var(--mono);
      font-size: 8px;
      letter-spacing: 0.4em;
      color: var(--bone-mute);
      text-transform: uppercase;
    }

    /* Hover reveal — action buttons slide in */
    .trending-card .t-actions {
      transform: translateY(8px);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.3s;
    }
    .trending-card:hover .t-actions {
      transform: translateY(0);
      opacity: 1;
    }

    /* Image crop tighter + monochrome treatment */
    .trending-card img {
      transition: filter 0.4s, transform 0.6s cubic-bezier(0.22,1,0.36,1);
    }
    .trending-card:hover img {
      filter: grayscale(0) contrast(1);
      transform: scale(1.04);
    }

    /* Border accent on hover */
    .trending-card::after {
      content: "";
      position: absolute;
      inset: 0;
      border: 1px solid transparent;
      pointer-events: none;
      transition: border-color 0.3s;
      z-index: 4;
    }
    .trending-card:hover::after {
      border-color: var(--stamp);
    }
  `;
  document.head.appendChild(style);
}
