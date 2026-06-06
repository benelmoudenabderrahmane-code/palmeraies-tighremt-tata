'use client';
import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { FONT } from '@/lib/tokens';

const IMG_PADDING = 12;
const EASE = [0.16, 1, 0.3, 1];

/**
 * Bloc éditorial parallaxe : image sticky plein écran + texte en surimpression
 * qui défile en parallaxe, puis contenu détaillé (children) dessous.
 * Adapté en JSX + styles inline + tokens de la marque.
 *
 * Props : imgUrl, alt, subheading, heading, children
 */
export default function TextParallaxContent({ imgUrl, alt, subheading, heading, children }) {
  return (
    <div style={{ paddingLeft: IMG_PADDING, paddingRight: IMG_PADDING }}>
      <div style={{ position: 'relative', height: '130vh' }}>
        <StickyImage imgUrl={imgUrl} alt={alt} />
        <OverlayCopy heading={heading} subheading={subheading} />
      </div>
      {children}
    </div>
  );
}

function StickyImage({ imgUrl, alt }) {
  const targetRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['end end', 'end start'],
  });

  const scaleMv   = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const opacityMv = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <motion.div
      ref={targetRef}
      role="img"
      aria-label={alt}
      style={{
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: `calc(100vh - ${IMG_PADDING * 2}px)`,
        top: IMG_PADDING,
        position: 'sticky',
        zIndex: 0,
        overflow: 'hidden',
        borderRadius: 24,
        boxShadow: '0 30px 60px rgba(19,61,32,0.18)',
        scale: reduce ? 1 : scaleMv,
      }}
    >
      {/* Voile vert nuit qui s'intensifie au scroll */}
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(19,61,32,0.86) 0%, rgba(19,61,32,0.28) 55%, rgba(19,61,32,0.12) 100%)',
          opacity: reduce ? 0.55 : opacityMv,
        }}
      />
      {/* Anneau doré intérieur */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 24,
          boxShadow: 'inset 0 0 0 1px rgba(196,169,107,0.18)',
          pointerEvents: 'none',
        }}
      />
    </motion.div>
  );
}

function OverlayCopy({ subheading, heading }) {
  const targetRef = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ['start end', 'end start'],
  });

  const yMv       = useTransform(scrollYProgress, [0, 1], [250, -250]);
  const opacityMv = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 1, 0]);

  return (
    <motion.div
      ref={targetRef}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 1,
        display: 'flex',
        height: '100vh',
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: '0 1.5rem',
        pointerEvents: 'none',
        y: reduce ? 0 : yMv,
        opacity: reduce ? 1 : opacityMv,
      }}
    >
      {/* Sous-titre (catégorie · date) + filets dorés */}
      <p
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
          fontSize: 'clamp(0.66rem, 1.4vw, 0.82rem)',
          letterSpacing: '0.26em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: 'rgba(196,169,107,0.95)',
        }}
      >
        <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(196,169,107,0.55)' }} />
        {subheading}
        <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(196,169,107,0.55)' }} />
      </p>

      {/* Titre */}
      <p
        style={{
          fontFamily: FONT.alt,
          fontSize: 'clamp(2rem, 6vw, 4.5rem)',
          fontWeight: 400,
          lineHeight: 1.08,
          maxWidth: 920,
          margin: 0,
          textShadow: '0 2px 30px rgba(0,0,0,0.32)',
        }}
      >
        {heading}
      </p>
    </motion.div>
  );
}

export { EASE };
