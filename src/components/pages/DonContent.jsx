'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Heart, ChevronDown, CalendarDays, FolderCheck, Users, Droplets,
  CreditCard, Mail, HandHelping, ShieldCheck, Check, Repeat,
  Zap, TreePine, GraduationCap, Home, ArrowRight,
  TrendingUp, Star, Settings, Megaphone, User, Hammer,
} from 'lucide-react';
import { C, FONT } from '@/lib/tokens';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import SectionDivider from '@/components/ui/SectionDivider';

const DonationProgress = dynamic(() => import('@/components/ui/DonationProgress'), { ssr: false });
const QRCodeSVG = dynamic(() => import('qrcode.react').then(m => ({ default: m.QRCodeSVG })), { ssr: false });

/* ─── Constants ───────────────────────────────────────────────── */
const HELLOASSO = 'https://www.helloasso.com/associations/palmeraies-tighremt-tata';

const AMOUNTS = [
  {
    value: 10,
    label: '10 €',
    Icon: GraduationCap,
    color: C.greenMid,
    impact: 'Fournitures scolaires pour 1 enfant pendant 1 mois',
    impactMonthly: 'Soutien scolaire toute l\'année pour 1 enfant',
  },
  {
    value: 25,
    label: '25 €',
    Icon: TreePine,
    color: C.green,
    impact: 'Un palmier dattier planté dans la palmeraie',
    impactMonthly: '12 palmiers plantés en un an — une rangée entière',
  },
  {
    value: 50,
    label: '50 €',
    Icon: Droplets,
    color: C.ochre,
    impact: "Irrigation d'une parcelle pendant une semaine complète",
    impactMonthly: "Une parcelle irriguée en permanence toute l'année",
    featured: true,
  },
  {
    value: 100,
    label: '100 €',
    Icon: Hammer,
    color: C.greenDeep,
    impact: "Réhabilitation d'un tronçon de canal foggara",
    impactMonthly: "Financement complet d'un canal foggara en 3 mois",
  },
  {
    value: 250,
    label: '250 €',
    Icon: Star,
    color: C.accentDark,
    impact: "Soutien complet d'un projet de terrain sur 1 mois",
    impactMonthly: "Sponsor principal de l'association — 3 000 € / an",
  },
  {
    value: 0,
    label: 'Libre',
    Icon: Heart,
    color: C.inkMuted,
    impact: 'Chaque centime compte pour Tighremt',
    impactMonthly: 'Votre soutien régulier, à votre rythme',
    free: true,
  },
];

const STATS = [
  { value: 2010, suffix: '', label: 'Fondée', Icon: CalendarDays, from: 2000 },
  { value: 6, suffix: '', label: 'Projets réalisés', Icon: FolderCheck, from: 0 },
  { value: 150, suffix: '+', label: 'Familles aidées', Icon: Users, from: 0 },
  { value: 12, suffix: '', label: 'Hectares irrigués', Icon: Droplets, from: 0 },
];

const TRANSPARENCY = [
  { label: 'Projets terrain', pct: 75, color: C.green, Icon: TreePine },
  { label: 'Frais de fonctionnement', pct: 15, color: C.ochre, Icon: Settings },
  { label: 'Communication & sensibilisation', pct: 10, color: C.greenMid, Icon: Megaphone },
];

const TEMOIGNAGES = [
  {
    text: "Grâce à l'association, nos enfants ont des fournitures scolaires et un soutien régulier.",
    auteur: 'Une mère de famille',
    lieu: 'Tighremt',
    AvatarIcon: User,
  },
  {
    text: "La palmeraie revit. On voit des palmiers pousser là où il n'y avait plus rien.",
    auteur: 'Un habitant du douar',
    lieu: 'Province de Tata',
    AvatarIcon: User,
  },
];

/* ─── Sub-components ──────────────────────────────────────────── */
function CounterItem({ stat }) {
  const duration = stat.value > 100 ? 2000 : 1600;
  const { ref, display } = useAnimatedCounter(stat.value, stat.from, duration);
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '1.75rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${C.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.green}28` }}>
          <stat.Icon size={22} color={C.green} strokeWidth={1.6} />
        </div>
      </div>
      <div style={{ fontFamily: FONT.alt, fontSize: 'clamp(2.2rem,4.5vw,3.2rem)', fontWeight: 600, color: C.greenDeep, lineHeight: 1 }}>
        <span className="stat-counter">{display}</span>{stat.suffix}
      </div>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: C.inkMuted, marginTop: '0.4rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{stat.label}</div>
    </div>
  );
}

function ProgressBar({ item, inView, delay = 0, index }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 500, color: C.ink, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <item.Icon size={15} color={item.color} strokeWidth={1.8} /> {item.label}
        </span>
        <span style={{ fontFamily: FONT.alt, fontSize: '1.1rem', fontWeight: 700, color: item.color }}>{item.pct}%</span>
      </div>
      <div style={{ height: 10, background: C.sandDark, borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
        <div style={{
          height: '100%',
          width: inView ? `${item.pct}%` : '0%',
          background: `linear-gradient(to right, ${item.color}, ${item.color}bb)`,
          borderRadius: 999,
          transition: inView ? `width 1.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms` : 'none',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Shimmer on bar */}
          {inView && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: `barShimmer 2s ease ${delay + 400}ms 1`,
            }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function DonContent() {
  const [selected, setSelected]     = useState(50);
  const [freeAmount, setFreeAmount] = useState('');
  const [monthly, setMonthly]       = useState(false);
  const [barsIn, setBarsIn]         = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const barsRef = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setBarsIn(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setBarsIn(true); io.disconnect(); }
    }, { threshold: 0.25 });
    if (barsRef.current) io.observe(barsRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TEMOIGNAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const displayAmount = selected === 0
    ? (parseInt(freeAmount) > 0 ? parseInt(freeAmount) : null)
    : selected;

  const selectedAmountData = AMOUNTS.find(a => a.value === selected) || AMOUNTS[0];

  const donUrl = displayAmount
    ? `${HELLOASSO}?amount=${displayAmount}`
    : HELLOASSO;

  return (
    <div style={{ background: C.sand }}>
      <style>{`
        @keyframes barShimmer {
          from { background-position: -200% center; }
          to   { background-position: 200% center; }
        }
        @keyframes don-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes donPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(196,112,63,0.4); }
          50%       { box-shadow: 0 0 0 12px rgba(196,112,63,0); }
        }
        @keyframes testimonialFade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes duneDriftA { from { transform: translateX(0); }     to { transform: translateX(-80px); } }
        @keyframes duneDriftB { from { transform: translateX(-40px); } to { transform: translateX(40px); } }
        @keyframes duneDriftC { from { transform: translateX(30px); }  to { transform: translateX(-50px); } }
        .don-dune-a { animation: duneDriftA 24s ease-in-out infinite alternate; }
        .don-dune-b { animation: duneDriftB 30s ease-in-out infinite alternate; }
        .don-dune-c { animation: duneDriftC 36s ease-in-out infinite alternate; }
        @keyframes toggleSlide {
          from { transform: translateX(0); }
          to   { transform: translateX(100%); }
        }
        .btn-don-cta {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          width: 100%; padding: 1.25rem 2rem;
          background: ${C.greenDeep}; color: #fff;
          border-radius: 1rem; font-size: 1.05rem; font-weight: 700;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 8px 32px rgba(19,61,32,0.3);
          transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s;
          font-family: inherit;
        }
        .btn-don-cta::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(110deg, transparent 20%, rgba(255,255,255,0.14) 50%, transparent 80%);
          background-size: 200% 100%;
          animation: don-shimmer 3.2s infinite;
        }
        .btn-don-cta:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 16px 40px rgba(19,61,32,0.35);
        }
        .amount-card {
          padding: 1.3rem 1rem;
          border-radius: 1rem;
          cursor: pointer;
          text-align: center;
          position: relative;
          overflow: visible;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1),
                      box-shadow 0.3s ease,
                      background 0.22s ease,
                      border-color 0.22s ease;
        }
        .amount-card:hover:not(.amount-card-active) {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 10px 28px rgba(19,61,32,0.14);
        }
        .amount-card-active {
          transform: translateY(-5px) scale(1.03);
          box-shadow: 0 14px 36px rgba(19,61,32,0.22);
          animation: donPulse 2s ease-in-out;
        }
        .frequency-toggle {
          display: inline-flex;
          background: ${C.sandMid};
          border-radius: 999px;
          padding: 4px;
          border: 1px solid ${C.sandDark};
          position: relative;
          cursor: pointer;
          user-select: none;
        }
        .frequency-option {
          padding: 0.5rem 1.4rem;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: color 0.25s;
          position: relative; z-index: 2;
          cursor: pointer;
          border: none;
          background: none;
          font-family: inherit;
        }
        .freq-slider {
          position: absolute;
          top: 4px; bottom: 4px;
          border-radius: 999px;
          background: ${C.greenDeep};
          box-shadow: 0 4px 12px rgba(19,61,32,0.3);
          transition: left 0.32s cubic-bezier(0.16,1,0.3,1), right 0.32s cubic-bezier(0.16,1,0.3,1);
          z-index: 1;
        }
        .impact-card {
          border-radius: 1.25rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, ${C.greenDeep}08, ${C.green}12);
          border: 1.5px solid ${C.green}25;
          transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
          animation: testimonialFade 0.4s cubic-bezier(0.16,1,0.3,1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .btn-don-cta::after { animation: none; }
          .btn-don-cta:hover, .amount-card:hover { transform: none; }
          .amount-card-active { transform: none; animation: none; }
          .freq-slider { transition: none; }
        }
      `}</style>

      {/* ══ 1. HERO ══════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', minHeight: '100vh', minHeight: '100svh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(8rem,14vw,11rem) 1.5rem clamp(4rem,8vw,6rem)',
        overflow: 'hidden', textAlign: 'center',
        background: '#1a0d00',
      }}>
        {/* Image de fond pleine qualité */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img aria-hidden="true" src="/don-hero.png?v=3" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
        {/* Overlay léger — juste pour la lisibilité du texte blanc */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.18) 50%, rgba(0,0,0,0.42) 100%)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 3, maxWidth: 720 }}>
          <div style={{ fontSize: '0.63rem', letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,210,120,0.9)', fontWeight: 500, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(255,210,120,0.6)' }} />
            Association Palmeraies Tighremt
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(255,210,120,0.6)' }} />
          </div>

          <h1 style={{ fontFamily: FONT.alt, fontSize: 'clamp(3rem, 8vw, 5.5rem)', fontWeight: 300, lineHeight: 1.05, color: '#fff', letterSpacing: '-0.02em', marginBottom: '1.25rem', textShadow: '0 2px 40px rgba(0,0,0,0.4)' }}>
            Votre geste<br />
            <em style={{ fontWeight: 400, color: 'rgba(255,235,160,1)' }}>change une vie</em>
          </h1>

          <div style={{ width: 56, height: 1.5, background: 'rgba(255,210,120,0.7)', margin: '0 auto 1.5rem' }} />

          {/* Testimonial auto-rotate */}
          <div key={activeTestimonial} style={{ animation: 'testimonialFade 0.6s ease both', marginBottom: '2.5rem' }}>
            <p style={{ fontFamily: FONT.alt, fontSize: 'clamp(1rem,2vw,1.25rem)', color: 'rgba(255,255,255,0.78)', lineHeight: 1.8, fontWeight: 300, fontStyle: 'italic', maxWidth: 540, margin: '0 auto' }}>
              &ldquo;{TEMOIGNAGES[activeTestimonial].text}&rdquo;
            </p>
            <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'rgba(255,210,120,0.7)', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <User size={12} color="rgba(255,210,120,0.7)" strokeWidth={1.8} />
              {TEMOIGNAGES[activeTestimonial].auteur} · {TEMOIGNAGES[activeTestimonial].lieu}
            </div>
          </div>

          <a href="#don-form" className="btn-micro" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2.5rem', background: '#fff', color: C.ochreDark, borderRadius: 999, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,0.25)' }}>
            <Heart size={18} /> Faire un don
          </a>
        </div>

        <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', color: 'rgba(255,255,255,0.35)', zIndex: 2 }}>
          <span style={{ fontSize: '0.54rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Défiler</span>
          <ChevronDown size={12} />
        </div>
      </section>
      <SectionDivider />

      {/* ══ 2. COUNTERS ══════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(3rem,6vw,4.5rem) 1.5rem', borderBottom: `1px solid ${C.sandDark}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
          {STATS.map(s => <CounterItem key={s.label} stat={s} />)}
        </div>
      </section>

      {/* ══ 2b. DONATION PROGRESS ════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 1.5rem 0' }}>
        <DonationProgress />
      </div>

      {/* ══ 3. DON FORM ══════════════════════════════════════════ */}
      <section id="don-form" style={{ background: C.sand, padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.63rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem' }}>
              <span style={{ width: 22, height: 1.5, background: C.ochre, display: 'block' }} />
              Votre contribution
              <span style={{ width: 22, height: 1.5, background: C.ochre, display: 'block' }} />
            </div>
            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.9rem,5vw,3rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.1, marginBottom: '1.75rem' }}>
              Choisissez votre contribution
            </h2>

            {/* Frequency toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem' }}>
              <div className="frequency-toggle" style={{ position: 'relative' }} onClick={() => setMonthly(m => !m)}>
                {/* Sliding pill */}
                <div className="freq-slider" style={{
                  left: monthly ? 'calc(50% - 2px)' : '4px',
                  width: 'calc(50% - 2px)',
                }} />
                <button className="frequency-option" style={{ color: !monthly ? '#fff' : C.inkMuted }}>
                  Ponctuel
                </button>
                <button className="frequency-option" style={{ color: monthly ? '#fff' : C.inkMuted, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Repeat size={13} /> Mensuel
                </button>
              </div>
              {monthly && (
                <div style={{ fontSize: '0.75rem', color: C.green, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.3rem', animation: 'testimonialFade 0.3s ease both' }}>
                  <TrendingUp size={13} /> Impact multiplié × 12 sur l&apos;année
                </div>
              )}
            </div>
          </div>

          {/* Amount grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem', marginBottom: '1.5rem' }}>
            {AMOUNTS.map((a, i) => {
              const active = a.free ? selected === 0 : selected === a.value;
              return (
                <div
                  key={i}
                  onClick={() => setSelected(a.free ? 0 : a.value)}
                  className={`amount-card${active ? ' amount-card-active' : ''}`}
                  style={{
                    border: `2px solid ${active ? a.color : C.sandDark}`,
                    background: active ? a.color : '#fff',
                    position: 'relative',
                  }}
                >
                  {/* Featured badge */}
                  {a.featured && !active && (
                    <div style={{
                      position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                      background: C.ochre, color: '#fff', fontSize: '0.58rem',
                      fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '2px 10px', borderRadius: 999,
                      whiteSpace: 'nowrap', boxShadow: `0 3px 10px ${C.ochre}50`,
                    }}>
                      ⭐ Populaire
                    </div>
                  )}

                  {/* Icon */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.18)' : `${a.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${active ? 'rgba(255,255,255,0.3)' : a.color + '30'}` }}>
                      <a.Icon size={17} color={active ? '#fff' : a.color} strokeWidth={1.8} />
                    </div>
                  </div>

                  {a.free ? (
                    <>
                      <div style={{ fontFamily: FONT.alt, fontSize: '1.3rem', fontWeight: 600, color: active ? '#fff' : C.greenDeep, marginBottom: '0.4rem' }}>Libre</div>
                      {active ? (
                        <input type="number" min="1" placeholder="Montant €" value={freeAmount} onChange={e => setFreeAmount(e.target.value)} onClick={e => e.stopPropagation()} autoComplete="off" inputMode="numeric"
                          aria-label="Montant du don en euros"
                          style={{ width: '100%', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 6, padding: '0.35rem 0.5rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.15)', color: '#fff', textAlign: 'center', outline: 'none', fontFamily: 'inherit' }}
                          onFocus={e => { e.currentTarget.style.outline = '2px solid rgba(255,255,255,0.7)'; e.currentTarget.style.outlineOffset = '2px'; }}
                          onBlur={e => { e.currentTarget.style.outline = 'none'; }}
                        />
                      ) : (
                        <div style={{ fontSize: '0.7rem', color: C.inkMuted, lineHeight: 1.4 }}>Votre montant</div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.25rem,2.5vw,1.6rem)', fontWeight: 600, color: active ? '#fff' : C.greenDeep, marginBottom: '0.3rem', lineHeight: 1 }}>
                        {a.label}{monthly ? '/mois' : ''}
                      </div>
                      <div style={{ fontSize: '0.68rem', lineHeight: 1.45, color: active ? 'rgba(255,255,255,0.82)' : C.inkMuted }}>
                        {monthly ? a.impactMonthly : a.impact}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Impact preview card */}
          {selected !== 0 && (
            <div key={`${selected}-${monthly}`} className="impact-card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '0.75rem', background: `${selectedAmountData.color}18`, border: `1.5px solid ${selectedAmountData.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <selectedAmountData.Icon size={22} color={selectedAmountData.color} strokeWidth={1.8} />
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: selectedAmountData.color, fontWeight: 700, marginBottom: '0.3rem' }}>
                    Impact de votre don {monthly ? 'mensuel' : ''}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: C.greenDeep, fontWeight: 500, lineHeight: 1.5 }}>
                    {monthly ? selectedAmountData.impactMonthly : selectedAmountData.impact}
                  </div>
                  {monthly && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: C.green, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Zap size={12} /> Soit <strong style={{ fontWeight: 700 }}>{(selected * 12).toLocaleString('fr-FR')} € par an</strong> pour Tighremt
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Main CTA */}
          <a href={donUrl} target="_blank" rel="noopener noreferrer" className="btn-don-cta">
            <Heart size={20} />
            {displayAmount
              ? `Faire un don ${monthly ? 'mensuel' : ''} de ${displayAmount} €`
              : 'Faire un don →'}
          </a>
          <p style={{ textAlign: 'center', marginTop: '0.9rem', fontSize: '0.72rem', color: C.inkLight, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <ShieldCheck size={13} color={C.green} strokeWidth={2} />
            HelloAsso · Paiement 100% sécurisé · 0% de commission
          </p>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 4. MODES ══════════════════════════════════════════════ */}
      <section style={{ background: C.sandMid, padding: 'clamp(3.5rem,7vw,5rem) 1.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.7rem,4vw,2.6rem)', fontWeight: 400, color: C.greenDeep }}>
              Autres façons de contribuer
            </h2>
          </div>
          <div style={{ maxWidth: 520, margin: '0 auto 1.5rem', background: '#f0ead8', borderRadius: 16, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <QRCodeSVG value="mailto:palmeraies.tighremt.tata@gmail.com" size={100} bgColor="transparent" fgColor="#133d20" />
            <div>
              <p style={{ fontWeight: 600, color: C.ink, marginBottom: '0.25rem' }}>Virement bancaire</p>
              <p style={{ fontSize: '0.85rem', color: C.inkMuted, lineHeight: 1.6 }}>Scannez le QR code ou contactez-nous<br/>pour obtenir nos coordonnées bancaires.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { Icon: CreditCard, title: 'Don en ligne (HelloAsso)', desc: '100% sécurisé · 0% de commission · reçu fiscal automatique', cta: 'Donner maintenant →', href: HELLOASSO, ext: true, color: C.green },
              { Icon: Mail, title: 'Virement ou chèque', desc: "Contactez-nous pour les coordonnées bancaires de l'association", cta: 'palmeraies.tighremt.tata@gmail.com', href: 'mailto:palmeraies.tighremt.tata@gmail.com', ext: false, color: C.ochre },
              { Icon: HandHelping, title: 'Devenir bénévole', desc: 'Médecins, ingénieurs, enseignants — chaque compétence compte', cta: 'Rejoindre l\'équipe →', href: '/contact', ext: false, color: C.greenDeep },
            ].map((m, i) => (
              <a key={i} href={m.href} {...(m.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="card-premium"
                aria-label={m.href.startsWith('mailto:') ? `Envoyer un email à ${m.href.replace('mailto:', '')}` : m.title}
                style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.4rem 1.6rem', background: '#fff', borderRadius: '1rem', border: `1px solid ${C.sandDark}`, textDecoration: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 48, height: 48, borderRadius: '0.875rem', background: `${m.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${m.color}25` }}>
                  <m.Icon size={22} color={m.color} strokeWidth={1.6} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.greenDeep, fontSize: '0.95rem', marginBottom: '0.2rem' }}>{m.title}</div>
                  <div style={{ fontSize: '0.8rem', color: C.inkMuted, lineHeight: 1.5 }}>{m.desc}</div>
                </div>
                <span style={{ fontSize: '0.78rem', color: m.color, fontWeight: 600, flexShrink: 0, whiteSpace: 'nowrap', paddingLeft: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  {m.cta} <ArrowRight size={13} />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 5. TRANSPARENCY ══════════════════════════════════════ */}
      <section ref={barsRef} style={{ background: '#fff', padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.63rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.85rem' }}>Transparence financière</div>
            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.7rem,4vw,2.8rem)', fontWeight: 400, color: C.greenDeep, marginBottom: '0.75rem' }}>
              Où va votre don ?
            </h2>
            <p style={{ color: C.inkMuted, fontSize: '0.88rem', maxWidth: 420, margin: '0 auto', lineHeight: 1.7 }}>
              L&apos;association publie ses comptes chaque année. Voici la répartition indicative de vos dons.
            </p>
          </div>
          {TRANSPARENCY.map((item, i) => <ProgressBar key={item.label} item={item} inView={barsIn} delay={i * 220} index={i} />)}

          {/* Trust badges */}
          <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            {['Association loi 1901', 'À but non lucratif', 'Don déductible des impôts*', 'Comptes publiés annuellement'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: C.inkMuted, background: C.sandMid, padding: '0.4rem 0.875rem', borderRadius: 999, border: `1px solid ${C.sandDark}` }}>
                <Check size={12} color={C.green} strokeWidth={2.5} /> {t}
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.64rem', color: C.inkLight }}>
            * Sous réserve des conditions légales en vigueur
          </div>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 6. URGENCY BANNER ════════════════════════════════════ */}
      <section style={{ background: C.greenDeep, padding: 'clamp(3.5rem,7vw,5rem) 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <p style={{ fontFamily: FONT.alt, fontStyle: 'italic', fontSize: 'clamp(1.1rem,2.5vw,1.5rem)', color: 'rgba(255,255,255,0.65)', marginBottom: '1rem', fontWeight: 300 }}>
            La palmeraie de Tighremt a besoin de vous aujourd&apos;hui.
          </p>
          <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 400, color: '#fff', lineHeight: 1.15, marginBottom: '2.25rem' }}>
            Ensemble, préservons<br />
            <em style={{ fontWeight: 400, color: C.ochre }}>un héritage vivant</em>
          </h2>
          <a href={HELLOASSO} target="_blank" rel="noopener noreferrer" className="btn-micro"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1rem 2.5rem', background: C.ochre, color: '#fff', borderRadius: 999, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: `0 6px 24px ${C.ochre}50` }}>
            <Heart size={17} /> Faire un don maintenant
          </a>
        </div>
      </section>
    </div>
  );
}
