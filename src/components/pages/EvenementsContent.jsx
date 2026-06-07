'use client';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import evenements from '@/data/evenements.json';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';

const TYPE_COLORS = { association: C.greenDeep, collecte: C.ochre, projet: C.accent };

export default function EvenementsContent() {
  useScrollReveal();
  const now = new Date();
  const upcoming = evenements.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = evenements.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

  const Card = ({ e, i }) => (
    <div className={`reveal reveal-delay-${(i % 3) + 1}`} style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', borderTop: `4px solid ${TYPE_COLORS[e.type] || C.accent}` }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', background: C.sandMid, color: TYPE_COLORS[e.type] || C.accent, padding: '0.2rem 0.7rem', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{e.type}</span>
      </div>
      <h3 style={{ fontFamily: FONT.alt, fontSize: '1.3rem', fontWeight: 600, color: C.ink, marginBottom: '0.75rem' }}>{e.titre}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
        {[
          [Calendar, new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
          [Clock, e.heure],
          [MapPin, e.lieu],
        ].map(([Icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.87rem', color: C.inkMuted }}>
            <Icon size={14} color={C.ochre} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{text}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.7, marginBottom: '1rem' }}>{e.description}</p>
      {e.lien && (
        <a href={e.lien} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: C.ochre, textDecoration: 'none' }}>
          Participer <ExternalLink size={13} />
        </a>
      )}
    </div>
  );

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Agenda</p>
          <h1 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Événements</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Retrouvez tous nos prochains rendez-vous.</p>
        </div>
      </section>
      <SectionDivider />

      {/* ── Intro contextuelle ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem 0', textAlign: 'center' }}>
        <p className="reveal" style={{ fontFamily: FONT.alt, fontSize: 'clamp(1.1rem,2vw,1.3rem)', fontWeight: 400, color: C.ink, lineHeight: 1.9, marginBottom: '1rem' }}>
          L&apos;Association Palmeraies Tighremt organise tout au long de l&apos;année des événements ouverts à ses membres, bénévoles et sympathisants. Collectes solidaires, assemblées générales, missions terrain, rencontres communautaires — chaque rendez-vous est une occasion de se retrouver, de partager et d&apos;avancer ensemble pour Tighremt.
        </p>
        <p className="reveal reveal-delay-1" style={{ fontSize: '0.92rem', color: C.inkMuted, lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
          Rejoignez-nous lors de nos prochains événements. Votre présence et votre soutien font la force de notre association. Pour être tenu informé, inscrivez-vous à notre lettre d&apos;information ou suivez-nous sur les réseaux sociaux.
        </p>
      </div>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {upcoming.length > 0 && (
          <>
            <h2 style={{ fontFamily: FONT.alt, fontSize: '1.8rem', color: C.greenDeep, marginBottom: '1.5rem' }}>À venir</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
              {upcoming.map((e, i) => <Card key={e.id} e={e} i={i} />)}
            </div>
          </>
        )}
        {past.length > 0 && (
          <>
            <h2 style={{ fontFamily: FONT.alt, fontSize: '1.8rem', color: C.inkMuted, marginBottom: '1.5rem' }}>Passés</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', opacity: 0.65 }}>
              {past.map((e, i) => <Card key={e.id} e={e} i={i} />)}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
