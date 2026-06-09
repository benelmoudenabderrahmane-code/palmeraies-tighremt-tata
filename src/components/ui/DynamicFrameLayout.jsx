'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { FONT } from '@/lib/tokens';

const ImageComparison = dynamic(
  () => import('@/components/ui/ImageComparison'),
  { ssr: false }
);

/**
 * DynamicFrameLayout — grille 3×3 interactive
 *
 * Props :
 *  - projects   : tableau de projets (au moins 9)
 *  - hoverSize  : taille fr de la ligne/colonne survolée (défaut 6)
 *  - gap        : espacement en px entre cellules (défaut 5)
 *
 * Comportement :
 *  - Survol → la ligne ET la colonne de la cellule s'agrandissent (grid fr)
 *  - Clic  → modal avant/après (ImageComparison) si le projet a before+after,
 *            sinon affichage de la photo principale
 */
export default function DynamicFrameLayout({ projects, hoverSize = 6, gap = 5 }) {
  const [hovered, setHovered] = useState(null); // { row, col }
  const [selected, setSelected] = useState(null); // index dans top9

  const top9 = projects.slice(0, 9);
  const nonH = (12 - hoverSize) / 2;

  const rowSizes = !hovered
    ? '1fr 1fr 1fr'
    : [0, 1, 2].map(r => (r === hovered.row ? `${hoverSize}fr` : `${nonH}fr`)).join(' ');

  const colSizes = !hovered
    ? '1fr 1fr 1fr'
    : [0, 1, 2].map(c => (c === hovered.col ? `${hoverSize}fr` : `${nonH}fr`)).join(' ');

  const sel = selected !== null ? top9[selected] : null;
  const selHasComp = sel && !!(sel.before && sel.after);

  return (
    <>
      {/* ── Grille 3×3 ── */}
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'grid',
          gridTemplateRows: rowSizes,
          gridTemplateColumns: colSizes,
          gap: `${gap}px`,
          transition: 'grid-template-rows 0.4s ease, grid-template-columns 0.4s ease',
        }}
      >
        {top9.map((project, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const isHov = hovered?.row === row && hovered?.col === col;
          const pHasComp = !!(project.before && project.after);
          const imgSrc =
            project.after ||
            project.afterFallback ||
            project.banner ||
            project.gallery?.[0]?.src;
          const fallback = project.afterFallback || project.gallery?.[0]?.fallback;

          return (
            <div
              key={project.id}
              onMouseEnter={() => setHovered({ row, col })}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(i)}
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: '0.45rem',
                cursor: 'pointer',
                /* Cadre verre — ni crème ni vert, juste blanc translucide */
                border: `1px solid rgba(255,255,255,${isHov ? 0.42 : 0.16})`,
                boxShadow: isHov ? '0 0 0 1px rgba(196,169,107,0.25)' : 'none',
                transition: 'border-color 0.35s ease, box-shadow 0.35s ease',
              }}
            >
              {/* Photo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={project.title}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                  transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
                  transform: isHov ? 'scale(1.09)' : 'scale(1)',
                }}
                onError={
                  fallback
                    ? (e) => { e.target.onerror = null; e.target.src = fallback; }
                    : undefined
                }
              />

              {/* Dégradé de lisibilité */}
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isHov
                    ? 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.42) 0%, transparent 60%)',
                  transition: 'background 0.3s ease',
                  pointerEvents: 'none',
                }}
              />

              {/* Label au survol */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '0.45rem 0.55rem',
                  transform: isHov ? 'translateY(0)' : 'translateY(6px)',
                  opacity: isHov ? 1 : 0,
                  transition: 'opacity 0.3s ease, transform 0.3s ease',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    fontSize: '0.5rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    color: 'rgba(196,169,107,0.95)',
                    marginBottom: '0.15rem',
                  }}
                >
                  {pHasComp ? '◀ avant · après ▶' : project.category}
                </div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    color: '#fff',
                    fontWeight: 500,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal avant/après ── */}
      {selected !== null && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9000,
            background: 'rgba(0,0,0,0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '2rem 1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(90vw, 860px)' }}
          >
            {/* Catégorie + lieu */}
            <p
              style={{
                textAlign: 'center',
                fontSize: '0.6rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                fontWeight: 600,
                color: 'rgba(196,169,107,0.9)',
                marginBottom: '0.6rem',
              }}
            >
              {sel?.category}
              {sel?.subtitle ? ` · ${sel.subtitle}` : ''}
            </p>

            {/* Titre */}
            <h3
              style={{
                fontFamily: FONT.alt,
                fontSize: 'clamp(1.3rem,2.5vw,2rem)',
                fontWeight: 400,
                color: '#fff',
                textAlign: 'center',
                margin: '0 0 1.25rem',
              }}
            >
              {sel?.title}
            </h3>

            {/* Avant/après ou photo seule */}
            {selHasComp ? (
              <ImageComparison
                beforeImage={sel.before}
                afterImage={sel.after}
                beforeFallback={sel.beforeFallback}
                afterFallback={sel.afterFallback}
                height={460}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={sel?.banner || sel?.gallery?.[0]?.src}
                alt={sel?.title || ''}
                style={{ width: '100%', borderRadius: '0.75rem', display: 'block' }}
              />
            )}

            {/* Hint fermeture */}
            <p
              style={{
                textAlign: 'center',
                marginTop: '1rem',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.06em',
              }}
            >
              Cliquez en dehors pour fermer
            </p>
          </div>
        </div>
      )}
    </>
  );
}
