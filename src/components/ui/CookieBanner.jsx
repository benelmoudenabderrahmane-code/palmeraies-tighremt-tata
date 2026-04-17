'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('cookie-consent')) setShow(true);
  }, []);

  const accept = () => { localStorage.setItem('cookie-consent', 'accepted'); setShow(false); };
  const refuse = () => { localStorage.setItem('cookie-consent', 'refused');  setShow(false); };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: 'rgba(19,61,32,0.97)', backdropFilter: 'blur(10px)',
      color: 'rgba(255,255,255,0.85)', padding: '1rem 1.5rem',
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem',
      borderTop: '1px solid rgba(255,255,255,0.1)',
    }}>
      <p style={{ flex: 1, fontSize: '0.85rem', lineHeight: 1.6, minWidth: 220 }}>
        🍪 Ce site utilise des cookies pour améliorer votre expérience.{' '}
        <a href="/contact" style={{ color: '#e8832a', textDecoration: 'underline' }}>En savoir plus</a>
      </p>
      <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
        <button onClick={refuse} style={{ padding: '0.5rem 1rem', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.82rem' }}>
          Refuser
        </button>
        <button onClick={accept} style={{ padding: '0.5rem 1.2rem', borderRadius: 6, border: 'none', background: '#e8832a', color: '#fff', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
          Accepter
        </button>
        <button onClick={refuse} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
