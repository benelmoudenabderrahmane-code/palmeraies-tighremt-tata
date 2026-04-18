'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import actualites from '@/data/actualites.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CATEGORIES = ['tous', 'projets', 'association', 'evenements'];

export default function ActualitesContent() {
  useScrollReveal();
  const [cat, setCat] = useState('tous');
  const filtered = cat === 'tous' ? actualites : actualites.filter(a => a.categorie === cat);

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Actualités</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600, lineHeight: 1.15 }}>
            Toutes nos nouvelles
          </h1>
          <p style={{ marginTop: '1rem', opacity: 0.75, fontSize: '1rem', lineHeight: 1.7 }}>
            Suivez l&apos;avancement de nos projets et la vie de l&apos;association.
          </p>
        </div>
      </section>

      <section style={{ background: C.sandMid, padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{
            padding: '0.45rem 1.1rem', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize',
            background: cat === c ? C.greenDeep : 'transparent',
            color: cat === c ? '#fff' : C.inkMuted,
            outline: cat === c ? 'none' : `1px solid ${C.sandDark}`,
            transition: 'all 0.2s',
          }}>{c === 'tous' ? 'Tous' : c === 'evenements' ? 'Événements' : c.charAt(0).toUpperCase() + c.slice(1)}</button>
        ))}
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {filtered.map((article, i) => (
            <article key={article.id} className={`reveal reveal-delay-${(i % 3) + 1} card-premium`}
              style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 20px rgba(0,0,0,0.07)' }}>
              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }} className="img-zoom-wrap">
                <Image src={article.image} alt={article.titre} fill style={{ objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', background: C.sandMid, color: C.ochre, padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Tag size={10} />{article.categorie}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: C.inkLight, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, marginBottom: '0.6rem', color: C.ink }}>{article.titre}</h2>
                <p style={{ fontSize: '0.87rem', color: C.inkMuted, lineHeight: 1.7, marginBottom: '1.2rem' }}>{article.extrait}</p>
                <Link href={`/actualites/${article.id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: C.ochre, textDecoration: 'none' }}>
                  Lire la suite <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
