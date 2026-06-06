'use client';
import Image from 'next/image';
import partenaires from '@/data/partenaires.json';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';

export default function PartenairesContent() {
  useScrollReveal();
  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Réseau</p>
          <h1 style={{ fontFamily: FONT.alt, fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Nos partenaires</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Ensemble pour Tighremt.</p>
        </div>
      </section>
      <SectionDivider />
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
          {partenaires.map((p, i) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
              className={`reveal reveal-delay-${(i % 4) + 1} card-premium`}
              style={{ background: '#fff', borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', textDecoration: 'none', display: 'block' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', background: C.sandMid }}>
                <Image src={p.logo} alt={p.nom} width={80} height={80} priority={i < 3} style={{ objectFit: 'cover', width: '80px', height: '80px', display: 'block' }} onError={() => {}} />
              </div>
              <h2 style={{ fontFamily: FONT.alt, fontSize: '1.15rem', fontWeight: 600, color: C.ink, marginBottom: '0.4rem' }}>{p.nom}</h2>
              <p style={{ fontSize: '0.84rem', color: C.inkMuted }}>{p.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
