'use client';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { C, FONT } from '@/lib/tokens';

export default function DonationProgress() {
  const goal    = Number(process.env.NEXT_PUBLIC_DONATION_GOAL    || 20000);
  const current = Number(process.env.NEXT_PUBLIC_DONATION_CURRENT || 12450);
  const pct     = Math.min(Math.round((current / goal) * 100), 100);

  const { ref, display } = useAnimatedCounter({ value: current, from: 0, duration: 2000 });

  return (
    <div ref={ref} style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 30px rgba(0,0,0,0.08)', maxWidth: 520, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkLight, fontWeight: 600 }}>Objectif 2025</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.greenDeep }}>{pct}%</span>
      </div>
      <div style={{ height: 10, background: C.sandMid, borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.accent})`, borderRadius: 999, transition: 'width 1.5s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontFamily: FONT.alt, fontSize: '2.2rem', fontWeight: 600, color: C.greenDeep }}>{display.toLocaleString('fr-FR')} €</span>
          <span style={{ fontSize: '0.85rem', color: C.inkMuted, marginLeft: '0.4rem' }}>collectés</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: C.inkMuted }}>{goal.toLocaleString('fr-FR')} €</span>
          <div style={{ fontSize: '0.75rem', color: C.inkLight }}>objectif annuel</div>
        </div>
      </div>
    </div>
  );
}
