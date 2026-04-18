'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function BeforeAfterPixel({
  beforeSrc,
  afterSrc,
  beforeFallback,
  afterFallback,
  beforeLabel = 'AVANT',
  afterLabel  = 'APRÈS',
  height      = 420,
}) {
  const containerRef  = useRef(null);
  const [pos, setPos]         = useState(50);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered]   = useState(false);
  const [interacted, setInteracted] = useState(false);
  const dragRef = useRef(false);

  /* ── Auto-sweep intro animation ──────────────────────────── */
  useEffect(() => {
    let raf;
    let startTs = null;
    const DURATION = 2200;

    const sweep = (ts) => {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / DURATION, 1);
      // Cubic ease-in-out
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      // Arc: 50 → 18 → 50
      let p;
      if (t < 0.5) {
        p = 50 - 32 * (ease * 2);
      } else {
        p = 18 + 32 * ((ease - 0.5) * 2);
      }
      setPos(Math.round(p));
      if (t < 1) raf = requestAnimationFrame(sweep);
      else setInteracted(true);
    };

    const timer = setTimeout(() => {
      if (!dragRef.current) raf = requestAnimationFrame(sweep);
    }, 700);

    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, []);

  /* ── Pointer helpers ─────────────────────────────────────── */
  const applyPos = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x    = e.touches ? e.touches[0].clientX : e.clientX;
    const p    = Math.max(3, Math.min(97, ((x - rect.left) / rect.width) * 100));
    setPos(Math.round(p));
  }, []);

  const onDown = useCallback((e) => {
    dragRef.current = true;
    setDragging(true);
    setInteracted(true);
    applyPos(e);
  }, [applyPos]);

  const onMove = useCallback((e) => {
    if (dragRef.current) applyPos(e);
  }, [applyPos]);

  const onUp = useCallback(() => {
    dragRef.current = false;
    setDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend',  onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend',  onUp);
    };
  }, [onMove, onUp]);

  const tr = dragging ? 'none' : 'clip-path 0.06s linear, left 0.06s linear';

  return (
    <>
      <style>{`
        @keyframes bap-hint-fade {
          0%   { opacity: 0; transform: translateX(-50%) translateY(6px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          75%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-4px); }
        }
        @keyframes bap-handle-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5), 0 6px 24px rgba(0,0,0,0.32); }
          50%       { box-shadow: 0 0 0 10px rgba(255,255,255,0), 0 6px 24px rgba(0,0,0,0.32); }
        }
        @keyframes bap-line-glow {
          0%, 100% { opacity: 0.8; }
          50%       { opacity: 1; }
        }
      `}</style>

      <div
        ref={containerRef}
        onMouseDown={onDown}
        onTouchStart={onDown}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: '100%',
          height,
          userSelect: 'none',
          borderRadius: '1.25rem',
          overflow: 'hidden',
          cursor: 'ew-resize',
          touchAction: 'none',
          background: '#1a1a18',
        }}
      >
        {/* ── AVANT (full image, base layer) ── */}
        <img
          src={beforeSrc}
          alt={beforeLabel}
          onError={beforeFallback ? (e) => { e.target.onerror = null; e.target.src = beforeFallback; } : undefined}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            pointerEvents: 'none',
          }}
        />

        {/* ── APRÈS (clipped top layer) ── */}
        <img
          src={afterSrc}
          alt={afterLabel}
          onError={afterFallback ? (e) => { e.target.onerror = null; e.target.src = afterFallback; } : undefined}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            clipPath: `inset(0 ${100 - pos}% 0 0 round 0)`,
            transition: tr,
            pointerEvents: 'none',
          }}
        />

        {/* ── Glowing divider line ── */}
        <div style={{
          position: 'absolute',
          top: 0, bottom: 0,
          left: `${pos}%`,
          width: 3,
          transform: 'translateX(-50%)',
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,0.3))',
          boxShadow: '0 0 16px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.2)',
          transition: dragging ? 'none' : 'left 0.06s linear',
          animation: 'bap-line-glow 2.5s ease-in-out infinite',
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* ── Drag handle ── */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: `${pos}%`,
          transform: 'translate(-50%, -50%)',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3,
          pointerEvents: 'none',
          transition: dragging ? 'none' : 'left 0.06s linear',
          animation: !dragging ? 'bap-handle-pulse 2.5s ease-in-out infinite' : 'none',
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute', inset: -6,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.35)',
            transition: 'opacity 0.3s',
            opacity: hovered ? 1 : 0.5,
          }} />
          {/* SVG arrows */}
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M8 6L3.5 11L8 16" stroke="#133d20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 6L18.5 11L14 16" stroke="#133d20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* ── APRÈS badge ── */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          background: 'rgba(19,61,32,0.88)',
          color: '#fff', fontSize: '0.6rem',
          letterSpacing: '0.2em', fontWeight: 700,
          padding: '5px 12px', borderRadius: 6,
          pointerEvents: 'none', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          zIndex: 4,
        }}>
          {afterLabel}
        </div>

        {/* ── AVANT badge ── */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(0,0,0,0.55)',
          color: '#fff', fontSize: '0.6rem',
          letterSpacing: '0.2em', fontWeight: 700,
          padding: '5px 12px', borderRadius: 6,
          pointerEvents: 'none', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 4,
        }}>
          {beforeLabel}
        </div>

        {/* ── Hint "Glisser" ── */}
        {!interacted && (
          <div style={{
            position: 'absolute',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.62rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(0,0,0,0.38)',
            padding: '5px 14px',
            borderRadius: 99,
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: 4,
            whiteSpace: 'nowrap',
            animation: 'bap-hint-fade 3.5s ease 0.6s forwards',
          }}>
            ← Glisser pour comparer →
          </div>
        )}
      </div>
    </>
  );
}
