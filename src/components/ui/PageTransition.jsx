'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';

/**
 * PageTransitionController — Curtain overlay (estrela-style).
 *
 * Séquence sur changement de route :
 *  1. Rideau vert nuit monte depuis le bas   (0.45s, ease [0.76,0,0.24,1])
 *  2. Pause 80ms — nouveau contenu monté sous le rideau
 *  3. Contenu entre en scène (CSS .page-transition-enter sur #main-content)
 *  4. Rideau sort vers le haut               (0.5s, même ease)
 *
 * Ne wrape PAS children — la server-component tree du layout reste intacte.
 */

const EASE = [0.76, 0, 0.24, 1];

export default function PageTransitionController() {
  const pathname = usePathname();
  const controls = useAnimation();
  const prevRef  = useRef(pathname);
  const firstRef = useRef(true);

  useEffect(() => {
    // Ignorer le premier rendu — la page est déjà visible
    if (firstRef.current) { firstRef.current = false; return; }
    if (prevRef.current === pathname) return;
    prevRef.current = pathname;

    async function run() {
      // ── Phase 1 : rideau monte depuis le bas (originY=1 = bottom) ──
      controls.set({ originY: 1, scaleY: 0 });
      await controls.start({
        scaleY: 1,
        transition: { duration: 0.45, ease: EASE },
      });

      // ── Reset animation du contenu (visible sous le rideau) ──
      const main = document.getElementById('main-content');
      if (main) {
        main.classList.remove('page-transition-enter');
        void main.offsetWidth;
        main.classList.add('page-transition-enter');
      }

      // ── Pause à plein écran ──
      await new Promise(r => setTimeout(r, 80));

      // ── Snap origin vers le haut SANS animation ──
      controls.set({ originY: 0 });

      // ── Phase 2 : rideau sort vers le haut (collapse upward) ──
      await controls.start({
        scaleY: 0,
        transition: { duration: 0.5, ease: EASE },
      });
    }

    run();
  }, [pathname, controls]);

  return (
    <motion.div
      animate={controls}
      style={{
        position:       'fixed',
        inset:           0,
        zIndex:          9997,
        background:     '#0d1f11',   /* vert nuit — accord avec la charte */
        pointerEvents:  'none',
        willChange:     'transform',
        transformOrigin: 'bottom center',
        scaleY:          0,
      }}
      aria-hidden="true"
    />
  );
}
