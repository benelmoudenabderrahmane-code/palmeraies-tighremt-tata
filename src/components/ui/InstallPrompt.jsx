'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { C } from '@/lib/tokens';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('pwa-dismissed')) return;
    const handler = e => { e.preventDefault(); setPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = () => { prompt?.prompt(); setShow(false); };
  const dismiss = () => { localStorage.setItem('pwa-dismissed', '1'); setShow(false); };

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9990, background: C.greenDeep, color: '#fff', borderRadius: 16, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 40px rgba(0,0,0,0.25)', maxWidth: 420, width: 'calc(100% - 2rem)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: '0.2rem' }}>Installer l&apos;application</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.75 }}>Accédez à Tighremt même hors ligne</p>
      </div>
      <button onClick={install} style={{ background: C.accent, border: 'none', color: '#fff', borderRadius: 8, padding: '0.5rem 0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.82rem', fontWeight: 600, flexShrink: 0 }}>
        <Download size={14} /> Installer
      </button>
      <button onClick={dismiss} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
        <X size={16} />
      </button>
    </div>
  );
}
