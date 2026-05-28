'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';
import AnimatedMarqueeHero from '@/components/ui/AnimatedMarqueeHero';

const Lightbox = dynamic(() => import('@/components/ui/Lightbox'), { ssr: false });

/* ────────────────────────────────────────────────
   Images — thème + dimensions indicatives pour
   alimenter le bento CSS (largeur / hauteur)
──────────────────────────────────────────────── */
const IMAGES = [
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt — vue panoramique', theme: 'palmeraie', w: 1600, h: 900  },
  { src: '/images/tighremt/palmeraie-sol.jpg',      alt: 'Sols de la palmeraie',                    theme: 'palmeraie', w: 1200, h: 800  },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes de Tighremt',                      theme: 'palmeraie', w: 1000, h: 750  },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt',                     theme: 'village',   w: 800,  h: 1200 },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar ancestral de Tighremt',              theme: 'village',   w: 1400, h: 900  },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt',                     theme: 'village',   w: 1600, h: 700  },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain',                   theme: 'paysage',   w: 1400, h: 900  },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie',                  theme: 'palmeraie', w: 1000, h: 750  },
  { src: '/images/tata/tata-oasis.webp',            alt: 'Oasis de Tata vue du ciel',               theme: 'tata',      w: 1200, h: 800  },
  { src: '/images/tata/tata-place.webp',            alt: 'Place principale de Tata',                theme: 'tata',      w: 1200, h: 800  },
  { src: '/images/tata/tata-porte.webp',            alt: 'Porte historique de la ville de Tata',    theme: 'tata',      w: 800,  h: 1000 },
  { src: '/images/tata/tata-mosquee.webp',          alt: 'Mosquée de Tata',                         theme: 'tata',      w: 900,  h: 1100 },
  { src: '/images/tata/tata-ville.webp',            alt: 'Ville de Tata',                           theme: 'tata',      w: 1200, h: 800  },
];

/* Marquee du hero — sélection variée (paysages + portraits) */
const MARQUEE = [
  { src: '/images/tata/tata-oasis.webp',            alt: 'Oasis de Tata' },
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt' },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt' },
  { src: '/images/tata/tata-porte.webp',            alt: 'Porte de Tata' },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes' },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar de Tighremt' },
  { src: '/images/tata/tata-place.webp',            alt: 'Place de Tata' },
  { src: '/images/tighremt/palmeraie-ciel.jpg',     alt: 'Palmiers de Tighremt' },
  { src: '/images/tata/tata-mosquee.webp',          alt: 'Mosquée de Tata' },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt' },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain' },
  { src: '/images/tata/tata-ville.webp',            alt: 'Ville de Tata' },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie' },
  { src: '/images/tighremt/ksar-couloir.jpg',       alt: 'Architecture en terre du ksar' },
];

const THEMES       = ['tous', 'palmeraie', 'village', 'paysage', 'tata'];
const THEME_LABELS = { tous: 'Tous', palmeraie: 'Palmeraie', village: 'Village', paysage: 'Paysage', tata: 'Tata' };

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme]          = useState('tous');
  const [lightboxIdx, setLightbox] = useState(null);
  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>
      <style>{`
        /* ── Filtres identiques à Actualités ── */
        .gal-filter {
          background: none; border: none; cursor: pointer;
          font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
          font-weight: 500; padding: 0 0 0.3rem;
          position: relative; transition: color 0.25s;
        }
        .gal-filter::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 0; height: 1.5px;
          background: ${C.greenDeep};
          transition: width 0.38s cubic-bezier(0.16,1,0.3,1);
        }
        .gal-filter.is-active { color: ${C.greenDeep}; }
        .gal-filter.is-active::after { width: 100%; }

        /* ── Cellule bento ── */
        .gal-cell {
          overflow: hidden;
          position: relative;
          border-radius: 10px;
          cursor: zoom-in;
        }
        .gal-cell img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .gal-cell:hover img { transform: scale(1.06); }

        /* ── Overlay + légende ── */
        .gal-overlay {
          position: absolute; inset: 0;
          background: rgba(19,61,32,0);
          transition: background 0.38s ease;
          display: flex; align-items: flex-end;
          padding: 1rem 1.2rem;
        }
        .gal-cell:hover .gal-overlay { background: rgba(19,61,32,0.42); }

        .gal-caption {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic;
          font-size: 0.92rem;
          color: rgba(255,255,255,0.94);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
          line-height: 1.3;
        }
        .gal-cell:hover .gal-caption { opacity: 1; transform: translateY(0); }
      `}</style>

      {/* ── Hero marquee animé ── */}
      <AnimatedMarqueeHero
        tagline="Galerie · Tata & Tighremt"
        title="Tighremt en images"
        description="La beauté de la palmeraie, du ksar et du village à travers nos photos — et celles de la ville de Tata."
        ctaText="Découvrir la galerie"
        ctaHref="#galerie-grid"
        images={MARQUEE}
      />

      <SectionDivider />

      {/* ── Filtres ── */}
      <div style={{
        background: '#f5f0e8', padding: '1.75rem 1.5rem 0',
        display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        {THEMES.map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`gal-filter${theme === t ? ' is-active' : ''}`}
            style={{ color: theme === t ? C.greenDeep : C.inkLight }}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Bento grid ── */}
      <section id="galerie-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem', scrollMarginTop: '5rem' }}>
        {filtered.length === 0 ? (
          <p style={{
            textAlign: 'center', color: C.inkMuted, padding: '4rem 0',
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic',
          }}>
            Aucune photo dans ce thème.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '240px',
            gap: '0.6rem',
          }}>
            {filtered.map((img, i) => {
              const isBig  = i === 0;
              const isPano = i === filtered.length - 1 && filtered.length > 3;
              const delay  = (i % 4) + 1;

              return (
                <div
                  key={img.src}
                  className={`gal-cell reveal reveal-delay-${delay}`}
                  onClick={() => setLightbox(i)}
                  style={{
                    gridColumn: isBig ? 'span 2' : isPano ? '1 / -1' : undefined,
                    gridRow:    isBig ? 'span 2' : undefined,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.src}
                    alt={img.alt}
                    width={img.w}
                    height={img.h}
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                  <div className="gal-overlay">
                    <span className="gal-caption">{img.alt}</span>
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
