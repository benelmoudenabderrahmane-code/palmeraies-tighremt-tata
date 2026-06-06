'use client';
import { useState, useEffect, useRef } from 'react';
import { Play, X } from 'lucide-react';
import { C, FONT } from '@/lib/tokens';

/**
 * VideoThumbnailPlayer — lecteur vidéo avec miniature cliquable.
 * Supporte les vidéos locales (<video>) et les iframes externes (YouTube…).
 * Adapté au pattern du site : JSX + styles inline + tokens C.
 *
 * Props :
 *   thumbnailSrc  string   — chemin de l'image miniature
 *   videoSrc      string   — URL ou chemin de la vidéo
 *   isExternal    bool     — true → iframe, false → <video> (défaut)
 *   title         string   — titre affiché sur la miniature + aria
 *   description   string   — sous-titre optionnel
 *   aspectRatio   string   — "16/9" | "4/3" (défaut "16/9")
 */
export default function VideoThumbnailPlayer({
  thumbnailSrc,
  videoSrc,
  isExternal = false,
  title = '',
  description = '',
  aspectRatio = '16/9',
}) {
  const [open, setOpen]       = useState(false);
  const [hover, setHover]     = useState(false);
  const videoRef              = useRef(null);

  /* ── Fermeture Échap ── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ── Lock scroll ── */
  useEffect(() => {
    if (open) {
      const y = window.scrollY;
      document.body.style.position  = 'fixed';
      document.body.style.top       = `-${y}px`;
      document.body.style.width     = '100%';
      document.body.dataset.scrollY = String(y);
    } else {
      const y = parseInt(document.body.dataset.scrollY || '0', 10);
      document.body.style.position  = '';
      document.body.style.top       = '';
      document.body.style.width     = '';
      window.scrollTo({ top: y, behavior: 'instant' });
      /* Stop local video on close */
      if (videoRef.current) videoRef.current.pause();
    }
  }, [open]);

  /* ── Aspect ratio → padding trick ── */
  const [w, h]    = aspectRatio.split('/').map(Number);
  const padBottom = `${(h / w) * 100}%`;

  return (
    <>
      {/* ── Miniature ── */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`Lire la vidéo : ${title}`}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: padBottom,
          borderRadius: '1rem',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: hover
            ? '0 12px 48px rgba(19,61,32,0.22)'
            : '0 4px 20px rgba(19,61,32,0.12)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Image miniature */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailSrc}
          alt={`Aperçu vidéo — ${title}`}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.45s cubic-bezier(0.16,1,0.3,1)',
          }}
        />

        {/* Dégradé bas */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,28,18,0.7) 0%, rgba(10,28,18,0.15) 55%, transparent 100%)',
        }} />

        {/* Bouton Play */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 72, height: 72,
            borderRadius: '50%',
            background: hover ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '2px solid rgba(255,255,255,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: hover ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s ease',
          }}>
            <Play size={30} fill="#fff" color="#fff" style={{ marginLeft: 3 }} />
          </div>
        </div>

        {/* Titre + description */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 'clamp(1rem,3vw,1.75rem)',
        }}>
          {title && (
            <p style={{
              fontFamily: FONT.alt,
              fontSize: 'clamp(1.1rem,2.5vw,1.5rem)',
              fontWeight: 600, color: '#fff', lineHeight: 1.2,
              marginBottom: description ? '0.3rem' : 0,
            }}>
              {title}
            </p>
          )}
          {description && (
            <p style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 300,
              letterSpacing: '0.02em',
            }}>
              {description}
            </p>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1200,
            background: 'rgba(5,15,10,0.85)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'vtpFadeIn 0.22s ease',
          }}
          aria-modal="true"
          role="dialog"
        >
          <style>{`
            @keyframes vtpFadeIn  { from { opacity:0 } to { opacity:1 } }
            @keyframes vtpSlideUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
          `}</style>

          {/* Bouton fermer */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer la vidéo"
            style={{
              position: 'absolute', top: '1.25rem', right: '1.25rem',
              width: 42, height: 42, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.22)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 1210, transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          >
            <X size={20} color="#fff" />
          </button>

          {/* Conteneur vidéo */}
          <div style={{
            width: '100%', maxWidth: 900,
            padding: '0 1.25rem',
            animation: 'vtpSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}>
            <div style={{ position: 'relative', paddingBottom: padBottom, borderRadius: '0.875rem', overflow: 'hidden' }}>
              {isExternal ? (
                <iframe
                  src={videoSrc}
                  title={title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000' }}
                />
              )}
            </div>

            {/* Légende sous la vidéo */}
            {(title || description) && (
              <div style={{ marginTop: '0.875rem', textAlign: 'center' }}>
                {title && (
                  <p style={{
                    fontFamily: FONT.alt,
                    fontSize: '1.15rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                  }}>
                    {title}
                  </p>
                )}
                {description && (
                  <p style={{
                    fontSize: '0.78rem',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '0.2rem',
                  }}>
                    {description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
