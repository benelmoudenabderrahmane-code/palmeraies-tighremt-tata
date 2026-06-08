'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import actualites from '@/data/actualites.json';
import { C, FONT } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';
import TextParallaxContent from '@/components/ui/TextParallaxContent';

const CATEGORIES = ['tous', 'projets', 'association', 'evenements'];
const CAT_LABELS  = { tous: 'Tous', projets: 'Projets', association: 'Association', evenements: 'Événements' };

const fmtDate = (d, opts) => new Date(d).toLocaleDateString('fr-FR', opts);

/* ── Corps éditorial sous chaque image parallaxe ────────────────────────── */
function ParallaxArticleBody({ article, index, total }) {
  return (
    <div style={{
      maxWidth: 1040,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: '2rem',
      padding: 'clamp(2.5rem,5vw,4rem) 1rem clamp(3rem,6vw,5rem)',
    }}>
      <div className="actu-parallax-body">
        {/* Colonne méta */}
        <div className="actu-parallax-meta">
          <div style={{
            fontFamily: FONT.alt,
            fontSize: 'clamp(2.2rem,4vw,3rem)',
            fontWeight: 600,
            color: C.sandDark,
            lineHeight: 1,
          }}>
            {String(index + 1).padStart(2, '0')}
            <span style={{ fontSize: '0.45em', color: C.inkLight, fontWeight: 400 }}>
              {' '}/ {String(total).padStart(2, '0')}
            </span>
          </div>
          <div style={{ marginTop: '1rem', height: 1, width: 48, background: C.ochre }} />
          <p style={{
            marginTop: '1rem',
            fontSize: '0.7rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: C.ochre,
            fontWeight: 600,
          }}>
            {CAT_LABELS[article.categorie]}
          </p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: C.inkLight, lineHeight: 1.6 }}>
            {fmtDate(article.date, { day: 'numeric', month: 'long', year: 'numeric' })}
            <br />
            <span style={{ fontStyle: 'italic' }}>{article.auteur}</span>
          </p>
        </div>

        {/* Colonne contenu */}
        <div>
          <p style={{
            fontFamily: FONT.alt,
            fontSize: 'clamp(1.3rem,2.4vw,1.7rem)',
            fontWeight: 400,
            fontStyle: 'italic',
            color: C.greenDeep,
            lineHeight: 1.4,
            marginBottom: '1.5rem',
          }}>
            {article.extrait}
          </p>
          <p style={{
            fontSize: 'clamp(0.95rem,1.4vw,1.05rem)',
            color: C.inkMuted,
            lineHeight: 1.85,
            fontWeight: 300,
            marginBottom: '2rem',
          }}>
            {article.contenu}
          </p>
          <Link
            href={`/actualites/${article.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: C.greenDeep,
              color: '#fff',
              fontSize: '0.82rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              padding: '0.85rem 1.75rem',
              borderRadius: '2rem',
              textDecoration: 'none',
              transition: 'background 0.25s, transform 0.25s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.green; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.greenDeep; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            Lire l&apos;article complet <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ActualitesContent() {
  useScrollReveal();
  const [cat, setCat] = useState('tous');
  const filtered      = cat === 'tous' ? actualites : actualites.filter(a => a.categorie === cat);
  const PARALLAX_COUNT = Math.min(2, filtered.length);
  const featured       = filtered.slice(0, PARALLAX_COUNT);
  const rest           = filtered.slice(PARALLAX_COUNT);

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

        /* ── Corps éditorial sous parallaxe ── */
        .actu-parallax-body {
          display: grid;
          grid-template-columns: 4fr 8fr;
          gap: clamp(1.5rem, 4vw, 3.5rem);
          align-items: start;
        }
        .actu-parallax-meta { position: sticky; top: 6rem; }
        @media (max-width: 760px) {
          .actu-parallax-body { grid-template-columns: 1fr; }
          .actu-parallax-meta { position: static; }
        }
      `}</style>

      {/* ── Hero ── */}
      <section style={{ background: C.greenDeep, color: '#fff', minHeight: 'clamp(280px,38vh,380px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem', textAlign: 'center' }}>
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
            fontFamily: FONT.alt,
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

      {/* ── Articles vedettes — parallaxe immersive ── */}
      {featured.map((article, i) => (
        <TextParallaxContent
          key={article.id}
          imgUrl={article.image}
          alt={article.titre}
          subheading={`${CAT_LABELS[article.categorie]} · ${fmtDate(article.date, { day: 'numeric', month: 'long', year: 'numeric' })}`}
          heading={article.titre}
        >
          <ParallaxArticleBody article={article} index={i} total={filtered.length} />
        </TextParallaxContent>
      ))}

      {rest.length > 0 && <SectionDivider />}

      {/* ── Grille des autres articles ── */}
      {rest.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(2.5rem,5vw,3.5rem) 1.5rem 5rem' }}>
          <p style={{
            textAlign: 'center', fontSize: '0.66rem', letterSpacing: '0.24em',
            textTransform: 'uppercase', color: C.ochre, fontWeight: 600,
            marginBottom: '2rem',
          }}>
            Plus d&apos;actualités
          </p>
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
                    {fmtDate(article.date, { month: 'long', year: 'numeric' })}
                  </p>
                  <h2 style={{
                    fontFamily: FONT.alt,
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
        </section>
      )}

      {filtered.length === 0 && (
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
          <p style={{
            textAlign: 'center', color: C.inkMuted,
            padding: '4rem 0', fontFamily: FONT.alt,
            fontSize: '1.2rem', fontStyle: 'italic',
          }}>
            Aucun article dans cette catégorie.
          </p>
        </section>
      )}
    </div>
  );
}
