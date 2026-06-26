'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

/*
 * VideoFrameLayout — grille 3×3 interactive (adaptée de 21st.dev)
 * Utilise des images à la place des vidéos (assets locaux uniquement).
 * Sur hover : la cellule survolée agrandit sa ligne ET sa colonne (CSS grid fr),
 * et l'image zoome légèrement (scale via mediaSize).
 */
function FrameCell({ src, alt, mediaSize, isHovered }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        borderRadius: '0.45rem',
        boxShadow: isHovered
          ? '0 20px 44px rgba(8,26,14,0.55)'
          : '0 4px 16px rgba(8,26,14,0.22)',
        transition: 'box-shadow 0.35s ease',
      }}
    >
      {/* Image zoomable */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ''}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${isHovered ? mediaSize * 1.08 : mediaSize})`,
          transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)',
          display: 'block',
        }}
      />

      {/* Dégradé assombrisseur au repos, léger au survol */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: isHovered
            ? 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)'
            : 'rgba(0,0,0,0.18)',
          transition: 'background 0.3s ease',
          pointerEvents: 'none',
        }}
      />

      {/* Filet doré premium au survol */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '0.45rem',
          pointerEvents: 'none',
          boxShadow: isHovered
            ? 'inset 0 0 0 1.5px rgba(196,169,107,0.9), inset 0 0 0 4px rgba(250,246,236,0.85), inset 0 0 0 5.5px rgba(196,169,107,0.55)'
            : 'inset 0 0 0 1px rgba(196,169,107,0.3)',
          transition: 'box-shadow 0.35s ease',
        }}
      />
    </div>
  );
}

export default function VideoFrameLayout({
  frames,
  hoverSize = 6,
  gapSize = 5,
}) {
  const [hovered, setHovered] = useState(null);

  const nonH = (12 - hoverSize) / 2;

  const rowSizes = !hovered
    ? '4fr 4fr 4fr'
    : [0, 1, 2].map(r => (r === hovered.row ? `${hoverSize}fr` : `${nonH}fr`)).join(' ');

  const colSizes = !hovered
    ? '4fr 4fr 4fr'
    : [0, 1, 2].map(c => (c === hovered.col ? `${hoverSize}fr` : `${nonH}fr`)).join(' ');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        gridTemplateRows: rowSizes,
        gridTemplateColumns: colSizes,
        gap: `${gapSize}px`,
        transition: 'grid-template-rows 0.4s ease, grid-template-columns 0.4s ease',
      }}
    >
      {frames.map((frame) => {
        const row = Math.floor(frame.defaultPos.y / 4);
        const col = Math.floor(frame.defaultPos.x / 4);
        const isHov = hovered?.row === row && hovered?.col === col;

        return (
          <motion.div
            key={frame.id}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHovered({ row, col })}
            onMouseLeave={() => setHovered(null)}
          >
            <FrameCell
              src={frame.image}
              alt={frame.alt || ''}
              mediaSize={frame.mediaSize ?? 1}
              isHovered={isHov}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
