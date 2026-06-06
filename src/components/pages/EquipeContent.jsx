'use client';
import { Mail, Users, Crown, Wallet, FileText, ArrowRight, TreePine, Handshake, Lightbulb, Sprout, Star } from 'lucide-react';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import TeamTestimonialCarousel from '@/components/ui/TeamTestimonialCarousel';
import { TextEffect } from '@/components/ui/TextEffect';
import SectionDivider from '@/components/ui/SectionDivider';

/* ─── Team data ──────────────────────────────────────────────── */
const MEMBRES = [
  {
    name: 'Mohamed TAHAR',
    role: 'Président',
    roleColor: C.greenDeep,
    RoleIcon: Crown,
    bio: "Pilote la vision stratégique et coordonne l'ensemble des actions de l'association.",
    skills: ['Gouvernance', 'Stratégie', 'Relations institutionnelles'],
    gradient: `linear-gradient(135deg, ${C.greenDeep}, ${C.green})`,
  },
  {
    name: 'Lahoucine AÏT EL JAMAR',
    role: 'Vice-Président',
    roleColor: C.green,
    RoleIcon: Star,
    bio: "Assiste le président et supervise les opérations sur le terrain à Tighremt.",
    skills: ['Opérations terrain', 'Coordination', 'Logistique'],
    gradient: `linear-gradient(135deg, ${C.green}, ${C.greenMid})`,
  },
  {
    name: 'Abderrahmane BEN MANSOUR',
    role: 'Trésorier',
    roleColor: C.ochre,
    RoleIcon: Wallet,
    bio: "Gère les finances de l'association avec rigueur et transparence totale.",
    skills: ['Finance', 'Comptabilité', 'Transparence'],
    gradient: `linear-gradient(135deg, ${C.ochre}, ${C.accent})`,
  },
  {
    name: 'Lahoucine BEN MANSOUR',
    role: 'Vice-Trésorier',
    roleColor: C.accentDark,
    RoleIcon: Wallet,
    bio: "Seconde le trésorier et assure le suivi des dépenses et recettes.",
    skills: ['Suivi financier', 'Audit', 'Reporting'],
    gradient: `linear-gradient(135deg, ${C.accentDark}, ${C.ochre})`,
  },
  {
    name: 'Omar BOUBKER',
    role: 'Secrétaire',
    roleColor: C.greenMid,
    RoleIcon: FileText,
    bio: "Rédige les comptes rendus et assure la communication officielle de l'association.",
    skills: ['Communication', 'Documentation', 'Organisation'],
    gradient: `linear-gradient(135deg, ${C.greenMid}, ${C.green})`,
  },
  {
    name: 'Lahoucine BEN LMOUDEN',
    role: 'Vice-Secrétaire',
    roleColor: C.inkMuted,
    RoleIcon: FileText,
    bio: "Appuie le secrétaire dans la gestion administrative et la mémoire associative.",
    skills: ['Administration', 'Archives', 'Suivi des membres'],
    gradient: `linear-gradient(135deg, #5c5848, #8a8270)`,
  },
];

const VALEURS = [
  { Icon: TreePine,   color: C.green,     titre: 'Ancrage territorial', desc: 'Chaque action est pensée depuis Tighremt, pour Tighremt.' },
  { Icon: Handshake,  color: C.greenDeep, titre: 'Bénévolat total',     desc: 'Tous nos membres donnent leur temps sans contrepartie.' },
  { Icon: Lightbulb,  color: C.ochre,     titre: 'Transparence',         desc: 'Comptes publiés, actions documentées, portes ouvertes.' },
  { Icon: Sprout,     color: C.greenMid,  titre: 'Long terme',           desc: "Pas de projets one-shot : on construit pour les générations suivantes." },
];

/* ─── Main export ────────────────────────────────────────────── */
export default function EquipeContent() {
  useScrollReveal();

  return (
    <>
      <style>{`
        @keyframes duneDriftA { from { transform: translateX(0); }      to { transform: translateX(-80px); } }
        @keyframes duneDriftB { from { transform: translateX(-40px); }  to { transform: translateX(40px); } }
        @keyframes duneDriftC { from { transform: translateX(30px); }   to { transform: translateX(-50px); } }
        .dune-a { animation: duneDriftA 22s ease-in-out infinite alternate; }
        .dune-b { animation: duneDriftB 28s ease-in-out infinite alternate; }
        .dune-c { animation: duneDriftC 34s ease-in-out infinite alternate; }
        .team-carousel-track::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(168deg, #0a2814 0%, ${C.greenDeep} 52%, ${C.green} 100%)`,
        padding: 'clamp(8rem,14vw,11rem) 1.5rem clamp(5rem,9vw,7rem)',
        textAlign: 'center',
      }}>
        {/* Lignes de dunes ondulantes (motif désert / oasis) */}
        <svg aria-hidden="true" viewBox="0 0 1440 600" preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, width: '120%', height: '100%', left: '-10%', pointerEvents: 'none', opacity: 0.5 }}>
          <g className="dune-a" fill="none" stroke={C.gold} strokeWidth="1.1" opacity="0.55">
            <path d="M-100,180 C260,90 540,250 820,170 C1080,100 1320,210 1640,140" />
            <path d="M-100,230 C260,140 540,300 820,220 C1080,150 1320,260 1640,190" />
          </g>
          <g className="dune-b" fill="none" stroke={C.gold} strokeWidth="1" opacity="0.4">
            <path d="M-100,340 C300,260 560,420 860,330 C1120,255 1340,380 1640,300" />
            <path d="M-100,390 C300,310 560,470 860,380 C1120,305 1340,430 1640,350" />
          </g>
          <g className="dune-c" fill="none" stroke={C.greenMid} strokeWidth="1.4" opacity="0.5">
            <path d="M-100,490 C320,420 600,560 900,470 C1160,395 1380,510 1640,440" />
          </g>
        </svg>

        {/* Filigrane éditorial : 06 (nombre de membres) */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          fontFamily: FONT.alt, fontSize: 'clamp(16rem,38vw,32rem)',
          fontWeight: 500, color: 'rgba(196,169,107,0.06)', lineHeight: 1, pointerEvents: 'none',
          userSelect: 'none', whiteSpace: 'nowrap',
        }}>
          06
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, margin: '0 auto' }}>
          <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: '1.25rem' }}>
            <span style={{ width: 28, height: 1.5, background: `${C.gold}99`, display: 'block' }} />
            Les personnes derrière l&apos;association
            <span style={{ width: 28, height: 1.5, background: `${C.gold}99`, display: 'block' }} />
          </div>

          <h1 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(2.6rem, 6.5vw, 4.4rem)', fontWeight: 300, lineHeight: 1.06, color: '#fff', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Notre <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,245,210,1)' }}>équipe</em> bénévole
          </h1>

          <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(0.9rem,1.5vw,1.05rem)', lineHeight: 1.8, fontWeight: 300, maxWidth: 520, margin: '0 auto 2.5rem' }}>
            Six bénévoles passionnés, unis par l&apos;amour de Tighremt et la volonté d&apos;agir pour préserver un patrimoine vivant.
          </p>

          {/* Stats — rangée éditoriale, filets dorés (sans glassmorphism) */}
          <div className="reveal reveal-delay-3" style={{ display: 'inline-flex', alignItems: 'center', gap: 'clamp(1.5rem,4vw,3rem)' }}>
            {[{ n: '6', l: 'Membres' }, { n: '14', l: 'Années' }, { n: '100%', l: 'Bénévoles' }].map(({ n, l }, i) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 'clamp(1.5rem,4vw,3rem)' }}>
                {i > 0 && <span style={{ width: 1, height: 38, background: `${C.gold}44`, display: 'block' }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.9rem,3vw,2.4rem)', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{n}</div>
                  <div style={{ fontSize: '0.62rem', color: C.gold, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: '0.35rem', fontWeight: 500 }}>{l}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══ TEAM CAROUSEL (cartes dépliables) ════════════════════ */}
      <section style={{ background: C.sand, padding: 'clamp(4rem,8vw,6rem) 0 clamp(3rem,6vw,4rem)' }}>
        <div style={{ textAlign: 'center', padding: '0 1.5rem', maxWidth: 700, margin: '0 auto' }}>
          <div className="reveal" style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.75rem' }}>
            Les six bénévoles
          </div>
          <TextEffect
            as="h2"
            preset="blur"
            per="word"
            delay={0.1}
            className=""
            style={{
              fontFamily: FONT.alt,
              fontSize: 'clamp(1.8rem,4vw,2.8rem)',
              fontWeight: 400, color: C.greenDeep,
              marginBottom: '1rem',
            }}
          >
            Notre équipe en détail
          </TextEffect>
          <p className="reveal reveal-delay-1" style={{ fontSize: '0.9rem', color: C.inkMuted, lineHeight: 1.7, fontWeight: 300 }}>
            Cliquez sur une carte pour découvrir le rôle et le parcours de chaque membre.
          </p>
        </div>
        <TeamTestimonialCarousel members={MEMBRES} />
      </section>

      {/* ══ VALEURS ══════════════════════════════════════════════ */}
      <section style={{ background: C.sandMid, padding: 'clamp(4rem,8vw,6rem) 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
            <div className="reveal" style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.75rem' }}>Ce qui nous unit</div>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, color: C.greenDeep }}>
              Nos <em>valeurs</em> communes
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {VALEURS.map((v, i) => (
              <div key={v.titre} className={`reveal reveal-delay-${i + 1} card-premium`} style={{
                background: '#fff', borderRadius: '1.25rem', padding: '1.75rem 1.5rem',
                border: `1px solid ${C.sandDark}`,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: '0.875rem', background: `${v.color}14`, border: `1.5px solid ${v.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <v.Icon size={22} color={v.color} strokeWidth={1.6} />
              </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: C.greenDeep, marginBottom: '0.5rem' }}>{v.titre}</div>
                <div style={{ fontSize: '0.83rem', color: C.inkMuted, lineHeight: 1.65, fontWeight: 300 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ══ JOIN CTA ══════════════════════════════════════════════ */}
      <section style={{ background: C.greenDeep, padding: 'clamp(4rem,8vw,6rem) 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }} />
        <div className="reveal" style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <Users size={28} color="rgba(255,255,255,0.85)" strokeWidth={1.5} />
          </div>
          <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, color: '#fff', marginBottom: '1rem', lineHeight: 1.2 }}>
            Rejoignez notre équipe
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.95rem', lineHeight: 1.75, fontWeight: 300, marginBottom: '2rem', maxWidth: 480, margin: '0 auto 2rem' }}>
            Ingénieurs, médecins, enseignants, artisans — toutes les compétences sont les bienvenues. Chaque bénévole compte pour Tighremt.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <a href="/contact" className="btn-micro" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 2rem', background: C.ochre, color: '#fff',
              borderRadius: 999, fontWeight: 600, fontSize: '0.9rem',
              textDecoration: 'none', boxShadow: `0 6px 24px ${C.ochre}50`,
            }}>
              <Mail size={16} /> Nous contacter
            </a>
            <a href="/don" className="btn-micro" style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.875rem 2rem',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#fff', borderRadius: 999, fontWeight: 500, fontSize: '0.9rem',
              textDecoration: 'none',
              backdropFilter: 'blur(8px)',
            }}>
              Faire un don <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
