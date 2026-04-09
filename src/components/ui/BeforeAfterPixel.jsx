'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

const BLOCK = 6;        // pixel block size in px
const NOISE = 0.10;     // ± noise amplitude (fraction of width)

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
  const canvasRef     = useRef(null);
  const beforeImgRef  = useRef(null);
  const afterImgRef   = useRef(null);
  const noiseRef      = useRef(null);
  const sliderPosRef  = useRef(0.5);
  const dragging      = useRef(false);
  const rafRef        = useRef(null);

  const [sliderPct, setSliderPct] = useState(50);
  const [ready, setReady]         = useState(false);

  /* ── build per-column noise array ─────────────────────────── */
  const buildNoise = (cols) => {
    const arr = new Float32Array(cols);
    for (let i = 0; i < cols; i++) arr[i] = (Math.random() - 0.5) * NOISE * 2;
    noiseRef.current = arr;
  };

  /* ── render one frame ──────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const before = beforeImgRef.current;
    const after  = afterImgRef.current;
    if (!canvas || !before?.complete || !after?.complete) return;

    const ctx  = canvas.getContext('2d');
    const W    = canvas.width;
    const H    = canvas.height;
    const cols = Math.ceil(W / BLOCK);

    if (!noiseRef.current || noiseRef.current.length !== cols) buildNoise(cols);
    const noise = noiseRef.current;
    const sp    = sliderPosRef.current;

    // Base: full AVANT image
    ctx.drawImage(before, 0, 0, W, H);

    // Clip staircase → APRÈS image
    ctx.save();
    ctx.beginPath();
    for (let col = 0; col < cols; col++) {
      if (col / cols < sp + noise[col]) {
        ctx.rect(col * BLOCK, 0, BLOCK, H);
      }
    }
    ctx.clip();
    ctx.drawImage(after, 0, 0, W, H);
    ctx.restore();

    // Divider line
    const lx = Math.round(sp * W);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur  = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.moveTo(lx, 0);
    ctx.lineTo(lx, H);
    ctx.stroke();
    ctx.restore();
  }, []);

  /* ── load images ───────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    let count   = 0;
    const onLoad = () => { count++; if (count === 2 && mounted) setReady(true); };

    const b = new window.Image();
    b.crossOrigin = 'anonymous';
    b.onload  = onLoad;
    b.onerror = () => {
      if (beforeFallback) { b.onerror = null; b.src = beforeFallback; }
      else onLoad();
    };
    b.src = beforeSrc;
    beforeImgRef.current = b;

    const a = new window.Image();
    a.crossOrigin = 'anonymous';
    a.onload  = onLoad;
    a.onerror = () => {
      if (afterFallback) { a.onerror = null; a.src = afterFallback; }
      else onLoad();
    };
    a.src = afterSrc;
    afterImgRef.current = a;

    return () => { mounted = false; };
  }, [beforeSrc, afterSrc]);

  /* ── fit canvas to container, re-render on resize ─────────── */
  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    const canvas    = canvasRef.current;
    if (!container || !canvas) return;

    const fit = () => {
      canvas.width  = container.clientWidth;
      canvas.height = height;
      noiseRef.current = null;
      render();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => ro.disconnect();
  }, [ready, height, render]);

  /* ── pointer helpers ───────────────────────────────────────── */
  const clientX = (e) => (e.touches ? e.touches[0].clientX : e.clientX);

  const applyPos = useCallback((e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const pos  = Math.max(0.01, Math.min(0.99, (clientX(e) - rect.left) / rect.width));
    sliderPosRef.current = pos;
    setSliderPct(Math.round(pos * 100));
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(render);
  }, [render]);

  const onDown  = useCallback((e) => { dragging.current = true;  applyPos(e); }, [applyPos]);
  const onMove  = useCallback((e) => { if (dragging.current) applyPos(e); }, [applyPos]);
  const onUp    = useCallback(()  => { dragging.current = false; }, []);

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

  /* ── render ────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      onMouseDown={onDown}
      onTouchStart={onDown}
      style={{
        position: 'relative',
        width: '100%',
        height,
        userSelect: 'none',
        borderRadius: '1.25rem',
        overflow: 'hidden',
        cursor: 'ew-resize',
        touchAction: 'none',
        background: '#e8e0d0',
      }}
    >
      {/* Loading skeleton */}
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#ede5d4',
        }}>
          <span style={{ color: '#8a8270', fontSize: '0.82rem', letterSpacing: '0.05em' }}>
            Chargement…
          </span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />

      {/* APRÈS badge (left = revealed side) */}
      <div style={{
        position: 'absolute', top: 14, left: 14,
        background: 'rgba(19,61,32,0.82)',
        color: '#fff',
        fontSize: '0.62rem',
        letterSpacing: '0.18em',
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 4,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
      }}>
        {afterLabel}
      </div>

      {/* AVANT badge (right = original side) */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        background: 'rgba(0,0,0,0.48)',
        color: '#fff',
        fontSize: '0.62rem',
        letterSpacing: '0.18em',
        fontWeight: 700,
        padding: '4px 10px',
        borderRadius: 4,
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
      }}>
        {beforeLabel}
      </div>

      {/* Drag handle */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: `${sliderPct}%`,
        transform: 'translate(-50%, -50%)',
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: '#fff',
        boxShadow: '0 2px 14px rgba(0,0,0,0.28)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        color: '#133d20',
        fontWeight: 900,
        pointerEvents: 'none',
        zIndex: 3,
        letterSpacing: '-0.05em',
      }}>
        ◀▶
      </div>
    </div>
  );
}
