'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Lightbox = dynamic(() => import('@/components/ui/Lightbox'), { ssr: false });

const IMAGES = [
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt — vue panoramique', theme: 'palmeraie' },
  { src: '/images/tighremt/palmeraie-sol.jpg',      alt: 'Sols de la palmeraie', theme: 'palmeraie' },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes de Tighremt', theme: 'palmeraie' },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt', theme: 'village' },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar ancestral de Tighremt', theme: 'village' },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt', theme: 'village' },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain', theme: 'paysage' },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie', theme: 'palmeraie' },
];

const THEMES = ['tous', 'palmeraie', 'village', 'paysage'];

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme] = useState('tous');
  const [lightboxIdx, setLightboxIdx] = useState(null);
  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Galerie</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Photos de Tighremt</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>La beauté de la palmeraie et du village à travers nos photos.</p>
        </div>
      </section>

      <section style={{ background: C.sandMid, padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {THEMES.map(t => (
          <button key={t} onClick={() => setTheme(t)} style={{
            padding: '0.45rem 1.1rem', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize',
            background: theme === t ? C.greenDeep : 'transparent',
            color: theme === t ? '#fff' : C.inkMuted,
            outline: theme === t ? 'none' : `1px solid ${C.sandDark}`,
            transition: 'all 0.2s',
          }}>{t === 'tous' ? 'Tous' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ columns: '3 280px', gap: '1rem' }}>
          {filtered.map((img, i) => (
            <div key={img.src} className="reveal img-zoom-wrap"
              onClick={() => setLightboxIdx(i)}
              style={{ breakInside: 'avoid', marginBottom: '1rem', borderRadius: 12, overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} style={{ width: '100%', display: 'block', borderRadius: 12 }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(19,61,32,0)', transition: 'background 0.3s', borderRadius: 12, display: 'flex', alignItems: 'flex-end', padding: '1rem' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(19,61,32,0.45)'; e.currentTarget.querySelector('span').style.opacity = '1'; }}
                onMouseOut={e  => { e.currentTarget.style.background = 'rgba(19,61,32,0)';    e.currentTarget.querySelector('span').style.opacity = '0'; }}>
                <span style={{ color: '#fff', fontSize: '0.82rem', opacity: 0, transition: 'opacity 0.3s' }}>{img.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {lightboxIdx !== null && (
        <Lightbox
          images={filtered.map(img => img.src)}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
