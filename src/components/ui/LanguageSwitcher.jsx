'use client';
import { useState, useEffect } from 'react';
import { C } from '@/lib/tokens';

const LANGS = [
  { code: 'fr', label: 'FR', flag: '🇫🇷', name: 'Français' },
  { code: 'en', label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'ar', label: 'AR', flag: '🇲🇦', name: 'العربية' },
];

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState('fr');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lang') || 'fr';
    setCurrent(stored);
    document.documentElement.lang = stored;
    document.documentElement.dir = stored === 'ar' ? 'rtl' : 'ltr';
  }, []);

  const select = (code) => {
    setCurrent(code);
    setOpen(false);
    localStorage.setItem('lang', code);
    document.documentElement.lang = code;
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  const cur = LANGS.find(l => l.code === current);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} aria-label={`${cur?.flag}${cur?.label} · ${cur?.name} — changer de langue`} aria-expanded={open} aria-haspopup="listbox"
        style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.6rem', borderRadius: 8, border: `1px solid ${C.sandDark}`, background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: C.inkMuted }}>
        <span>{cur?.flag}</span>
        <span>{cur?.label}</span>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.12)', overflow: 'hidden', zIndex: 999, minWidth: 130 }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => select(l.code)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem', background: l.code === current ? C.sandMid : 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: C.ink, textAlign: 'left' }}>
              <span>{l.flag}</span>
              <span>{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
