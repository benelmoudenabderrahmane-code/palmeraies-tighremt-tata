'use client';
import dynamic from 'next/dynamic';
import { Heart } from 'lucide-react';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const SoftAurora = dynamic(() => import('@/components/ui/SoftAurora'), { ssr: false });

export default function DonContent() {
  useScrollReveal();
  return (
    <section id="don" style={{ background: C.ochre, padding: 'clamp(7rem,12vw,10rem) 1.5rem clamp(5rem,10vw,8rem)', position: 'relative', overflow: 'hidden' }}>
      <SoftAurora
        color1="#f5a050"
        color2="#fcd480"
        speed={0.35}
        brightness={0.55}
        bandHeight={0.5}
        bandSpread={0.85}
        scale={1.6}
        noiseAmplitude={0.85}
        layerOffset={1.8}
        mouseInfluence={0.15}
      />
      <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />

      <div style={{ maxWidth: 780, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div className="reveal" style={{ fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)', fontWeight: 500, marginBottom: '1.5rem' }}>
          Agir maintenant · Ensemble
        </div>
        <h1 className="reveal reveal-delay-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.2rem, 6vw, 4.5rem)', fontWeight: 300, lineHeight: 1.05, color: '#fff', marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Chaque geste compte<br /><em style={{ fontWeight: 400 }}>pour Tighremt</em>
        </h1>
        <div className="reveal reveal-delay-2" style={{ width: 64, height: 2, background: 'rgba(255,255,255,0.4)', margin: '0 auto 2rem' }} />
        <p className="reveal reveal-delay-2" style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 300, fontSize: 'clamp(0.95rem, 2vw, 1.15rem)', lineHeight: 1.8, maxWidth: 480, margin: '0 auto 2.75rem' }}>
          Votre soutien finance nos actions sur le terrain et contribue directement au développement durable de la province de Tata.
        </p>
        <div className="reveal reveal-delay-3" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
          <a href="mailto:palmeraies.tighremt.tata@gmail.com"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '1.1rem 2.5rem', background: '#fff', color: C.ochreDark, borderRadius: 999, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 28px rgba(0,0,0,0.15)', transition: 'transform 0.25s, box-shadow 0.25s' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.2)'; }}
            onMouseOut={e  => { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.15)'; }}>
            <Heart size={18} />
            Soutenir nos actions par un don
          </a>
          <a href="/mission" className="btn-white-outline" style={{ padding: '1.1rem 2.5rem', borderRadius: 999, fontWeight: 500, fontSize: '0.95rem', textDecoration: 'none' }}>
            Notre mission
          </a>
        </div>
        <div className="reveal reveal-delay-4" style={{ marginTop: '3.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem', color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontWeight: 400 }}>
          {['Association loi 1901', 'À but non lucratif', 'Don déductible des impôts*'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '1rem' }}>✓</span> {t}
            </span>
          ))}
        </div>
        <div className="reveal reveal-delay-4" style={{ marginTop: '0.75rem', fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)' }}>
          * Sous réserve des conditions légales en vigueur
        </div>
      </div>
    </section>
  );
}
