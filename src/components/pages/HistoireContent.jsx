'use client';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

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

export default function HistoireContent() {
  useScrollReveal();
  return (
    <section id="histoire" style={{ background: C.sandMid, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem' }}>
            Notre Rapport
          </div>
          <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
            Le livre de notre <em>association</em>
          </h1>
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
