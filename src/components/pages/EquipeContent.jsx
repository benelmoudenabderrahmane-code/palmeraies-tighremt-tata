'use client';
import { Mail, Users, Leaf, Crown, Wallet, FileText, ArrowRight, TreePine, Handshake, Lightbulb, Sprout, Star } from 'lucide-react';
import { C } from '@/lib/tokens';
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
        @keyframes equipeFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50%       { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes equipeOrb {
          0%, 100% { transform: scale(1) translate(0,0); opacity: 0.35; }
          33%       { transform: scale(1.18) translate(20px,-15px); opacity: 0.5; }
          66%       { transform: scale(0.92) translate(-15px,10px); opacity: 0.28; }
        }
        .equipe-hero-leaf { animation: equipeFloat 6s ease-in-out infinite; }
        .equipe-orb-1     { animation: equipeOrb  9s ease-in-out infinite; }
        .equipe-orb-2     { animation: equipeOrb 12s ease-in-out infinite reverse; }
        .team-carousel-track::-webkit-scrollbar { display: none; }
      `}</style>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(155deg, ${C.greenDeep} 0%, ${C.green} 50%, #0a2814 100%)`,
        padding: 'clamp(8rem,14vw,11rem) 1.5rem clamp(5rem,9vw,7rem)',
        textAlign: 'center',
      }}>
        {/* Orbs */}
        <div className="equipe-orb-1" style={{ position: 'absolute', top: '10%', left: '8%', width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${C.greenMid}60 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div className="equipe-orb-2" style={{ position: 'absolute', bottom: '5%', right: '5%', width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${C.ochre}30 0%, transparent 70%)`, pointerEvents: 'none' }} />

        {/* Floating leaf */}
        <div className="equipe-hero-leaf" style={{ position: 'absolute', top: '20%', right: '12%', opacity: 0.15, pointerEvents: 'none' }}>
          <Leaf size={80} color="#fff" strokeWidth={1} />
        </div>

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 700, margin: '0 auto' }}>
          <div className="reveal" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.65rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(232,163,80,0.9)', fontWeight: 600, marginBottom: '1.25rem' }}>
            <span style={{ width: 28, height: 1.5, background: 'rgba(232,163,80,0.6)', display: 'block' }} />
            Les personnes derrière l&apos;association
            <span style={{ width: 28, height: 1.5, background: 'rgba(232,163,80,0.6)', display: 'block' }} />
          </div>

          <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 300, lineHeight: 1.08, color: '#fff', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
            Notre <em style={{ fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,245,210,1)' }}>équipe</em> bénévole
          </h1>

          <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.62)', fontSize: 'clamp(0.9rem,1.5vw,1.05rem)', lineHeight: 1.8, fontWeight: 300, maxWidth: 520, margin: '0 auto 2.5rem' }}>
            Six bénévoles passionnés, unis par l&apos;amour de Tighremt et la volonté d&apos;agir pour préserver un patrimoine vivant.
          </p>

          {/* Stats mini-bar */}
          <div className="reveal reveal-delay-3" style={{ display: 'inline-flex', gap: '2rem', background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', borderRadius: '2rem', padding: '1rem 2rem', border: '1px solid rgba(255,255,255,0.12)' }}>
            {[{ n: '6', l: 'Membres' }, { n: '14', l: 'Années' }, { n: '100%', l: 'Bénévoles' }].map(({ n, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '0.25rem' }}>{l}</div>
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
              fontFamily: 'Cormorant Garamond, serif',
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
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, color: C.greenDeep }}>
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
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400, color: '#fff', marginBottom: '1rem', lineHeight: 1.2 }}>
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
