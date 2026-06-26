'use client';
import { useState } from 'react';
import {
  Leaf, Droplets, GraduationCap, Heart, Shield, Users,
  TreePine, MapPin, Calendar, ArrowRight, Sprout, Home,
  BookOpen, Handshake, Star, CheckCircle,
} from 'lucide-react';
import { MaskedAvatars } from '@/components/ui/masked-avatars';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import SectionDivider from '@/components/ui/SectionDivider';

const TEAM_AVATARS = [
  { name: 'Mohamed TAHAR',            gradient: `linear-gradient(135deg, ${C.greenDeep}, ${C.green})` },
  { name: 'Lahoucine AÏT EL JAMAR',   gradient: `linear-gradient(135deg, ${C.green}, ${C.greenMid})` },
  { name: 'Abderrahmane BEN MANSOUR', gradient: `linear-gradient(135deg, ${C.ochre}, ${C.accent})` },
  { name: 'Lahoucine BEN MANSOUR',    gradient: `linear-gradient(135deg, ${C.accentDark}, ${C.ochre})` },
  { name: 'Omar BOUBKER',             gradient: `linear-gradient(135deg, ${C.greenMid}, ${C.green})` },
  { name: 'Lahoucine BEN LMOUDEN',    gradient: `linear-gradient(135deg, #5c5848, #8a8270)` },
];

const MISSIONS = [
  {
    Icon: TreePine,
    color: C.green,
    bg: `${C.green}12`,
    border: `${C.green}28`,
    titre: 'Environnement & Palmeraie',
    desc: 'Replantation de palmiers dattiers, restauration des canaux d\'irrigation foggara et lutte contre la désertification pour préserver l\'écosystème oasien de Tighremt.',
    points: ['1 200 palmiers replantés', '4 ha de surface restaurée', '800 m de haies brise-vent'],
  },
  {
    Icon: GraduationCap,
    color: C.greenMid,
    bg: `${C.greenMid}12`,
    border: `${C.greenMid}28`,
    titre: 'Éducation & Enfance',
    desc: 'Rénovation des structures scolaires, fourniture de matériel pédagogique et création de bibliothèques pour offrir aux enfants du douar un accès équitable à l\'éducation.',
    points: ['2 crèches rénovées', '80+ enfants bénéficiaires', 'Salle informatique & bibliothèque'],
  },
  {
    Icon: Home,
    color: C.ochre,
    bg: `${C.ochre}12`,
    border: `${C.ochre}28`,
    titre: 'Infrastructure locale',
    desc: 'Consolidation du pont de Tighremt, construction de vestiaires sportifs et amélioration des équipements collectifs pour sécuriser et moderniser le quotidien des habitants.',
    points: ['Pont consolidé — 4 piliers', 'Vestiaire terrain de football', 'Clôture du cimetière de Sidi Brahim'],
  },
  {
    Icon: Heart,
    color: C.accent,
    bg: `${C.accent}12`,
    border: `${C.accent}28`,
    titre: 'Aide humanitaire',
    desc: 'Distributions alimentaires régulières (farine, huile, sucre, légumineuses) et de couvertures aux foyers les plus vulnérables, identifiés en lien avec les élus locaux.',
    points: ['120 foyers aidés / an', '5 distributions annuelles', '3 tonnes de denrées livrées'],
  },
  {
    Icon: Shield,
    color: C.greenDeep,
    bg: `${C.greenDeep}12`,
    border: `${C.greenDeep}28`,
    titre: 'Patrimoine & Mémoire',
    desc: 'Inventaire numérique des ksour, greniers collectifs et gravures rupestres. Ateliers intergénérationnels de transmission des savoir-faire amazighs et restauration du patrimoine bâti.',
    points: ['40+ sites inventoriés', '1 grenier restauré', '200 h de témoignages'],
  },
  {
    Icon: Droplets,
    color: C.water,
    bg: `${C.water}16`,
    border: `${C.water}30`,
    titre: 'Eau & Irrigation',
    desc: 'Remise en état des canaux foggara traditionnels et suivi scientifique des ressources en eau pour garantir l\'irrigation des cultures et la survie de l\'oasis.',
    points: ['12 hectares irrigués', 'Canaux foggara restaurés', 'Suivi hydrologique continu'],
  },
];

const VALEURS = [
  { Icon: MapPin,    color: C.green,    titre: 'Ancrage territorial', desc: 'Chaque décision est prise depuis Tighremt, pour Tighremt.' },
  { Icon: Handshake, color: C.greenDeep, titre: 'Bénévolat total',    desc: 'Tous les membres donnent leur temps sans aucune contrepartie.' },
  { Icon: Star,      color: C.ochre,    titre: 'Transparence',         desc: 'Comptes publiés annuellement, actions documentées, portes ouvertes.' },
  { Icon: Sprout,    color: C.greenMid, titre: 'Long terme',           desc: 'Pas de projets one-shot : nous construisons pour les générations futures.' },
];

const TIMELINE = [
  { year: '2010', title: 'Fondation', desc: "Création de l'association loi 1901 par des membres de la diaspora tighrémtoise établis en France." },
  { year: '2010', title: 'Premiers travaux', desc: "Consolidation du pont de Tighremt — premier projet structurant pour le douar." },
  { year: '2017', title: 'Dignité mémorielle', desc: "Érection de la clôture du cimetière de Sidi Brahim pour protéger les sépultures." },
  { year: '2018', title: 'Sport & jeunesse', desc: "Construction du vestiaire du terrain de football Sidi Brahim, entièrement bénévole." },
  { year: '2020', title: 'Aide humanitaire', desc: "Lancement des distributions alimentaires régulières, renforcées pendant la pandémie." },
  { year: '2022', title: 'Palmeraie vivante', desc: "Démarrage du programme de replantation intensive — 1 200 palmiers en trois ans." },
  { year: '2023', title: 'Anti-désertification', desc: "Haies brise-vent, fascines de palmes et parcelles pilotes de surveillance végétale." },
  { year: '2024', title: 'Patrimoine digital', desc: "Inventaire numérique de 40+ sites patrimoniaux, ateliers de transmission amazighe." },
];

function StatCounter({ value, suffix, label, color }) {
  const { ref, display } = useAnimatedCounter(value, 0, 1600);
  return (
    <div ref={ref} style={{ textAlign: 'center', padding: '0.5rem' }}>
      <div style={{ fontFamily: FONT.alt, fontSize: 'clamp(2.2rem,4.5vw,3rem)', fontWeight: 600, color: color || C.greenDeep, lineHeight: 1 }}>
        <span>{display}</span>{suffix}
      </div>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.ochre, marginTop: '0.5rem', fontWeight: 500, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

function MissionCard({ m, index }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`reveal reveal-delay-${(index % 3) + 1}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '1.5rem',
        padding: '2rem 1.75rem',
        border: `1.5px solid ${hovered ? m.color + '55' : C.sandDark}`,
        boxShadow: hovered
          ? `0 20px 48px rgba(0,0,0,0.1), 0 0 0 4px ${m.color}14`
          : '0 2px 12px rgba(0,0,0,0.05)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div style={{
        width: 52, height: 52,
        borderRadius: '1rem',
        background: m.bg,
        border: `1.5px solid ${m.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1.25rem',
        transition: 'transform 0.3s ease',
        transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1) rotate(0)',
      }}>
        <m.Icon size={24} color={m.color} strokeWidth={1.6} />
      </div>

      <h3 style={{
        fontFamily: FONT.alt,
        fontSize: '1.2rem', fontWeight: 600,
        color: C.greenDeep, marginBottom: '0.75rem',
        lineHeight: 1.3,
      }}>
        {m.titre}
      </h3>

      <p style={{
        fontSize: '0.85rem', color: C.inkMuted,
        lineHeight: 1.75, fontWeight: 300,
        marginBottom: '1.25rem',
      }}>
        {m.desc}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {m.points.map(pt => (
          <div key={pt} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={13} color={m.color} strokeWidth={2} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: C.ink, fontWeight: 500 }}>{pt}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MissionContent() {
  useScrollReveal();

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: C.sand }}>
      {/* ══ 1. HERO ══════════════════════════════════════════════════════════ */}
      <section style={{ background: C.greenDeep, color: '#fff', minHeight: 'clamp(280px,38vh,380px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{
            fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(196,169,107,0.9)', marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}>
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
            Notre mission
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
          </p>
          <h1 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300, lineHeight: 1.1 }}>
            Préserver un <em style={{ fontStyle: 'italic' }}>héritage vivant</em>
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7, maxWidth: 520, margin: '0.75rem auto 0' }}>
            Association loi 1901 fondée en 2010, agissant pour Tighremt à travers six axes : environnement, éducation, infrastructure, humanitaire, patrimoine et eau.
          </p>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 2. ORIGINE & CONTEXTE ═══════════════════════════════════════════ */}
      <section id="mission" style={{ background: C.sand, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,480px),1fr))', gap: 'clamp(3rem,6vw,6rem)', alignItems: 'center' }}>

          <div className="reveal-left">
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ width: 28, height: 1, background: C.ochre, display: 'block' }} />
              Origine & Contexte
            </div>

            <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, lineHeight: 1.12, color: C.greenDeep, marginBottom: '1.5rem' }}>
              Une mission née<br />de <em>l&apos;amour de la terre</em>
            </h2>

            <div style={{ width: 56, height: 2, background: `linear-gradient(to right, ${C.ochre}, transparent)`, marginBottom: '2rem' }} />

            <p className="reveal reveal-delay-1" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1rem', fontWeight: 300, marginBottom: '1.25rem' }}>
              Tighremt est un petit douar de la province de Tata, au cœur du Souss-Massa, dans le sud du Maroc. Enclavée entre les contreforts de l&apos;Anti-Atlas et les premiers regs sahariens, la région est l&apos;une des plus arides du royaume — les précipitations y dépassent rarement 80 mm par an.
            </p>
            <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1rem', fontWeight: 300, marginBottom: '1.25rem' }}>
              La palmeraie de Tighremt, symbole vivant d&apos;identité et de résilience, comptait autrefois des milliers de dattiers irrigués par un réseau de canaux foggara. L&apos;exode rural et la sécheresse cronique ont fragilisé cet équilibre millénaire.
            </p>
            <p className="reveal reveal-delay-3" style={{ color: C.inkMuted, lineHeight: 1.9, fontSize: '1rem', fontWeight: 300 }}>
              C&apos;est face à cette réalité que des membres de la communauté tighrémtoise établis en France ont décidé d&apos;agir — en créant en mars 2010 l&apos;association <strong style={{ color: C.greenDeep, fontWeight: 600 }}>Palmeraies Tighremt Tata</strong>, association à but non lucratif régie par la loi 1901.
            </p>

            <div className="reveal reveal-delay-4" style={{ marginTop: '2rem', padding: '1.5rem 1.75rem', background: C.sandMid, borderLeft: `4px solid ${C.ochre}`, borderRadius: '0 1rem 1rem 0' }}>
              <div style={{ fontFamily: FONT.alt, fontSize: '1.12rem', fontStyle: 'italic', color: C.green, lineHeight: 1.6 }}>
                &quot;La ville de Tata reste majestueuse et accueillante — ses habitants se contentent du peu que leur procure la nature, sachant que tout reste à faire pour s&apos;atteler au train du développement.&quot;
              </div>
              <div style={{ fontSize: '0.75rem', color: C.ochre, fontWeight: 600, letterSpacing: '0.08em', marginTop: '0.75rem', textTransform: 'uppercase' }}>
                Humanitaire · Échanges culturels · Maroc
              </div>
            </div>

            <div className="reveal reveal-delay-4" style={{ marginTop: '2.5rem' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkLight, fontWeight: 500, marginBottom: '1rem' }}>
                Notre équipe de bénévoles
              </div>
              <MaskedAvatars avatars={TEAM_AVATARS} size={56} border={6} column={32} label="membres du bureau" />
            </div>
          </div>

          <div className="reveal-right reveal-delay-2" style={{ position: 'relative' }}>
            <div style={{
              position: 'relative', borderRadius: '2rem', overflow: 'hidden', aspectRatio: '4/5',
            }}>
              <img
                src="/images/tighremt/palmeraie-ksar.jpg"
                alt="Palmeraie de Tighremt"
                width="900" height="1125"
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=900&q=75&auto=format&fit=crop'; }}
              />
              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${C.greenDeep}55 0%, transparent 55%)` }} />
            </div>

            {/* Floating badge */}
            <div style={{ position: 'absolute', bottom: '-1.5rem', left: '-1.5rem', background: C.ochre, color: '#fff', borderRadius: '1.25rem', padding: '1.25rem 1.5rem', boxShadow: '0 12px 32px rgba(164,84,40,0.35)' }}>
              <div style={{ fontFamily: FONT.alt, fontSize: '2.25rem', fontWeight: 600, lineHeight: 1 }}>2010</div>
              <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginTop: '0.3rem' }}>Fondée en</div>
            </div>

            {/* Leaf accent */}
            <div style={{ position: 'absolute', top: '-1.25rem', right: '-1.25rem', width: 64, height: 64, borderRadius: '50%', background: C.sandDark, border: `4px solid ${C.sand}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf size={22} color={C.green} />
            </div>

            {/* Location chip */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)', borderRadius: 999, padding: '0.4rem 0.875rem', fontSize: '0.72rem', fontWeight: 600, color: C.greenDeep }}>
              <MapPin size={12} color={C.green} strokeWidth={2} /> Tighremt, Province de Tata
            </div>
          </div>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 3. NOS 6 MISSIONS ═══════════════════════════════════════════════ */}
      <section style={{ background: C.sandMid, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
            <div className="reveal" style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.75rem' }}>Nos axes d&apos;action</div>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.9rem,4vw,3rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
              Six missions pour <em>un village</em>
            </h2>
            <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, fontSize: '0.95rem', maxWidth: 520, margin: '1rem auto 0', lineHeight: 1.75, fontWeight: 300 }}>
              Chaque projet est pensé pour répondre à un besoin concret identifié par les habitants, les élus locaux et nos membres bénévoles sur le terrain.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: '1.25rem' }}>
            {MISSIONS.map((m, i) => <MissionCard key={m.titre} m={m} index={i} />)}
          </div>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 4. TIMELINE ════════════════════════════════════════════════════ */}
      <section style={{ background: '#fff', padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
            <div className="reveal" style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.75rem' }}>Depuis 2010</div>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.9rem,4vw,3rem)', fontWeight: 400, color: C.greenDeep }}>
              Notre <em>parcours</em>
            </h2>
          </div>

          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 'clamp(24px, 4vw, 40px)', top: 0, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.green}40, ${C.ochre}60, ${C.green}40)`, borderRadius: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {TIMELINE.map((item, i) => (
                <div key={i} className={`reveal reveal-delay-${(i % 4) + 1}`} style={{ display: 'flex', gap: 'clamp(1.5rem,4vw,3rem)', alignItems: 'flex-start', paddingLeft: 'clamp(16px,2vw,24px)', paddingBottom: '2rem' }}>
                  {/* Dot */}
                  <div style={{ flexShrink: 0, width: 'clamp(32px,4vw,48px)', height: 'clamp(32px,4vw,48px)', borderRadius: '50%', background: i % 2 === 0 ? C.green : C.ochre, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px ${i % 2 === 0 ? C.green : C.ochre}50`, zIndex: 1 }}>
                    <Calendar size={14} color="#fff" strokeWidth={2} />
                  </div>
                  {/* Content */}
                  <div style={{ paddingTop: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: FONT.alt, fontSize: '1.6rem', fontWeight: 700, color: i % 2 === 0 ? C.green : C.ochre, lineHeight: 1 }}>{item.year}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem', color: C.greenDeep }}>{item.title}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.7, fontWeight: 300 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 5. VALEURS ═════════════════════════════════════════════════════ */}
      <section style={{ background: C.sand, padding: 'clamp(5rem,10vw,8rem) 1.5rem' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2.5rem,5vw,4rem)' }}>
            <div className="reveal" style={{ fontSize: '0.65rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 600, marginBottom: '0.75rem' }}>Ce qui nous unit</div>
            <h2 className="reveal reveal-delay-1" style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.9rem,4vw,3rem)', fontWeight: 400, color: C.greenDeep }}>
              Nos <em>valeurs</em> fondatrices
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {VALEURS.map((v, i) => (
              <div key={v.titre} className={`reveal reveal-delay-${i + 1} card-premium`} style={{ background: '#fff', borderRadius: '1.25rem', padding: '2rem 1.75rem', border: `1px solid ${C.sandDark}` }}>
                <div style={{ width: 48, height: 48, borderRadius: '1rem', background: `${v.color}12`, border: `1.5px solid ${v.color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <v.Icon size={22} color={v.color} strokeWidth={1.6} />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: C.greenDeep, marginBottom: '0.6rem' }}>{v.titre}</div>
                <div style={{ fontSize: '0.85rem', color: C.inkMuted, lineHeight: 1.7, fontWeight: 300 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SectionDivider />

      {/* ══ 6. COMPTEURS ═══════════════════════════════════════════════════ */}
      <section style={{ background: C.greenDeep, width: '100%' }}>
        <div className="reveal" style={{
          maxWidth: 1100, margin: '0 auto',
          padding: 'clamp(2.5rem,5vw,4rem) clamp(1.5rem,4vw,3rem)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px,1fr))',
          gap: '1.5rem',
        }}>
          <StatCounter value={1200} suffix="+"  label="Palmiers préservés"   color="#fff" />
          <StatCounter value={120}  suffix=""   label="Foyers aidés / an"    color="#fff" />
          <StatCounter value={14}   suffix=""   label="Années d'action"      color="#fff" />
          <StatCounter value={6}    suffix=""   label="Projets réalisés"     color="#fff" />
          <StatCounter value={80}   suffix="+"  label="Enfants bénéficiaires" color="#fff" />
          <StatCounter value={12}   suffix=""   label="Hectares irrigués"    color="#fff" />
        </div>
      </section>

      {/* ══ 7. CTA ═════════════════════════════════════════════════════════ */}
      <section style={{ background: C.greenDeep, padding: 'clamp(4rem,8vw,6rem) 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }} />
        <div className="reveal" style={{ maxWidth: 640, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <p style={{ fontFamily: FONT.alt, fontStyle: 'italic', fontSize: 'clamp(1.05rem,2vw,1.35rem)', color: 'rgba(255,255,255,0.6)', marginBottom: '0.75rem', fontWeight: 300 }}>
            Agir ensemble pour un territoire vivant
          </p>
          <h2 style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 400, color: '#fff', lineHeight: 1.15, marginBottom: '2rem' }}>
            Rejoignez notre mission ou<br />
            <em style={{ color: C.ochre }}>soutenez nos projets</em>
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            <a href="/don" className="btn-micro" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.25rem', background: C.ochre, color: '#fff', borderRadius: 999, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: `0 6px 24px ${C.ochre}50` }}>
              <Heart size={16} /> Faire un don
            </a>
            <a href="/projets" className="btn-micro" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2.25rem', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: 999, fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none', backdropFilter: 'blur(8px)' }}>
              Voir les projets <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
