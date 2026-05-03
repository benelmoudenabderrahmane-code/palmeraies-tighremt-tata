'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * PageTransitionController — Rideau estrela-style.
 *
 * Séquence sur changement de route :
 *  1. Rideau vert nuit monte depuis le bas   (0.45s, ease [0.76,0,0.24,1])
 *  2. Pause 80ms — nouveau contenu monté sous le rideau
 *  3. Contenu entre en scène (CSS .page-transition-enter sur #main-content)
 *  4. Rideau sort vers le haut               (0.5s, même ease)
 *
 * Implémentation : CSS transitions via DOM direct — aucune dépendance
 * à framer-motion pour éviter les conflits WAAPI / style-prop v12.
 */

const EASE    = 'cubic-bezier(0.76,0,0.24,1)';
const DUR_IN  = 450;  // ms
const DUR_OUT = 500;  // ms

export default function PageTransitionController() {
  const pathname   = usePathname();
  const prevRef    = useRef(pathname);
  const firstRef   = useRef(true);
  const curtainRef = useRef(null);
  const busyRef    = useRef(false);

  useEffect(() => {
    if (firstRef.current) { firstRef.current = false; return; }
    if (prevRef.current === pathname) return;
    prevRef.current = pathname;

    const el = curtainRef.current;
    if (!el || busyRef.current) return;
    busyRef.current = true;

    // ── Phase 1 : rideau monte depuis le bas ──
    el.style.transition      = 'none';
    el.style.transformOrigin = 'bottom center';
    el.style.transform       = 'scaleY(0)';
    void el.offsetHeight;                       // force reflow
    el.style.transition = `transform ${DUR_IN}ms ${EASE}`;
    el.style.transform  = 'scaleY(1)';

    setTimeout(() => {
      // ── Toggle animation du contenu ──
      const main = document.getElementById('main-content');
      if (main) {
        main.classList.remove('page-transition-enter');
        void main.offsetWidth;
        main.classList.add('page-transition-enter');
      }

      // ── Pause à plein écran ──
      setTimeout(() => {
        // ── Phase 2 : rideau sort vers le haut ──
        el.style.transition      = 'none';
        el.style.transformOrigin = 'top center';
        void el.offsetHeight;                   // force reflow
        el.style.transition = `transform ${DUR_OUT}ms ${EASE}`;
        el.style.transform  = 'scaleY(0)';

        setTimeout(() => { busyRef.current = false; }, DUR_OUT);
      }, 80);
    }, DUR_IN);
  }, [pathname]);

  return (
    <div
      ref={curtainRef}
      aria-hidden="true"
      style={{
        position:        'fixed',
        inset:            0,
        zIndex:           9997,
        background:      '#0d1f11',
        pointerEvents:   'none',
        willChange:      'transform',
        transform:       'scaleY(0)',
        transformOrigin: 'bottom center',
      }}
    />
  );
}
