'use client';
import { useEffect, useRef } from 'react';

/**
 * Filet doré animé entre deux sections.
 * Le trait se révèle de gauche à droite via scaleX quand il entre dans le viewport.
 * Le losange central apparaît 820ms après.
 */
export default function SectionDivider() {
  const wrapRef = useRef(null);
  const lineRef = useRef(null);
  const gemRef  = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !lineRef.current || !gemRef.current) return;

    // SSR / no IntersectionObserver fallback
    if (typeof IntersectionObserver === 'undefined') {
      lineRef.current.style.transform = 'scaleX(1)';
      gemRef.current.style.opacity    = '1';
      gemRef.current.style.transform  = 'translateX(-50%) rotate(45deg) scale(1)';
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        lineRef.current.style.transform = 'scaleX(1)';
        setTimeout(() => {
          if (!gemRef.current) return;
          gemRef.current.style.opacity   = '1';
          gemRef.current.style.transform = 'translateX(-50%) rotate(45deg) scale(1)';
        }, 820);
        io.disconnect();
      },
      { threshold: 0.8 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ position: 'relative', height: 48, display: 'flex', alignItems: 'center' }}
    >
      {/* Filet plein-largeur, révélé de gauche à droite */}
      <div
        ref={lineRef}
        style={{
          position: 'absolute',
          left: '1.5rem', right: '1.5rem', top: '50%',
          height: 1,
          background: 'linear-gradient(to right, transparent, #c4a96b 15%, #c4a96b 85%, transparent)',
          transform: 'scaleX(0)',
          transformOrigin: 'left center',
          transition: 'transform 1.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
      {/* Losange central */}
      <div
        ref={gemRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginTop: -3.5,
          width: 7, height: 7,
          background: '#c4a96b',
          transform: 'translateX(-50%) rotate(45deg) scale(0)',
          opacity: 0,
          transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </div>
  );
}
