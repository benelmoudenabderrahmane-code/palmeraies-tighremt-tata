'use client';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Heart, ChevronDown, CalendarDays, FolderCheck, Users, Droplets } from 'lucide-react';
import { C } from '@/lib/tokens';

const Grainient = dynamic(() => import('@/components/ui/Grainient'), { ssr: false });

/* ── Data ────────────────────────────────────────────────────── */
const AMOUNTS = [
  { value: 10,  label: '10 €',  desc: 'Fournitures scolaires pour 1 mois' },
  { value: 25,  label: '25 €',  desc: 'Un arbre planté dans la palmeraie' },
  { value: 50,  label: '50 €',  desc: "Irrigation d'une parcelle pendant une semaine", featured: true },
  { value: 100, label: '100 €', desc: "Réhabilitation d'un canal foggara" },
  { value: 250, label: '250 €', desc: "Soutien complet d'un projet de terrain" },
  { value: 0,   label: 'Libre', desc: 'Saisissez votre montant', free: true },
];

const STATS = [
  { value: 2010, suffix: '',  label: 'Fondée',           Icon: CalendarDays, from: 2000 },
  { value: 6,    suffix: '',  label: 'Projets réalisés', Icon: FolderCheck,  from: 0 },
  { value: 150,  suffix: '+', label: 'Familles aidées',  Icon: Users,        from: 0 },
  { value: 12,   suffix: '',  label: 'Hectares irrigués',Icon: Droplets,     from: 0 },
];

const MODES = [
  {
    icon: '💳',
    title: 'Don en ligne',
    desc: 'Via HelloAsso — sécurisé, 0% de commission',
    cta: 'Faire un don maintenant →',
    href: 'https://www.helloasso.com/associations/palmeraies-tighremt-tata',
    external: true,
  },
  {
    icon: '📧',
    title: 'Don par virement ou chèque',
    desc: 'Contactez-nous pour les coordonnées bancaires',
    cta: 'palmeraies.tighremt.tata@gmail.com',
    href: 'mailto:palmeraies.tighremt.tata@gmail.com',
    external: false,
  },
  {
    icon: '🤝',
    title: 'Devenir bénévole',
    desc: 'Ingénieurs, médecins, enseignants — chaque compétence compte',
    cta: 'Nous contacter →',
    href: '/contact',
    external: false,
  },
];

const TRANSPARENCY = [
  { label: 'Projets terrain',         pct: 75, color: C.green },
  { label: 'Frais de fonctionnement', pct: 15, color: C.ochre },
  { label: 'Communication',           pct: 10, color: C.greenMid },
];

const HELLOASSO = 'https://www.helloasso.com/associations/palmeraies-tighremt-tata';

/* ── Counter sub-component ───────────────────────────────────── */
function CounterItem({ stat, inView }) {
  const [count, setCount] = useState(stat.from);
  const started = useRef(false);

  useEffect(() => {
    if (!inView || started.current) return;
    started.current = true;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(stat.value);
      return;
    }
    const duration = stat.value > 100 ? 2000 : 1600;
    const range = stat.value - stat.from;
    let startTime = null;
    const animate = ts => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(stat.from + eased * range));
      if (p < 1) requestAnimationFrame(animate);
      else setCount(stat.value);
    };
    requestAnimationFrame(animate);
  }, [inView, stat]);

  const { Icon } = stat;
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${C.green}22, ${C.greenDeep}18)`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1.5px solid ${C.green}30` }}>
          <Icon size={22} color={C.green} strokeWidth={1.6} />
        </div>
      </div>
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
        fontWeight: 600, color: C.greenDeep, lineHeight: 1,
      }}>
        {count}{stat.suffix}
      </div>
      <div style={{
        fontSize: '0.72rem', fontWeight: 600, color: C.inkMuted,
        marginTop: '0.5rem', letterSpacing: '0.1em', textTransform: 'uppercase',
      }}>
        {stat.label}
      </div>
    </div>
  );
}

/* ── Progress bar sub-component ─────────────────────────────── */
function ProgressBar({ item, inView, delay = 0 }) {
  return (
    <div style={{ marginBottom: '1.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'baseline' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 500, color: C.ink }}>{item.label}</span>
        <span style={{ fontSize: '0.95rem', fontWeight: 700, color: item.color, fontFamily: 'Cormorant Garamond, serif' }}>{item.pct}%</span>
      </div>
      <div style={{ height: 10, background: C.sandDark, borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: inView ? `${item.pct}%` : '0%',
          background: `linear-gradient(to right, ${item.color}, ${item.color}bb)`,
          borderRadius: 999,
          transition: inView
            ? `width 1.4s cubic-bezier(0.16,1,0.3,1) ${delay}ms`
            : 'none',
        }} />
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────── */
export default function DonContent() {
  const [selected, setSelected]     = useState(50);
  const [freeAmount, setFreeAmount] = useState('');
  const [countersIn, setCountersIn] = useState(false);
  const [barsIn, setBarsIn]         = useState(false);
  const countersRef = useRef(null);
  const barsRef     = useRef(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      setCountersIn(true); setBarsIn(true); return;
    }
    const opt = (fn, ref, threshold = 0.25) => {
      const io = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) { fn(true); io.disconnect(); }
      }, { threshold });
      if (ref.current) io.observe(ref.current);
      return io;
    };
    const io1 = opt(setCountersIn, countersRef);
    const io2 = opt(setBarsIn, barsRef);
    return () => { io1.disconnect(); io2.disconnect(); };
  }, []);

  const displayAmount = selected === 0
    ? (parseInt(freeAmount) > 0 ? parseInt(freeAmount) : null)
    : selected;

  return (
    <div style={{ background: C.sand }}>

      {/* ════════════════════════════════ 1. HERO ══════════════════ */}
      <section style={{
        position: 'relative',
        minHeight: '100vh', minHeight: '100svh',
        display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center',
        padding: 'clamp(8rem,14vw,11rem) 1.5rem clamp(4rem,8vw,6rem)',
        overflow: 'hidden', textAlign: 'center',
      }}>
        <Grainient
          color1="#FFD080" color2="#C96818" color3="#3D1A04"
          timeSpeed={0.18} warpStrength={0.8} warpFrequency={4.0}
          warpAmplitude={60} grainAmount={0.06} contrast={1.4}
          saturation={1.1} zoom={0.85}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(10,5,0,0.32)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720 }}>
          <div style={{
            fontSize: '0.63rem', letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,210,120,0.9)', fontWeight: 500, marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}>
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(255,210,120,0.6)' }} />
            Association Palmeraies Tighremt
            <span style={{ display: 'block', width: 28, height: 1, background: 'rgba(255,210,120,0.6)' }} />
          </div>

          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            fontWeight: 300, lineHeight: 1.05, color: '#fff',
            letterSpacing: '-0.02em', marginBottom: '1.5rem',
            textShadow: '0 2px 40px rgba(0,0,0,0.4)',
          }}>
            Votre geste<br />
            <em style={{ fontWeight: 400, fontStyle: 'italic', color: 'rgba(255,235,160,1)' }}>change une vie</em>
          </h1>

          <div style={{ width: 56, height: 1.5, background: 'rgba(255,210,120,0.7)', margin: '0 auto 1.75rem' }} />

          <p style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.05rem, 2vw, 1.3rem)',
            color: 'rgba(255,255,255,0.8)', lineHeight: 1.8,
            fontWeight: 300, fontStyle: 'italic',
            maxWidth: 560, margin: '0 auto 2.5rem',
          }}>
            Chaque don, aussi petit soit-il, contribue directement à préserver la palmeraie
            ancestrale de Tighremt et soutenir ses habitants.
          </p>

          <a href="#don-form" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '1rem 2.5rem', background: '#fff',
            color: C.ochreDark, borderRadius: 999, fontWeight: 700,
            fontSize: '0.95rem', textDecoration: 'none',
            boxShadow: '0 8px 28px rgba(0,0,0,0.25)',
            transition: 'transform 0.25s, box-shadow 0.25s',
          }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.3)'; }}
            onMouseOut={e  => { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.25)'; }}>
            <Heart size={18} />
            Faire un don
          </a>
        </div>

        <div style={{
          position: 'absolute', bottom: '2rem', left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
          color: 'rgba(255,255,255,0.35)', zIndex: 2,
        }}>
          <span style={{ fontSize: '0.54rem', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Défiler</span>
          <ChevronDown size={12} />
        </div>
      </section>

      {/* ════════════════════════════════ 2. COUNTERS ══════════════ */}
      <section ref={countersRef} style={{ background: '#fff', padding: 'clamp(3rem,6vw,4.5rem) 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.5rem',
          }}>
            {STATS.map(s => (
              <CounterItem key={s.label} stat={s} inView={countersIn} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ 3. AMOUNT SELECTOR ═══════ */}
      <style>{`
        .amounts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.875rem;
          margin-bottom: 2rem;
        }
        @media (max-width: 580px) {
          .amounts-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 340px) {
          .amounts-grid { grid-template-columns: 1fr; }
        }
        @keyframes don-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .btn-don-cta {
          position: relative; overflow: hidden;
          display: flex; align-items: center; justify-content: center; gap: 0.75rem;
          width: 100%; padding: 1.2rem 2rem;
          background: ${C.greenDeep}; color: #fff;
          border-radius: 1rem; font-size: 1.1rem; font-weight: 700;
          text-decoration: none; border: none; cursor: pointer;
          box-shadow: 0 6px 28px rgba(19,61,32,0.28);
          transition: transform 0.25s, box-shadow 0.25s;
          font-family: inherit;
        }
        .btn-don-cta::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(110deg,
            transparent 20%, rgba(255,255,255,0.14) 50%, transparent 80%);
          background-size: 200% 100%;
          animation: don-shimmer 3.2s infinite;
        }
        .btn-don-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 36px rgba(19,61,32,0.32); }
        @media (prefers-reduced-motion: reduce) {
          .btn-don-cta::after { animation: none; }
          .btn-don-cta:hover  { transform: none; }
        }
      `}</style>

      <section id="don-form" style={{
        background: C.sand,
        padding: 'clamp(4rem,8vw,6rem) 1.5rem',
      }}>
        <div style={{ maxWidth: 840, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
            <div style={{
              fontSize: '0.63rem', letterSpacing: '0.25em', textTransform: 'uppercase',
              color: C.ochre, fontWeight: 600, marginBottom: '0.85rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
            }}>
              <span style={{ width: 22, height: 1.5, background: C.ochre, display: 'block' }} />
              Votre contribution
              <span style={{ width: 22, height: 1.5, background: C.ochre, display: 'block' }} />
            </div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.9rem, 5vw, 3rem)',
              fontWeight: 400, color: C.greenDeep, lineHeight: 1.1, marginBottom: '0.75rem',
            }}>
              Choisissez votre contribution
            </h2>
            <p style={{ color: C.inkMuted, fontSize: '0.9rem', maxWidth: 440, margin: '0 auto' }}>
              Sélectionnez un montant ou saisissez le vôtre.
            </p>
          </div>

          {/* Amount cards */}
          <div className="amounts-grid">
            {AMOUNTS.map((a, i) => {
              const active = a.free ? selected === 0 : selected === a.value;
              return (
                <div
                  key={i}
                  onClick={() => setSelected(a.free ? 0 : a.value)}
                  style={{
                    padding: '1.4rem 1rem',
                    borderRadius: '0.875rem',
                    border: `1.5px solid ${active ? C.greenDeep : 'rgba(19,61,32,0.14)'}`,
                    background: active ? C.greenDeep : '#fff',
                    cursor: 'pointer', textAlign: 'center',
                    transition: 'transform 0.2s, box-shadow 0.2s, background 0.18s, border-color 0.18s',
                    boxShadow: active ? '0 8px 30px rgba(19,61,32,0.22)' : '0 2px 10px rgba(0,0,0,0.05)',
                    transform: active ? 'translateY(-4px)' : 'none',
                    animationDelay: `${i * 80}ms`,
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!active) {
                      e.currentTarget.style.transform   = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow   = '0 8px 22px rgba(19,61,32,0.13)';
                      e.currentTarget.style.borderColor = C.green;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!active) {
                      e.currentTarget.style.transform   = 'none';
                      e.currentTarget.style.boxShadow   = '0 2px 10px rgba(0,0,0,0.05)';
                      e.currentTarget.style.borderColor = 'rgba(19,61,32,0.14)';
                    }
                  }}
                >
                  {a.free ? (
                    <>
                      <div style={{
                        fontSize: '1.35rem', fontFamily: 'Cormorant Garamond, serif',
                        fontWeight: 600, color: active ? '#fff' : C.greenDeep,
                        marginBottom: '0.5rem',
                      }}>Libre</div>
                      {active ? (
                        <input
                          type="number" min="1" placeholder="Montant en €"
                          value={freeAmount}
                          onChange={e => setFreeAmount(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          autoComplete="off"
                          inputMode="numeric"
                          style={{
                            width: '100%', border: '1px solid rgba(255,255,255,0.35)',
                            borderRadius: 6, padding: '0.4rem 0.5rem', fontSize: '0.88rem',
                            background: 'rgba(255,255,255,0.12)', color: '#fff',
                            textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                          }}
                        />
                      ) : (
                        <div style={{ fontSize: '0.72rem', color: C.inkMuted, lineHeight: 1.4 }}>
                          Saisissez votre montant
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div style={{
                        fontSize: 'clamp(1.3rem, 2.8vw, 1.7rem)',
                        fontFamily: 'Cormorant Garamond, serif',
                        fontWeight: 600, color: active ? '#fff' : C.greenDeep,
                        marginBottom: '0.4rem', lineHeight: 1,
                      }}>
                        {a.label}
                      </div>
                      <div style={{
                        fontSize: '0.72rem', lineHeight: 1.45,
                        color: active ? 'rgba(255,255,255,0.72)' : C.inkMuted,
                      }}>
                        {a.desc}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Main CTA */}
          <a
            href={HELLOASSO}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-don-cta"
          >
            <Heart size={20} />
            {displayAmount
              ? `Faire un don de ${displayAmount} € →`
              : 'Faire un don →'}
          </a>
          <p style={{
            textAlign: 'center', marginTop: '0.9rem',
            fontSize: '0.75rem', color: C.inkLight,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            <span>🔒</span> HelloAsso · Paiement sécurisé · 0% de commission
          </p>
        </div>
      </section>

      {/* ════════════════════════════════ 4. ALTERNATIVE MODES ═════ */}
      <section style={{ background: C.sandMid, padding: 'clamp(3.5rem,7vw,5rem) 1.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.7rem, 4vw, 2.6rem)',
              fontWeight: 400, color: C.greenDeep,
            }}>
              Autres façons de contribuer
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {MODES.map((m, i) => (
              <a
                key={i}
                href={m.href}
                {...(m.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{
                  display: 'flex', alignItems: 'center', gap: '1.25rem',
                  padding: '1.4rem 1.6rem', background: '#fff',
                  borderRadius: '1rem', border: '1px solid rgba(19,61,32,0.08)',
                  textDecoration: 'none',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(19,61,32,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; }}
              >
                <span style={{ fontSize: '2rem', flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: C.greenDeep, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
                    {m.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: C.inkMuted, lineHeight: 1.5 }}>
                    {m.desc}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.8rem', color: C.ochre, fontWeight: 600,
                  flexShrink: 0, whiteSpace: 'nowrap', paddingLeft: '0.75rem',
                }}>
                  {m.cta}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ 5. TRANSPARENCY ══════════ */}
      <section ref={barsRef} style={{ background: '#fff', padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              fontSize: '0.63rem', letterSpacing: '0.25em', textTransform: 'uppercase',
              color: C.ochre, fontWeight: 600, marginBottom: '0.85rem',
            }}>Transparence</div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(1.7rem, 4vw, 2.8rem)',
              fontWeight: 400, color: C.greenDeep, marginBottom: '0.75rem',
            }}>
              Où va votre don ?
            </h2>
            <p style={{
              color: C.inkMuted, fontSize: '0.88rem',
              maxWidth: 420, margin: '0 auto', lineHeight: 1.7,
            }}>
              L'association publie ses comptes chaque année. Voici la répartition indicative.
            </p>
          </div>
          {TRANSPARENCY.map((item, i) => (
            <ProgressBar key={item.label} item={item} inView={barsIn} delay={i * 200} />
          ))}
        </div>
      </section>

      {/* ════════════════════════════════ 6. TESTIMONIAL ═══════════ */}
      <section style={{
        background: C.sandMid, padding: 'clamp(4rem,8vw,6rem) 1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-1rem', left: '1.5rem',
          fontFamily: 'Georgia, serif', fontSize: '9rem',
          color: C.greenMid, opacity: 0.1, lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
        }}>"</div>

        <div style={{ maxWidth: 660, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <blockquote style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.25rem, 3vw, 1.8rem)',
            fontWeight: 300, fontStyle: 'italic',
            color: C.greenDeep, lineHeight: 1.65, marginBottom: '2rem',
          }}>
            "La palmeraie est notre héritage, notre identité, notre futur.
            Grâce à l'association, nous pouvons transmettre ce trésor aux générations à venir."
          </blockquote>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.85rem' }}>
            <div style={{
              width: 50, height: 50, borderRadius: '50%',
              background: `linear-gradient(135deg, ${C.green}, ${C.greenDeep})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}><Users size={22} color="#fff" strokeWidth={1.5} /></div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: C.greenDeep }}>
                Un habitant de Tighremt
              </div>
              <div style={{ fontSize: '0.75rem', color: C.inkMuted }}>Province de Tata, Maroc</div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ 7. URGENCY BANNER ════════ */}
      <section style={{
        background: C.greenDeep, padding: 'clamp(3.5rem,7vw,5rem) 1.5rem',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
          <p style={{
            fontFamily: 'Cormorant Garamond, serif', fontStyle: 'italic',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
            color: 'rgba(255,255,255,0.65)', marginBottom: '1rem', fontWeight: 300,
          }}>
            La palmeraie de Tighremt a besoin de vous aujourd'hui.
          </p>
          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(1.8rem, 5vw, 3rem)',
            fontWeight: 400, color: '#fff', lineHeight: 1.15, marginBottom: '2.25rem',
          }}>
            Ensemble, préservons<br />
            <em style={{ fontWeight: 400, color: C.ochre }}>un héritage vivant</em>
          </h2>
          <a
            href={HELLOASSO}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
              padding: '1rem 2.5rem', background: C.ochre,
              color: '#fff', borderRadius: 999, fontWeight: 700,
              fontSize: '0.95rem', textDecoration: 'none',
              transition: 'transform 0.25s, background 0.2s',
              boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = C.accentDark; }}
            onMouseOut={e  => { e.currentTarget.style.transform = '';                 e.currentTarget.style.background = C.ochre; }}
          >
            <Heart size={17} />
            Faire un don maintenant
          </a>
          <div style={{ marginTop: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
            {['Association loi 1901', 'À but non lucratif', 'Don déductible des impôts*'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ color: C.ochre }}>✓</span> {t}
              </span>
            ))}
          </div>
          <div style={{ marginTop: '0.6rem', fontSize: '0.65rem', color: 'rgba(255,255,255,0.28)' }}>
            * Sous réserve des conditions légales en vigueur
          </div>
        </div>
      </section>

    </div>
  );
}
