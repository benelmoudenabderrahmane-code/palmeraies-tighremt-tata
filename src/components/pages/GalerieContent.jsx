'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { C, FONT } from '@/lib/tokens';
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
  { src: '/images/tighremt/tigh-g1.jpg',  alt: 'Tighremt — village et palmeraie 1',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g2.jpg',  alt: 'Tighremt — village et palmeraie 2',  theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g3.jpg',  alt: 'Tighremt — village et palmeraie 3',  theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g4.jpg',  alt: 'Tighremt — village et palmeraie 4',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g5.jpg',  alt: 'Tighremt — village et palmeraie 5',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g6.jpg',  alt: 'Tighremt — village et palmeraie 6',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g7.jpg',  alt: 'Tighremt — village et palmeraie 7',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g8.jpg',  alt: 'Tighremt — village et palmeraie 8',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g9.jpg',  alt: 'Tighremt — village et palmeraie 9',  theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g10.jpg', alt: 'Tighremt — village et palmeraie 10', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g11.jpg', alt: 'Tighremt — village et palmeraie 11', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g12.jpg', alt: 'Tighremt — village et palmeraie 12', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g13.jpg', alt: 'Tighremt — village et palmeraie 13', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g14.jpg', alt: 'Tighremt — village et palmeraie 14', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g15.jpg', alt: 'Tighremt — village et palmeraie 15', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g16.jpg', alt: 'Tighremt — village et palmeraie 16', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g17.jpg', alt: 'Tighremt — village et palmeraie 17', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g18.jpg', alt: 'Tighremt — village et palmeraie 18', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g19.jpg', alt: 'Tighremt — village et palmeraie 19', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g20.jpg', alt: 'Tighremt — village et palmeraie 20', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g21.jpg', alt: 'Tighremt — village et palmeraie 21', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g22.jpg', alt: 'Tighremt — village et palmeraie 22', theme: 'tighremt', w: 1600, h: 901  },
  { src: '/images/tighremt/tigh-g23.jpg', alt: 'Tighremt — village et palmeraie 23', theme: 'tighremt', w: 1600, h: 901  },
  { src: '/images/tighremt/tigh-g24.jpg', alt: 'Tighremt — village et palmeraie 24', theme: 'tighremt', w: 1600, h: 901  },
  { src: '/images/tighremt/tigh-g25.jpg', alt: 'Tighremt — village et palmeraie 25', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g26.jpg', alt: 'Tighremt — village et palmeraie 26', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g27.jpg', alt: 'Tighremt — village et palmeraie 27', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g28.jpg', alt: 'Tighremt — village et palmeraie 28', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g29.jpg', alt: 'Tighremt — village et palmeraie 29', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g30.jpg', alt: 'Tighremt — village et palmeraie 30', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g31.jpg', alt: 'Tighremt — village et palmeraie 31', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g32.jpg', alt: 'Tighremt — village et palmeraie 32', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g33.jpg', alt: 'Tighremt — village et palmeraie 33', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g34.jpg', alt: 'Tighremt — village et palmeraie 34', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g35.jpg', alt: 'Tighremt — village et palmeraie 35', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g36.jpg', alt: 'Tighremt — village et palmeraie 36', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g37.jpg', alt: 'Tighremt — village et palmeraie 37', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g38.jpg', alt: 'Tighremt — village et palmeraie 38', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g39.jpg', alt: 'Tighremt — village et palmeraie 39', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g40.jpg', alt: 'Tighremt — village et palmeraie 40', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g41.jpg', alt: 'Tighremt — village et palmeraie 41', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g42.jpg', alt: 'Tighremt — village et palmeraie 42', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g43.jpg', alt: 'Tighremt — village et palmeraie 43', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g44.jpg', alt: 'Tighremt — village et palmeraie 44', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g45.jpg', alt: 'Tighremt — village et palmeraie 45', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g46.jpg', alt: 'Tighremt — village et palmeraie 46', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g47.jpg', alt: 'Tighremt — village et palmeraie 47', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g48.jpg', alt: 'Tighremt — village et palmeraie 48', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g49.jpg', alt: 'Tighremt — village et palmeraie 49', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g50.jpg', alt: 'Tighremt — village et palmeraie 50', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g51.jpg', alt: 'Tighremt — village et palmeraie 51', theme: 'tighremt', w: 1600, h: 2133 },
  { src: '/images/tighremt/tigh-g52.jpg', alt: 'Tighremt — village et palmeraie 52', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g53.jpg', alt: 'Tighremt — village et palmeraie 53', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g54.jpg', alt: 'Tighremt — village et palmeraie 54', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g55.jpg', alt: 'Tighremt — village et palmeraie 55', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g56.jpg', alt: 'Tighremt — village et palmeraie 56', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g57.jpg', alt: 'Tighremt — village et palmeraie 57', theme: 'tighremt', w: 1600, h: 1200 },
  { src: '/images/tighremt/tigh-g58.jpg', alt: 'Tighremt — village et palmeraie 58', theme: 'tighremt', w: 1600, h: 1200 },
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
  { src: '/images/tighremt/tigh-g2.jpg',  alt: 'Tighremt — paysage 2' },
  { src: '/images/tighremt/tigh-g14.jpg', alt: 'Tighremt — paysage 14' },
  { src: '/images/tighremt/tigh-g22.jpg', alt: 'Tighremt — paysage 22' },
  { src: '/images/tighremt/tigh-g34.jpg', alt: 'Tighremt — paysage 34' },
  { src: '/images/tighremt/tigh-g50.jpg', alt: 'Tighremt — paysage 50' },
];

const THEMES       = ['tous', 'tighremt', 'palmeraie', 'village', 'paysage', 'tata'];
const THEME_LABELS = { tous: 'Tous', tighremt: 'Tighremt', palmeraie: 'Palmeraie', village: 'Village', paysage: 'Paysage', tata: 'Tata' };

/* ── Vignette galerie (image + overlay légende + ouverture lightbox) ── */
function GalThumb({ img, idx, onOpen, priority = false }) {
  return (
    <div
      className="gal-cell"
      onClick={() => onOpen(idx)}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onOpen(idx)}
      role="button"
      tabIndex={0}
      aria-label={`Voir en grand : ${img.alt}`}
      style={{ position: 'relative' }}
    >
      <Image
        src={img.src}
        alt={img.alt}
        fill
        sizes="(max-width: 560px) 100vw, (max-width: 900px) 50vw, 33vw"
        priority={priority}
        style={{ objectFit: 'cover' }}
      />
      <div className="gal-overlay">
        <span className="gal-caption">{img.alt}</span>
      </div>
    </div>
  );
}

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme]          = useState('tous');
  const [lightboxIdx, setLightbox] = useState(null);
  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  // Distribution en 3 colonnes : la colonne centrale reste fixe (sticky) pendant le scroll
  const withIdx  = filtered.map((img, i) => ({ img, idx: i }));
  const sticky   = withIdx.slice(0, 3);
  const rest     = withIdx.slice(3);
  const leftCol  = rest.filter((_, i) => i % 2 === 0);
  const rightCol = rest.filter((_, i) => i % 2 === 1);
  const stickyRows = Math.max(sticky.length, 1);

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
          outline: none;
        }
        .gal-cell:focus-visible {
          outline: 2px solid #e8832a;
          outline-offset: 3px;
          border-radius: 10px;
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
          font-family: ${FONT.alt};
          font-style: italic;
          font-size: 0.92rem;
          color: rgba(255,255,255,0.94);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.16,1,0.3,1);
          line-height: 1.3;
        }
        .gal-cell:hover .gal-caption { opacity: 1; transform: translateY(0); }

        /* ── Galerie scroll — colonnes avec colonne centrale fixe (sticky) ── */
        .gal-sticky {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.6rem;
          align-items: start;
        }
        .gal-track { display: grid; gap: 0.6rem; }
        .gal-track .gal-cell { height: clamp(220px, 26vw, 360px); }
        .gal-pin {
          position: sticky;
          top: 0.6rem;
          height: calc(100vh - 1.2rem);
          display: grid;
          gap: 0.6rem;
        }
        .gal-pin .gal-cell { height: 100%; }
        @media (max-width: 900px) {
          .gal-sticky { grid-template-columns: repeat(2, 1fr); }
          .gal-pin {
            position: static !important;
            height: auto !important;
            grid-template-rows: auto !important;
          }
          .gal-pin .gal-cell { height: clamp(220px, 40vw, 340px); }
        }
        @media (max-width: 560px) {
          .gal-sticky { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ── Hero — image pleine sans marquee ── */}
      <AnimatedMarqueeHero
        tagline="Galerie · Tata & Tighremt"
        title="Tighremt en images"
        description="La beauté de la palmeraie, du ksar et du village à travers nos photos — et celles de la ville de Tata."
        ctaText="Découvrir la galerie"
        ctaHref="#galerie-grid"
        bgImage="/galerie-hero.png?v=2"
        fadeColor="#f5f0e8"
      />

      {/* ── Strip marquee séparé ── */}
      <div style={{ background: '#f5f0e8', overflow: 'hidden', padding: '2.25rem 0 1.5rem', marginTop: '-1px' }}>
        <motion.div
          style={{ display: 'flex', gap: '1rem', alignItems: 'center', willChange: 'transform' }}
          animate={{ x: ['0%', '-50%'] }}
          transition={{ ease: 'linear', duration: 55, repeat: Infinity }}
        >
          {[...MARQUEE, ...MARQUEE].map((img, i) => (
            <div key={i} style={{
              flexShrink: 0,
              width: 'clamp(160px, 22vw, 260px)',
              aspectRatio: '3 / 2',
              borderRadius: '0.75rem',
              overflow: 'hidden',
              transform: `rotate(${i % 2 === 0 ? -1.5 : 1.5}deg)`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt={img.alt || ''}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          ))}
        </motion.div>
      </div>

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

      {/* ── Masonry gallery ── */}
      <section id="galerie-grid" style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem', scrollMarginTop: '5rem' }}>
        {filtered.length === 0 ? (
          <p style={{
            textAlign: 'center', color: C.inkMuted, padding: '4rem 0',
            fontFamily: FONT.alt, fontSize: '1.2rem', fontStyle: 'italic',
          }}>
            Aucune photo dans ce thème.
          </p>
        ) : (
          <div className="gal-sticky">
            {/* Colonne gauche — défile normalement */}
            <div className="gal-track">
              {leftCol.map(({ img, idx }) => (
                <GalThumb key={img.src} img={img} idx={idx} onOpen={setLightbox} />
              ))}
            </div>

            {/* Colonne centrale — reste fixe pendant le scroll */}
            <div className="gal-pin" style={{ gridTemplateRows: `repeat(${stickyRows}, 1fr)` }}>
              {sticky.map(({ img, idx }) => (
                <GalThumb key={img.src} img={img} idx={idx} onOpen={setLightbox} priority />
              ))}
            </div>

            {/* Colonne droite — défile normalement */}
            <div className="gal-track">
              {rightCol.map(({ img, idx }) => (
                <GalThumb key={img.src} img={img} idx={idx} onOpen={setLightbox} />
              ))}
            </div>
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
