'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Lightbox = dynamic(() => import('@/components/ui/Lightbox'), { ssr: false });

const IMAGES = [
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt — vue panoramique', theme: 'palmeraie', w: 1920, h: 1080 },
  { src: '/images/tighremt/palmeraie-sol.jpg',      alt: 'Sols de la palmeraie',                   theme: 'palmeraie', w: 1280, h: 960  },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes de Tighremt',                     theme: 'palmeraie', w: 1280, h: 853  },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt',                    theme: 'village',   w: 800,  h: 1067 },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar ancestral de Tighremt',             theme: 'village',   w: 1440, h: 810  },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt',                    theme: 'village',   w: 1920, h: 1080 },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain',                  theme: 'paysage',   w: 1280, h: 960  },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie',                 theme: 'palmeraie', w: 1280, h: 853  },
];

const THEMES       = ['tous', 'palmeraie', 'village', 'paysage'];
const THEME_LABELS = { tous: 'Tous', palmeraie: 'Palmeraie', village: 'Village', paysage: 'Paysage' };

/**
 * Une cellule du bento.
 * bentoIdx 0   → grande image dominante (gridRow 1/3, gridColumn 1/2)
 * bentoIdx 1-4 → cellules standard
 * bentoIdx 5+  → bannière panoramique plein-largeur
 */
function BentoCell({ img, bentoIdx, lightboxIdx, onOpen }) {
  const isPano = bentoIdx >= 5;
  const isBig  = bentoIdx === 0;

  const gridStyle = isPano
    ? { gridColumn: '1 / 4', height: 130 }
    : isBig
    ? { gridColumn: '1 / 2', gridRow: '1 / 3', minHeight: 360 }
    : { height: 175 };

  return (
    <div
      className={`gal-bento-wrap reveal reveal-delay-${(bentoIdx % 4) + 1}`}
      onClick={() => onOpen(lightboxIdx)}
      style={gridStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.src}
        alt={img.alt}
        className="gal-bento-img"
        loading={bentoIdx < 2 ? 'eager' : 'lazy'}
      />
      <div className="gal-bento-overlay">
        <span className="gal-bento-caption">{img.alt}</span>
      </div>
    </div>
  );
}

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme]          = useState('tous');
  const [lightboxIdx, setLightbox] = useState(null);
  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  const bentoCells = filtered.slice(0, 5);
  const panoCells  = filtered.slice(5);

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
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1,
          }}>
            Tighremt en images
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7 }}>
            La beauté de la palmeraie et du village à travers nos photos.
          </p>
        </div>
      </section>

      {/* ── Filtres — text-links petites caps ── */}
      <div style={{
        background: '#f5f0e8', padding: '1.75rem 1.5rem 0',
        display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        {THEMES.map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
              color:        theme === t ? C.greenDeep : C.inkLight,
              borderBottom: theme === t ? `1.5px solid ${C.greenDeep}` : '1.5px solid transparent',
              paddingBottom: '0.25rem',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
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
          <>
            {/* Grille bento principale : 2fr 1fr 1fr, 2 rangées */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: bentoCells.length >= 3 ? '2fr 1fr 1fr' : `repeat(${Math.min(bentoCells.length, 3)}, 1fr)`,
              gridTemplateRows: bentoCells.length >= 3 ? '180px 180px' : '240px',
              gap: '0.5rem',
              marginBottom: bentoCells.length > 0 ? '0.5rem' : 0,
            }}>
              {bentoCells.map((img, i) => (
                <BentoCell
                  key={img.src}
                  img={img}
                  bentoIdx={i}
                  lightboxIdx={i}
                  onOpen={setLightbox}
                />
              ))}
            </div>

            {/* Bannières panoramiques (images 5+) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {panoCells.map((img, i) => (
                <BentoCell
                  key={img.src}
                  img={img}
                  bentoIdx={5 + i}
                  lightboxIdx={5 + i}
                  onOpen={setLightbox}
                />
              ))}
            </div>
          </>
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
