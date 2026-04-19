'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';

/**
 * ImageComparison — clip-path based before/after slider.
 * Props:
 *   beforeImage   {string}  URL of the "before" (bottom layer)
 *   afterImage    {string}  URL of the "after"  (top, clipped layer)
 *   altBefore     {string}
 *   altAfter      {string}
 *   beforeLabel   {string}  badge text, default "AVANT"
 *   afterLabel    {string}  badge text, default "APRÈS"
 *   height        {number}  px height of the container, default 420
 *   beforeFallback {string}
 *   afterFallback  {string}
 */
export default function ImageComparison({
  beforeImage,
  afterImage,
  altBefore     = 'Avant',
  altAfter      = 'Après',
  beforeLabel   = 'AVANT',
  afterLabel    = 'APRÈS',
  height        = 420,
  beforeFallback,
  afterFallback,
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging]         = useState(false);
  const [hovered, setHovered]               = useState(false);
  const [interacted, setInteracted]         = useState(false);
  const containerRef = useRef(null);
  const dragging     = useRef(false);

  /* ── auto-sweep intro ─────────────────────────────────────── */
  useEffect(() => {
    let raf;
    let startTs = null;
    const DURATION = 2000;

    const sweep = (ts) => {
      if (!startTs) startTs = ts;
      const t = Math.min((ts - startTs) / DURATION, 1);
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const p = t < 0.5 ? 50 - 30 * ease * 2 : 20 + 30 * (ease - 0.5) * 2;
      setSliderPosition(Math.round(p));
      if (t < 1) raf = requestAnimationFrame(sweep);
      else setInteracted(true);
    };

    const timer = setTimeout(() => {
      if (!dragging.current) raf = requestAnimationFrame(sweep);
    }, 600);

    return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
  }, []);

  /* ── pointer logic ────────────────────────────────────────── */
  const applyPos = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    let p = ((clientX - rect.left) / rect.width) * 100;
    p = Math.max(1, Math.min(99, p));
    setSliderPosition(p);
  }, []);

  const handleMouseDown = () => {
    dragging.current = true;
    setIsDragging(true);
    setInteracted(true);
  };
  const handleMouseUp   = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);
  const handleMouseMove = (e) => { if (dragging.current) applyPos(e.clientX); };
  const handleTouchStart = () => {
    dragging.current = true;
    setIsDragging(true);
    setInteracted(true);
  };
  const handleTouchEnd  = useCallback(() => {
    dragging.current = false;
    setIsDragging(false);
  }, []);
  const handleTouchMove = (e) => {
    if (dragging.current) applyPos(e.touches[0].clientX);
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseUp, handleTouchEnd]);

  return (
    <>
      <style>{`
        @keyframes ic-hint-fade {
          0%   { opacity: 0; transform: translateX(-50%) translateY(6px); }
          15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
          78%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes ic-line-pulse {
          0%,100% { opacity: 0.85; }
          50%      { opacity: 1; }
        }
      `}</style>

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onMouseEnter={() => setHovered(true)}
        style={{
          position: 'relative',
          width: '100%',
          height,
          borderRadius: '1.25rem',
          overflow: 'hidden',
          cursor: 'ew-resize',
          userSelect: 'none',
          touchAction: 'none',
          background: '#1a1a18',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        }}
      >
        {/* ── AVANT (base layer, full width) ── */}
        <img
          src={beforeImage}
          alt={altBefore}
          draggable={false}
          onError={beforeFallback ? (e) => { e.target.onerror = null; e.target.src = beforeFallback; } : undefined}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: 'left',
            display: 'block', pointerEvents: 'none',
          }}
        />

        {/* ── APRÈS (clipped top layer) ── */}
        <div
          style={{
            position: 'absolute', inset: 0,
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            transition: isDragging ? 'none' : 'clip-path 0.06s linear',
          }}
        >
          <img
            src={afterImage}
            alt={altAfter}
            draggable={false}
            onError={afterFallback ? (e) => { e.target.onerror = null; e.target.src = afterFallback; } : undefined}
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'left',
              display: 'block', pointerEvents: 'none',
            }}
          />
        </div>

        {/* ── Divider line ── */}
        <div
          style={{
            position: 'absolute',
            top: 0, bottom: 0,
            left: `${sliderPosition}%`,
            width: 3,
            transform: 'translateX(-50%)',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.25), rgba(255,255,255,0.95) 25%, rgba(255,255,255,0.95) 75%, rgba(255,255,255,0.25))',
            boxShadow: '0 0 18px rgba(255,255,255,0.55), 0 0 40px rgba(255,255,255,0.18)',
            animation: 'ic-line-pulse 2.5s ease-in-out infinite',
            transition: isDragging ? 'none' : 'left 0.06s linear',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* ── Handle ── */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${sliderPosition}%`,
            transform: 'translate(-50%, -50%)',
            width: 52, height: 52,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(8px)',
            boxShadow: isDragging
              ? '0 0 0 8px rgba(255,255,255,0.22), 0 10px 32px rgba(0,0,0,0.38)'
              : hovered
                ? '0 0 0 5px rgba(255,255,255,0.18), 0 6px 24px rgba(0,0,0,0.3)'
                : '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 3,
            cursor: 'ew-resize',
            transition: 'box-shadow 0.25s ease',
          }}
        >
          {/* outer ring */}
          <div style={{
            position: 'absolute', inset: -7,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
            opacity: hovered ? 1 : 0.4,
            transition: 'opacity 0.3s',
          }} />
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M8 5.5L3 11L8 16.5"  stroke="#133d20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14 5.5L19 11L14 16.5" stroke="#133d20" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* ── APRÈS badge ── */}
        <div style={{
          position: 'absolute', top: 14, left: 14,
          background: 'rgba(19,61,32,0.88)', color: '#fff',
          fontSize: '0.6rem', letterSpacing: '0.2em', fontWeight: 700,
          padding: '5px 12px', borderRadius: 6,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          pointerEvents: 'none', zIndex: 4,
        }}>
          {afterLabel}
        </div>

        {/* ── AVANT badge ── */}
        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(0,0,0,0.55)', color: '#fff',
          fontSize: '0.6rem', letterSpacing: '0.2em', fontWeight: 700,
          padding: '5px 12px', borderRadius: 6,
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          pointerEvents: 'none', zIndex: 4,
        }}>
          {beforeLabel}
        </div>

        {/* ── Hint ── */}
        {!interacted && (
          <div style={{
            position: 'absolute', bottom: 18,
            left: '50%',
            fontSize: '0.62rem', letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.88)',
            background: 'rgba(0,0,0,0.38)',
            padding: '5px 14px', borderRadius: 99,
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none', zIndex: 4,
            whiteSpace: 'nowrap',
            animation: 'ic-hint-fade 3.5s ease 0.5s forwards',
          }}>
            ← Glisser pour comparer →
          </div>
        )}
      </div>
    </>
  );
}
