'use client';
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ChevronDown, ArrowRight, TreePine, Droplets, HeartHandshake } from 'lucide-react';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';
import actualites from '@/data/actualites.json';

const CircularGallery = dynamic(
  () => import('@/components/ui/CircularGallery'),
  { ssr: false }
);

const TextType = dynamic(
  () => import('@/components/ui/TextType'),
  { ssr: false }
);

/* ─────────────────────────────────────────────────────────────
   Données statiques
───────────────────────────────────────────────────────────── */
const CIRCULAR_GALLERY_ITEMS = [
  { image: '/images/tighremt/palmeraie-panorama.jpg', text: 'Palmeraie de Tighremt' },
  { image: '/images/tighremt/palmeraie-sol.jpg',      text: 'Oasis en fleur' },
  { image: '/images/tighremt/dattes.jpg',             text: 'Dattes de Tighremt' },
  { image: '/images/tighremt/minaret.jpg',            text: 'Mosquée de Tighremt' },
  { image: '/images/tighremt/ksar-silhouette.jpg',    text: 'Ksar ancestral' },
  { image: '/images/tighremt/tighremt-panorama.jpg',  text: 'Village de Tighremt' },
  { image: '/images/tighremt/route-tighremt.jpg',     text: 'Paysage du sud marocain' },
  { image: '/images/tighremt/palmeraie-chemin.jpg',   text: 'Chemin de la palmeraie' },
];

const PILLIERS = [
  {
    Icon: TreePine,
    color: C.green,
    titre: 'Palmeraie',
    description: 'Replantation et préservation des palmiers dattiers contre la désertification. Plus de 1 200 palmiers sauvegardés à ce jour.',
  },
  {
    Icon: Droplets,
    color: C.water,
    titre: 'Foggaras & Irrigation',
    description: 'Réhabilitation des canaux d\'irrigation souterrains ancestraux pour garantir l\'eau aux cultivateurs du village.',
  },
  {
    Icon: HeartHandshake,
    color: C.ochre,
    titre: 'Aide humanitaire',
    description: 'Missions annuelles : aide médicale, soutien scolaire et distribution aux 18 familles vulnérables de Tighremt.',
  },
];

const STATS_PROJETS = [
  { val: '1 200+', label: 'palmiers préservés' },
  { val: '18',     label: 'familles soutenues' },
  { val: '14',     label: "années d'action" },
  { val: '6',      label: 'projets complétés' },
];

const EQUIPE = [
  { nom: 'Mohamed TAHAR',            role: 'Président',      initiales: 'MT' },
  { nom: 'Lahoucine AÏT EL JAMAR',   role: 'Vice-Président', initiales: 'LA' },
  { nom: 'Abderrahmane BEN MANSOUR', role: 'Trésorier',      initiales: 'AB' },
  { nom: 'Omar BOUBKER',             role: 'Secrétaire',     initiales: 'OB' },
];

/* ─────────────────────────────────────────────────────────────
   Styles CTAs partagés (inline string templates)
───────────────────────────────────────────────────────────── */
const ctaLight = {
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
  color: 'rgba(196,169,107,0.9)', textDecoration: 'none',
  borderBottom: '1px solid rgba(196,169,107,0.35)', paddingBottom: '0.2rem',
  transition: 'color 0.2s, border-color 0.2s',
};
const ctaDark = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
  fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase',
  color, textDecoration: 'none',
  borderBottom: `1px solid ${color}`, paddingBottom: '0.2rem',
  transition: 'color 0.2s, border-color 0.2s',
});
const eyebrow = (color) => ({
  fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
  color, fontWeight: 500, marginBottom: '0.75rem',
});

/* ─────────────────────────────────────────────────────────────
   1. HERO
───────────────────────────────────────────────────────────── */
function Hero() {
  const contentRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      if (!sectionRef.current) return;
      const scrollY  = window.scrollY;
      const sectionH = sectionRef.current.offsetHeight;
      if (scrollY > sectionH) return;
      if (contentRef.current) contentRef.current.style.transform = `translateY(${scrollY * 0.12}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style>{`
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
        .stat-item { padding: 0 1.4rem; text-align: center; }
        .stat-item + .stat-item { border-left: 1px solid rgba(255,255,255,0.18); }
        @media (max-width: 420px) {
          .stat-item { padding: 0 0.8rem; }
        }
        @keyframes scrollFloat {
          0%, 100% { transform: translateX(-50%) translateY(0);   opacity: 0.3; }
          50%       { transform: translateX(-50%) translateY(6px); opacity: 0.55; }
        }
        .btn-hero-primary {
          display: inline-flex; align-items: center; gap: 0.6rem;
          padding: 1rem 2.2rem; background: ${C.accent}; color: #fff;
          border: none; border-radius: 999px; font-size: 0.95rem; font-weight: 600;
          letter-spacing: 0.03em; text-decoration: none; cursor: pointer;
          min-height: 44px; transition: background 0.2s, transform 0.25s;
          box-shadow: 0 8px 28px rgba(232,131,42,0.38);
        }
        .btn-hero-primary:hover { background: ${C.accentDark}; transform: translateY(-3px); }
        .btn-hero-glass {
          display: inline-flex; align-items: center; padding: 1rem 2.2rem;
          border-radius: 999px; font-size: 0.92rem; font-weight: 400;
          letter-spacing: 0.03em; text-decoration: none;
          color: rgba(255,255,255,0.92); background: rgba(255,255,255,0.07);
          backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2);
          min-height: 44px; cursor: pointer;
          transition: transform 0.3s, background 0.3s, border-color 0.3s;
        }
        .btn-hero-glass:hover {
          transform: translateY(-3px); background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.38);
        }
      `}</style>

      <section ref={sectionRef} style={{
        position: 'relative', minHeight: '100vh', minHeight: '100svh',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '0 1.5rem 5rem', overflow: 'hidden',
      }}>
        <div
          style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: `<video autoplay loop playsinline muted preload="auto" poster="/images/tighremt/palmeraie-panorama.jpg" style="position:absolute;inset:0;width:100%;height:120%;object-fit:cover;top:-10%;"><source src="/palmeraie-hero.mp4" type="video/mp4"><track kind="captions" src="/captions-fr.vtt" srclang="fr" label="Français"></video>` }}
        />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(110deg, rgba(6,20,10,0.90) 0%, rgba(6,20,10,0.60) 42%, rgba(6,20,10,0.10) 72%, transparent 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(to top, rgba(6,20,10,0.75) 0%, transparent 45%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, zIndex: 1, background: 'linear-gradient(to bottom, rgba(6,20,10,0.45) 0%, transparent 100%)' }} />

        <div ref={contentRef} style={{ position: 'relative', zIndex: 2, maxWidth: 1200, margin: '0 auto', width: '100%', paddingTop: '7rem', textAlign: 'center' }}>
          <div className="hero-eyebrow" style={{ fontSize: '0.68rem', letterSpacing: '0.32em', textTransform: 'uppercase', color: 'rgba(232,163,80,0.95)', fontWeight: 500, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'block', width: 32, height: 1, background: 'rgba(232,163,80,0.7)' }} />
            Province de Tata · Maroc · Fondée 2010
            <span style={{ display: 'block', width: 32, height: 1, background: 'rgba(232,163,80,0.7)' }} />
          </div>

          <h1 className="hero-h1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(3.2rem, 9.5vw, 7.5rem)', fontWeight: 300, lineHeight: 0.97, color: '#fff', letterSpacing: '-0.025em', marginBottom: '2rem', textShadow: '0 2px 60px rgba(0,0,0,0.5)' }}>
            Agir pour nous aider<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,245,220,1)' }}>à grandir</em>
          </h1>

          <div className="hero-divider" style={{ width: 80, height: 1.5, background: 'linear-gradient(to right, transparent, rgba(232,163,80,0.9), transparent)', margin: '0 auto 1.75rem' }} />

          <div className="hero-sub" style={{ color: 'rgba(255,255,255,0.70)', fontWeight: 300, fontSize: 'clamp(0.95rem, 2vw, 1.18rem)', lineHeight: 1.8, maxWidth: 520, textShadow: '0 1px 16px rgba(0,0,0,0.5)', margin: '0 auto 2.75rem', minHeight: '3.5em' }}>
            <TextType
              text={[
                'Sauvegarde de la palmeraie de Tighremt',
                'Développement du village de Tata, Maroc',
                'Soutien aux familles depuis 2010',
                'Réhabilitation des foggaras ancestrales',
                'Ensemble pour faire grandir Tighremt',
              ]}
              typingSpeed={45} deletingSpeed={25} pauseDuration={2400}
              initialDelay={1800} loop={true} showCursor={true}
              cursorCharacter="|" cursorBlinkDuration={0.55}
            />
          </div>

          <div className="hero-ctas" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '4.5rem', alignItems: 'center', justifyContent: 'center' }}>
            <a href="/don" className="btn-hero-primary btn-micro">
              <Heart size={18} /> Faire un don
            </a>
            <a href="/mission" className="btn-hero-glass btn-micro">
              Découvrir notre mission
            </a>
          </div>

          <div className="hero-stats" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center' }}>
            {[
              { val: '2010',     label: 'Année de fondation' },
              { val: 'Loi 1901', label: 'Statut juridique' },
              { val: 'Tata',     label: 'Province, Maroc' },
            ].map(s => (
              <div key={s.val} className="stat-item">
                <div style={{ fontFamily: FONT.alt, fontSize: '1.75rem', fontWeight: 600, color: '#fff', lineHeight: 1, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}>{s.val}</div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.48)', marginTop: '0.3rem', fontWeight: 300, letterSpacing: '0.07em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.3)', zIndex: 2, animation: 'scrollFloat 2.8s cubic-bezier(0.16,1,0.3,1) infinite' }}>
          <span style={{ fontSize: '0.56rem', letterSpacing: '0.28em', textTransform: 'uppercase' }}>Défiler</span>
          <ChevronDown size={13} />
        </div>
      </section>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   2. MISSION — 3 piliers d'action
───────────────────────────────────────────────────────────── */
function SectionMission() {
  return (
    <section style={{ background: C.greenDeep, padding: 'clamp(5rem,10vw,7rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div className="reveal" style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,4.5rem)' }}>
          <p style={{ ...eyebrow('rgba(196,169,107,0.9)'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.5)' }} />
            Notre mission
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.5)' }} />
          </p>
          <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 300, color: '#fff', lineHeight: 1.1, maxWidth: 640, margin: '0 auto' }}>
            Sauvegarder la palmeraie,<br />
            <em style={{ fontStyle: 'italic', fontWeight: 400 }}>développer le village</em>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {PILLIERS.map((p, i) => (
            <div
              key={p.titre}
              className={`reveal reveal-delay-${i + 1}`}
              style={{ padding: '2rem', borderRadius: 12, border: '1px solid rgba(196,169,107,0.18)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(4px)' }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '0.875rem', marginBottom: '1rem',
                background: `${p.color}22`, border: `1.5px solid ${p.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <p.Icon size={24} color={p.color} strokeWidth={1.6} />
              </div>
              <h3 style={{ fontFamily: FONT.alt, fontSize: '1.4rem', fontWeight: 500, color: '#fff', marginBottom: '0.6rem' }}>{p.titre}</h3>
              <p style={{ fontSize: '0.86rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontWeight: 300 }}>{p.description}</p>
            </div>
          ))}
        </div>

        <div className="reveal" style={{ textAlign: 'center' }}>
          <Link href="/mission" style={ctaLight}>
            Découvrir notre mission complète <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. PROJETS — chiffres-clés
───────────────────────────────────────────────────────────── */
function SectionProjets() {
  return (
    <section style={{ background: C.sand, padding: 'clamp(5rem,10vw,7rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem', marginBottom: 'clamp(3rem,6vw,4rem)' }}>
          <div className="reveal">
            <p style={eyebrow(C.ochre)}>Nos projets</p>
            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 300, color: C.ink, lineHeight: 1.1 }}>
              14 ans d&apos;action<br /><em style={{ fontStyle: 'italic' }}>sur le terrain</em>
            </h2>
          </div>
          <div className="reveal">
            <Link href="/projets" style={ctaDark(C.greenDeep)}>
              Voir tous les projets <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1.25rem' }}>
          {STATS_PROJETS.map((s, i) => (
            <div
              key={s.label}
              className={`reveal reveal-delay-${i + 1}`}
              style={{ padding: '2rem 1.5rem', background: '#fff', borderRadius: 12, border: '1px solid #e0d8c8', textAlign: 'center' }}
            >
              <div style={{ fontFamily: FONT.alt, fontSize: 'clamp(2.5rem,5vw,3.5rem)', fontWeight: 600, color: C.greenDeep, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.75rem', color: C.inkMuted, marginTop: '0.5rem', fontWeight: 300, letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   4. ACTUALITÉS — 2 derniers articles
───────────────────────────────────────────────────────────── */
function SectionActualites() {
  const featured = actualites[0];
  const second   = actualites[1];

  return (
    <section style={{ background: '#fff', padding: 'clamp(5rem,10vw,7rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem', marginBottom: 'clamp(2.5rem,5vw,3.5rem)' }}>
          <div className="reveal">
            <p style={eyebrow(C.ochre)}>Actualités</p>
            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 300, color: C.ink, lineHeight: 1.1 }}>
              Les dernières<br /><em style={{ fontStyle: 'italic' }}>nouvelles</em>
            </h2>
          </div>
          <div className="reveal">
            <Link href="/actualites" style={ctaDark(C.greenDeep)}>
              Toutes les actualités <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>

          {featured && (
            <Link
              href={`/actualites/${featured.id}`}
              className="reveal"
              style={{ textDecoration: 'none', display: 'block', position: 'relative', borderRadius: 12, overflow: 'hidden', minHeight: 360 }}
            >
              <Image
                src={featured.image}
                alt={featured.titre}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="actu-featured-img"
                style={{ objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,61,32,0.92) 0%, rgba(19,61,32,0.3) 55%, transparent 100%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.75rem' }}>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(196,169,107,0.9)', marginBottom: '0.5rem', fontWeight: 500 }}>
                  {new Date(featured.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <h3 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.2rem,2.5vw,1.5rem)', fontWeight: 400, color: '#fff', lineHeight: 1.25, marginBottom: '0.75rem' }}>
                  {featured.titre}
                </h3>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: '0.1rem' }}>
                  Lire l&apos;article <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          )}

          {second && (
            <Link
              href={`/actualites/${second.id}`}
              className="reveal reveal-delay-1"
              style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', borderRadius: 12, overflow: 'hidden', border: '1px solid #e0d8c8', background: C.sand }}
            >
              <div className="actu-card-img-wrap" style={{ height: 200, flexShrink: 0, position: 'relative' }}>
                <Image
                  src={second.image}
                  alt={second.titre}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="actu-card-img"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500 }}>
                  {new Date(second.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
                <h3 style={{ fontFamily: FONT.alt, fontSize: '1.15rem', fontWeight: 500, color: C.ink, lineHeight: 1.3 }}>
                  {second.titre}
                </h3>
                <p style={{ fontSize: '0.82rem', color: C.inkMuted, lineHeight: 1.65, flex: 1 }}>{second.extrait}</p>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: C.greenDeep, borderBottom: `1px solid ${C.greenDeep}`, paddingBottom: '0.1rem', marginTop: '0.25rem', alignSelf: 'flex-start' }}>
                  Lire la suite <ArrowRight size={11} />
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   5. GALERIE — CircularGallery existante
───────────────────────────────────────────────────────────── */
function SectionGalerie() {
  return (
    <section id="galerie" style={{ background: C.greenDeep, padding: 'clamp(5rem,10vw,8rem) 0 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
        <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(232,163,80,0.9)', fontWeight: 500, marginBottom: '1rem' }}>
          Notre Galerie
        </div>
        <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: '#fff', lineHeight: 1.15 }}>
          <em>Tighremt</em> en images
        </h2>
        <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', marginTop: '0.75rem', fontWeight: 300 }}>
          Faites glisser pour explorer · Scroll to browse
        </p>
      </div>
      <div className="reveal">
        <CircularGallery
          items={CIRCULAR_GALLERY_ITEMS}
          bend={3} textColor="#ffffff" borderRadius={0.05}
          font="italic bold 32px 'Cormorant Garamond', serif"
          scrollSpeed={2} scrollEase={0.05}
        />
      </div>
      <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem 4rem' }}>
        <Link href="/galerie" style={ctaLight}>
          Explorer toute la galerie <ArrowRight size={12} />
        </Link>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   6. DON — CTA plein impact
───────────────────────────────────────────────────────────── */
function SectionDon() {
  return (
    <section style={{ background: C.greenDeep, padding: 'clamp(5rem,10vw,7rem) 1.5rem', textAlign: 'center' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <p className="reveal" style={{ ...eyebrow('rgba(196,169,107,0.9)'), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.5)' }} />
          Agir concrètement
          <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.5)' }} />
        </p>
        <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(2.2rem,6vw,4rem)', fontWeight: 300, color: '#fff', lineHeight: 1.1, margin: '0.5rem 0 1.1rem' }}>
          Chaque euro va<br />
          <em style={{ fontStyle: 'italic', fontWeight: 400 }}>directement au terrain</em>
        </h2>
        <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '2.5rem', fontWeight: 300 }}>
          Association loi 1901 à but non lucratif · 0% de commission HelloAsso · Transparence totale
        </p>

        <div className="reveal reveal-delay-2" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          {[
            { pct: '75%', label: 'Projets terrain' },
            { pct: '15%', label: 'Fonctionnement' },
            { pct: '10%', label: 'Communication' },
          ].map(r => (
            <div key={r.label}>
              <div style={{ fontFamily: FONT.alt, fontSize: '2.4rem', fontWeight: 600, color: 'rgba(196,169,107,0.95)', lineHeight: 1 }}>{r.pct}</div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.3rem', letterSpacing: '0.07em' }}>{r.label}</div>
            </div>
          ))}
        </div>

        <div className="reveal reveal-delay-3">
          <Link
            href="/don"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', padding: '1rem 2.5rem', background: C.accent, color: '#fff', borderRadius: 999, textDecoration: 'none', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.03em', boxShadow: '0 8px 28px rgba(232,131,42,0.4)', transition: 'background 0.2s, transform 0.25s' }}
          >
            <Heart size={16} /> Faire un don maintenant
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   7. ÉQUIPE — 4 membres bénévoles
───────────────────────────────────────────────────────────── */
function SectionEquipe() {
  return (
    <section style={{ background: C.sand, padding: 'clamp(5rem,10vw,7rem) 1.5rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '2rem', marginBottom: 'clamp(3rem,6vw,4rem)' }}>
          <div className="reveal">
            <p style={eyebrow(C.ochre)}>L&apos;équipe</p>
            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,4.5vw,3rem)', fontWeight: 300, color: C.ink, lineHeight: 1.1 }}>
              Des bénévoles<br /><em style={{ fontStyle: 'italic' }}>engagés pour Tighremt</em>
            </h2>
          </div>
          <div className="reveal">
            <Link href="/equipe" style={ctaDark(C.greenDeep)}>
              Toute l&apos;équipe <ArrowRight size={12} />
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
          {EQUIPE.map((m, i) => (
            <div
              key={m.nom}
              className={`reveal reveal-delay-${i + 1}`}
              style={{ background: '#fff', borderRadius: 12, padding: '1.5rem', border: '1px solid #e0d8c8', display: 'flex', alignItems: 'center', gap: '1.1rem' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.greenDeep, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: FONT.alt, fontSize: '0.9rem', fontWeight: 600, color: 'rgba(196,169,107,0.95)', letterSpacing: '0.04em' }}>{m.initiales}</span>
              </div>
              <div>
                <div style={{ fontFamily: FONT.alt, fontSize: '1rem', fontWeight: 600, color: C.ink, lineHeight: 1.25 }}>{m.nom}</div>
                <div style={{ fontSize: '0.7rem', color: C.inkMuted, marginTop: '0.2rem', fontWeight: 300, letterSpacing: '0.05em' }}>{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   8. TÉMOIGNAGES — infinite scroll columns
───────────────────────────────────────────────────────────── */
const TESTIMONIALS = [
  {
    text: "Je donne chaque année depuis 5 ans. La transparence de leur rapport financier m'a convaincu dès le début.",
    name: "Karim B.", role: "Donateur, Lyon", initiales: "KB",
  },
  {
    text: "J'ai participé à la mission de 2023. Distribuer les aides aux familles de Tighremt reste l'une des expériences les plus marquantes de ma vie.",
    name: "Fatima A.", role: "Bénévole, Paris", initiales: "FA",
  },
  {
    text: "Grâce à l'association, nos enfants ont accès à des fournitures scolaires chaque année. Merci infiniment.",
    name: "Hassan O.", role: "Habitant de Tighremt", initiales: "HO",
  },
  {
    text: "La réhabilitation des foggaras a changé notre quotidien. Nos cultures sont de nouveau irriguées comme au temps de nos ancêtres.",
    name: "Brahim M.", role: "Agriculteur, Tata", initiales: "BM",
  },
  {
    text: "Un don de 50 € suffit à financer une aide médicale complète pour une famille dans le besoin. Je n'hésite plus.",
    name: "Sarah L.", role: "Donatrice, Marseille", initiales: "SL",
  },
  {
    text: "L'association est gérée avec une rigueur et une passion qui force le respect. Chaque euro est utilisé avec soin.",
    name: "Ahmed T.", role: "Membre actif, Casablanca", initiales: "AT",
  },
  {
    text: "Replanter des palmiers dattiers, c'est replanter des racines. Ce projet m'a touché profondément en tant que Marocain de la diaspora.",
    name: "Youssef N.", role: "Bénévole, Montréal", initiales: "YN",
  },
  {
    text: "Ma mère est née à Tighremt. Quand j'ai vu les photos de la palmeraie restaurée, j'ai eu les larmes aux yeux. Merci pour ce travail.",
    name: "Najat R.", role: "Donatrice, Bordeaux", initiales: "NR",
  },
  {
    text: "La mission humanitaire annuelle prouve que l'argent des donateurs va vraiment aux familles. Pas de bureaucratie inutile.",
    name: "Pierre D.", role: "Donateur, Nantes", initiales: "PD",
  },
];

function TestimonialsColumn({ items, duration = 20 }) {
  const doubled = [...items, ...items];
  return (
    <div style={{ overflow: 'hidden', height: 560, position: 'relative' }}>
      <motion.div
        animate={{ translateY: '-50%' }}
        transition={{ duration, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        {doubled.map((t, i) => (
          <div
            key={i}
            style={{
              background: '#fff',
              borderRadius: 16,
              border: '1px solid #e0d8c8',
              padding: '1.5rem',
              boxShadow: '0 2px 16px rgba(19,61,32,0.05)',
            }}
          >
            <p style={{ fontSize: '0.88rem', color: C.ink, lineHeight: 1.75, fontWeight: 300, marginBottom: '1.25rem' }}>
              &ldquo;{t.text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: C.greenDeep,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontFamily: FONT.alt, fontSize: '0.78rem', fontWeight: 600, color: 'rgba(196,169,107,0.95)', letterSpacing: '0.04em' }}>
                  {t.initiales}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: C.ink, lineHeight: 1.25 }}>{t.name}</div>
                <div style={{ fontSize: '0.72rem', color: C.inkMuted, marginTop: '0.15rem', fontWeight: 300 }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to bottom, ${C.sand}, transparent)`, pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: `linear-gradient(to top, ${C.sand}, transparent)`, pointerEvents: 'none', zIndex: 2 }} />
    </div>
  );
}

function SectionTemoignages() {
  return (
    <section style={{ background: C.sand, padding: 'clamp(5rem,10vw,7rem) 1.5rem' }}>
      <style>{`
        .testi-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .testi-col-2, .testi-col-3 { display: none; }
        @media (min-width: 640px) {
          .testi-grid { grid-template-columns: repeat(2, 1fr); }
          .testi-col-2 { display: block; }
        }
        @media (min-width: 960px) {
          .testi-grid { grid-template-columns: repeat(3, 1fr); }
          .testi-col-3 { display: block; }
        }
      `}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,4.5rem)' }}>
          <p className="reveal" style={{ ...eyebrow(C.ochre), display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,112,63,0.4)' }} />
            Témoignages
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,112,63,0.4)' }} />
          </p>
          <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,5vw,3.2rem)', fontWeight: 300, color: C.ink, lineHeight: 1.1 }}>
            Ils soutiennent<br />
            <em style={{ fontStyle: 'italic' }}>Tighremt</em>
          </h2>
        </div>

        <div className="testi-grid">
          <div>
            <TestimonialsColumn items={TESTIMONIALS.slice(0, 3)} duration={20} />
          </div>
          <div className="testi-col-2">
            <TestimonialsColumn items={TESTIMONIALS.slice(3, 6)} duration={26} />
          </div>
          <div className="testi-col-3">
            <TestimonialsColumn items={TESTIMONIALS.slice(6, 9)} duration={17} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   ROOT — orchestration complète
───────────────────────────────────────────────────────────── */
export default function HomeContent() {
  useScrollReveal();
  return (
    <>
      <Hero />
      <SectionDivider />
      <SectionMission />
      <SectionDivider />
      <SectionProjets />
      <SectionDivider />
      <SectionActualites />
      <SectionDivider />
      <SectionGalerie />
      <SectionDon />
      <SectionDivider />
      <SectionEquipe />
      <SectionDivider />
      <SectionTemoignages />
    </>
  );
}
