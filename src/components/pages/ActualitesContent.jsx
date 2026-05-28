'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import actualites from '@/data/actualites.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';

const CATEGORIES = ['tous', 'projets', 'association', 'evenements'];
const CAT_LABELS  = { tous: 'Tous', projets: 'Projets', association: 'Association', evenements: 'Événements' };

export default function ActualitesContent() {
  useScrollReveal();
  const [cat, setCat] = useState('tous');
  const filtered      = cat === 'tous' ? actualites : actualites.filter(a => a.categorie === cat);
  const featured      = filtered[0]  ?? null;
  const rest          = filtered.slice(1);

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh', background: '#f5f0e8' }}>
      <style>{`
        /* ── Filtres : soulignement animé ── */
        .actu-filter {
          background: none; border: none; cursor: pointer;
          font-size: 0.68rem; letter-spacing: 0.22em; text-transform: uppercase;
          font-weight: 500; padding: 0 0 0.3rem;
          position: relative; transition: color 0.25s;
        }
        .actu-filter::after {
          content: '';
          position: absolute; bottom: 0; left: 0;
          width: 0; height: 1.5px;
          background: ${C.greenDeep};
          transition: width 0.38s cubic-bezier(0.16,1,0.3,1);
        }
        .actu-filter.is-active { color: ${C.greenDeep}; }
        .actu-filter.is-active::after { width: 100%; }

        /* ── Grille 2 colonnes ── */
        .actu-grid-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 600px) {
          .actu-grid-2col { grid-template-columns: 1fr; }
        }

        /* ── Image 3:2 par carte ── */
        .actu-card-ratio {
          overflow: hidden;
          aspect-ratio: 3 / 2;
        }
        .actu-card-ratio img {
          width: 100%; height: 100%; object-fit: cover; display: block;
          transition: transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .actu-card:hover .actu-card-ratio img { transform: scale(1.06); }

        /* ── Article vedette : zoom image ── */
        .actu-featured-wrap:hover .actu-vedette-img { transform: scale(1.05); }
        .actu-vedette-img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; display: block;
          transition: transform 0.72s cubic-bezier(0.16,1,0.3,1);
        }
      `}</style>

      {/* ── Hero ── */}
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
            fontSize: 'clamp(2rem,5vw,3.5rem)',
            fontWeight: 300, lineHeight: 1.1,
          }}>
            Toutes nos nouvelles
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7 }}>
            Suivez l&apos;avancement de nos projets et la vie de l&apos;association.
          </p>
        </div>
      </section>

      <SectionDivider />

      {/* ── Filtres petites-caps + soulignement animé ── */}
      <div style={{
        background: '#f5f0e8', padding: '1.75rem 1.5rem 0',
        display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`actu-filter${cat === c ? ' is-active' : ''}`}
            style={{ color: cat === c ? C.greenDeep : C.inkLight }}
          >
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>

        {/* ── Article vedette — 16:9 full-bleed ── */}
        {featured && (
          <Link
            href={`/actualites/${featured.id}`}
            className="reveal actu-featured-wrap"
            style={{
              display: 'block', textDecoration: 'none',
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              marginBottom: '1.5rem',
              aspectRatio: '16 / 9',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={featured.image}
              alt={featured.titre}
              className="actu-vedette-img"
              width={1600}
              height={900}
              loading="eager"
            />
            {/* Dégradé vert nuit vers le bas */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to top, rgba(19,61,32,0.92) 0%, rgba(19,61,32,0.4) 50%, transparent 100%)',
            }} />
            {/* Texte en surimpression */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 'clamp(1.5rem,4vw,2.5rem)' }}>
              <p style={{
                fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase',
                color: 'rgba(196,169,107,0.92)', marginBottom: '0.55rem', fontWeight: 500,
              }}>
                {CAT_LABELS[featured.categorie]}&nbsp;·&nbsp;
                {new Date(featured.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(1.6rem,3.5vw,2.2rem)',
                fontWeight: 400, color: '#fff', lineHeight: 1.2,
                maxWidth: 680, marginBottom: '1rem',
              }}>
                {featured.titre}
              </h2>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.78)',
                borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.15rem',
              }}>
                Lire l&apos;article <ArrowRight size={12} />
              </span>
            </div>
          </Link>
        )}

        {/* ── Grille 2×2 ── */}
        {rest.length > 0 && (
          <div className="actu-grid-2col">
            {rest.map((article, i) => (
              <Link
                key={article.id}
                href={`/actualites/${article.id}`}
                className={`actu-card reveal reveal-delay-${(i % 2) + 1}`}
                style={{
                  textDecoration: 'none', display: 'block',
                  background: '#fff', border: '1px solid #e0d8c8',
                  borderRadius: 10, overflow: 'hidden',
                }}
              >
                {/* Image 3:2 */}
                <div className="actu-card-ratio">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.image} alt={article.titre} width={600} height={400} loading="lazy" />
                </div>

                {/* Corps */}
                <div style={{ padding: '1.25rem 1.4rem 1.5rem' }}>
                  <p style={{
                    fontSize: '0.6rem', letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: C.ochre, marginBottom: '0.5rem', fontWeight: 500,
                  }}>
                    {new Date(article.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </p>
                  <h2 style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.3,
                    marginBottom: '0.65rem', color: C.ink,
                  }}>
                    {article.titre}
                  </h2>
                  <p style={{
                    fontSize: '0.82rem', color: C.inkMuted,
                    lineHeight: 1.7, marginBottom: '1.1rem',
                  }}>
                    {article.extrait}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: C.greenDeep,
                    borderBottom: `1px solid ${C.greenDeep}`, paddingBottom: '0.1rem',
                  }}>
                    Lire la suite <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <p style={{
            textAlign: 'center', color: C.inkMuted,
            padding: '4rem 0', fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.2rem', fontStyle: 'italic',
          }}>
            Aucun article dans cette catégorie.
          </p>
        )}
      </section>
    </div>
  );
}
