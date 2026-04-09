import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function TrailImage({ src, x, y, id, slices }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const size = 80;
  const sliceH = size / slices;

  return (
    <div style={{
      position: 'fixed',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden',
      borderRadius: 4,
      animation: 'trailFadeOut 0.6s ease forwards',
    }}>
      {Array.from({ length: slices }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: 0,
          top: i * sliceH,
          width: size,
          height: sliceH,
          overflow: 'hidden',
          animation: `trailSlice${i % 2 === 0 ? 'L' : 'R'} 0.5s ease forwards`,
          animationDelay: `${i * 0.04}s`,
        }}>
          <img
            src={src}
            alt=""
            style={{
              position: 'absolute',
              top: -(i * sliceH),
              left: 0,
              width: size,
              height: size,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export function PixelatedImageTrail({
  images = [],
  slices = 4,
  spawnThreshold = 80,
  smoothing = 0.12,
}) {
  const [trails, setTrails] = useState([]);
  const lastPos   = useRef({ x: -999, y: -999 });
  const counterRef = useRef(0);

  useEffect(() => {
    const onMove = (e) => {
      const { clientX: x, clientY: y } = e;
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < spawnThreshold) return;
      lastPos.current = { x, y };
      const id = counterRef.current++;
      const src = images[id % images.length];
      setTrails(prev => [...prev.slice(-10), { id, x, y, src }]);
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [images, spawnThreshold]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <style>{`
        @keyframes trailFadeOut { 0%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(0.85)} }
        @keyframes trailSliceL  { 0%{transform:translateX(0)} 100%{transform:translateX(-12px)} }
        @keyframes trailSliceR  { 0%{transform:translateX(0)} 100%{transform:translateX(12px)} }
      `}</style>
      {trails.map(t => (
        <TrailImage key={t.id} {...t} slices={slices} />
      ))}
    </>,
    document.body
  );
}
