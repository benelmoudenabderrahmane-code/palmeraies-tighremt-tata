'use client';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const MEMBRES = [
  { name: 'Mohamed TAHAR',            role: 'Président',       avatar: 'https://i.pravatar.cc/150?u=tahar' },
  { name: 'Lahoucine AÏT EL JAMAR',  role: 'Vice Président',  avatar: 'https://i.pravatar.cc/150?u=aitjamar' },
  { name: 'Abderrahmane BEN MANSOUR', role: 'Trésorier',       avatar: 'https://i.pravatar.cc/150?u=benmansour1' },
  { name: 'Lahoucine BEN MANSOUR',    role: 'Vice Trésorier',  avatar: 'https://i.pravatar.cc/150?u=benmansour2' },
  { name: 'Omar BOUBKER',             role: 'Secrétaire',      avatar: 'https://i.pravatar.cc/150?u=boubker' },
  { name: 'Lahoucine BEN LMOUDEN',    role: 'Vice secrétaire', avatar: 'https://i.pravatar.cc/150?u=benlmouden' },
];

export default function EquipeContent() {
  useScrollReveal();
  return (
    <section id="equipe" style={{ background: C.sand, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 'clamp(3rem,6vw,5rem)' }}>
          <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.ochre, fontWeight: 500, marginBottom: '1rem' }}>
            Les personnes derrière l&apos;association
          </div>
          <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem, 4.5vw, 3.2rem)', fontWeight: 400, color: C.greenDeep, lineHeight: 1.15 }}>
            Notre <em>équipe</em>
          </h1>
          <p className="reveal reveal-delay-2" style={{ color: C.inkMuted, fontSize: '0.95rem', marginTop: '1rem', maxWidth: 480, margin: '1rem auto 0', lineHeight: 1.7, fontWeight: 300 }}>
            Des bénévoles engagés, unis par l&apos;amour de Tighremt et la volonté d&apos;agir.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {MEMBRES.map((m, i) => (
            <div key={m.name} className={`reveal reveal-delay-${(i % 4) + 1}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem', background: C.sandMid, borderRadius: '1.5rem', border: `1px solid ${C.sandDark}`, transition: 'transform 0.3s, box-shadow 0.3s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(19,61,32,0.1)'; }}
              onMouseOut={e  => { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = ''; }}
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
