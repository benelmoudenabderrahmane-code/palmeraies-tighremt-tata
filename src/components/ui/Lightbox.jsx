'use client';
import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';

const GD = '#133d20';
const O  = '#c4703f';

export default function Lightbox({ images, startIndex, onClose }) {
  const [current, setCurrent] = useState(startIndex ?? 0);
  const [loaded,  setLoaded]  = useState(false);
  const [zoomed,  setZoomed]  = useState(false);
  const [drag,    setDrag]    = useState(null); // { startX }

  const total = images.length;

  const prev = useCallback(() => {
    setLoaded(false);
    setZoomed(false);
    setCurrent(c => (c - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setLoaded(false);
    setZoomed(false);
    setCurrent(c => (c + 1) % total);
  }, [total]);

  /* Keyboard navigation */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')     onClose();
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, prev, next]);

  /* Prevent body scroll */
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* Touch swipe */
  const onTouchStart = (e) => setDrag({ startX: e.touches[0].clientX });
  const onTouchEnd   = (e) => {
    if (!drag) return;
    const dx = e.changedTouches[0].clientX - drag.startX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    setDrag(null);
  };

  const img = images[current];

  return (
    <>
      <style>{`
        @keyframes lbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes lbImgIn {
          from { opacity: 0; transform: scale(0.94) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .lb-overlay { animation: lbFadeIn 0.28s ease both; }
        .lb-img-wrap { animation: lbImgIn 0.38s cubic-bezier(0.16,1,0.3,1) both; }
        .lb-btn {
          position: absolute;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 50%;
          width: 48px; height: 48px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #fff;
          transition: background 0.18s, transform 0.18s;
          backdrop-filter: blur(8px);
          z-index: 10;
          -webkit-tap-highlight-color: transparent;
        }
        .lb-btn:hover { background: rgba(255,255,255,0.22); transform: scale(1.1); }
        .lb-btn:active { transform: scale(0.95); }
        .lb-dot {
          width: 6px; height: 6px; border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.5);
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .lb-dot.active {
          background: ${O}; border-color: ${O}; transform: scale(1.3);
        }
        .lb-dot:hover:not(.active) { background: rgba(255,255,255,0.4); }
        @media (prefers-reduced-motion: reduce) {
          .lb-overlay, .lb-img-wrap { animation: none; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="lb-overlay"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        style={{
          position: 'fixed', inset: 0, zIndex: 99000,
          background: 'rgba(5,12,7,0.94)',
          backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            position: 'fixed', top: 20, right: 20, zIndex: 99001,
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '50%', width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#fff', backdropFilter: 'blur(8px)',
            transition: 'background 0.18s, transform 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* Counter */}
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.72rem', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.45)',
          fontWeight: 400, zIndex: 99001,
        }}>
          {current + 1} / {total}
        </div>

        {/* Prev arrow */}
        {total > 1 && (
          <button
            className="lb-btn"
            onClick={prev}
            aria-label="Image précédente"
            style={{ left: 'clamp(12px, 3vw, 32px)', top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
        )}

        {/* Image */}
        <div
          className="lb-img-wrap"
          key={current}
          style={{
            maxWidth: 'min(900px, 90vw)',
            maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
          }}
        >
          <div
            onClick={() => setZoomed(z => !z)}
            style={{
              position: 'relative', cursor: zoomed ? 'zoom-out' : 'zoom-in',
              borderRadius: '1rem', overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
            }}
          >
            {!loaded && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.1)',
                  borderTopColor: O,
                  animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            <img
              src={img.src || img}
              alt={img.alt || ''}
              onLoad={() => setLoaded(true)}
              onError={img.fallback ? (e) => { e.target.onerror = null; e.target.src = img.fallback; setLoaded(true); } : () => setLoaded(true)}
              style={{
                display: 'block',
                maxWidth: 'min(900px, 90vw)',
                maxHeight: zoomed ? 'none' : '70vh',
                width: 'auto',
                height: 'auto',
                borderRadius: '1rem',
                objectFit: 'contain',
                transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)',
                opacity: loaded ? 1 : 0,
                transition: 'opacity 0.35s ease',
              }}
            />
            {loaded && (
              <div style={{
                position: 'absolute', top: 10, right: 10,
                background: 'rgba(0,0,0,0.35)', borderRadius: '0.5rem',
                padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4,
                color: 'rgba(255,255,255,0.6)', fontSize: '0.65rem',
                backdropFilter: 'blur(4px)', pointerEvents: 'none',
              }}>
                <ZoomIn size={11} />
                {zoomed ? 'Réduire' : 'Agrandir'}
              </div>
            )}
          </div>

          {/* Caption */}
          {img.alt && (
            <p style={{
              fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)',
              textAlign: 'center', fontStyle: 'italic', fontWeight: 300,
              maxWidth: '60ch', lineHeight: 1.5,
            }}>
              {img.alt}
            </p>
          )}
        </div>

        {/* Next arrow */}
        {total > 1 && (
          <button
            className="lb-btn"
            onClick={next}
            aria-label="Image suivante"
            style={{ right: 'clamp(12px, 3vw, 32px)', top: '50%', transform: 'translateY(-50%)' }}
          >
            <ChevronRight size={22} strokeWidth={2} />
          </button>
        )}

        {/* Dots */}
        {total > 1 && total <= 12 && (
          <div style={{
            position: 'fixed', bottom: 24,
            display: 'flex', gap: '0.5rem', alignItems: 'center', zIndex: 99001,
          }}>
            {images.map((_, i) => (
              <button
                key={i}
                className={`lb-dot${i === current ? ' active' : ''}`}
                onClick={() => { setLoaded(false); setZoomed(false); setCurrent(i); }}
                aria-label={`Image ${i + 1}`}
                style={{ border: 'none', cursor: 'pointer', padding: 0 }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
