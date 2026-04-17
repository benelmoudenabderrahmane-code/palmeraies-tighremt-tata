'use client';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

export default function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Activer le mode clair' : 'Activer le mode sombre'}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(232,131,42,0.12)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'background 0.2s', flexShrink: 0,
      }}
      onMouseOver={e => (e.currentTarget.style.background = 'rgba(232,131,42,0.22)')}
      onMouseOut={e  => (e.currentTarget.style.background = 'rgba(232,131,42,0.12)')}
    >
      {dark ? <Sun size={16} color="#e8832a" /> : <Moon size={16} color="#5c5848" />}
    </button>
  );
}
