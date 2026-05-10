'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────
   PageTransition v5 — View Transitions API (native browser)
   Mécanisme identique à estrela.studio :
     • Pas d'overlay panel
     • Les snapshots de page eux-mêmes se wipe l'un l'autre
     • Old page : clip-path se contracte vers le HAUT
     • New page : clip-path se révèle depuis le BAS
   CSS dans globals.css  ::view-transition-old/new(root)
   Fallback silencieux sur navigateurs sans support VT
───────────────────────────────────────────────────────────── */
export default function PageTransition() {
  const router = useRouter();

  useEffect(() => {
    const onClick = (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const a = e.target.closest('a[href]');
      if (!a) return;

      const href = a.getAttribute('href');
      if (!href?.startsWith('/')) return;
      if (a.target === '_blank') return;

      /* même page (hash ou query différent ok, mais même path = pas de transition) */
      const targetPath = href.split('#')[0].split('?')[0];
      if (targetPath === window.location.pathname) return;

      e.preventDefault();

      /* Navigateurs sans View Transitions API → navigation directe */
      if (!document.startViewTransition) {
        router.push(href);
        return;
      }

      /* ── View Transitions : capture old → push → reveal new ── */
      document.startViewTransition(() => router.push(href));
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [router]);

  /* Aucun élément DOM — la magie est dans les pseudo-éléments CSS */
  return null;
}
