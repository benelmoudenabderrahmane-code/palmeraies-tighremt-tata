'use client';
import { motion } from 'framer-motion';
import { C, FONT } from '@/lib/tokens';

/**
 * Hero plein écran avec marquee d'images défilant en bas.
 * Adapté du pattern AnimatedMarqueeHero — styles inline + tokens de la marque.
 *
 * Props:
 *  - tagline   : petit label en pilule (petites caps)
 *  - title     : titre principal (string ou JSX)
 *  - description : sous-titre
 *  - ctaText   : libellé du bouton
 *  - ctaHref   : lien (ancre ou page)
 *  - images    : tableau d'objets { src, alt }
 */

const FADE = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

function ActionButton({ children, href }) {
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      style={{
        display: 'inline-block',
        marginTop: '2rem',
        padding: '0.85rem 2.25rem',
        borderRadius: '2rem',
        background: C.ochre,
        color: '#fff',
        fontWeight: 600,
        fontSize: '0.9rem',
        letterSpacing: '0.03em',
        textDecoration: 'none',
        boxShadow: '0 10px 30px rgba(196,112,63,0.35)',
        cursor: 'pointer',
      }}
    >
      {children}
    </motion.a>
  );
}

export default function AnimatedMarqueeHero({
  tagline,
  title,
  description,
  ctaText,
  ctaHref = '#galerie-grid',
  videoSrc,
}) {

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: 620,
        overflow: 'hidden',
        background: C.greenDeep,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 1.5rem',
      }}
    >
      {/* ── Vidéo de fond (optionnelle) ── */}
      {videoSrc && (
        <>
          <video
            aria-hidden="true"
            autoPlay
            muted
            loop
            playsInline
            src={videoSrc}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
            }}
          />
          {/* Overlay sombre pour lisibilité du texte */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(10,28,15,0.55) 0%, rgba(10,28,15,0.38) 55%, rgba(10,28,15,0.70) 100%)',
              zIndex: 1,
            }}
          />
        </>
      )}

      {/* Halo doré décoratif */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(680px, 90vw)',
          height: 400,
          background: 'radial-gradient(ellipse at center, rgba(196,169,107,0.16) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ── Contenu texte ── */}
      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 760 }}>
        {/* Tagline pilule */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={FADE}
          style={{
            marginBottom: '1.25rem',
            display: 'inline-block',
            borderRadius: '2rem',
            border: '1px solid rgba(196,169,107,0.45)',
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '0.4rem 1.1rem',
            fontSize: '0.66rem',
            letterSpacing: '0.24em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: 'rgba(196,169,107,0.95)',
          }}
        >
          {tagline}
        </motion.div>

        {/* Titre principal — stagger par mot si string */}
        <motion.h1
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.09 } } }}
          style={{
            fontFamily: FONT.alt,
            fontSize: 'clamp(2.6rem, 7vw, 5rem)',
            fontWeight: 300,
            fontStyle: 'italic',
            lineHeight: 1.05,
            color: '#fff',
            margin: 0,
          }}
        >
          {typeof title === 'string'
            ? title.split(' ').map((word, i) => (
                <motion.span key={i} variants={FADE} style={{ display: 'inline-block' }}>
                  {word}&nbsp;
                </motion.span>
              ))
            : title}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial="hidden"
          animate="show"
          variants={FADE}
          transition={{ delay: 0.5 }}
          style={{
            marginTop: '1.25rem',
            maxWidth: 540,
            fontSize: '1rem',
            lineHeight: 1.7,
            fontWeight: 300,
            color: 'rgba(255,255,255,0.6)',
          }}
        >
          {description}
        </motion.p>

        {/* CTA */}
        <motion.div initial="hidden" animate="show" variants={FADE} transition={{ delay: 0.6 }}>
          <ActionButton href={ctaHref}>{ctaText}</ActionButton>
        </motion.div>
      </div>

    </section>
  );
}
