'use client';
import { useRef, createContext, useContext } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { C } from '@/lib/tokens';

/* ── Context ─────────────────────────────────────────────────────────────── */
const ScrollCtx = createContext(null);

/* ── ContainerScroll — tracks scroll progress ───────────────────────────── */
export function ContainerScroll({ children, style, ...props }) {
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: scrollRef, offset: ['start start', 'end end'] });

  return (
    <ScrollCtx.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        style={{ position: 'relative', minHeight: '200vh', width: '100%', ...style }}
        {...props}
      >
        {children}
      </div>
    </ScrollCtx.Provider>
  );
}

/* ── ContainerScale — hero title, fixed while scrolling then fades ────────── */
export function ContainerScale({ children, style, ...props }) {
  const { scrollYProgress } = useContext(ScrollCtx);

  const scale   = useTransform(scrollYProgress, [0, 0.5], [1, 0.82]);
  const opacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);
  const y       = useTransform(scrollYProgress, [0, 0.5], ['0%', '-8%']);

  return (
    <motion.div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        pointerEvents: 'none',
        scale,
        opacity,
        y,
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── BentoGrid — sticky grid that slides up over the hero ───────────────── */
export function BentoGrid({ children, style, ...props }) {
  const { scrollYProgress } = useContext(ScrollCtx);

  const translateY = useTransform(scrollYProgress, [0.15, 0.6], ['60vh', '0vh']);
  const opacity    = useTransform(scrollYProgress, [0.12, 0.28], [0, 1]);

  return (
    <motion.div
      style={{
        position: 'sticky',
        top: 0,
        height: '100vh',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        gap: '0.75rem',
        padding: '5rem 1.5rem 1.5rem',
        translateY,
        opacity,
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── BentoCell — individual card, scale + translate on scroll ───────────── */
export function BentoCell({ children, colSpan = 2, rowSpan = 2, colStart, rowStart, delay = 0, style, ...props }) {
  const { scrollYProgress } = useContext(ScrollCtx);

  const scale      = useTransform(scrollYProgress, [0.1 + delay, 0.9], [0.5, 1]);
  const translateY = useTransform(scrollYProgress, [0.1 + delay, 0.9], ['-35%', '0%']);
  const opacity    = useTransform(scrollYProgress, [0.1 + delay, 0.25 + delay], [0, 1]);

  return (
    <motion.div
      style={{
        gridColumn: colStart ? `${colStart} / span ${colSpan}` : `span ${colSpan}`,
        gridRow:    rowStart ? `${rowStart} / span ${rowSpan}` : `span ${rowSpan}`,
        borderRadius: '1rem',
        overflow: 'hidden',
        position: 'relative',
        scale,
        translateY,
        opacity,
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
