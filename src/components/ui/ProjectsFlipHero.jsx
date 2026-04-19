'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

/* ── Constants ──────────────────────────────────────────────────────────── */
const IMG_W = 62;
const IMG_H = 88;
const MAX_SCROLL = 3000;

const lerp = (a, b, t) => a * (1 - t) + b * t;

/* ── FlipCard ───────────────────────────────────────────────────────────── */
function FlipCard({ src, alt, index, target }) {
  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: 'spring', stiffness: 38, damping: 14 }}
      style={{
        position: 'absolute',
        width: IMG_W,
        height: IMG_H,
        transformStyle: 'preserve-3d',
        perspective: 1000,
        cursor: 'pointer',
      }}
      className="group"
    >
      <motion.div
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 240, damping: 22 }}
      >
        {/* Front */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '0.75rem', overflow: 'hidden',
          boxShadow: '0 4px 18px rgba(0,0,0,0.28)',
          backfaceVisibility: 'hidden',
        }}>
          <img
            src={src}
            alt={alt || `photo-${index}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)' }} />
        </div>

        {/* Back */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '0.75rem',
          background: 'linear-gradient(135deg, #133d20, #1e5c30)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          padding: '0.75rem',
          border: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(232,163,80,0.9)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
            Voir
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 500, color: '#fff', textAlign: 'center', lineHeight: 1.4 }}>
            Détails
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
export default function ProjectsFlipHero({ images = [], children }) {
  const containerRef  = useRef(null);
  const scrollRef     = useRef(0);
  const [introPhase, setIntroPhase] = useState('scatter');
  const [size, setSize]             = useState({ w: 0, h: 0 });

  /* container size */
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setSize({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    setSize({ w: containerRef.current.offsetWidth, h: containerRef.current.offsetHeight });
    return () => ro.disconnect();
  }, []);

  /* virtual scroll */
  const virtualScroll = useMotionValue(0);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const next = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };
    let ty = 0;
    const onTS = (e) => { ty = e.touches[0].clientY; };
    const onTM = (e) => {
      const dy = ty - e.touches[0].clientY;
      ty = e.touches[0].clientY;
      const next = Math.min(Math.max(scrollRef.current + dy, 0), MAX_SCROLL);
      scrollRef.current = next;
      virtualScroll.set(next);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTS, { passive: false });
    el.addEventListener('touchmove', onTM, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTS);
      el.removeEventListener('touchmove', onTM);
    };
  }, [virtualScroll]);

  /* spring transforms */
  const morphRaw    = useTransform(virtualScroll, [0, 600], [0, 1]);
  const morphSpring = useSpring(morphRaw, { stiffness: 38, damping: 18 });

  const rotRaw    = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const rotSpring = useSpring(rotRaw, { stiffness: 38, damping: 18 });

  const mouseX      = useMotionValue(0);
  const mouseSpring = useSpring(mouseX, { stiffness: 28, damping: 18 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onMM = (e) => {
      const rect = el.getBoundingClientRect();
      mouseX.set(((e.clientX - rect.left) / rect.width * 2 - 1) * 90);
    };
    el.addEventListener('mousemove', onMM);
    return () => el.removeEventListener('mousemove', onMM);
  }, [mouseX]);

  /* intro sequence */
  useEffect(() => {
    const t1 = setTimeout(() => setIntroPhase('line'),   500);
    const t2 = setTimeout(() => setIntroPhase('circle'), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  /* reactive values for render */
  const [morph,    setMorph]    = useState(0);
  const [rotate,   setRotate]   = useState(0);
  const [parallax, setParallax] = useState(0);

  useEffect(() => {
    const u1 = morphSpring.on('change', setMorph);
    const u2 = rotSpring.on('change', setRotate);
    const u3 = mouseSpring.on('change', setParallax);
    return () => { u1(); u2(); u3(); };
  }, [morphSpring, rotSpring, mouseSpring]);

  /* scatter positions (stable across renders) */
  const scatter = useMemo(() =>
    images.map(() => ({
      x: (Math.random() - 0.5) * 1400,
      y: (Math.random() - 0.5) * 900,
      rotation: (Math.random() - 0.5) * 170,
      scale: 0.55,
      opacity: 0,
    })),
  [images]);

  const TOTAL = images.length;

  /* content opacity based on morph */
  const contentOpacity = Math.max(0, Math.min(1, (morph - 0.75) / 0.25));
  const contentY       = Math.round((1 - contentOpacity) * 22);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* Cards */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {images.map((imgObj, i) => {
          let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

          if (introPhase === 'scatter') {
            target = scatter[i];
          } else if (introPhase === 'line') {
            const spacing   = 72;
            const totalW    = TOTAL * spacing;
            target = { x: i * spacing - totalW / 2, y: 0, rotation: 0, scale: 1, opacity: 1 };
          } else {
            /* circle → arc morph */
            const minDim = Math.min(size.w || 600, size.h || 500);

            /* A. Circle */
            const cRadius = Math.min(minDim * 0.34, 320);
            const cAngle  = (i / TOTAL) * 360;
            const cRad    = (cAngle * Math.PI) / 180;
            const circle  = {
              x: Math.cos(cRad) * cRadius,
              y: Math.sin(cRad) * cRadius,
              rotation: cAngle + 90,
            };

            /* B. Arc */
            const isMobile  = (size.w || 600) < 768;
            const baseR     = Math.min(size.w || 600, (size.h || 500) * 1.5);
            const arcR      = baseR * (isMobile ? 1.45 : 1.12);
            const apexY     = (size.h || 500) * (isMobile ? 0.36 : 0.26);
            const arcCenterY = apexY + arcR;
            const spread    = isMobile ? 100 : 132;
            const startAngle = -90 - spread / 2;
            const step      = spread / (TOTAL - 1);
            const scrollProg = Math.min(Math.max(rotate / 360, 0), 1);
            const bounded   = -scrollProg * spread * 0.8;
            const aAngle    = startAngle + i * step + bounded;
            const aRad      = (aAngle * Math.PI) / 180;
            const arc = {
              x: Math.cos(aRad) * arcR + parallax,
              y: Math.sin(aRad) * arcR + arcCenterY,
              rotation: aAngle + 90,
              scale: isMobile ? 1.45 : 1.85,
            };

            target = {
              x: lerp(circle.x, arc.x, morph),
              y: lerp(circle.y, arc.y, morph),
              rotation: lerp(circle.rotation, arc.rotation, morph),
              scale: lerp(1, arc.scale, morph),
              opacity: 1,
            };
          }

          return (
            <FlipCard
              key={i}
              src={imgObj.src}
              alt={imgObj.alt}
              index={i}
              target={target}
            />
          );
        })}
      </div>

      {/* Content overlay (fades in as morph completes) */}
      <div style={{
        position: 'absolute',
        top: '8%',
        left: 0, right: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
        opacity: contentOpacity,
        transform: `translateY(${contentY}px)`,
        transition: 'none',
        pointerEvents: contentOpacity > 0.5 ? 'auto' : 'none',
        zIndex: 10,
        padding: '0 1.5rem',
      }}>
        {children}
      </div>

      {/* Scroll hint */}
      {morph < 0.5 && (
        <div style={{
          position: 'absolute',
          bottom: '1.5rem',
          left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.56rem',
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '0.3rem',
          pointerEvents: 'none',
          opacity: 1 - morph * 2,
        }}>
          <span>Défiler</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  );
}
