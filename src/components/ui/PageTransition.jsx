'use client';
import { useEffect, useRef } from 'react';

/* ─────────────────────────────────────────────────────────────
   Estrela Studio–style page transition — v4
   • Removes useRouter / usePathname (suspected prod-build issue)
   • Uses window.location.assign for navigation (reliable full nav)
   • Uses sessionStorage to persist "pending reveal" across loads
   • Inline script in <head> (added via layout.js) prevents flash
───────────────────────────────────────────────────────────── */
const COVER_MS  = 500;
const REVEAL_MS = 680;
const EASE_IN   = 'cubic-bezier(0.76, 0, 0.24, 1)';
const EASE_OUT  = 'cubic-bezier(0.16, 1, 0.3, 1)';

const HIDDEN = 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)';
const FULL   = 'polygon(0% 0%,   100% 0%,   100% 100%, 0% 100%)';
const GONE   = 'polygon(0% 0%,   100% 0%,   100% 0%,   0% 0%)';

const STORAGE_KEY = 'pt_pending_reveal';

export default function PageTransition() {
  const panelRef   = useRef(null);
  const stateRef   = useRef('idle');
  const coverTimer = useRef(null);
  const revealTimer= useRef(null);

  const rAF2 = (fn) =>
    requestAnimationFrame(() => requestAnimationFrame(fn));

  /* ── Reveal helper ── */
  const reveal = useRef(null);
  reveal.current = () => {
    const el = panelRef.current;
    if (!el) return;
    stateRef.current = 'revealing';
    setTimeout(() => {
      el.style.transition    = `clip-path ${REVEAL_MS}ms ${EASE_OUT}`;
      el.style.clipPath      = GONE;
      el.style.pointerEvents = 'none';
      revealTimer.current = setTimeout(() => {
        el.style.transition = 'none';
        el.style.clipPath   = HIDDEN;
        stateRef.current    = 'idle';
      }, REVEAL_MS + 60);
    }, 50);
  };

  /* ── Create panel + handle pending reveal from previous page ── */
  useEffect(() => {
    const needsReveal = sessionStorage.getItem(STORAGE_KEY) === '1';
    if (needsReveal) sessionStorage.removeItem(STORAGE_KEY);

    const panel = document.createElement('div');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('data-page-transition', 'true');
    Object.assign(panel.style, {
      position:      'fixed',
      top:           '0',
      left:          '0',
      right:         '0',
      bottom:        '0',
      zIndex:        '9999',
      background:    '#133d20',
      clipPath:      needsReveal ? FULL : HIDDEN,
      transition:    'none',
      willChange:    'clip-path',
      pointerEvents: needsReveal ? 'all' : 'none',
    });

    /* gold leading edge */
    const edge = document.createElement('div');
    edge.setAttribute('aria-hidden', 'true');
    Object.assign(edge.style, {
      position:   'absolute',
      top:        '0',
      left:       '0',
      right:      '0',
      height:     '2px',
      background: 'linear-gradient(to right, transparent 0%, #c4a96b 15%, #c4a96b 85%, transparent 100%)',
      opacity:    '0.9',
    });
    panel.appendChild(edge);
    document.body.appendChild(panel);
    panelRef.current = panel;

    /* Remove the inline ::before cover that prevented flash during HTML parse */
    const flashCover = document.getElementById('pt-flash-cover');
    if (flashCover) flashCover.parentNode.removeChild(flashCover);

    if (needsReveal) {
      stateRef.current = 'covered';
      /* Small delay so new page has painted beneath the panel */
      const t = setTimeout(() => reveal.current(), 120);
      return () => {
        clearTimeout(t);
        if (panel.parentNode) panel.parentNode.removeChild(panel);
      };
    }

    return () => {
      if (panel.parentNode) panel.parentNode.removeChild(panel);
    };
  }, []);

  /* ── Click interceptor ── */
  useEffect(() => {
    const onClick = (e) => {
      if (stateRef.current !== 'idle') return;
      const a = e.target.closest('a[href]');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href?.startsWith('/')) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank') return;
      const targetPath = href.split('#')[0].split('?')[0];
      if (targetPath === window.location.pathname) return;

      e.preventDefault();

      const el = panelRef.current;
      if (!el) return;

      stateRef.current      = 'covering';
      el.style.transition    = 'none';
      el.style.clipPath      = HIDDEN;
      el.style.pointerEvents = 'all';

      rAF2(() => {
        el.style.transition = `clip-path ${COVER_MS}ms ${EASE_IN}`;
        el.style.clipPath   = FULL;
        coverTimer.current  = setTimeout(() => {
          stateRef.current = 'covered';
          /* Flag the next page to reveal, then navigate */
          sessionStorage.setItem(STORAGE_KEY, '1');
          window.location.assign(href);
        }, COVER_MS);
      });
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  /* ── Cleanup timers on unmount ── */
  useEffect(() => () => {
    clearTimeout(coverTimer.current);
    clearTimeout(revealTimer.current);
  }, []);

  return null;
}
