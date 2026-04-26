# Actualités & Galerie Redesign + SectionDivider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesigner les sections Actualités (Nature Luxe) et Galerie (Masonry Bento) et ajouter un composant SectionDivider animé doré entre les sections majeures.

**Architecture:** Trois modifications indépendantes — (1) nouveau `SectionDivider.jsx` avec IntersectionObserver, (2) réécriture complète de `ActualitesContent.jsx` avec hero full-bleed + grille 2×2, (3) réécriture complète de `GalerieContent.jsx` avec bento CSS grid. Les filtres Actualités et Galerie partagent le même style visuel (text-links petites caps, fond sable `#f5f0e8`).

**Tech Stack:** Next.js 15 App Router, React hooks (useState/useEffect/useRef), styles inline + classes CSS globals, tokens `src/lib/tokens.js`, hook `useScrollReveal`, composant `Lightbox.jsx` existant conservé.

---

## File Map

| Action | Fichier | Responsabilité |
|--------|---------|----------------|
| **Créer** | `src/components/ui/SectionDivider.jsx` | Filet doré animé + losange, IntersectionObserver |
| **Modifier** | `src/app/globals.css` | Classes hover bento galerie + image zoom actu |
| **Réécrire** | `src/components/pages/ActualitesContent.jsx` | Hero full-bleed + grille 2×2 + filtres text-links |
| **Réécrire** | `src/components/pages/GalerieContent.jsx` | Bento 2fr+1fr+1fr + panoramique + filtres text-links |
| **Modifier** | `src/components/pages/HomeContent.jsx` | Insérer `<SectionDivider />` entre Hero et Galerie |

---

## Task 1 — SectionDivider.jsx

**Files:**
- Create: `src/components/ui/SectionDivider.jsx`

- [ ] **Créer le fichier avec ce contenu exact :**

```jsx
'use client';
import { useEffect, useRef } from 'react';

/**
 * Filet doré animé entre deux sections.
 * Le trait se révèle de gauche à droite via scaleX quand il entre dans le viewport.
 * Le losange central apparaît 800ms après.
 */
export default function SectionDivider() {
  const wrapRef = useRef(null);
  const lineRef = useRef(null);
  const gemRef  = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || !lineRef.current || !gemRef.current) return;

    // SSR / no IntersectionObserver fallback
    if (typeof IntersectionObserver === 'undefined') {
      lineRef.current.style.transform = 'scaleX(1)';
      gemRef.current.style.opacity    = '1';
      gemRef.current.style.transform  = 'translateX(-50%) rotate(45deg) scale(1)';
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        lineRef.current.style.transform = 'scaleX(1)';
        setTimeout(() => {
          if (!gemRef.current) return;
          gemRef.current.style.opacity   = '1';
          gemRef.current.style.transform = 'translateX(-50%) rotate(45deg) scale(1)';
        }, 820);
        io.disconnect();
      },
      { threshold: 0.8 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{ position: 'relative', height: 48, display: 'flex', alignItems: 'center' }}
    >
      {/* Filet plein-largeur, révélé de gauche à droite */}
      <div
        ref={lineRef}
        style={{
          position: 'absolute',
          left: '1.5rem', right: '1.5rem', top: '50%',
          height: 1,
          background: 'linear-gradient(to right, transparent, #c4a96b 15%, #c4a96b 85%, transparent)',
          transform: 'scaleX(0)',
          transformOrigin: 'left center',
          transition: 'transform 1.2s cubic-bezier(0.16,1,0.3,1)',
        }}
      />
      {/* Losange central */}
      <div
        ref={gemRef}
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginTop: -3.5,
          width: 7, height: 7,
          background: '#c4a96b',
          transform: 'translateX(-50%) rotate(45deg) scale(0)',
          opacity: 0,
          transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      />
    </div>
  );
}
```

- [ ] **Vérifier le fichier est créé :**

```bash
ls "src/components/ui/SectionDivider.jsx"
```
Attendu : le fichier existe.

- [ ] **Commit :**

```bash
git add src/components/ui/SectionDivider.jsx
git commit -m "feat: SectionDivider — filet doré animé scaleX + losange"
```

---

## Task 2 — globals.css : classes hover bento + actu

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Ajouter à la fin de `src/app/globals.css` :**

```css
/* ── Galerie Bento hover ── */
.gal-bento-wrap { overflow: hidden; position: relative; border-radius: 10px; cursor: zoom-in; }
.gal-bento-img  { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
.gal-bento-wrap:hover .gal-bento-img { transform: scale(1.05); }

.gal-bento-overlay {
  position: absolute; inset: 0;
  background: rgba(19,61,32,0);
  transition: background 0.35s ease;
  display: flex; align-items: flex-end;
  padding: 0.75rem 1rem;
}
.gal-bento-wrap:hover .gal-bento-overlay { background: rgba(19,61,32,0.45); }

.gal-bento-caption {
  font-family: 'Cormorant Garamond', serif;
  font-style: italic;
  font-size: 0.82rem;
  color: rgba(255,255,255,0.92);
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.gal-bento-wrap:hover .gal-bento-caption { opacity: 1; transform: translateY(0); }

/* ── Actualités card image zoom ── */
.actu-card-img-wrap { overflow: hidden; }
.actu-card-img { width: 100%; display: block; transition: transform 0.6s cubic-bezier(0.16,1,0.3,1); }
.actu-card-img-wrap:hover .actu-card-img { transform: scale(1.05); }
```

- [ ] **Commit :**

```bash
git add src/app/globals.css
git commit -m "feat: CSS classes gal-bento et actu-card pour hover image zoom"
```

---

## Task 3 — ActualitesContent.jsx (réécriture complète)

**Files:**
- Modify: `src/components/pages/ActualitesContent.jsx`

- [ ] **Remplacer intégralement le contenu par :**

```jsx
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
  const [cat, setCat]   = useState('tous');
  const filtered        = cat === 'tous' ? actualites : actualites.filter(a => a.categorie === cat);
  const [featured, ...rest] = filtered;

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
            {/* Dégradé bas */}
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

        {/* Grille secondaire — 2×2 (auto-fill ≥ 280px) */}
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
```

- [ ] **Vérifier visuellement en local (si serveur dev actif) :**

```bash
# Si Next.js dev tourne :
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/actualites
```
Attendu : `200`

- [ ] **Commit :**

```bash
git add src/components/pages/ActualitesContent.jsx
git commit -m "feat: ActualitesContent redesign — hero full-bleed + grille 2x2 + filtres text-links"
```

---

## Task 4 — GalerieContent.jsx (réécriture complète)

**Files:**
- Modify: `src/components/pages/GalerieContent.jsx`

- [ ] **Remplacer intégralement le contenu par :**

```jsx
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Lightbox = dynamic(() => import('@/components/ui/Lightbox'), { ssr: false });

const IMAGES = [
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt — vue panoramique', theme: 'palmeraie', w: 1920, h: 1080 },
  { src: '/images/tighremt/palmeraie-sol.jpg',      alt: 'Sols de la palmeraie',                   theme: 'palmeraie', w: 1280, h: 960  },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes de Tighremt',                     theme: 'palmeraie', w: 1280, h: 853  },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt',                    theme: 'village',   w: 800,  h: 1067 },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar ancestral de Tighremt',             theme: 'village',   w: 1440, h: 810  },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt',                    theme: 'village',   w: 1920, h: 1080 },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain',                  theme: 'paysage',   w: 1280, h: 960  },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie',                 theme: 'palmeraie', w: 1280, h: 853  },
];

const THEMES       = ['tous', 'palmeraie', 'village', 'paysage'];
const THEME_LABELS = { tous: 'Tous', palmeraie: 'Palmeraie', village: 'Village', paysage: 'Paysage' };

/** Une cellule du bento — gère sa propre position selon son index */
function BentoCell({ img, bentoIdx, lightboxIdx, onOpen }) {
  // Index 0 : grande image (2 rangées)
  // Index 1-4 : cellules standard
  // Index 5+ : bannière panoramique plein-largeur
  const isPano = bentoIdx >= 5;
  const isBig  = bentoIdx === 0;

  const gridStyle = isPano
    ? { gridColumn: '1 / 4', height: 130 }
    : isBig
    ? { gridColumn: '1 / 2', gridRow: '1 / 3', height: '100%', minHeight: 360 }
    : { height: 175 };

  return (
    <div
      className={`gal-bento-wrap reveal reveal-delay-${(bentoIdx % 4) + 1}`}
      onClick={() => onOpen(lightboxIdx)}
      style={{ ...gridStyle, borderRadius: 10 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img.src}
        alt={img.alt}
        className="gal-bento-img"
        loading={bentoIdx < 2 ? 'eager' : 'lazy'}
        style={{ height: '100%' }}
      />
      <div className="gal-bento-overlay">
        <span className="gal-bento-caption">{img.alt}</span>
      </div>
    </div>
  );
}

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme]         = useState('tous');
  const [lightboxIdx, setLightbox] = useState(null);
  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  const bentoCells = filtered.slice(0, 5);  // positions 0-4 dans le bento
  const panoCells  = filtered.slice(5);     // bannières panoramiques

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
            Galerie
            <span style={{ display: 'block', width: 24, height: 1, background: 'rgba(196,169,107,0.6)' }} />
          </p>
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 300, fontStyle: 'italic', lineHeight: 1.1,
          }}>
            Tighremt en images
          </h1>
          <p style={{ marginTop: '0.75rem', opacity: 0.6, fontSize: '0.92rem', lineHeight: 1.7 }}>
            La beauté de la palmeraie et du village à travers nos photos.
          </p>
        </div>
      </section>

      {/* ── Filtres — text-links petites caps ── */}
      <div style={{
        background: '#f5f0e8', padding: '1.75rem 1.5rem 0',
        display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap',
      }}>
        {THEMES.map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 500,
              color:        theme === t ? C.greenDeep : C.inkLight,
              borderBottom: theme === t ? `1.5px solid ${C.greenDeep}` : '1.5px solid transparent',
              paddingBottom: '0.25rem',
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {THEME_LABELS[t]}
          </button>
        ))}
      </div>

      {/* ── Bento ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: C.inkMuted, padding: '4rem 0', fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic' }}>
            Aucune photo dans ce thème.
          </p>
        ) : (
          <>
            {/* Bento grid principal */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: bentoCells.length >= 3 ? '2fr 1fr 1fr' : `repeat(${Math.min(bentoCells.length, 3)}, 1fr)`,
              gridTemplateRows: bentoCells.length >= 3 ? '180px 180px' : '240px',
              gap: '0.5rem',
              marginBottom: '0.5rem',
            }}>
              {bentoCells.map((img, i) => (
                <BentoCell
                  key={img.src}
                  img={img}
                  bentoIdx={i}
                  lightboxIdx={i}
                  onOpen={setLightbox}
                />
              ))}
            </div>

            {/* Bannières panoramiques (images 5+) */}
            {panoCells.map((img, i) => (
              <BentoCell
                key={img.src}
                img={img}
                bentoIdx={5 + i}
                lightboxIdx={5 + i}
                onOpen={setLightbox}
              />
            ))}
          </>
        )}
      </section>

      {lightboxIdx !== null && (
        <Lightbox
          images={filtered.map(img => img.src)}
          initialIndex={lightboxIdx}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Commit :**

```bash
git add src/components/pages/GalerieContent.jsx
git commit -m "feat: GalerieContent redesign — bento CSS grid + panoramique + filtres text-links"
```

---

## Task 5 — HomeContent.jsx : insérer SectionDivider

**Files:**
- Modify: `src/components/pages/HomeContent.jsx`

- [ ] **Ajouter l'import SectionDivider en haut du fichier, après les imports existants :**

Trouver la ligne :
```jsx
import { useScrollReveal } from '@/hooks/useScrollReveal';
```

La remplacer par :
```jsx
import { useScrollReveal } from '@/hooks/useScrollReveal';
import SectionDivider from '@/components/ui/SectionDivider';
```

- [ ] **Modifier la fonction `HomeContent` pour insérer le divider entre Hero et Galerie :**

Trouver :
```jsx
export default function HomeContent() {
  useScrollReveal();
  return (
    <>
      <Hero />
      <Galerie />
    </>
  );
}
```

Remplacer par :
```jsx
export default function HomeContent() {
  useScrollReveal();
  return (
    <>
      <Hero />
      <SectionDivider />
      <Galerie />
    </>
  );
}
```

- [ ] **Commit :**

```bash
git add src/components/pages/HomeContent.jsx
git commit -m "feat: ajouter SectionDivider entre Hero et Galerie dans HomeContent"
```

---

## Task 6 — Push + vérification Vercel

- [ ] **Push sur main :**

```bash
git push origin main
```

- [ ] **Vérifier que les 5 commits sont bien poussés :**

```bash
git log --oneline -6
```

Attendu (ordre chronologique) :
```
feat: ajouter SectionDivider entre Hero et Galerie dans HomeContent
feat: GalerieContent redesign — bento CSS grid + panoramique + filtres text-links
feat: ActualitesContent redesign — hero full-bleed + grille 2x2 + filtres text-links
feat: CSS classes gal-bento et actu-card pour hover image zoom
feat: SectionDivider — filet doré animé scaleX + losange
```

- [ ] **Confirmer le déploiement Vercel (attendre ~2 min) puis ouvrir :**
  - `https://palmeraies-tighremt-tata.vercel.app/actualites`
  - `https://palmeraies-tighremt-tata.vercel.app/galerie`
  - `https://palmeraies-tighremt-tata.vercel.app` (divider entre Hero et Galerie)

---

## Auto-review

**Couverture spec :**
- [x] Actualités : fond sable, hero full-bleed 16:7, grille 2×2, filtres text-links, stagger reveal
- [x] Galerie : fond sable, bento 2fr+1fr+1fr, panoramique, hover overlay+caption, filtres text-links, Lightbox conservé
- [x] SectionDivider : filet scaleX + losange, IntersectionObserver, fallback SSR
- [x] HomeContent : SectionDivider entre Hero et Galerie

**Placeholders :** Aucun — tout le code est complet.

**Cohérence types :** `BentoCell` reçoit `{ img, bentoIdx, lightboxIdx, onOpen }` — utilisé identiquement pour bento et panoramique.
