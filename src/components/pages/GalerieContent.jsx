'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';

const Lightbox = dynamic(() => import('@/components/ui/Lightbox'), { ssr: false });

const IMAGES = [
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt — vue panoramique', theme: 'palmeraie' },
  { src: '/images/tighremt/palmeraie-sol.jpg',      alt: 'Sols de la palmeraie',                   theme: 'palmeraie' },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes de Tighremt',                     theme: 'palmeraie' },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt',                    theme: 'village'   },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar ancestral de Tighremt',             theme: 'village'   },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt',                    theme: 'village'   },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain',                  theme: 'paysage'   },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie',                 theme: 'palmeraie' },
];

const THEMES       = ['tous', 'palmeraie', 'village', 'paysage'];
const THEME_LABELS = { tous: 'Tous', palmeraie: 'Palmeraie', village: 'Village', paysage: 'Paysage' };

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme]          = useState('tous');
  const [lightboxIdx, setLightbox] = useState(null);
  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: '#f5f0e8' }}>

      {/* ── Hero vert ── */}
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{
            fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(196,169,107,0.9)', marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}>
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
            Galerie
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1 }}>
            Tighremt en images
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7 }}>
            La beauté de la palmeraie et du village à travers nos photos.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ── Filtres text-links ── */}
      <div style={{ background: '#f5f0e8', padding: '1.75rem 1.5rem 0', display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        {THEMES.map(t => (
          <button key={t} onClick={() => setTheme(t)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
            color: theme === t ? C.greenDeep : C.inkLight,
            borderBottom: theme === t ? `1.5px solid ${C.greenDeep}` : '1.5px solid transparent',
            paddingBottom: '0.25rem', transition: 'color 0.2s, border-color 0.2s',
          }}>
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Bento grid ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.inkMuted, padding: '4rem 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic' }}>
            Aucune photo dans ce thème.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '200px',
            gap: '0.5rem',
          }}>
            {filtered.map((img, i) => {
              /* Big cell : première image, span 2 colonnes et 2 rangées */
              const isBig  = i === 0;
              /* Panoramique : dernière image, plein-largeur */
              const isPano = i === filtered.length - 1 && filtered.length > 3;

              return (
                <div
                  key={img.src}
                  className={`gal-bento-wrap reveal reveal-delay-${(i % 4) + 1}`}
                  onClick={() => setLightbox(i)}
                  style={{
                    gridColumn: isBig ? 'span 2' : isPano ? '1 / -1' : undefined,
                    gridRow:    isBig ? 'span 2' : undefined,
                    borderRadius: 10,
                  }}
                >
                  <div
                    className="gal-bento-img"
                    style={{ backgroundImage: `url(${img.src})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                  />
                  <div className="gal-bento-overlay">
                    <span className="gal-bento-caption">{img.alt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {lightboxIdx !== null && (
        <Lightbox
          images={filtered.map(img => img.src)}
          initialIndex={lightboxIdx}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
