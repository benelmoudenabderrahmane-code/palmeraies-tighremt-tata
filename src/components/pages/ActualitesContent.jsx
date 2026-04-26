'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import actualites from '@/data/actualites.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const CATEGORIES = ['tous', 'projets', 'association', 'evenements'];
const CAT_LABELS  = { tous: 'Tous', projets: 'Projets', association: 'Association', evenements: 'Événements' };

export default function ActualitesContent() {
  useScrollReveal();
  const [cat, setCat]           = useState('tous');
  const filtered                = cat === 'tous' ? actualites : actualites.filter(a => a.categorie === cat);
  const [featured, ...rest]     = filtered;

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: '#f5f0e8' }}>

      {/* ── Hero vert ── */}
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{
            fontSize: '0.68rem', letterSpacing: '0.28em', textTransform: 'uppercase',
            color: 'rgba(196,169,107,0.9)', marginBottom: '0.75rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
          }}>
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
            Actualités
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
          </p>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300, lineHeight: 1.1,
          }}>
            Toutes nos nouvelles
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7 }}>
            Suivez l&apos;avancement de nos projets et la vie de l&apos;association.
          </p>
        </div>
      </section>

      {/* ── Filtres — text-links petites caps ── */}
      <div style={{
        background: '#f5f0e8', padding: '1.75rem 1.5rem 0',
        display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
              color:        cat === c ? C.greenDeep : C.inkLight,
              borderBottom: cat === c ? `1.5px solid ${C.greenDeep}` : '1.5px solid transparent',
              paddingBottom: '0.25rem',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* ── Contenu ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* Article vedette full-bleed 16:7 */}
        {featured && (
          <article
            className="reveal"
            style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', marginBottom: '1.5rem', aspectRatio: '16/7', minHeight: 240 }}
          >
            <Image
              src={featured.image}
              alt={featured.titre}
              fill
              style={{ objectFit: 'cover' }}
              priority
            />
            {/* Dégradé bas vert nuit */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(19,61,32,0.88) 0%, rgba(19,61,32,0.35) 55%, transparent 100%)' }} />
            {/* Texte */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
              <p style={{
                fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(196,169,107,0.92)', marginBottom: '0.55rem', fontWeight: 500,
              }}>
                {CAT_LABELS[featured.categorie]} · {new Date(featured.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.4rem,3.5vw,2.1rem)', fontWeight: 400, color: '#fff',
                lineHeight: 1.2, maxWidth: 640, marginBottom: '1.1rem',
              }}>
                {featured.titre}
              </h2>
              <Link href={`/actualites/${featured.id}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.82)', textDecoration: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.15rem',
                transition: 'color 0.2s, border-color 0.2s',
              }}>
                Lire l&apos;article <ArrowRight size={12} />
              </Link>
            </div>
          </article>
        )}

        {/* Grille secondaire — auto-fill minmax 280px */}
        {rest.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {rest.map((article, i) => (
              <article
                key={article.id}
                className={`reveal reveal-delay-${(i % 3) + 1}`}
                style={{ background: '#fff', border: '1px solid #e0d8c8', borderRadius: 10, overflow: 'hidden' }}
              >
                <div className="actu-card-img-wrap">
                  <Image
                    src={article.image}
                    alt={article.titre}
                    width={400}
                    height={260}
                    className="actu-card-img"
                    style={{ height: 185, objectFit: 'cover' }}
                    loading="lazy"
                  />
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <p style={{
                    fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: C.ochre, marginBottom: '0.5rem', fontWeight: 500,
                  }}>
                    {CAT_LABELS[article.categorie]} · {new Date(article.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                  <h2 style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1.18rem', fontWeight: 500, lineHeight: 1.3,
                    marginBottom: '0.65rem', color: C.ink,
                  }}>
                    {article.titre}
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: C.inkMuted, lineHeight: 1.7, marginBottom: '1rem' }}>
                    {article.extrait}
                  </p>
                  <Link href={`/actualites/${article.id}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: C.greenDeep, textDecoration: 'none',
                    borderBottom: `1px solid ${C.greenDeep}`, paddingBottom: '0.1rem',
                  }}>
                    Lire la suite <ArrowRight size={12} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: C.inkMuted, padding: '4rem 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic' }}>
            Aucun article dans cette catégorie.
          </p>
        )}
      </section>
    </div>
  );
}
