'use client';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Quote, X } from 'lucide-react';
import { C } from '@/lib/tokens';

/**
 * TeamTestimonialCarousel — carousel à défilement horizontal de cartes
 * dépliables (clic → modal plein écran). Adapté en JSX + styles inline +
 * tokens de la marque. Données : [{ name, role, bio, skills, avatar,
 * roleColor, gradient }].
 */

const EASE = [0.16, 1, 0.3, 1];

/* ── Hook clic-extérieur ─────────────────────────────────────────────── */
function useOutsideClick(ref, onOutside) {
  useEffect(() => {
    const handler = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      onOutside();
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [ref, onOutside]);
}

/* ── Photo de profil ronde ───────────────────────────────────────────── */
function ProfileImage({ src, alt, initials, gradient }) {
  const [loading, setLoading] = useState(true);
  return (
    <div style={{
      width: 'clamp(96px, 12vw, 140px)',
      height: 'clamp(96px, 12vw, 140px)',
      borderRadius: '50%',
      overflow: 'hidden',
      border: `3px solid ${C.sandDark}`,
      position: 'relative',
      flexShrink: 0,
      background: gradient || C.green,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Initiales en fond (fallback) */}
      <span style={{
        position: 'absolute',
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: '2rem',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.92)',
        userSelect: 'none',
      }}>
        {initials}
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={140}
        height={140}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoading(false)}
        onError={(e) => { e.currentTarget.style.opacity = '0'; }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: loading ? 'blur(8px)' : 'none',
          transition: 'filter 0.4s ease',
        }}
      />
    </div>
  );
}

/* ── Carte dépliable ─────────────────────────────────────────────────── */
function TestimonialCard({ member, index, bgImage }) {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef(null);

  const initials = member.name.split(' ').map((w) => w[0]).slice(0, 2).join('');

  const collapse = () => setExpanded(false);

  // Lock scroll + Échap
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') collapse(); };
    if (expanded) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.dataset.scrollY = String(scrollY);
      window.addEventListener('keydown', onKey);
      return () => {
        const y = parseInt(document.body.dataset.scrollY || '0', 10);
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo({ top: y, behavior: 'instant' });
        window.removeEventListener('keydown', onKey);
      };
    }
  }, [expanded]);

  useOutsideClick(containerRef, () => { if (expanded) collapse(); });

  const shortBio = member.bio.length > 110 ? `${member.bio.slice(0, 110)}…` : member.bio;

  return (
    <>
      {/* ── Modal plein écran ── */}
      <AnimatePresence>
        {expanded && (
          <div style={{ position: 'fixed', inset: 0, height: '100vh', overflow: 'hidden', zIndex: 1000 }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(10,30,18,0.7)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            />
            <motion.div
              ref={containerRef}
              layoutId={`team-card-${member.name}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'relative',
                maxWidth: 760,
                margin: '0 auto',
                height: '100%',
                zIndex: 1010,
                background: `linear-gradient(to bottom, ${C.sand}, #fffdf6)`,
                borderRadius: 24,
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <button
                onClick={collapse}
                aria-label="Fermer"
                style={{
                  position: 'sticky', top: 0, marginLeft: 'auto',
                  width: 38, height: 38, borderRadius: '50%',
                  background: C.greenDeep, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={18} color="#fff" />
              </button>

              <div style={{ marginTop: '0.5rem' }}>
                <ProfileImage src={member.avatar} alt={member.name} initials={initials} gradient={member.gradient} />
              </div>

              <p style={{
                marginTop: '1.25rem',
                fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                fontWeight: 700, color: member.roleColor,
              }}>
                {member.role}
              </p>
              <p style={{
                marginTop: '0.5rem',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 500, color: C.greenDeep, lineHeight: 1.1,
              }}>
                {member.name}
              </p>

              <div style={{ position: 'relative', maxWidth: 540, marginTop: '1.75rem' }}>
                <Quote size={28} color={C.ochre} style={{ opacity: 0.5 }} />
                <p style={{
                  marginTop: '0.5rem',
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 'clamp(1.2rem, 2.4vw, 1.7rem)',
                  fontStyle: 'italic', fontWeight: 400,
                  color: C.inkMuted, lineHeight: 1.5,
                }}>
                  {member.bio}
                </p>
              </div>

              {member.skills?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'center', marginTop: '2rem' }}>
                  {member.skills.map((s) => (
                    <span key={s} style={{
                      fontSize: '0.7rem', padding: '0.3rem 0.85rem', borderRadius: 999,
                      background: `${member.roleColor}14`, color: member.roleColor,
                      border: `1px solid ${member.roleColor}30`, fontWeight: 500, letterSpacing: '0.03em',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Carte fermée ── */}
      <motion.button
        layoutId={`team-card-${member.name}`}
        onClick={() => setExpanded(true)}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.08 * index, ease: EASE }}
        whileHover={{ y: -8, rotate: index % 2 === 0 ? 1.5 : -1.5, transition: { duration: 0.3, ease: EASE } }}
        style={{
          position: 'relative',
          width: 'clamp(270px, 78vw, 340px)',
          height: 'clamp(440px, 64vh, 510px)',
          borderRadius: 24,
          border: 'none',
          cursor: 'pointer',
          overflow: 'hidden',
          background: `linear-gradient(to bottom, ${C.sand}, #fffdf6)`,
          boxShadow: '0 6px 24px rgba(19,61,32,0.10)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '2rem 1.5rem',
          flexShrink: 0,
          textAlign: 'center',
        }}
      >
        {/* Texture de fond discrète */}
        {bgImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgImage}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', opacity: 0.08, pointerEvents: 'none',
            }}
          />
        )}
        {/* Liseré doré supérieur */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: member.gradient || C.green }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <ProfileImage src={member.avatar} alt={member.name} initials={initials} gradient={member.gradient} />
        </div>

        <p style={{
          position: 'relative', zIndex: 1,
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.15rem', fontWeight: 400, fontStyle: 'italic',
          color: C.inkMuted, lineHeight: 1.5, maxWidth: 280,
        }}>
          {shortBio}
        </p>

        <div style={{ position: 'relative', zIndex: 1, marginTop: '0.25rem' }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.35rem', fontWeight: 600, color: C.greenDeep, lineHeight: 1.15,
          }}>
            {member.name}
          </p>
          <p style={{
            marginTop: '0.4rem',
            fontSize: '0.68rem', letterSpacing: '0.16em', textTransform: 'uppercase',
            fontWeight: 700, color: member.roleColor,
          }}>
            {member.role}
          </p>
        </div>

        {/* Indice "voir plus" */}
        <span style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase',
          color: C.inkLight, fontWeight: 600,
        }}>
          Cliquer pour lire
        </span>
      </motion.button>
    </>
  );
}

/* ── Carousel ────────────────────────────────────────────────────────── */
export default function TeamTestimonialCarousel({ members = [], bgImage = '/images/tighremt/palmeraie-panorama.jpg' }) {
  const trackRef = useRef(null);
  const [canLeft, setCanLeft]   = useState(false);
  const [canRight, setCanRight] = useState(true);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => { checkScroll(); }, []);

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };

  if (!members.length) return null;

  return (
    <div style={{ position: 'relative', width: '100%', marginTop: '2.5rem' }}>
      <div
        ref={trackRef}
        onScroll={checkScroll}
        className="team-carousel-track"
        style={{
          display: 'flex',
          gap: '1rem',
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          padding: '1.25rem clamp(1rem, 5vw, 4rem) 2rem',
          scrollbarWidth: 'none',
        }}
      >
        {members.map((m, i) => (
          <TestimonialCard key={m.name} member={m} index={i} bgImage={bgImage} />
        ))}
      </div>

      {/* Flèches */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
        <button
          onClick={() => scrollBy(-1)}
          disabled={!canLeft}
          aria-label="Précédent"
          style={arrowStyle(canLeft)}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
        <button
          onClick={() => scrollBy(1)}
          disabled={!canRight}
          aria-label="Suivant"
          style={arrowStyle(canRight)}
        >
          <ArrowRight size={20} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function arrowStyle(enabled) {
  return {
    width: 44, height: 44, borderRadius: '50%',
    background: C.greenDeep, border: 'none',
    cursor: enabled ? 'pointer' : 'default',
    opacity: enabled ? 1 : 0.4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'opacity 0.2s, transform 0.2s',
  };
}
