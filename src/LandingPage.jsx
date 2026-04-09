import React, { useState, useEffect, useRef } from 'react';
import {
  TreePine, Shield, Heart, BookOpen,
  Menu, X, Leaf, ArrowRight, ChevronDown,
  Share2, Globe, Send, Mail, Phone, MapPin,
  Home, Newspaper, HandHeart, ImageIcon, Users,
} from 'lucide-react';
import Logo from './components/ui/Logo';
import PillNav from './components/ui/PillNav';

/* ── VengenceUI components ── */
import AnimatedButton from './components/ui/animated-button';
import { GlassDock } from './components/ui/glass-dock';
import { PixelatedImageTrail } from './components/ui/pixelated-image-trail';
import { MaskedAvatars } from './components/ui/masked-avatars';
import CircularGallery from './components/ui/CircularGallery';

/* ─────────────────────────────────────────────
   BRAND TOKENS
   ───────────────────────────────────────────── */
const C = {
  greenDeep:  '#133d20',
  green:      '#1e5c30',
  greenMid:   '#2a7a3e',
  ochre:      '#c4703f',
  ochreDark:  '#a35428',
  sand:       '#faf7f0',
  sandMid:    '#f0ead8',
  sandDark:   '#e6ddc8',
  accent:     '#e8832a',
  accentDark: '#c96d18',
  ink:        '#1c1c18',
  inkMuted:   '#5c5848',
  inkLight:   '#8a8270',
};

/* ─────────────────────────────────────────────
   GLOBAL STYLES
   ───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  ul, ol, li { list-style: none !important; }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 16px;
    background-color: ${C.sand};
    color: ${C.ink};
    -webkit-font-smoothing: antialiased;
  }

  a, button, [role="button"], .action-card { cursor: pointer; }

  a:focus-visible, button:focus-visible {
    outline: 2px solid ${C.accent};
    outline-offset: 3px;
    border-radius: 4px;
  }

  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.9s cubic-bezier(0.16,1,0.3,1),
                transform 0.9s cubic-bezier(0.16,1,0.3,1);
  }
  .reveal.in-view            { opacity: 1; transform: none; }
  .reveal-delay-1.in-view    { transition-delay: 0.1s; }
  .reveal-delay-2.in-view    { transition-delay: 0.22s; }
  .reveal-delay-3.in-view    { transition-delay: 0.34s; }
  .reveal-delay-4.in-view    { transition-delay: 0.46s; }

  .nav-link {
    position: relative;
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 500;
    letter-spacing: 0.03em;
    transition: color 0.2s;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -3px; left: 0;
    width: 0; height: 1px;
    background: ${C.accent};
    transition: width 0.3s ease;
  }
  .nav-link:hover::after { width: 100%; }

  .action-card {
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s ease;
  }
  .action-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(19,61,32,0.13);
  }

  .btn-accent {
    background: ${C.accent};
    color: #fff;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.2s, transform 0.2s;
    border: none;
  }
  .btn-accent:hover { background: ${C.accentDark}; transform: translateY(-1px); }

  .btn-white-outline {
    border: 1.5px solid rgba(255,255,255,0.6);
    color: #fff;
    background: transparent;
    cursor: pointer;
    min-height: 44px;
    transition: background 0.2s;
  }
  .btn-white-outline:hover { background: rgba(255,255,255,0.1); }

  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .stat-item + .stat-item {
    border-left: 1px solid rgba(255,255,255,0.2);
    padding-left: 2rem;
    margin-left: 2rem;
  }

  @media (max-width: 640px) {
    .stat-item + .stat-item {
      border-left: none;
      padding-left: 0;
      margin-left: 0;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 1.5rem;
      margin-top: 1.5rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    html { scroll-behavior: auto; }
    .reveal { opacity: 1 !important; transform: none !important; transition: none !important; }
  }
`;

/* ─────────────────────────────────────────────
   HOOK – Scroll Reveal
   ───────────────────────────────────────────── */
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ─────────────────────────────────────────────
   NAVBAR — PillNav
   ───────────────────────────────────────────── */
const NAV_ITEMS = [
  { label: 'Accueil',     href: '#' },
  { label: 'Mission',     href: '#mission' },
  { label: 'Nos projets', href: '#actions' },
  { label: 'Équipe',      href: '#equipe' },
  { label: 'Histoire',    href: '#histoire' },
  { label: 'Don',         href: '#don' },
  { label: 'Contact',     href: '#contact' },
];

const SECTION_IDS = [
  { href: '#contact',  id: 'contact'  },
  { href: '#don',      id: 'don'      },
  { href: '#galerie',  id: 'galerie'  },
  { href: '#histoire', id: 'histoire' },
  { href: '#equipe',   id: 'equipe'   },
  { href: '#actions',  id: 'actions'  },
  { href: '#mission',  id: 'mission'  },
];

function Navbar() {
  const [scrolled,    setScrolled]    = useState(false);
  const [activeHref,  setActiveHref]  = useState('#');

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);

      // Find the topmost section that has been scrolled past
      const OFFSET = 120; // navbar height + buffer
      let found = '#';
      for (const { href, id } of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= OFFSET) {
          found = href;
          break; // list is ordered bottom→top, so first match wins
        }
      }
      setActiveHref(found);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(250,247,240,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      boxShadow: scrolled ? '0 1px 0 rgba(196,112,63,0.15)' : 'none',
      transition: 'background 0.35s, box-shadow 0.35s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PillNav
          logo="/logo.png"
          logoAlt="Association Palmeraies Tighremt"
          logoName="Association Palmeraies Tighremt"
          logoSubtitle="TATA · Maroc"
          items={NAV_ITEMS}
          activeHref={activeHref}
          baseColor={scrolled ? C.inkMuted : '#fff'}
          pillColor={scrolled ? C.greenDeep : 'rgba(255,255,255,0.15)'}
          hoveredPillTextColor={scrolled ? '#fff' : C.greenDeep}
          ease="power3.out"
          initialLoadAnimation={false}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────── */
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
            imageRendering: 'high-quality',
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
            <a href="#don" className="btn-hero-primary">
              <Heart size={18} />
              Faire un don
            </a>
            <a href="#mission" className="btn-hero-glass">
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

/* ─────────────────────────────────────────────
   MISSION SECTION
   ───────────────────────────────────────────── */
const TEAM_AVATARS = [
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies1', name: 'Bénévole' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies2', name: 'Membre' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies3', name: 'Fondateur' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies4', name: 'Volontaire' },
  { avatar: 'https://i.pravatar.cc/150?u=palmeraies5', name: 'Partenaire' },
];

function Mission() {
  return (
    <section id="mission" style={{ background: C.sand, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,480px),1fr))', gap: 'clamp(3rem,6vw,6rem)', alignItems: 'center' }}>

        <div>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
            Notre Histoire
          </div>

          <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.4rem)', fontWeight: 400, lineHeight: 1.12, color: C.greenDeep, marginBottom: '1.5rem' }}>
            Une mission née<br />de <em>l'amour de la terre</em>
          </h2>

          <div className="reveal reveal-delay-1" style={{ width: 56, height: 2, background: `linear-gradient(to right, ${C.ochre}, transparent)`, marginBottom: '2rem' }} />

          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1.02rem', fontWeight: 300, marginBottom: '1.25rem' }}>
            Notre association a été créée pour aider par différentes actions, le village de Tighremt dans la province de Tata au Maroc. C'est une association à but non lucratif créée selon la loi 1901 en mars 2010.
          </p>
          <p className="reveal reveal-delay-3" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1.02rem', fontWeight: 300 }}>
            La ville de Tata reste majestueuse et accueillante — ses habitants se contentent du peu que leur procure la nature, sachant que tout reste à faire pour s'atteler au train du développement.
          </p>

          <div className="reveal reveal-delay-4" style={{ marginTop: '2.5rem', padding: '1.5rem 1.75rem', background: C.sandMid, borderLeft: `4px solid ${C.ochre}`, borderRadius: '0 1rem 1rem 0' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontStyle: 'italic', color: C.green, lineHeight: 1.5 }}>
              "Association loi 1901 à but non lucratif<br />fondée en mars 2010"
            </div>
            <div style={{ fontSize: '0.78rem', color: C.ochre, fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.75rem', textTransform: 'uppercase' }}>
              Humanitaire · Échanges culturels · Maroc
            </div>
          </div>

          {/* MaskedAvatars */}
          <div className="reveal reveal-delay-4" style={{ marginTop: '2.5rem' }}>
            <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkLight, fontWeight: 500, marginBottom: '1rem' }}>
              Notre équipe de bénévoles
            </div>
            <MaskedAvatars
              avatars={TEAM_AVATARS}
              size={56}
              border={6}
              column={32}
            />
          </div>
        </div>

        <div className="reveal reveal-delay-2" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '4/5' }}>
            <img src="https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80" alt="Palmeraie de Tata, Maroc" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.greenDeep}60 0%, transparent 55%)` }} />
          </div>
          <div style={{ position: 'absolute', bottom: '-1.5rem', left: '-1.5rem', background: C.ochre, color: '#fff', borderRadius: '1.25rem', padding: '1.25rem 1.5rem', boxShadow: '0 12px 32px rgba(164,84,40,0.35)' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.25rem', fontWeight: 600, lineHeight: 1 }}>2010</div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, marginTop: '0.3rem' }}>Fondée en</div>
          </div>
          <div style={{ position: 'absolute', top: '-1.25rem', right: '-1.25rem', width: 64, height: 64, borderRadius: '50%', background: C.sandDark, border: `4px solid ${C.sand}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf size={22} color={C.green} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   HISTOIRE — Timeline cards (replaces InteractiveBook)
   ───────────────────────────────────────────── */
const HISTOIRE_ITEMS = [
  {
    year: '2010',
    title: 'Notre Fondation',
    text: "L'Association Palmeraies Tighremt TATA a été fondée en mars 2010, sous la loi française 1901, par des bénévoles originaires de la province de Tata. Notre objectif premier : préserver la palmeraie ancestrale de Tighremt.",
    quote: '"La palmeraie est notre héritage, notre identité, notre futur."',
  },
  {
    year: 'Chaque année',
    title: 'Nos Actions Humanitaires',
    text: "Nos bénévoles organisent des missions humanitaires à Tighremt : distributions alimentaires, aide médicale, et soutien aux familles vulnérables.",
    bullets: ['Aide alimentaire aux familles', 'Soutien scolaire aux enfants', 'Réhabilitation des foggara'],
  },
  {
    year: 'Rejoignez-nous',
    title: 'Nous Rejoindre',
    text: "Nous accueillons tous ceux qui souhaitent contribuer, quelle que soit leur spécialité. Ingénieurs, médecins, enseignants, artisans — chaque compétence compte.",
    contact: 'palmeraies.tighremt.tata@gmail.com',
  },
];

function Histoire() {
  return (
    <section id="histoire" style={{ background: C.sandMid, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem' }}>
            Notre Rapport
          </div>
          <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
            Le livre de notre <em>association</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {HISTOIRE_ITEMS.map((item, i) => (
            <div key={i} className={`reveal reveal-delay-${i + 1}`} style={{ background: C.sand, borderRadius: '1.5rem', padding: '2rem', border: `1px solid ${C.sandDark}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: C.greenDeep, color: '#fff', borderRadius: 999, padding: '0.3rem 1rem', fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', alignSelf: 'flex-start' }}>
                {item.year}
              </div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 500, color: C.greenDeep, lineHeight: 1.2 }}>{item.title}</h3>
              <p style={{ fontSize: '0.9rem', color: C.inkMuted, lineHeight: 1.8, fontWeight: 300 }}>{item.text}</p>
              {item.quote && (
                <div style={{ fontStyle: 'italic', fontSize: '0.92rem', color: C.green, borderLeft: `3px solid ${C.ochre}`, paddingLeft: '1rem', lineHeight: 1.6 }}>
                  {item.quote}
                </div>
              )}
              {item.bullets && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {item.bullets.map(b => (
                    <div key={b} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: C.inkMuted }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.ochre, flexShrink: 0 }} />
                      {b}
                    </div>
                  ))}
                </div>
              )}
              {item.contact && (
                <a href={`mailto:${item.contact}`} style={{ fontSize: '0.85rem', color: C.accent, textDecoration: 'none', fontWeight: 500 }}>
                  {item.contact}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ACTIONS
   ───────────────────────────────────────────── */
const ACTIONS = [
  { icon: TreePine, title: 'Sauvegarde de la Palmeraie',        desc: "Protection et restauration du patrimoine végétal ancestral de la région de Tata, symbole vivant d'identité et d'espoir pour les générations futures.", color: C.green,    bgImage: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&q=70' },
  { icon: Shield,   title: 'Lutte contre la désertification',    desc: "Actions concrètes pour préserver les terres agricoles, contenir l'avancée du désert et maintenir la biodiversité des oasis.",                            color: C.ochre,    bgImage: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&q=70' },
  { icon: Heart,    title: 'Missions Humanitaires',              desc: "Aide directe aux populations vulnérables, distribution de produits essentiels et accompagnement solidaire au cœur de la communauté.",                    color: C.accent,   bgImage: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=600&q=70' },
  { icon: BookOpen, title: 'Formation & Information locale',     desc: "Sensibilisation, éducation et transfert de savoir-faire pour permettre à chacun de construire son avenir avec dignité.",                                color: C.greenMid, bgImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=70' },
];

function Actions() {
  return (
    <section id="actions" style={{ background: C.sand, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 'clamp(3rem,6vw,5rem)', maxWidth: 560 }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
            Nos projets
          </div>
          <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, lineHeight: 1.15, color: C.greenDeep }}>
            Nos projets pour<br /><em>Tighremt & la région</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {ACTIONS.map(({ icon: Icon, title, desc, color, bgImage }, i) => (
            <div key={title} className={`action-card reveal reveal-delay-${i + 1}`} style={{ background: C.sandMid, borderRadius: '1.75rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                <img src={bgImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${C.sandMid}cc)` }} />
                <div style={{ position: 'absolute', bottom: '-20px', left: '1.5rem', width: 48, height: 48, borderRadius: '0.875rem', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${color}50` }}>
                  <Icon size={20} color="#fff" />
                </div>
              </div>
              <div style={{ padding: '2.5rem 1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.greenDeep, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.75, fontWeight: 300, flex: 1 }}>{desc}</p>
                <div style={{ marginTop: '0.75rem' }}>
                  <AnimatedButton
                    as="a"
                    href="#contact"
                    className="!text-sm !px-4 !py-3 !rounded-lg !border-neutral-200 !bg-white/80 !text-neutral-700 w-full justify-center"
                  >
                    En savoir plus →
                  </AnimatedButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   GALERIE
   ───────────────────────────────────────────── */
const GALLERY_ITEMS = [
  { src: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&q=75', label: 'Palmeraie de Tighremt', span: 2 },
  { src: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&q=75',    label: 'Oasis de Tata' },
  { src: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&q=75', label: 'Désert marocain' },
  { src: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=600&q=75', label: 'Mission humanitaire' },
  { src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=75', label: 'Éducation locale' },
  { src: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&q=75', label: 'Culture berbère', span: 2 },
];

/* ─────────────────────────────────────────────
   ÉQUIPE SECTION
   ───────────────────────────────────────────── */
const MEMBRES = [
  { name: 'Mohamed TAHAR',          role: 'Président',        avatar: 'https://i.pravatar.cc/150?u=tahar' },
  { name: 'Lahoucine AÏT EL JAMAR', role: 'Vice Président',   avatar: 'https://i.pravatar.cc/150?u=aitjamar' },
  { name: 'Abderrahmane BEN MANSOUR', role: 'Trésorier',      avatar: 'https://i.pravatar.cc/150?u=benmansour1' },
  { name: 'Lahoucine BEN MANSOUR',  role: 'Vice Trésorier',   avatar: 'https://i.pravatar.cc/150?u=benmansour2' },
  { name: 'Omar BOUBKER',           role: 'Secrétaire',       avatar: 'https://i.pravatar.cc/150?u=boubker' },
  { name: 'Lahoucine BEN LMOUDEN',  role: 'Vice secrétaire',  avatar: 'https://i.pravatar.cc/150?u=benlmouden' },
];

function Equipe() {
  return (
    <section id="equipe" style={{ background: C.sand, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem' }}>
            Les personnes derrière l'association
          </div>
          <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
            Notre <em>équipe</em>
          </h2>
          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, fontSize: '0.95rem', marginTop: '1rem', maxWidth: 480, margin: '1rem auto 0', lineHeight: 1.7, fontWeight: 300 }}>
            Des bénévoles engagés, unis par l'amour de Tighremt et la volonté d'agir.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {MEMBRES.map((m, i) => (
            <div key={m.name} className={`reveal reveal-delay-${(i % 4) + 1}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem', background: C.sandMid, borderRadius: '1.5rem', border: `1px solid ${C.sandDark}`, transition: 'transform 0.3s, box-shadow 0.3s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(19,61,32,0.1)'; }}
              onMouseOut={e =>  { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ position: 'relative' }}>
                <img src={m.avatar} alt={m.name}
                  style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: `4px solid ${C.sand}`, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: C.greenMid, border: `3px solid ${C.sandMid}` }} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: C.greenDeep, marginBottom: '0.3rem' }}>{m.name}</div>
                <div style={{ fontSize: '0.78rem', color: C.ochre, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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

      <div className="reveal" style={{ width: '100%' }}>
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

/* ─────────────────────────────────────────────
   DONATION BANNER
   ───────────────────────────────────────────── */
function DonationBanner() {
  return (
    <section id="don" style={{ background: C.ochre, padding: 'clamp(5rem,10vw,8rem) 1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div className="dot-grid" style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'absolute', right: '-5rem', top: '50%', transform: 'translateY(-50%)', width: 420, height: 420, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', right: '-7rem', top: '50%', transform: 'translateY(-50%)', width: 560, height: 560, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 500, marginBottom: '1.5rem' }}>
          Agir maintenant · Ensemble
        </div>
        <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Chaque geste compte<br /><em style={{ fontWeight: 400 }}>pour Tighremt</em>
        </h2>
        <div className="reveal reveal-delay-2" style={{ width: 64, height: 2, background: 'rgba(255,255,255,0.4)', margin: '0 auto 2rem' }} />
        <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 300, fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 2.75rem' }}>
          Votre soutien finance nos actions sur le terrain et contribue directement au développement durable de la province de Tata.
        </p>
        <div className="reveal reveal-delay-3" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
          <a href="mailto:palmeraies.tighremt.tata@gmail.com"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1.1rem 2.5rem', background: '#fff', color: C.ochreDark, borderRadius: 999, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,0.15)', transition: 'transform 0.25s, box-shadow 0.25s' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.2)'; }}
            onMouseOut={e =>  { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.15)'; }}>
            <Heart size={18} />
            Soutenir nos actions par un don
          </a>
          <a href="#mission" className="btn-white-outline" style={{ padding: '1.1rem 2.5rem', borderRadius: 999, fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
            Notre mission
          </a>
        </div>
        <div className="reveal reveal-delay-4" style={{ marginTop: '3.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 400 }}>
          {['Association loi 1901', 'À but non lucratif', 'Don déductible des impôts*'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>✓</span> {t}
            </span>
          ))}
        </div>
        <div className="reveal reveal-delay-4" style={{ marginTop: '0.75rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
          * Sous réserve des conditions légales en vigueur
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   FOOTER
   ───────────────────────────────────────────── */
function Footer() {
  const quickLinks = ['Accueil', 'Mission', 'Actions', 'Histoire', 'Galerie', 'Faire un don', 'Contact'];
  const hrefs      = ['#', '#mission', '#actions', '#histoire', '#galerie', '#don', '#contact'];

  return (
    <footer id="contact" style={{ background: C.greenDeep, color: 'rgba(255,255,255,0.65)', padding: '5rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <Logo size={100} />
              <div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, fontSize: '1rem', color: '#fff', lineHeight: 1.1 }}>Association Palmeraies Tighremt</div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent }}>TATA · Maroc</div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.85, fontWeight: 300, marginBottom: '1.5rem' }}>
              Association à but non lucratif<br />Loi 1901 · Fondée en mars 2010<br />Humanitaire & Échanges culturels
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[{ Icon: Share2, label: 'Facebook' }, { Icon: Globe, label: 'Instagram' }, { Icon: Send, label: 'Twitter/X' }].map(({ Icon, label }) => (
                <a key={label} href="#" aria-label={label}
                  style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', textDecoration: 'none' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                  onMouseOut={e =>  e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <Icon size={15} color="rgba(255,255,255,0.7)" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>Liens rapides</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {quickLinks.map((l, i) => (
                <a key={l} href={hrefs[i]}
                  style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                  onMouseOut={e =>  e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}>
                  {l}
                </a>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>NOUS CONTACTER</div>
            {[
              { Icon: MapPin, text: 'rue Nobel\n62410 Hulluch, France' },
              { Icon: Phone,  text: '06 35 99 63 89\n06 70 06 05 45' },
              { Icon: Mail,   text: 'palmeraies.tighremt.tata@gmail.com' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <Icon size={15} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.87rem', lineHeight: 1.65, whiteSpace: 'pre-line', fontWeight: 300 }}>{text}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>Restez informé</div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 300, marginBottom: '1rem' }}>
              Recevez nos actualités et suivez l'avancement de nos projets.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="email" placeholder="Votre e-mail"
                style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
              />
              <button className="btn-accent" style={{ padding: '0.65rem 1rem', borderRadius: 8, flexShrink: 0 }}>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          <span>© 2025 Association Palmeraies Tighremt TATA · Tous droits réservés</span>
          <span>Association loi 1901 à but non lucratif</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   GLASS DOCK — floating bottom navigation
   ───────────────────────────────────────────── */
const DOCK_ITEMS = [
  { title: 'Accueil',     href: '#',        icon: Home },
  { title: 'Mission',     href: '#mission', icon: Newspaper },
  { title: 'Nos projets', href: '#actions', icon: HandHeart },
  { title: 'Équipe',      href: '#equipe',  icon: Users },
  { title: 'Don',         href: '#don',     icon: Heart },
  { title: 'Galerie',     href: '#galerie', icon: ImageIcon },
];

function FloatingDock() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 100}px)`,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
      zIndex: 200,
    }}>
      <GlassDock items={DOCK_ITEMS} />
    </div>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
   ───────────────────────────────────────────── */
const TRAIL_IMAGES = [
  'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=300&q=70',
  'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=300&q=70',
  'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=300&q=70',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=300&q=70',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=300&q=70',
];

export default function LandingPage() {
  useScrollReveal();

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {/* Cursor trail */}
      <PixelatedImageTrail
        images={TRAIL_IMAGES}
        slices={4}
        spawnThreshold={80}
        smoothing={0.12}
      />

      {/* Floating bottom dock */}
      <FloatingDock />

      {/* Skip link for accessibility */}
      <a href="#main-content" style={{ position: 'absolute', top: '-100%', left: 0, background: '#133d20', color: '#fff', padding: '0.5rem 1rem', zIndex: 9999, borderRadius: '0 0 4px 0', transition: 'top 0.2s' }}
        onFocus={e => e.currentTarget.style.top = '0'}
        onBlur={e =>  e.currentTarget.style.top = '-100%'}>
        Aller au contenu principal
      </a>

      <Navbar />
      <main id="main-content">
        <Hero />
        <Mission />
        <Histoire />
        <Actions />
        <Equipe />
        <Galerie />
        <DonationBanner />
      </main>
      <Footer />
    </>
  );
}
