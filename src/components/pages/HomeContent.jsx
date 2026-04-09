'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Heart, ChevronDown } from 'lucide-react';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CircularGallery = dynamic(
  () => import('@/components/ui/CircularGallery'),
  { ssr: false }
);

const CIRCULAR_GALLERY_ITEMS = [
  { image: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=800&q=80', text: 'Palmeraie de Tighremt' },
  { image: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80',    text: 'Oasis de Tata' },
  { image: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=800&q=80', text: 'Désert marocain' },
  { image: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=800&q=80', text: 'Mission humanitaire' },
  { image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80', text: 'Éducation locale' },
  { image: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80', text: 'Culture berbère' },
  { image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&q=80',    text: 'Maroc traditionnel' },
  { image: 'https://images.unsplash.com/photo-1489493887464-892be6d1daae?w=800&q=80', text: 'Paysage du sud' },
];

function Hero() {
  const videoRef   = useRef(null);
  const contentRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return;
      const scrollY  = window.scrollY;
      const sectionH = sectionRef.current.offsetHeight;
      if (scrollY > sectionH) return;
      if (videoRef.current)   videoRef.current.style.transform   = `scale(1.0) translateY(${scrollY * 0.30}px)`;
      if (contentRef.current) contentRef.current.style.transform = `translateY(${scrollY * 0.12}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
        @keyframes heroZoomOut {
          from { transform: scale(1.1) translateY(0px); }
          to   { transform: scale(1.0) translateY(0px); }
        }
        @keyframes focusIn {
          0%   { filter: blur(18px); opacity: 0; transform: translateY(14px) scale(0.98); }
          60%  { filter: blur(3px);  opacity: 0.85; }
          100% { filter: blur(0px);  opacity: 1;   transform: translateY(0) scale(1); }
        }
        @keyframes focusInSub {
          0%   { filter: blur(12px); opacity: 0; transform: translateY(10px); }
          100% { filter: blur(0px);  opacity: 1; transform: translateY(0); }
        }
        .hero-eyebrow { animation: focusInSub 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        .hero-h1      { animation: focusIn    1.4s cubic-bezier(0.16,1,0.3,1) 0.5s both; }
        .hero-divider { animation: focusInSub 1.0s cubic-bezier(0.16,1,0.3,1) 1.0s both; }
        .hero-sub     { animation: focusInSub 1.1s cubic-bezier(0.16,1,0.3,1) 1.15s both; }
        .hero-ctas    { animation: focusInSub 1.0s cubic-bezier(0.16,1,0.3,1) 1.4s both; }
        .hero-stats   { animation: focusInSub 0.9s cubic-bezier(0.16,1,0.3,1) 1.7s both; }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(7px); }
        }
        .btn-hero-primary {
          display: inline-flex; align-items: center; gap: 0.6rem;
          padding: 1rem 2.2rem;
          background: ${C.accent};
          color: #fff;
          border: none;
          border-radius: 999px;
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-decoration: none;
          cursor: pointer;
          min-height: 44px;
          transition: background 0.2s, transform 0.25s;
          box-shadow: 0 8px 28px rgba(232,131,42,0.38);
        }
        .btn-hero-primary:hover { background: ${C.accentDark}; transform: translateY(-3px); }
        .btn-hero-glass {
          display: inline-flex; align-items: center;
          padding: 1rem 2.2rem;
          border-radius: 999px;
          font-size: 0.92rem;
          font-weight: 400;
          letter-spacing: 0.03em;
          text-decoration: none;
          color: rgba(255,255,255,0.92);
          background: rgba(255,255,255,0.07);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.2);
          min-height: 44px;
          cursor: pointer;
          transition: transform 0.3s, background 0.3s, border-color 0.3s;
        }
        .btn-hero-glass:hover {
          transform: translateY(-3px);
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.38);
        }
      `}</style>

      <section ref={sectionRef} style={{
        position: 'relative', minHeight: '100svh',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 1.5rem 5rem', overflow: 'hidden',
      }}>
        <video ref={videoRef} autoPlay muted loop playsInline
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '115%', objectFit: 'cover', top: '-7.5%',
            animation: 'heroZoomOut 14s cubic-bezier(0.16,1,0.3,1) forwards',
            zIndex: 0, willChange: 'transform',
            filter: 'contrast(1.08) saturate(1.18) brightness(1.04)',
          }}>
          <source src="/palmeraie.mp4" type="video/mp4" />
        </video>

        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(110deg, rgba(6,20,10,0.90) 0%, rgba(6,20,10,0.60) 42%, rgba(6,20,10,0.10) 72%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to top, rgba(6,20,10,0.75) 0%, transparent 45%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 1, background: 'linear-gradient(to bottom, rgba(6,20,10,0.45) 0%, transparent 100%)' }} />

        <div ref={contentRef} style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', width: '100%', paddingTop: '7rem', willChange: 'transform' }}>
          <div className="hero-eyebrow" style={{ fontSize: '0.68rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(232,163,80,0.95)', fontWeight: 500, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'block', width: 32, height: 1, background: 'rgba(232,163,80,0.7)' }} />
            Province de Tata · Maroc · Fondée 2010
          </div>

          <h1 className="hero-h1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(3.2rem, 9.5vw, 7.5rem)', fontWeight: 300, lineHeight: 0.97, color: '#fff', letterSpacing: '-0.025em', maxWidth: '13ch', marginBottom: '2rem', textShadow: '0 2px 60px rgba(0,0,0,0.5)' }}>
            Agir pour<br />nous aider<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,245,220,1)' }}>à grandir</em>
          </h1>

          <div className="hero-divider" style={{ width: 80, height: 1.5, background: 'linear-gradient(to right, rgba(232,163,80,0.9), transparent)', marginBottom: '1.75rem' }} />

          <p className="hero-sub" style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 300, fontSize: 'clamp(0.95rem, 2vw, 1.18rem)', lineHeight: 1.8, maxWidth: 460, marginBottom: '2.75rem', textShadow: '0 1px 16px rgba(0,0,0,0.5)' }}>
            Ensemble pour la sauvegarde de la palmeraie et le développement du village de Tighremt (Tata, Maroc).
          </p>

          <div className="hero-ctas" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '4.5rem', alignItems: 'center' }}>
            <a href="/don" className="btn-hero-primary">
              <Heart size={18} />
              Faire un don
            </a>
            <a href="/mission" className="btn-hero-glass">
              Découvrir notre mission
            </a>
          </div>

          <div className="hero-stats" style={{ display: 'flex', flexWrap: 'wrap' }}>
            {[
              { val: '2010',     label: 'Année de fondation' },
              { val: 'Loi 1901', label: 'Statut juridique' },
              { val: 'Tata',     label: 'Province, Maroc' },
            ].map(s => (
              <div key={s.val} className="stat-item">
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.75rem', fontWeight: 600, color: '#fff', lineHeight: 1, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.48)', marginTop: '0.3rem', fontWeight: 300, letterSpacing: '0.07em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.3)', zIndex: 2, animation: 'bounce 2.4s ease-in-out infinite' }}>
          <span style={{ fontSize: '0.56rem', letterSpacing: '0.28em', textTransform: 'uppercase' }}>Défiler</span>
          <ChevronDown size={13} />
        </div>
      </section>
    </>
  );
}

function Galerie() {
  return (
    <section id="galerie" style={{ background: C.greenDeep, padding: 'clamp(5rem,10vw,8rem) 0 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
        <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(232,163,80,0.9)', fontWeight: 500, marginBottom: '1rem' }}>
          Notre Galerie
        </div>
        <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: '#fff', lineHeight: 1.15 }}>
          <em>Tighremt</em> en images
        </h2>
        <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', marginTop: '0.75rem', fontWeight: 300 }}>
          Faites glisser pour explorer · Scroll to browse
        </p>
      </div>
      <div className="reveal">
        <CircularGallery
          items={CIRCULAR_GALLERY_ITEMS}
          bend={3}
          textColor="#ffffff"
          borderRadius={0.05}
          font="bold 28px 'Plus Jakarta Sans', sans-serif"
          scrollSpeed={2}
          scrollEase={0.05}
        />
      </div>
    </section>
  );
}

export default function HomeContent() {
  useScrollReveal();
  return (
    <>
      <Hero />
      <Galerie />
    </>
  );
}
