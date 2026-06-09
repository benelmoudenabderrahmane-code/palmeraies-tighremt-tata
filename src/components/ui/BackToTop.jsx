'use client';
import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Retour en haut de la page"
      style={{
        position: 'fixed', bottom: 'calc(9.5rem + env(safe-area-inset-bottom))', right: '1.35rem', zIndex: 200,
        width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(19,61,32,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)', transition: 'opacity 0.3s, transform 0.3s',
      }}
    >
      <ChevronUp size={18} color="#faf7f0" />
    </button>
  );
}
