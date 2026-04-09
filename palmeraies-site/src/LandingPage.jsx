import React, { useState, useEffect } from 'react';
import {
  TreePine, Shield, Heart, BookOpen,
  Menu, X, Leaf, ArrowRight, ChevronDown,
  Share2, Globe, Send, Mail, Phone, MapPin,
  Calendar, Scale, Map
} from 'lucide-react';

/* ─────────────────────────────────────────────
    BRAND TOKENS - Palette Palmeraie Maroc
    ───────────────────────────────────────────── */
const C = {
  greenDeep:   '#133d20',
  green:       '#1e5c30',
  greenMid:    '#2a7a3e',
  greenCanopy: '#2D5A27',  // Vert Canopée
  ochre:       '#c4703f',
  ochreDark:   '#a35428',
  ochreSand:   '#D4A373',  // Ocre Sable
  sand:        '#FAFAE1',  // Crème
  sandMid:     '#eae4d4',
  sandDark:    '#ddd4c0',
  cream:       '#FAFAE1',  // Crème fond
  accent:      '#e8832a',
  accentDark:  '#c96d18',
  ink:         '#1c1c18',
  inkMuted:    '#5c5848',
  inkLight:    '#8a8270',
};

/* ─────────────────────────────────────────────
    GLOBAL STYLES (injected once)
    ───────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Montserrat:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'Montserrat', sans-serif;
    background-color: ${C.cream};
    color: ${C.ink};
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: 'Playfair Display', serif;
  }

  /* ── Scroll-reveal ── */
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

  /* ── Nav underline ── */
  .nav-link { 
    position: relative;
    color: #fff;
    text-decoration: none;
    font-size: 0.88rem;
    font-weight: 500;
    transition: color 0.3s ease;
  }
  .nav-link::after {
    content: '';
    position: absolute;
    bottom: -3px; left: 0;
    width: 0; height: 1px;
    background: ${C.accent};
    transition: width 0.3s ease;
  }
  .nav-link:hover { color: ${C.cream}; }
  .nav-link:hover::after { width: 100%; }

  .nav-link-scrolled {
    color: ${C.inkMuted};
  }
  .nav-link-scrolled:hover { color: ${C.greenDeep}; }

  /* ── Action cards ── */
  .action-card {
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1),
                box-shadow 0.3s ease;
  }
  .action-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 24px 48px rgba(19,61,32,0.13);
  }

  /* ── Buttons ── */
  .btn-accent {
    background: ${C.accent};
    color: #fff;
    transition: background 0.2s, transform 0.2s;
  }
  .btn-accent:hover { background: ${C.accentDark}; transform: translateY(-1px); }

  .btn-ghost-white {
    border: 1.5px solid rgba(255,255,255,0.65);
    color: #fff;
    transition: background 0.2s, border-color 0.2s;
  }
  .btn-ghost-white:hover {
    background: rgba(255,255,255,0.12);
    border-color: #fff;
  }

  .btn-white-outline {
    border: 1.5px solid rgba(255,255,255,0.6);
    color: #fff;
    transition: background 0.2s;
  }
  .btn-white-outline:hover { background: rgba(255,255,255,0.1); }

  /* ── Hero parallax bg ── */
  .hero-bg {
    background:
      linear-gradient(180deg, 
        rgba(19,61,32,0.75) 0%, 
        rgba(19,61,32,0.55) 40%, 
        rgba(19,61,32,0.85) 100%
      ),
      linear-gradient(0deg, rgba(0,0,0,0.4) 0%, transparent 60%),
      url('https://images.unsplash.com/photo-1518475311958-cb5c818f8866?w=1920&q=85') center/cover no-repeat fixed;
    min-height: 100svh;
  }

  /* ── Decorative dot grid ── */
  .dot-grid {
    background-image: radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* ── Stat items ── */
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .stat-item + .stat-item {
    border-left: 1px solid rgba(255,255,255,0.2);
    padding-left: 2rem;
    margin-left: 2rem;
  }
  .stat-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
  }

  @media (max-width: 768px) {
    .stat-item + .stat-item {
      border-left: none;
      padding-left: 0;
      margin-left: 0;
      border-top: 1px solid rgba(255,255,255,0.2);
      padding-top: 1rem;
      margin-top: 1rem;
    }
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
   NAVBAR
   ───────────────────────────────────────────── */
function Navbar() {
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['Accueil', 'À propos', 'Nos projets', 'Équipe', 'Actualités', 'Contact'];

  const navBg = scrolled
    ? `rgba(250,247,240,0.96)`
    : 'transparent';
  const shadow = scrolled ? '0 1px 0 rgba(196,112,63,0.15)' : 'none';
  const textCol = scrolled ? C.inkMuted : 'rgba(255,255,255,0.82)';
  const logoCol = scrolled ? C.greenDeep : '#fff';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: navBg, boxShadow: shadow,
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      transition: 'background 0.35s, box-shadow 0.35s, backdrop-filter 0.35s',
      padding: '1rem 1.5rem',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: C.greenMid,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Leaf size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '1.05rem', color: logoCol, lineHeight: 1.1 }}>
              Palmeraies Tighremt
            </div>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: scrolled ? C.ochre : 'rgba(255,255,255,0.65)', fontWeight: 500 }}>
              TATA · Maroc
            </div>
          </div>
        </a>

        {/* Desktop links */}
        <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', justifyContent: 'flex-end', flex: 1 }} className="desktop-nav" data-hide-mobile>
          {links.map(l => (
            <a key={l} href="#" className={`nav-link ${scrolled ? 'nav-link-scrolled' : ''}`}>
              {l}
            </a>
          ))}
        </div>

        {/* CTA + Hamburger */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a href="#don" className="btn-accent"
            style={{ padding: '0.6rem 1.4rem', borderRadius: 999, fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.04em', textDecoration: 'none', display: 'none' }}
            id="nav-cta-desktop">
            FAIRE UN DON
          </a>
          <button onClick={() => setOpen(!open)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: scrolled ? C.ink : '#fff', lineHeight: 0 }}
            id="hamburger">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          background: C.cream, borderTop: `1px solid ${C.creamDark}`,
          padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
        }}>
          {links.map(l => (
            <a key={l} href="#"
              style={{ padding: '0.75rem 0', fontSize: '1rem', color: C.inkMuted, textDecoration: 'none', borderBottom: `1px solid ${C.creamDark}` }}
              onClick={() => setOpen(false)}>
              {l}
            </a>
          ))}
          <a href="#don" className="btn-accent"
            style={{ marginTop: '1rem', padding: '0.9rem', borderRadius: 999, fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}
            onClick={() => setOpen(false)}>
            FAIRE UN DON
          </a>
        </div>
      )}

      {/* Inject show/hide logic via style */}
      <style>{`
        @media (min-width: 1024px) {
          [data-hide-mobile] { display: flex !important; }
          #nav-cta-desktop   { display: block !important; }
          #hamburger         { display: none !important; }
        }
        @media (max-width: 1023px) {
          [data-hide-mobile] { display: none !important; }
        }
      `}</style>
    </nav>
  );
}

/* ─────────────────────────────────────────────
   HERO
   ───────────────────────────────────────────── */
function Hero() {
  return (
    <section className="hero-bg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 1.5rem 5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', paddingTop: '7rem' }}>

        {/* Eyebrow */}
        <div className="reveal" style={{
          fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
          color: 'rgba(232,131,42,0.9)', fontWeight: 500, marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ display: 'block', width: 32, height: 1, background: C.accent }} />
          Province de Tata · Maroc · Fondée 2010
        </div>

        {/* H1 */}
        <h1 className="reveal reveal-delay-1" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 'clamp(3rem, 9vw, 7rem)',
          fontWeight: 300, lineHeight: 1.05,
          color: '#fff', letterSpacing: '-0.02em',
          maxWidth: '14ch', marginBottom: '1.75rem',
        }}>
          Agir pour<br />nous aider<br /><em style={{ fontStyle: 'italic', fontWeight: 400 }}>à grandir</em>
        </h1>

        {/* Divider line */}
        <div className="reveal reveal-delay-2" style={{ width: 72, height: 2, background: `linear-gradient(to right, ${C.accent}, transparent)`, marginBottom: '1.75rem' }} />

        {/* Subtitle */}
        <p className="reveal reveal-delay-2" style={{
          color: 'rgba(255,255,255,0.78)', fontWeight: 300,
          fontSize: 'clamp(0.95rem, 2.2vw, 1.2rem)', lineHeight: 1.75,
          maxWidth: 500, marginBottom: '2.5rem',
        }}>
          Ensemble pour la sauvegarde de la palmeraie et le développement du village de Tighremt (Tata, Maroc).
        </p>

        {/* CTAs */}
        <div className="reveal reveal-delay-3" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '4rem' }}>
          <a href="#don" className="btn-accent"
            style={{ padding: '1rem 2.25rem', borderRadius: 999, fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Faire un don <ArrowRight size={17} />
          </a>
          <a href="#mission" className="btn-ghost-white"
            style={{ padding: '1rem 2.25rem', borderRadius: 999, fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
            Découvrir notre mission
          </a>
        </div>

        {/* Stats strip */}
        <div className="reveal reveal-delay-4" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { val: '2010', label: 'Année de fondation', icon: Calendar },
            { val: 'Loi 1901', label: 'Statut juridique', icon: Scale },
            { val: 'Tata', label: 'Province, Maroc', icon: Map },
          ].map(s => (
            <div key={s.val} className="stat-item">
              <div className="stat-icon">
                <s.icon size={16} color="rgba(255,255,255,0.7)" />
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', marginTop: '0.3rem', fontWeight: 300 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.4)' }}>
        <span style={{ fontSize: '0.58rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Défiler</span>
        <ChevronDown size={15} style={{ animation: 'bounce 2s infinite' }} />
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }`}</style>
    </section>
  );
}

/* ─────────────────────────────────────────────
   MISSION SECTION
   ───────────────────────────────────────────── */
function Mission() {
  return (
    <section id="mission" style={{ background: C.cream, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,480px),1fr))', gap: 'clamp(3rem,6vw,6rem)', alignItems: 'center' }}>

        {/* Text column */}
        <div>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
            Notre Histoire
          </div>

          <h2 className="reveal reveal-delay-1" style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 'clamp(2rem, 4.5vw, 3.4rem)',
            fontWeight: 400, lineHeight: 1.12,
            color: C.greenDeep, marginBottom: '1.5rem',
          }}>
            Une mission née<br />de <em>l'amour de la terre</em>
          </h2>

          <div className="reveal reveal-delay-1" style={{ width: 56, height: 2, background: `linear-gradient(to right, ${C.ochre}, transparent)`, marginBottom: '2rem' }} />

          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1.02rem', fontWeight: 300, marginBottom: '1.25rem' }}>
            Notre association a été créée pour aider par différentes actions, le village de Tighremt dans la province de Tata au Maroc. C'est une association à but non lucratif créée selon la loi 1901 en mars 2010. Dirigée vers l'humanitaire et les échanges culturels au Maroc, elle regroupe des bénévoles de diverses spécialités tous originaires de la province de Tighremt Tata qui par leurs compétences contribuent à son fonctionnement et à son développement.
          </p>
          <p className="reveal reveal-delay-3" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1.02rem', fontWeight: 300 }}>
            La ville de Tata reste majestueuse et accueillante, austères mais fiers et hospitaliers, ses habitants se contentent du peu que leur procure la nature, sachant que tout reste à faire pour s'atteler au train du développement à grande vitesse. C'est ainsi qu'est née Palmeraies Tighremt Tata.
          </p>

          {/* Pull quote badge */}
          <div className="reveal reveal-delay-4" style={{
            marginTop: '2.5rem',
            padding: '1.5rem 1.75rem',
            background: C.creamMid,
            borderLeft: `4px solid ${C.ochre}`,
            borderRadius: '0 1rem 1rem 0',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.15rem', fontStyle: 'italic', color: C.green, lineHeight: 1.5 }}>
              "Association loi 1901 à but non lucratif<br />fondée en mars 2010"
            </div>
            <div style={{ fontSize: '0.78rem', color: C.ochre, fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.75rem', textTransform: 'uppercase' }}>
              Humanitaire · Échanges culturels · Maroc
            </div>
          </div>
        </div>

        {/* Image column */}
        <div className="reveal reveal-delay-2" style={{ position: 'relative' }}>
          <div style={{ position: 'relative', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '4/5' }}>
            <img
              src="https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=800&q=80"
              alt="Palmeraie de Tata, Maroc"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.greenDeep}60 0%, transparent 55%)` }} />
          </div>

          {/* Floating year badge */}
          <div style={{
            position: 'absolute', bottom: '-1.5rem', left: '-1.5rem',
            background: C.ochre, color: '#fff',
            borderRadius: '1.25rem', padding: '1.25rem 1.5rem',
            boxShadow: '0 12px 32px rgba(164,84,40,0.35)',
          }}>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.25rem', fontWeight: 600, lineHeight: 1 }}>2010</div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.8, marginTop: '0.3rem' }}>Fondée en</div>
          </div>

          {/* Decorative corner element */}
          <div style={{
            position: 'absolute', top: '-1.25rem', right: '-1.25rem',
            width: 64, height: 64, borderRadius: '50%',
            background: C.creamDark, border: `4px solid ${C.cream}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Leaf size={22} color={C.green} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   ACTIONS SECTION
   ───────────────────────────────────────────── */
const ACTIONS = [
  {
    icon: TreePine,
    title: 'Sauvegarde de la Palmeraie',
    desc: 'Protection et restauration du patrimoine végétal ancestral de la région de Tata, symbole vivant d\'identité et d\'espoir pour les générations futures.',
    color: C.green,
    bgImage: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=600&q=70',
  },
  {
    icon: Shield,
    title: 'Lutte contre la désertification',
    desc: 'Actions concrètes pour préserver les terres agricoles, contenir l\'avancée du désert et maintenir la biodiversité des oasis.',
    color: C.ochre,
    bgImage: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=600&q=70',
  },
  {
    icon: Heart,
    title: 'Missions Humanitaires',
    desc: 'Aide directe aux populations vulnérables, distribution de produits essentiels et accompagnement solidaire au cœur de la communauté.',
    color: C.accent,
    bgImage: 'https://images.unsplash.com/photo-1526976668912-1a811878dd37?w=600&q=70',
  },
  {
    icon: BookOpen,
    title: 'Formation & Information locale',
    desc: 'Sensibilisation, éducation et transfert de savoir-faire pour permettre à chacun de construire son avenir avec dignité.',
    color: C.greenMid,
    bgImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=70',
  },
];

function Actions() {
  return (
    <section id="actions" style={{ background: C.creamMid, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: 'clamp(3rem,6vw,5rem)', maxWidth: 560 }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
            Ce que nous faisons
          </div>
          <h2 className="reveal reveal-delay-1" style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2rem, 4.5vw, 3.2rem)',
            fontWeight: 400, lineHeight: 1.15,
            color: C.greenDeep,
          }}>
            Nos actions pour<br /><em>Tighremt & la région</em>
          </h2>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {ACTIONS.map(({ icon: Icon, title, desc, color, bgImage }, i) => (
            <div
              key={title}
              className={`action-card reveal reveal-delay-${i + 1}`}
              style={{
                background: C.cream,
                borderRadius: '1.75rem',
                overflow: 'hidden',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Top image strip */}
              <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                <img src={bgImage} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, transparent 40%, ${C.cream}cc)` }} />
                <div style={{
                  position: 'absolute', bottom: '-20px', left: '1.5rem',
                  width: 48, height: 48, borderRadius: '0.875rem',
                  background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 16px ${color}50`,
                }}>
                  <Icon size={20} color="#fff" />
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '2.5rem 1.5rem 1.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.greenDeep, lineHeight: 1.3 }}>{title}</h3>
                <p style={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.75, fontWeight: 300, flex: 1 }}>{desc}</p>
                <a href="#" style={{ fontSize: '0.82rem', fontWeight: 600, color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                  En savoir plus <ArrowRight size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
   DONATION CTA BANNER
   ───────────────────────────────────────────── */
function DonationBanner() {
  return (
    <section id="don" style={{ background: C.ochre, padding: 'clamp(5rem,10vw,8rem) 1.5rem', position: 'relative', overflow: 'hidden' }}>

      {/* Dot grid overlay */}
      <div className="dot-grid" style={{ position: 'absolute', inset: 0 }} />

      {/* Decorative palm silhouette circle */}
      <div style={{
        position: 'absolute', right: '-5rem', top: '50%', transform: 'translateY(-50%)',
        width: 420, height: 420, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.12)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: '-7rem', top: '50%', transform: 'translateY(-50%)',
        width: 560, height: 560, borderRadius: '50%',
        border: '1px solid rgba(255,255,255,0.07)',
        pointerEvents: 'none',
      }} />

      <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>

        <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 500, marginBottom: '1.5rem' }}>
          Agir maintenant · Ensemble
        </div>

        <h2 className="reveal reveal-delay-1" style={{
          fontFamily: 'Playfair Display, serif',
          fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
          fontWeight: 300, lineHeight: 1.05,
          color: '#fff', marginBottom: '1.5rem',
          letterSpacing: '-0.02em',
        }}>
          Chaque geste compte<br /><em style={{ fontWeight: 400 }}>pour Tighremt</em>
        </h2>

        <div className="reveal reveal-delay-2" style={{ width: 64, height: 2, background: 'rgba(255,255,255,0.4)', margin: '0 auto 2rem' }} />

        <p className="reveal reveal-delay-2" style={{
          color: 'rgba(255,255,255,0.78)',
          fontWeight: 300, fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
          lineHeight: 1.8, maxWidth: 480, margin: '0 auto 2.75rem',
        }}>
          Votre soutien, quel que soit son montant, finance nos actions sur le terrain et contribue directement au développement durable de la province de Tata.
        </p>

        <div className="reveal reveal-delay-3" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
          <a href="#"
            style={{
              background: '#fff', color: C.ochreDark,
              padding: '1.1rem 2.5rem', borderRadius: 999,
              fontWeight: 700, fontSize: '0.95rem',
              textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.22)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }}
          >
            Soutenir nos actions par un don <ArrowRight size={17} />
          </a>
          <a href="#mission" className="btn-white-outline"
            style={{ padding: '1.1rem 2.5rem', borderRadius: 999, fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
            Notre mission
          </a>
        </div>

        {/* Trust signals */}
        <div className="reveal reveal-delay-4" style={{
          marginTop: '3.5rem',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem',
          color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 400,
        }}>
          {['Association loi 1901', 'À but non lucratif', 'Don déductible des impôts*'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1rem', lineHeight: 1 }}>✓</span> {t}
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
  const quickLinks = ['Accueil', 'À propos', 'Nos projets', 'Équipe', 'Actualités', 'Faire un don', 'Contact'];

  return (
    <footer style={{ background: C.greenDeep, color: 'rgba(255,255,255,0.65)', padding: '5rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', paddingBottom: '3rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>

          {/* Brand */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.greenMid, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Leaf size={16} color="#fff" />
              </div>
              <div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 600, fontSize: '1rem', color: '#fff', lineHeight: 1.1 }}>
                  Palmeraies Tighremt
                </div>
                <div style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: C.accent }}>
                  TATA · Maroc
                </div>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.85, fontWeight: 300, marginBottom: '1.5rem' }}>
              Association à but non lucratif<br />
              Loi 1901 · Fondée en mars 2010<br />
              Humanitaire & Échanges culturels
            </p>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {[Share2, Globe, Send].map((Icon, i) => (
                <a key={i} href="#"
                  style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', textDecoration: 'none' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.16)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                >
                  <Icon size={15} color="rgba(255,255,255,0.7)" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>
              Liens rapides
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {quickLinks.map(l => (
                <a key={l} href="#"
                  style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
                  onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
                >
                  {l}
                </a>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>
              Contact
            </div>
            {[
              { Icon: Mail, text: 'contact@palmeraies-tata.org' },
              { Icon: Phone, text: '+33 (0)X XX XX XX XX' },
              { Icon: MapPin, text: 'Tighremt, Province de Tata\nMaroc' },
            ].map(({ Icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                <Icon size={15} color={C.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ fontSize: '0.87rem', lineHeight: 1.65, whiteSpace: 'pre-line', fontWeight: 300 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* Newsletter CTA */}
          <div>
            <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>
              Restez informé
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 300, marginBottom: '1rem' }}>
              Recevez nos actualités et suivez l'avancement de nos projets.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="email"
                placeholder="Votre e-mail"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, padding: '0.65rem 0.9rem',
                  color: '#fff', fontSize: '0.85rem', outline: 'none',
                }}
              />
              <button className="btn-accent"
                style={{ padding: '0.65rem 1rem', borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)' }}>
          <span>© 2025 Palmeraies Tighremt TATA · Tous droits réservés</span>
          <span>Association loi 1901 à but non lucratif</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
   ROOT COMPONENT
   ───────────────────────────────────────────── */
export default function LandingPage() {
  useScrollReveal();

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <Navbar />
      <main>
        <Hero />
        <Mission />
        <Actions />
        <DonationBanner />
      </main>
      <Footer />
    </>
  );
}
