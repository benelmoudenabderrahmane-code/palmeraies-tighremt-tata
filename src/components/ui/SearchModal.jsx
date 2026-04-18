'use client';
import { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { search } from '@/hooks/useSearch';
import { C } from '@/lib/tokens';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const results = search(query);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,26,18,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8rem', padding: '8rem 1rem 2rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580, overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '1rem 1.25rem', borderBottom: `1px solid ${C.sandDark}`, gap: '0.75rem' }}>
          <Search size={18} color={C.inkMuted} style={{ flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher..." aria-label="Recherche"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', color: C.ink, background: 'transparent' }} />
          <button onClick={onClose} aria-label="Fermer la recherche" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={18} color={C.inkMuted} />
          </button>
        </div>
        {results.length > 0 && (
          <div>
            {results.map((r, i) => (
              <Link key={i} href={r.href} onClick={onClose}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', textDecoration: 'none', borderBottom: `1px solid ${C.sandMid}`, transition: 'background 0.15s', background: 'transparent' }}
                onMouseOver={e => (e.currentTarget.style.background = C.sandMid)}
                onMouseOut={e  => (e.currentTarget.style.background = 'transparent')}>
                <span style={{ flex: 1, fontSize: '0.93rem', color: C.ink, lineHeight: 1.4 }}>{r.label}</span>
                <ArrowRight size={14} color={C.inkLight} />
              </Link>
            ))}
          </div>
        )}
        {query.length >= 2 && results.length === 0 && (
          <div style={{ padding: '2rem', textAlign: 'center', color: C.inkMuted, fontSize: '0.9rem' }}>
            Aucun résultat pour &ldquo;{query}&rdquo;
          </div>
        )}
        {query.length < 2 && (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: C.inkLight, fontSize: '0.85rem' }}>
            Tapez au moins 2 caractères pour rechercher
          </div>
        )}
      </div>
    </div>
  );
}
