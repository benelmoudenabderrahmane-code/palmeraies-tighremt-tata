# Palmeries Tighremt — Full Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing Next.js 15 association website into a full-featured PWA with dark mode, FR/AR/EN i18n, 6 new pages, global UI components, SEO, and newsletter API.

**Architecture:** Static-first (no database), all dynamic data lives in JSON files under `src/data/`. New pages follow the existing pattern: thin route wrapper in `src/app/` + rich content component in `src/components/pages/`. Global UI additions (WhatsApp, BackToTop, Cookie, Toast) mount once in `src/app/layout.js`.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind CSS v4, Framer Motion, GSAP, next-intl, Leaflet, qrcode.react

---

## Task 1: Install dependencies & .env

**Files:**
- Modify: `package.json`
- Create: `.env.local`

- [ ] **Step 1: Install packages**
```bash
cd "C:/Users/abdel/Desktop/CLAUDE PROJECTS"
npm install next-intl leaflet react-leaflet qrcode.react
```
Expected: packages added, no peer-dep errors.

- [ ] **Step 2: Create .env.local**
```
NEXT_PUBLIC_WHATSAPP_NUMBER=+33635996389
NEXT_PUBLIC_DONATION_GOAL=20000
NEXT_PUBLIC_DONATION_CURRENT=12450
NEXT_PUBLIC_SITE_URL=https://palmeries-tighremt.org
```

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json .env.local
git commit -m "chore: install next-intl, leaflet, qrcode.react"
```

---

## Task 2: PWA — manifest + service worker

**Files:**
- Create: `public/manifest.json`
- Create: `public/sw.js`
- Modify: `src/app/layout.js`

- [ ] **Step 1: Create manifest.json**
```json
{
  "name": "Association Palmeraies Tighremt",
  "short_name": "Tighremt",
  "description": "Association loi 1901 — Sauvegarde de la palmeraie de Tighremt, Maroc",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#faf7f0",
  "theme_color": "#133d20",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["lifestyle", "social"],
  "lang": "fr"
}
```

- [ ] **Step 2: Create service worker sw.js**
```js
const CACHE = 'tighremt-v1';
const PRECACHE = ['/', '/mission', '/projets', '/don', '/contact', '/histoire', '/equipe'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
```

- [ ] **Step 3: Create placeholder icons directory**
```bash
mkdir -p "C:/Users/abdel/Desktop/CLAUDE PROJECTS/public/icons"
```
Note: Place 192×192 and 512×512 PNG versions of the logo at `public/icons/icon-192.png` and `public/icons/icon-512.png`. Use the existing `/logo.png` as source.

- [ ] **Step 4: Update layout.js head section**

In `src/app/layout.js`, replace the existing `<head>` block with:
```jsx
<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#133d20" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Tighremt" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Literata:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Noto+Sans+Arabic:wght@300;400;500;600&display=swap"
    rel="stylesheet"
  />
  <script dangerouslySetInnerHTML={{ __html: `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
    }
  `}} />
</head>
```

- [ ] **Step 5: Commit**
```bash
git add public/manifest.json public/sw.js public/icons src/app/layout.js
git commit -m "feat: add PWA manifest and service worker"
```

---

## Task 3: Dark Mode

**Files:**
- Create: `src/hooks/useDarkMode.js`
- Create: `src/components/ui/DarkModeToggle.jsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.js`
- Modify: `src/components/Navbar.jsx`

- [ ] **Step 1: Create useDarkMode hook**

`src/hooks/useDarkMode.js`:
```js
'use client';
import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ? stored === 'dark' : prefersDark;
    setDark(initial);
    document.documentElement.classList.toggle('dark', initial);
  }, []);

  const toggle = () => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  };

  return { dark, toggle };
}
```

- [ ] **Step 2: Create DarkModeToggle component**

`src/components/ui/DarkModeToggle.jsx`:
```jsx
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
```

- [ ] **Step 3: Add dark mode CSS variables to globals.css**

Append to `src/app/globals.css`:
```css
/* ── Dark Mode ── */
:root {
  --bg: #faf7f0;
  --text: #1c1c18;
  --text-muted: #5c5848;
  --border: rgba(28,28,24,0.12);
  --card-bg: #ffffff;
  --nav-bg: rgba(250,247,240,0.96);
}
html.dark {
  --bg: #0f1a12;
  --text: #f0ead8;
  --text-muted: #9a9280;
  --border: rgba(240,234,216,0.12);
  --card-bg: #1a2b1e;
  --nav-bg: rgba(15,26,18,0.96);
}
html.dark body { background-color: var(--bg); color: var(--text); }
html.dark .card-premium { background: var(--card-bg); }
```

- [ ] **Step 4: Add DarkModeToggle to Navbar**

In `src/components/Navbar.jsx`, import and add the toggle:
```jsx
import DarkModeToggle from './ui/DarkModeToggle';
```
Inside the return, add `<DarkModeToggle />` after the `<PillNav />` closing tag, still inside the inner div.

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useDarkMode.js src/components/ui/DarkModeToggle.jsx src/app/globals.css src/components/Navbar.jsx
git commit -m "feat: dark mode toggle with system preference and localStorage"
```

---

## Task 4: Global UI — WhatsApp button + BackToTop

**Files:**
- Create: `src/components/ui/WhatsAppButton.jsx`
- Create: `src/components/ui/BackToTop.jsx`
- Modify: `src/app/layout.js`

- [ ] **Step 1: Create WhatsAppButton**

`src/components/ui/WhatsAppButton.jsx`:
```jsx
'use client';
import { useEffect, useState } from 'react';

export default function WhatsAppButton() {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') || '33635996389';
  const url = `https://wa.me/${number}?text=Bonjour%20%2C%20je%20souhaite%20avoir%20plus%20d%27informations%20sur%20l%27association.`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  return (
    <a
      href={url} target="_blank" rel="noopener noreferrer"
      aria-label="Contactez-nous sur WhatsApp"
      style={{
        position: 'fixed', bottom: '5.5rem', right: '1.25rem', zIndex: 200,
        width: 52, height: 52, borderRadius: '50%',
        background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
        animation: 'waPulse 2.5s infinite',
        textDecoration: 'none',
      }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    </a>
  );
}
```

Append to `globals.css`:
```css
@keyframes waPulse {
  0%, 100% { box-shadow: 0 4px 20px rgba(37,211,102,0.4); }
  50%       { box-shadow: 0 4px 32px rgba(37,211,102,0.7); }
}
```

- [ ] **Step 2: Create BackToTop**

`src/components/ui/BackToTop.jsx`:
```jsx
'use client';
import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Retour en haut de la page"
      style={{
        position: 'fixed', bottom: '9.5rem', right: '1.35rem', zIndex: 200,
        width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: 'rgba(19,61,32,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)', transition: 'opacity 0.3s, transform 0.3s',
      }}
    >
      <ChevronUp size={18} color="#faf7f0" />
    </button>
  );
}
```

- [ ] **Step 3: Mount both in layout.js**

In `src/app/layout.js`, add imports:
```jsx
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import BackToTop from '@/components/ui/BackToTop';
```
Add before `</body>`:
```jsx
<WhatsAppButton />
<BackToTop />
```

- [ ] **Step 4: Commit**
```bash
git add src/components/ui/WhatsAppButton.jsx src/components/ui/BackToTop.jsx src/app/layout.js src/app/globals.css
git commit -m "feat: WhatsApp floating button and BackToTop"
```

---

## Task 5: Cookie banner + Toast system

**Files:**
- Create: `src/hooks/useToast.js`
- Create: `src/components/ui/Toast.jsx`
- Create: `src/components/ui/CookieBanner.jsx`
- Modify: `src/app/layout.js`

- [ ] **Step 1: Create useToast hook**

`src/hooks/useToast.js`:
```js
'use client';
import { useState, useCallback } from 'react';

let _addToast = null;
export function useToastEmitter() {
  const [toasts, setToasts] = useState([]);
  _addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  return { toasts, remove: id => setToasts(p => p.filter(t => t.id !== id)) };
}

export const toast = {
  success: msg => _addToast?.(msg, 'success'),
  error:   msg => _addToast?.(msg, 'error'),
  info:    msg => _addToast?.(msg, 'info'),
};
```

- [ ] **Step 2: Create Toast container**

`src/components/ui/Toast.jsx`:
```jsx
'use client';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastEmitter } from '@/hooks/useToast';

const icons = { success: CheckCircle, error: AlertCircle, info: Info };
const colors = { success: '#1e5c30', error: '#c0392b', info: '#c4703f' };

export default function ToastContainer() {
  const { toasts, remove } = useToastEmitter();
  return (
    <div style={{ position: 'fixed', top: '5rem', right: '1rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.5rem', pointerEvents: 'none' }} aria-live="polite">
      {toasts.map(({ id, msg, type }) => {
        const Icon = icons[type];
        return (
          <div key={id} style={{
            pointerEvents: 'all', background: '#fff', borderLeft: `4px solid ${colors[type]}`,
            borderRadius: 8, padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 260, maxWidth: 360,
            animation: 'slideIn 0.3s ease',
          }}>
            <Icon size={16} color={colors[type]} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.88rem', flex: 1, color: '#1c1c18' }}>{msg}</span>
            <button onClick={() => remove(id)} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
              <X size={14} color="#8a8270" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

Append to `globals.css`:
```css
@keyframes slideIn {
  from { opacity: 0; transform: translateX(40px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

- [ ] **Step 3: Create CookieBanner**

`src/components/ui/CookieBanner.jsx`:
```jsx
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
```

- [ ] **Step 4: Mount Toast + Cookie in layout.js**

Add imports:
```jsx
import ToastContainer from '@/components/ui/Toast';
import CookieBanner from '@/components/ui/CookieBanner';
```
Add before `</body>`:
```jsx
<ToastContainer />
<CookieBanner />
```

- [ ] **Step 5: Commit**
```bash
git add src/hooks/useToast.js src/components/ui/Toast.jsx src/components/ui/CookieBanner.jsx src/app/layout.js src/app/globals.css
git commit -m "feat: toast notification system and GDPR cookie banner"
```

---

## Task 6: Static data files

**Files:**
- Create: `src/data/actualites.json`
- Create: `src/data/evenements.json`
- Create: `src/data/partenaires.json`
- Create: `src/data/faq.json`
- Create: `src/data/missions-benevoles.json`

- [ ] **Step 1: Create actualites.json**

`src/data/actualites.json`:
```json
[
  {
    "id": "plantation-2024",
    "titre": "Campagne de plantation 2024 — 500 palmiers replantés",
    "extrait": "Grâce à vos dons, nous avons pu replanté 500 palmiers dattiers en décembre 2024 dans la palmeraie de Tighremt.",
    "contenu": "La campagne de plantation 2024 a été un succès retentissant. Avec le soutien de 87 donateurs et 12 bénévoles présents sur place, nous avons replanté 500 palmiers dattiers issus de rejets sélectionnés. Cette action s'inscrit dans notre programme de lutte contre la désertification.",
    "categorie": "projets",
    "date": "2024-12-15",
    "image": "/images/tighremt/palmeraie-panorama.jpg",
    "auteur": "Équipe Tighremt"
  },
  {
    "id": "eau-irrigation-2024",
    "titre": "Nouveau système d'irrigation — Phase 2 achevée",
    "extrait": "Le réseau d'irrigation souterrain couvre désormais 4 hectares supplémentaires de la palmeraie.",
    "contenu": "La phase 2 du projet d'irrigation a été finalisée en octobre 2024. Le nouveau réseau goutte-à-goutte permet d'économiser 40% d'eau par rapport aux anciennes méthodes. 23 familles de cultivateurs bénéficient directement de cette installation.",
    "categorie": "projets",
    "date": "2024-10-20",
    "image": "/images/tighremt/palmeraie-chemin.jpg",
    "auteur": "Équipe Tighremt"
  },
  {
    "id": "assemblee-2024",
    "titre": "Assemblée générale 2024 — Rapport d'activité",
    "extrait": "Retour sur notre assemblée générale annuelle et les décisions prises pour 2025.",
    "contenu": "L'assemblée générale 2024 s'est tenue le 15 novembre à Hulluch. 34 membres y ont participé. Le bilan financier affiche un excédent de 2 350€, entièrement réinvesti dans les projets. Le budget 2025 prévoit une augmentation de 18% des actions sur le terrain.",
    "categorie": "association",
    "date": "2024-11-15",
    "image": "/images/tighremt/ksar-silhouette.jpg",
    "auteur": "Bureau de l'association"
  },
  {
    "id": "visite-terrain-2024",
    "titre": "Mission terrain — Été 2024",
    "extrait": "6 bénévoles ont passé 10 jours à Tighremt cet été pour superviser les chantiers en cours.",
    "contenu": "Une délégation de 6 membres de l'association s'est rendue à Tighremt du 20 au 30 juillet 2024. Ils ont supervisé les travaux d'irrigation, rencontré les familles bénéficiaires et documenté l'avancement des projets. Un rapport complet est disponible sur demande.",
    "categorie": "evenements",
    "date": "2024-08-05",
    "image": "/images/tighremt/route-tighremt.jpg",
    "auteur": "Équipe Tighremt"
  }
]
```

- [ ] **Step 2: Create evenements.json**

`src/data/evenements.json`:
```json
[
  {
    "id": "ag-2025",
    "titre": "Assemblée Générale 2025",
    "date": "2025-11-22",
    "heure": "14h00",
    "lieu": "Salle polyvalente, Hulluch (62410)",
    "description": "Assemblée générale annuelle de l'association. Bilan 2025, élection du bureau, vote du budget 2026. Tous les membres sont invités.",
    "lien": null,
    "type": "association"
  },
  {
    "id": "vente-dattes-2025",
    "titre": "Vente de dattes de Tighremt",
    "date": "2025-12-06",
    "heure": "10h00 – 18h00",
    "lieu": "Marché de Noël, Lens (62300)",
    "description": "Stand de vente de dattes Medjool de Tighremt. Toutes les recettes financent directement les familles de cultivateurs.",
    "lien": "mailto:palmeraies.tighremt.tata@gmail.com",
    "type": "collecte"
  },
  {
    "id": "plantation-2025",
    "titre": "Campagne de plantation 2025",
    "date": "2025-12-20",
    "heure": "À définir",
    "lieu": "Tighremt, province de Tata, Maroc",
    "description": "Nouvelle campagne de plantation de palmiers dattiers. Des bénévoles sur place sont les bienvenus. Contactez-nous pour participer.",
    "lien": "mailto:palmeraies.tighremt.tata@gmail.com",
    "type": "projet"
  }
]
```

- [ ] **Step 3: Create partenaires.json**

`src/data/partenaires.json`:
```json
[
  { "id": "ccfd", "nom": "CCFD-Terre Solidaire", "logo": "/images/partenaires/ccfd.png", "url": "https://ccfd-terresolidaire.org", "description": "Partenaire solidarité internationale" },
  { "id": "mairie-hulluch", "nom": "Mairie de Hulluch", "logo": "/images/partenaires/mairie-hulluch.png", "url": "#", "description": "Soutien institutionnel local" },
  { "id": "fondation-ocp", "nom": "Fondation OCP", "logo": "/images/partenaires/ocp.png", "url": "https://www.ocpgroup.ma", "description": "Partenaire agricole au Maroc" },
  { "id": "communaute-tighremt", "nom": "Communauté de Tighremt", "logo": "/images/tighremt/minaret.jpg", "url": "#", "description": "Nos partenaires sur le terrain" }
]
```

- [ ] **Step 4: Create faq.json**

`src/data/faq.json`:
```json
[
  {
    "categorie": "association",
    "questions": [
      { "q": "Quand a été fondée l'association ?", "r": "L'association Palmeraies Tighremt TATA a été fondée en mars 2010 sous le statut loi 1901 (association à but non lucratif)." },
      { "q": "Comment devenir membre ?", "r": "Pour adhérer, contactez-nous par email à palmeraies.tighremt.tata@gmail.com ou par téléphone. La cotisation annuelle est libre." },
      { "q": "Où est basée l'association ?", "r": "Le siège social est à Hulluch (62410), dans le Pas-de-Calais, France. Les actions se déroulent à Tighremt, province de Tata, Maroc." }
    ]
  },
  {
    "categorie": "dons",
    "questions": [
      { "q": "Les dons sont-ils déductibles des impôts ?", "r": "Oui. En tant qu'association loi 1901 reconnue d'intérêt général, vos dons ouvrent droit à une réduction d'impôt de 66% dans la limite de 20% de votre revenu imposable." },
      { "q": "Comment sont utilisés les fonds ?", "r": "75% des fonds vont directement aux projets sur le terrain, 15% aux frais de fonctionnement, 10% à la communication. Un rapport annuel détaillé est disponible sur demande." },
      { "q": "Peut-on faire un don en nature ?", "r": "Oui ! Graines, outils agricoles, matériel scolaire — contactez-nous pour organiser la collecte et l'acheminement." }
    ]
  },
  {
    "categorie": "benevoles",
    "questions": [
      { "q": "Comment devenir bénévole ?", "r": "Remplissez le formulaire sur notre page Bénévoles ou contactez-nous directement. Nous acceptons des bénévoles aussi bien en France (administration, communication) qu'au Maroc (terrain)." },
      { "q": "Faut-il parler arabe ou tamazight ?", "r": "Ce n'est pas obligatoire, mais toujours apprécié ! Nous organisons des missions mixtes avec des locuteurs francophones et arabophones." }
    ]
  },
  {
    "categorie": "projets",
    "questions": [
      { "q": "Quels sont les projets en cours ?", "r": "Nous menons actuellement : (1) la replantation de la palmeraie, (2) l'extension du réseau d'irrigation, (3) le soutien scolaire aux enfants de Tighremt, (4) la rénovation des pistes d'accès au village." },
      { "q": "Comment suivre l'avancement des projets ?", "r": "La page Projets de ce site est mise à jour régulièrement. Vous pouvez aussi vous inscrire à notre newsletter pour recevoir les actualités." }
    ]
  }
]
```

- [ ] **Step 5: Create missions-benevoles.json**

`src/data/missions-benevoles.json`:
```json
[
  {
    "id": "communication",
    "titre": "Responsable communication",
    "lieu": "France (télétravail)",
    "type": "permanent",
    "competences": ["Réseaux sociaux", "Rédaction", "Photo/Vidéo"],
    "description": "Gérer les réseaux sociaux, rédiger les actualités du site, créer des supports de communication pour sensibiliser le public."
  },
  {
    "id": "terrain-irrigation",
    "titre": "Technicien irrigation",
    "lieu": "Tighremt, Maroc (mission 2 semaines)",
    "type": "mission",
    "competences": ["Plomberie", "Agriculture", "Physique"],
    "description": "Participer à l'installation et la maintenance du réseau d'irrigation goutte-à-goutte dans la palmeraie."
  },
  {
    "id": "soutien-scolaire",
    "titre": "Soutien scolaire",
    "lieu": "Tighremt, Maroc (mission 1 mois)",
    "type": "mission",
    "competences": ["Enseignement", "Patience", "Français/Arabe"],
    "description": "Animer des ateliers de soutien scolaire pour les enfants du village, notamment en français et en mathématiques."
  },
  {
    "id": "collecte-fonds",
    "titre": "Organisateur de collecte de fonds",
    "lieu": "France",
    "type": "ponctuel",
    "competences": ["Organisation", "Relationnel", "Vente"],
    "description": "Organiser des événements de collecte de fonds : vente de dattes, stands marchés de Noël, soirées de gala."
  }
]
```

- [ ] **Step 6: Commit**
```bash
git add src/data/
git commit -m "feat: add static data files for all new pages"
```

---

## Task 7: Page Actualités

**Files:**
- Create: `src/app/actualites/page.js`
- Create: `src/app/actualites/[id]/page.js`
- Create: `src/components/pages/ActualitesContent.jsx`
- Create: `src/components/pages/ArticleContent.jsx`

- [ ] **Step 1: Create route wrappers**

`src/app/actualites/page.js`:
```js
import ActualitesContent from '@/components/pages/ActualitesContent';
export const metadata = { title: 'Actualités | Association Palmeraies Tighremt', description: 'Toutes les actualités de l\'association : projets, événements, missions terrain.' };
export default function ActualitesPage() { return <ActualitesContent />; }
```

`src/app/actualites/[id]/page.js`:
```js
import ArticleContent from '@/components/pages/ArticleContent';
import actualites from '@/data/actualites.json';
export function generateStaticParams() {
  return actualites.map(a => ({ id: a.id }));
}
export function generateMetadata({ params }) {
  const article = actualites.find(a => a.id === params.id);
  return { title: `${article?.titre} | Tighremt`, description: article?.extrait };
}
export default function ArticlePage({ params }) { return <ArticleContent id={params.id} />; }
```

- [ ] **Step 2: Create ActualitesContent.jsx**

`src/components/pages/ActualitesContent.jsx`:
```jsx
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
      {/* Hero */}
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

      {/* Filters */}
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

      {/* Grid */}
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
                  <span style={{ fontSize: '0.72rem', background: C.sandMid, color: C.ochre, padding: '0.2rem 0.6rem', borderRadius: 999, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <Tag size={10} style={{ marginRight: 4 }} />{article.categorie}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: C.inkLight, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={12} />
                    {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3, marginBottom: '0.6rem', color: C.ink }}>{article.titre}</h2>
                <p style={{ fontSize: '0.87rem', color: C.inkMuted, lineHeight: 1.7, marginBottom: '1.2rem' }}>{article.extrait}</p>
                <Link href={`/actualites/${article.id}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: C.ochre, textDecoration: 'none' }}
                  onMouseOver={e => (e.currentTarget.style.gap = '0.7rem')}
                  onMouseOut={e  => (e.currentTarget.style.gap = '0.4rem')}>
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
```

- [ ] **Step 3: Create ArticleContent.jsx**

`src/components/pages/ArticleContent.jsx`:
```jsx
'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, ArrowLeft, Share2 } from 'lucide-react';
import actualites from '@/data/actualites.json';
import { C } from '@/lib/tokens';
import { toast } from '@/hooks/useToast';

export default function ArticleContent({ id }) {
  const article = actualites.find(a => a.id === id);
  if (!article) return <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>Article introuvable.</div>;

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: article.titre, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié dans le presse-papiers !');
    }
  };

  return (
    <div style={{ paddingTop: '6rem', maxWidth: 800, margin: '0 auto', padding: '7rem 1.5rem 4rem' }}>
      <Link href="/actualites" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: C.inkMuted, textDecoration: 'none', fontSize: '0.85rem', marginBottom: '2rem' }}>
        <ArrowLeft size={14} /> Retour aux actualités
      </Link>
      <div style={{ position: 'relative', height: 360, borderRadius: 16, overflow: 'hidden', marginBottom: '2rem' }}>
        <Image src={article.image} alt={article.titre} fill style={{ objectFit: 'cover' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: C.inkLight, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={13} />
          {new Date(article.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' · '}{article.auteur}
        </span>
        <button onClick={share} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: `1px solid ${C.sandDark}`, borderRadius: 8, padding: '0.4rem 0.9rem', cursor: 'pointer', fontSize: '0.8rem', color: C.inkMuted }}>
          <Share2 size={13} /> Partager
        </button>
      </div>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 600, lineHeight: 1.2, color: C.ink, marginBottom: '1.5rem' }}>{article.titre}</h1>
      <div style={{ fontSize: '1rem', lineHeight: 1.85, color: C.inkMuted }}>{article.contenu}</div>
    </div>
  );
}
```

- [ ] **Step 4: Add Actualités to Navbar and Footer**

In `src/components/Navbar.jsx`, add to NAV_ITEMS:
```js
{ label: 'Actualités', href: '/actualites' },
```

In `src/components/Footer.jsx`, add to quickLinks:
```js
{ label: 'Actualités', href: '/actualites' },
```

- [ ] **Step 5: Commit**
```bash
git add src/app/actualites/ src/components/pages/ActualitesContent.jsx src/components/pages/ArticleContent.jsx src/components/Navbar.jsx src/components/Footer.jsx
git commit -m "feat: Actualités page with article detail and category filters"
```

---

## Task 8: Page FAQ

**Files:**
- Create: `src/app/faq/page.js`
- Create: `src/components/pages/FaqContent.jsx`

- [ ] **Step 1: Create route**

`src/app/faq/page.js`:
```js
import FaqContent from '@/components/pages/FaqContent';
export const metadata = { title: 'FAQ | Association Palmeraies Tighremt', description: 'Questions fréquemment posées sur l\'association, les dons, le bénévolat et les projets.' };
export default function FaqPage() { return <FaqContent />; }
```

- [ ] **Step 2: Create FaqContent.jsx**

`src/components/pages/FaqContent.jsx`:
```jsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import faqData from '@/data/faq.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const LABELS = { association: 'L\'Association', dons: 'Les Dons', benevoles: 'Bénévolat', projets: 'Nos Projets' };

function AccordionItem({ q, r }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${C.sandDark}` }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '1.25rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1rem', fontWeight: 500, color: C.ink, lineHeight: 1.4 }}>{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }} style={{ flexShrink: 0 }}>
          <ChevronDown size={18} color={C.ochre} />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }} style={{ overflow: 'hidden' }}>
            <p style={{ paddingBottom: '1.25rem', fontSize: '0.93rem', color: C.inkMuted, lineHeight: 1.75 }}>{r}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FaqContent() {
  useScrollReveal();
  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>FAQ</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Questions fréquentes</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Tout ce que vous souhaitez savoir sur l&apos;association.</p>
        </div>
      </section>

      <section style={{ maxWidth: 780, margin: '0 auto', padding: '4rem 1.5rem' }}>
        {faqData.map((section, i) => (
          <div key={section.categorie} className={`reveal reveal-delay-${i + 1}`} style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', fontWeight: 600, color: C.greenDeep, marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: `2px solid ${C.accent}`, display: 'inline-block' }}>
              {LABELS[section.categorie] || section.categorie}
            </h2>
            {section.questions.map(({ q, r }) => <AccordionItem key={q} q={q} r={r} />)}
          </div>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add src/app/faq/ src/components/pages/FaqContent.jsx
git commit -m "feat: FAQ page with animated accordion by category"
```

---

## Task 9: Page Galerie

**Files:**
- Create: `src/app/galerie/page.js`
- Create: `src/components/pages/GalerieContent.jsx`

- [ ] **Step 1: Create route**

`src/app/galerie/page.js`:
```js
import GalerieContent from '@/components/pages/GalerieContent';
export const metadata = { title: 'Galerie | Association Palmeraies Tighremt', description: 'Photos de la palmeraie, du village de Tighremt et de nos projets.' };
export default function GaleriePage() { return <GalerieContent />; }
```

- [ ] **Step 2: Create GalerieContent.jsx**

`src/components/pages/GalerieContent.jsx`:
```jsx
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const Lightbox = dynamic(() => import('@/components/ui/Lightbox'), { ssr: false });

const IMAGES = [
  { src: '/images/tighremt/palmeraie-panorama.jpg', alt: 'Palmeraie de Tighremt — vue panoramique', theme: 'palmeraie' },
  { src: '/images/tighremt/palmeraie-sol.jpg',      alt: 'Sols de la palmeraie', theme: 'palmeraie' },
  { src: '/images/tighremt/dattes.jpg',             alt: 'Dattes de Tighremt', theme: 'palmeraie' },
  { src: '/images/tighremt/minaret.jpg',            alt: 'Mosquée de Tighremt', theme: 'village' },
  { src: '/images/tighremt/ksar-silhouette.jpg',    alt: 'Ksar ancestral de Tighremt', theme: 'village' },
  { src: '/images/tighremt/tighremt-panorama.jpg',  alt: 'Village de Tighremt', theme: 'village' },
  { src: '/images/tighremt/route-tighremt.jpg',     alt: 'Route du sud marocain', theme: 'paysage' },
  { src: '/images/tighremt/palmeraie-chemin.jpg',   alt: 'Chemin de la palmeraie', theme: 'palmeraie' },
];

const THEMES = ['tous', 'palmeraie', 'village', 'paysage'];

export default function GalerieContent() {
  useScrollReveal();
  const [theme, setTheme] = useState('tous');
  const [lightboxIdx, setLightboxIdx] = useState(null);

  const filtered = theme === 'tous' ? IMAGES : IMAGES.filter(img => img.theme === theme);

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Galerie</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Photos de Tighremt</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>La beauté de la palmeraie et du village à travers nos photos.</p>
        </div>
      </section>

      <section style={{ background: C.sandMid, padding: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        {THEMES.map(t => (
          <button key={t} onClick={() => setTheme(t)} style={{
            padding: '0.45rem 1.1rem', borderRadius: 999, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize',
            background: theme === t ? C.greenDeep : 'transparent',
            color: theme === t ? '#fff' : C.inkMuted,
            outline: theme === t ? 'none' : `1px solid ${C.sandDark}`,
            transition: 'all 0.2s',
          }}>{t === 'tous' ? 'Tous' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
        ))}
      </section>

      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ columns: '3 280px', gap: '1rem' }}>
          {filtered.map((img, i) => (
            <div key={img.src} className="reveal img-zoom-wrap"
              onClick={() => setLightboxIdx(i)}
              style={{ breakInside: 'avoid', marginBottom: '1rem', borderRadius: 12, overflow: 'hidden', cursor: 'zoom-in', position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt} style={{ width: '100%', display: 'block', borderRadius: 12 }} loading="lazy" />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(19,61,32,0)', transition: 'background 0.3s', borderRadius: 12, display: 'flex', alignItems: 'flex-end', padding: '1rem' }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(19,61,32,0.45)'; e.currentTarget.querySelector('span').style.opacity = 1; }}
                onMouseOut={e  => { e.currentTarget.style.background = 'rgba(19,61,32,0)';    e.currentTarget.querySelector('span').style.opacity = 0; }}>
                <span style={{ color: '#fff', fontSize: '0.82rem', opacity: 0, transition: 'opacity 0.3s' }}>{img.alt}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {lightboxIdx !== null && (
        <Lightbox
          images={filtered.map(img => img.src)}
          initialIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**
```bash
git add src/app/galerie/ src/components/pages/GalerieContent.jsx
git commit -m "feat: Galerie page with masonry layout, filters, and lightbox"
```

---

## Task 10: Pages Événements + Bénévoles + Partenaires

**Files:**
- Create: `src/app/evenements/page.js`
- Create: `src/components/pages/EvenementsContent.jsx`
- Create: `src/app/benevoles/page.js`
- Create: `src/components/pages/BenevolesContent.jsx`
- Create: `src/app/partenaires/page.js`
- Create: `src/components/pages/PartenairesContent.jsx`

- [ ] **Step 1: Événements route + content**

`src/app/evenements/page.js`:
```js
import EvenementsContent from '@/components/pages/EvenementsContent';
export const metadata = { title: 'Événements | Association Palmeraies Tighremt', description: 'Agenda des événements à venir.' };
export default function EvenementsPage() { return <EvenementsContent />; }
```

`src/components/pages/EvenementsContent.jsx`:
```jsx
'use client';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import evenements from '@/data/evenements.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const TYPE_COLORS = { association: C.greenDeep, collecte: C.ochre, projet: C.accent };

export default function EvenementsContent() {
  useScrollReveal();
  const now = new Date();
  const upcoming = evenements.filter(e => new Date(e.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = evenements.filter(e => new Date(e.date) < now).sort((a, b) => new Date(b.date) - new Date(a.date));

  const Card = ({ e, i }) => (
    <div className={`reveal reveal-delay-${(i % 3) + 1}`} style={{ background: '#fff', borderRadius: 16, padding: '1.75rem', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', borderTop: `4px solid ${TYPE_COLORS[e.type] || C.accent}` }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.72rem', background: C.sandMid, color: TYPE_COLORS[e.type] || C.accent, padding: '0.2rem 0.7rem', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{e.type}</span>
      </div>
      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 600, color: C.ink, marginBottom: '0.75rem' }}>{e.titre}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
        {[
          [Calendar, new Date(e.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
          [Clock, e.heure],
          [MapPin, e.lieu],
        ].map(([Icon, text]) => (
          <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.87rem', color: C.inkMuted }}>
            <Icon size={14} color={C.ochre} style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{text}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: '0.88rem', color: C.inkMuted, lineHeight: 1.7, marginBottom: '1rem' }}>{e.description}</p>
      {e.lien && (
        <a href={e.lien} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 600, color: C.ochre, textDecoration: 'none' }}>
          Participer <ExternalLink size={13} />
        </a>
      )}
    </div>
  );

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Agenda</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Événements</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Retrouvez tous nos prochains rendez-vous.</p>
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {upcoming.length > 0 && <>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: C.greenDeep, marginBottom: '1.5rem' }}>À venir</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {upcoming.map((e, i) => <Card key={e.id} e={e} i={i} />)}
          </div>
        </>}
        {past.length > 0 && <>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: C.inkMuted, marginBottom: '1.5rem' }}>Passés</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', opacity: 0.65 }}>
            {past.map((e, i) => <Card key={e.id} e={e} i={i} />)}
          </div>
        </>}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Bénévoles route + content**

`src/app/benevoles/page.js`:
```js
import BenevolesContent from '@/components/pages/BenevolesContent';
export const metadata = { title: 'Bénévolat | Association Palmeraies Tighremt', description: 'Rejoignez notre équipe de bénévoles et contribuez à la sauvegarde de Tighremt.' };
export default function BenevolesPage() { return <BenevolesContent />; }
```

`src/components/pages/BenevolesContent.jsx`:
```jsx
'use client';
import { useState } from 'react';
import { MapPin, Clock, Tag, Send } from 'lucide-react';
import missions from '@/data/missions-benevoles.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { toast } from '@/hooks/useToast';

const TYPE_LABELS = { permanent: 'Permanent', mission: 'Mission', ponctuel: 'Ponctuel' };
const TYPE_COLORS = { permanent: C.greenDeep, mission: C.ochre, ponctuel: C.accent };

export default function BenevolesContent() {
  useScrollReveal();
  const [form, setForm] = useState({ nom: '', email: '', mission: '', message: '' });
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.includes('@')) { toast.error('Email invalide'); return; }
    setSending(true);
    await new Promise(r => setTimeout(r, 800));
    setSending(false);
    toast.success('Candidature envoyée ! Nous vous répondrons sous 48h.');
    setForm({ nom: '', email: '', mission: '', message: '' });
  };

  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Rejoignez-nous</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Devenir bénévole</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Vos compétences peuvent changer des vies à Tighremt.</p>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: C.greenDeep, marginBottom: '1.5rem' }}>Missions disponibles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {missions.map((m, i) => (
            <div key={m.id} className={`reveal reveal-delay-${(i % 3) + 1}`}
              style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', borderTop: `3px solid ${TYPE_COLORS[m.type]}` }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.7rem', background: C.sandMid, color: TYPE_COLORS[m.type], padding: '0.15rem 0.6rem', borderRadius: 999, fontWeight: 700, textTransform: 'uppercase' }}>
                  {TYPE_LABELS[m.type]}
                </span>
              </div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontWeight: 600, color: C.ink, marginBottom: '0.5rem' }}>{m.titre}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: C.inkMuted, marginBottom: '0.4rem' }}>
                <MapPin size={12} color={C.ochre} />{m.lieu}
              </div>
              <p style={{ fontSize: '0.86rem', color: C.inkMuted, lineHeight: 1.65, marginBottom: '0.75rem' }}>{m.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {m.competences.map(c => (
                  <span key={c} style={{ fontSize: '0.72rem', background: C.sandMid, color: C.inkMuted, padding: '0.15rem 0.5rem', borderRadius: 4 }}>{c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: C.greenDeep, marginBottom: '1.5rem', textAlign: 'center' }}>Postuler</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { name: 'nom', label: 'Nom complet', type: 'text', placeholder: 'Votre nom' },
              { name: 'email', label: 'Email', type: 'email', placeholder: 'votre@email.com' },
            ].map(({ name, label, type, placeholder }) => (
              <div key={name}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: '0.4rem' }}>{label}</label>
                <input type={type} placeholder={placeholder} value={form[name]}
                  onChange={e => setForm(p => ({ ...p, [name]: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${C.sandDark}`, fontSize: '0.93rem', outline: 'none', background: '#fff' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: '0.4rem' }}>Mission souhaitée</label>
              <select value={form.mission} onChange={e => setForm(p => ({ ...p, mission: e.target.value }))} required
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${C.sandDark}`, fontSize: '0.93rem', background: '#fff', outline: 'none' }}>
                <option value="">Choisir une mission...</option>
                {missions.map(m => <option key={m.id} value={m.id}>{m.titre}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: C.ink, display: 'block', marginBottom: '0.4rem' }}>Message (optionnel)</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                placeholder="Présentez-vous et expliquez votre motivation..."
                rows={4} style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: 10, border: `1px solid ${C.sandDark}`, fontSize: '0.93rem', resize: 'vertical', outline: 'none', background: '#fff' }} />
            </div>
            <button type="submit" disabled={sending}
              className="btn-accent"
              style={{ padding: '0.85rem', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, opacity: sending ? 0.7 : 1 }}>
              <Send size={16} />{sending ? 'Envoi...' : 'Envoyer ma candidature'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Partenaires route + content**

`src/app/partenaires/page.js`:
```js
import PartenairesContent from '@/components/pages/PartenairesContent';
export const metadata = { title: 'Partenaires | Association Palmeraies Tighremt' };
export default function PartenairesPage() { return <PartenairesContent />; }
```

`src/components/pages/PartenairesContent.jsx`:
```jsx
'use client';
import Image from 'next/image';
import partenaires from '@/data/partenaires.json';
import { C } from '@/lib/tokens';
import { useScrollReveal } from '@/hooks/useScrollReveal';

export default function PartenairesContent() {
  useScrollReveal();
  return (
    <div style={{ paddingTop: '6rem', minHeight: '100vh' }}>
      <section style={{ background: C.greenDeep, color: '#fff', padding: '4rem 1.5rem 3rem', textAlign: 'center' }}>
        <div className="reveal" style={{ maxWidth: 700, margin: '0 auto' }}>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: C.accent, marginBottom: '0.75rem' }}>Réseau</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 600 }}>Nos partenaires</h1>
          <p style={{ marginTop: '1rem', opacity: 0.75 }}>Ensemble pour Tighremt.</p>
        </div>
      </section>
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '2rem' }}>
          {partenaires.map((p, i) => (
            <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
              className={`reveal reveal-delay-${(i % 4) + 1} card-premium`}
              style={{ background: '#fff', borderRadius: 16, padding: '2rem 1.5rem', textAlign: 'center', boxShadow: '0 2px 20px rgba(0,0,0,0.07)', textDecoration: 'none', display: 'block' }}>
              <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 1rem', background: C.sandMid }}>
                <Image src={p.logo} alt={p.nom} fill style={{ objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 600, color: C.ink, marginBottom: '0.4rem' }}>{p.nom}</h3>
              <p style={{ fontSize: '0.84rem', color: C.inkMuted }}>{p.description}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add src/app/evenements/ src/app/benevoles/ src/app/partenaires/ src/components/pages/EvenementsContent.jsx src/components/pages/BenevolesContent.jsx src/components/pages/PartenairesContent.jsx
git commit -m "feat: Événements, Bénévoles, and Partenaires pages"
```

---

## Task 11: Map Leaflet on Contact page

**Files:**
- Create: `src/components/ui/MapLeaflet.jsx`
- Modify: `src/components/pages/ContactContent.jsx`

- [ ] **Step 1: Create MapLeaflet component**

`src/components/ui/MapLeaflet.jsx`:
```jsx
'use client';
import { useEffect, useRef } from 'react';

export default function MapLeaflet() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    import('leaflet').then(L => {
      // Fix default marker icons
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current).setView([29.7488, -8.0028], 12);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker([29.7488, -8.0028])
        .addTo(map)
        .bindPopup('<strong>Tighremt</strong><br>Province de Tata, Maroc<br><em>Palmeraie Tighremt TATA</em>')
        .openPopup();
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: 380, borderRadius: 16, overflow: 'hidden', zIndex: 1 }} aria-label="Carte de localisation de Tighremt" />
    </>
  );
}
```

- [ ] **Step 2: Add map to ContactContent.jsx**

In `src/components/pages/ContactContent.jsx`, add a dynamic import at the top:
```jsx
import dynamic from 'next/dynamic';
const MapLeaflet = dynamic(() => import('@/components/ui/MapLeaflet'), { ssr: false });
```
Then add `<MapLeaflet />` inside the page, below the contact form or in a dedicated section.

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/MapLeaflet.jsx src/components/pages/ContactContent.jsx
git commit -m "feat: Leaflet interactive map on contact page showing Tighremt location"
```

---

## Task 12: Donation progress bar + QR code

**Files:**
- Create: `src/components/ui/DonationProgress.jsx`
- Modify: `src/components/pages/DonContent.jsx`

- [ ] **Step 1: Create DonationProgress**

`src/components/ui/DonationProgress.jsx`:
```jsx
'use client';
import { useRef } from 'react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { C } from '@/lib/tokens';

export default function DonationProgress() {
  const goal    = Number(process.env.NEXT_PUBLIC_DONATION_GOAL    || 20000);
  const current = Number(process.env.NEXT_PUBLIC_DONATION_CURRENT || 12450);
  const pct     = Math.min(Math.round((current / goal) * 100), 100);

  const { ref, display } = useAnimatedCounter({ value: current, from: 0, duration: 2000 });

  return (
    <div ref={ref} style={{ background: '#fff', borderRadius: 20, padding: '2rem', boxShadow: '0 4px 30px rgba(0,0,0,0.08)', maxWidth: 520, width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: C.inkLight, fontWeight: 600 }}>Objectif 2025</span>
        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.greenDeep }}>{pct}%</span>
      </div>
      <div style={{ height: 10, background: C.sandMid, borderRadius: 999, overflow: 'hidden', marginBottom: '1rem' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${C.green}, ${C.accent})`, borderRadius: 999, transition: 'width 1.5s cubic-bezier(0.16,1,0.3,1)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', fontWeight: 600, color: C.greenDeep }}>{display.toLocaleString('fr-FR')} €</span>
          <span style={{ fontSize: '0.85rem', color: C.inkMuted, marginLeft: '0.4rem' }}>collectés</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.1rem', fontWeight: 600, color: C.inkMuted }}>{goal.toLocaleString('fr-FR')} €</span>
          <div style={{ fontSize: '0.75rem', color: C.inkLight }}>objectif annuel</div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add DonationProgress and QR Code to DonContent.jsx**

In `src/components/pages/DonContent.jsx`, add these imports at the top:
```jsx
import dynamic from 'next/dynamic';
const DonationProgress = dynamic(() => import('@/components/ui/DonationProgress'), { ssr: false });
const QRCode = dynamic(() => import('qrcode.react').then(m => m.QRCodeSVG), { ssr: false });
```

Add `<DonationProgress />` near the top of the page content, below the hero section.

Add a QR code section for bank transfer:
```jsx
<div style={{ background: C.sandMid, borderRadius: 16, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
  <QRCode value="mailto:palmeraies.tighremt.tata@gmail.com" size={100} bgColor="transparent" fgColor={C.greenDeep} />
  <div>
    <p style={{ fontWeight: 600, color: C.ink, marginBottom: '0.25rem' }}>Virement bancaire</p>
    <p style={{ fontSize: '0.85rem', color: C.inkMuted, lineHeight: 1.6 }}>Scannez le QR code ou contactez-nous<br/>pour obtenir nos coordonnées bancaires.</p>
  </div>
</div>
```

- [ ] **Step 3: Commit**
```bash
git add src/components/ui/DonationProgress.jsx src/components/pages/DonContent.jsx
git commit -m "feat: animated donation progress bar and QR code on don page"
```

---

## Task 13: Newsletter API route

**Files:**
- Create: `src/app/api/newsletter/route.js`
- Create: `data/newsletter-subscribers.json` (gitignored)
- Modify: `src/components/Footer.jsx`

- [ ] **Step 1: Create API route**

`src/app/api/newsletter/route.js`:
```js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'newsletter-subscribers.json');

function readSubscribers() {
  try {
    if (!fs.existsSync(FILE)) return [];
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch { return []; }
}

function writeSubscribers(list) {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }
    const list = readSubscribers();
    if (list.some(s => s.email === email)) {
      return NextResponse.json({ message: 'Déjà inscrit' }, { status: 200 });
    }
    list.push({ email, date: new Date().toISOString() });
    writeSubscribers(list);
    return NextResponse.json({ message: 'Inscrit avec succès' }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Add data/ to .gitignore**
```bash
echo "data/newsletter-subscribers.json" >> .gitignore
```

- [ ] **Step 3: Wire up the footer newsletter form**

In `src/components/Footer.jsx`, make it a client component that calls the API. Add state and handler:
```jsx
// At the top of the Footer component, after the 'use client' directive is already present:
import { useState } from 'react';
import { toast } from '@/hooks/useToast';
```

Replace the existing static newsletter `<div>` in the footer with:
```jsx
<div>
  <div style={{ fontSize: '0.65rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: C.accent, fontWeight: 600, marginBottom: '1.25rem' }}>Restez informé</div>
  <p style={{ fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 300, marginBottom: '1rem' }}>
    Recevez nos actualités et suivez l&apos;avancement de nos projets.
  </p>
  <NewsletterForm />
</div>
```

Add `NewsletterForm` as a sub-component inside `Footer.jsx`:
```jsx
function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) { toast.error('Email invalide'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (res.ok) { toast.success('Inscription confirmée ! Merci.'); setEmail(''); }
      else toast.error(data.error || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: '0.5rem' }}>
      <input type="email" placeholder="Votre e-mail" value={email} onChange={e => setEmail(e.target.value)}
        autoComplete="email" inputMode="email" required
        style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.65rem 0.9rem', color: '#fff', fontSize: '0.85rem', outline: 'none' }}
      />
      <button type="submit" className="btn-accent" aria-label="S'abonner" disabled={loading} style={{ padding: '0.65rem 1rem', borderRadius: 8, flexShrink: 0 }}>
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Commit**
```bash
git add src/app/api/newsletter/ src/components/Footer.jsx .gitignore
git commit -m "feat: newsletter subscription API route and wired footer form"
```

---

## Task 14: SEO — robots.txt + sitemap.xml + JSON-LD

**Files:**
- Create: `public/robots.txt`
- Create: `public/sitemap.xml`
- Modify: `src/app/layout.js`

- [ ] **Step 1: Create robots.txt**

`public/robots.txt`:
```
User-agent: *
Allow: /

Sitemap: https://palmeries-tighremt.org/sitemap.xml
```

- [ ] **Step 2: Create sitemap.xml**

`public/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://palmeries-tighremt.org/</loc><priority>1.0</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/mission</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/projets</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/don</loc><priority>0.9</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/actualites</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/galerie</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/evenements</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/faq</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/benevoles</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/equipe</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/histoire</loc><priority>0.7</priority><changefreq>monthly</changefreq></url>
  <url><loc>https://palmeries-tighremt.org/contact</loc><priority>0.8</priority><changefreq>monthly</changefreq></url>
</urlset>
```

- [ ] **Step 3: Add JSON-LD structured data to layout.js**

In `src/app/layout.js`, add inside `<head>`:
```jsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Association Palmeraies Tighremt",
  "alternateName": "Palmeraies Tighremt TATA",
  "url": "https://palmeries-tighremt.org",
  "logo": "https://palmeries-tighremt.org/logo.png",
  "description": "Association loi 1901 fondée en 2010. Sauvegarde de la palmeraie et développement du village de Tighremt, province de Tata, Maroc.",
  "foundingDate": "2010",
  "areaServed": { "@type": "Place", "name": "Tighremt, Tata, Maroc" },
  "contactPoint": { "@type": "ContactPoint", "email": "palmeraies.tighremt.tata@gmail.com", "contactType": "customer service" }
})}} />
```

- [ ] **Step 4: Commit**
```bash
git add public/robots.txt public/sitemap.xml src/app/layout.js
git commit -m "feat: SEO — robots.txt, sitemap.xml, JSON-LD structured data"
```

---

## Task 15: Search modal

**Files:**
- Create: `src/hooks/useSearch.js`
- Create: `src/components/ui/SearchModal.jsx`
- Modify: `src/components/Navbar.jsx`

- [ ] **Step 1: Create useSearch hook**

`src/hooks/useSearch.js`:
```js
import actualites from '@/data/actualites.json';
import faqData from '@/data/faq.json';

const INDEX = [
  { label: 'Accueil',     href: '/',           text: 'accueil association palmeraies tighremt' },
  { label: 'Mission',     href: '/mission',    text: 'mission objectifs environnement education' },
  { label: 'Projets',     href: '/projets',    text: 'projets irrigation plantation eau' },
  { label: 'Don',         href: '/don',        text: 'don faire un don soutenir financer' },
  { label: 'Actualités',  href: '/actualites', text: 'actualites news nouvelles' },
  { label: 'Galerie',     href: '/galerie',    text: 'galerie photos images' },
  { label: 'Événements',  href: '/evenements', text: 'evenements agenda calendrier' },
  { label: 'FAQ',         href: '/faq',        text: 'faq questions reponses' },
  { label: 'Bénévoles',   href: '/benevoles',  text: 'benevoles missions rejoindre' },
  { label: 'Contact',     href: '/contact',    text: 'contact adresse telephone email' },
  ...actualites.map(a => ({ label: a.titre, href: `/actualites/${a.id}`, text: a.titre + ' ' + a.extrait })),
  ...faqData.flatMap(s => s.questions.map(q => ({ label: q.q, href: '/faq', text: q.q + ' ' + q.r }))),
];

export function search(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return INDEX.filter(item =>
    item.text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q)
  ).slice(0, 8);
}
```

- [ ] **Step 2: Create SearchModal**

`src/components/ui/SearchModal.jsx`:
```jsx
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,26,18,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '8rem', padding: '8rem 1rem 2rem' }}
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
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1.25rem', textDecoration: 'none', borderBottom: `1px solid ${C.sandMid}`, transition: 'background 0.15s' }}
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
```

- [ ] **Step 3: Add search trigger to Navbar**

In `src/components/Navbar.jsx`:
```jsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import dynamic from 'next/dynamic';
const SearchModal = dynamic(() => import('./ui/SearchModal'), { ssr: false });
```

Add state: `const [searchOpen, setSearchOpen] = useState(false);`

Add search button after `<PillNav />`:
```jsx
<button onClick={() => setSearchOpen(true)} aria-label="Ouvrir la recherche"
  style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'rgba(232,131,42,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <Search size={15} color={transparent ? '#fff' : C.inkMuted} />
</button>
{searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
```

- [ ] **Step 4: Commit**
```bash
git add src/hooks/useSearch.js src/components/ui/SearchModal.jsx src/components/Navbar.jsx
git commit -m "feat: full-site search modal with keyboard navigation"
```

---

## Task 16: Language switcher (i18n scaffold)

**Files:**
- Create: `src/components/ui/LanguageSwitcher.jsx`
- Modify: `src/components/Navbar.jsx`

> Note: Full next-intl routing requires moving all routes under `src/app/[locale]/`. This task implements the UI switcher and scaffolds the i18n messages. Full route migration is a separate step to avoid breaking existing pages.

- [ ] **Step 1: Create language messages**

`src/i18n/messages/fr.json`:
```json
{
  "nav": { "home": "Accueil", "mission": "Mission", "projects": "Nos projets", "team": "Équipe", "history": "Histoire", "donate": "Don", "contact": "Contact", "news": "Actualités" },
  "home": { "hero_title": "Ensemble pour Tighremt", "hero_subtitle": "Sauvegardons la palmeraie" },
  "donate": { "cta": "Faire un don", "goal": "Objectif annuel" }
}
```

`src/i18n/messages/en.json`:
```json
{
  "nav": { "home": "Home", "mission": "Mission", "projects": "Our Projects", "team": "Team", "history": "History", "donate": "Donate", "contact": "Contact", "news": "News" },
  "home": { "hero_title": "Together for Tighremt", "hero_subtitle": "Protecting the palm grove" },
  "donate": { "cta": "Make a donation", "goal": "Annual goal" }
}
```

`src/i18n/messages/ar.json`:
```json
{
  "nav": { "home": "الرئيسية", "mission": "المهمة", "projects": "مشاريعنا", "team": "الفريق", "history": "التاريخ", "donate": "التبرع", "contact": "اتصل بنا", "news": "الأخبار" },
  "home": { "hero_title": "معاً من أجل تيغريمت", "hero_subtitle": "نحافظ على واحة النخيل" },
  "donate": { "cta": "تبرع الآن", "goal": "الهدف السنوي" }
}
```

- [ ] **Step 2: Create LanguageSwitcher**

`src/components/ui/LanguageSwitcher.jsx`:
```jsx
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
      <button onClick={() => setOpen(o => !o)} aria-label="Changer de langue"
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
```

- [ ] **Step 3: Add LanguageSwitcher to Navbar**

In `src/components/Navbar.jsx`, import and add:
```jsx
import LanguageSwitcher from './ui/LanguageSwitcher';
```
Add `<LanguageSwitcher />` next to `<DarkModeToggle />` in the navbar inner div.

- [ ] **Step 4: Commit**
```bash
git add src/i18n/ src/components/ui/LanguageSwitcher.jsx src/components/Navbar.jsx
git commit -m "feat: language switcher (FR/AR/EN) with RTL support and localStorage"
```

---

## Task 17: Install PWA prompt + 404 page

**Files:**
- Create: `src/components/ui/InstallPrompt.jsx`
- Create: `src/app/not-found.js`
- Modify: `src/app/layout.js`

- [ ] **Step 1: Create InstallPrompt**

`src/components/ui/InstallPrompt.jsx`:
```jsx
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
```

- [ ] **Step 2: Create 404 page**

`src/app/not-found.js`:
```jsx
import Link from 'next/link';
import { C } from '@/lib/tokens';

export const metadata = { title: '404 — Page introuvable | Tighremt' };

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', background: C.sand }}>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(5rem,15vw,10rem)', fontWeight: 600, color: C.sandDark, lineHeight: 1 }}>404</p>
      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.5rem,4vw,2.5rem)', color: C.greenDeep, margin: '0.5rem 0 1rem' }}>Page introuvable</h1>
      <p style={{ color: C.inkMuted, marginBottom: '2rem', maxWidth: 400 }}>La page que vous cherchez n&apos;existe pas ou a été déplacée.</p>
      <Link href="/" style={{ background: C.greenDeep, color: '#fff', padding: '0.8rem 2rem', borderRadius: 999, textDecoration: 'none', fontWeight: 600, fontSize: '0.92rem' }}>
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Mount InstallPrompt in layout.js**

Add import and mount before `</body>`:
```jsx
import InstallPrompt from '@/components/ui/InstallPrompt';
// ...
<InstallPrompt />
```

- [ ] **Step 4: Commit**
```bash
git add src/components/ui/InstallPrompt.jsx src/app/not-found.js src/app/layout.js
git commit -m "feat: PWA install prompt and custom 404 page"
```

---

## Task 18: Final — update Footer links + run dev build

**Files:**
- Modify: `src/components/Footer.jsx`
- Modify: `src/components/Navbar.jsx`

- [ ] **Step 1: Update Footer quickLinks**

In `src/components/Footer.jsx`, replace `quickLinks` array:
```js
const quickLinks = [
  { label: 'Accueil',      href: '/' },
  { label: 'Mission',      href: '/mission' },
  { label: 'Nos projets',  href: '/projets' },
  { label: 'Actualités',   href: '/actualites' },
  { label: 'Galerie',      href: '/galerie' },
  { label: 'Événements',   href: '/evenements' },
  { label: 'Bénévoles',    href: '/benevoles' },
  { label: 'FAQ',          href: '/faq' },
  { label: 'Faire un don', href: '/don' },
  { label: 'Contact',      href: '/contact' },
];
```

- [ ] **Step 2: Update Navbar NAV_ITEMS**

In `src/components/Navbar.jsx`, update NAV_ITEMS:
```js
const NAV_ITEMS = [
  { label: 'Accueil',     href: '/' },
  { label: 'Actualités',  href: '/actualites' },
  { label: 'Mission',     href: '/mission' },
  { label: 'Projets',     href: '/projets' },
  { label: 'Galerie',     href: '/galerie' },
  { label: 'Don',         href: '/don' },
  { label: 'Contact',     href: '/contact' },
];
```

- [ ] **Step 3: Run dev server and verify**

```bash
cd "C:/Users/abdel/Desktop/CLAUDE PROJECTS"
npm run dev
```

Visit and verify each route:
- `http://localhost:3000` — Home with WhatsApp button + BackToTop
- `http://localhost:3000/actualites` — News grid
- `http://localhost:3000/galerie` — Masonry gallery
- `http://localhost:3000/faq` — Accordion FAQ
- `http://localhost:3000/benevoles` — Volunteer form
- `http://localhost:3000/evenements` — Events calendar
- `http://localhost:3000/don` — Donation progress bar
- `http://localhost:3000/contact` — Map
- Dark mode toggle works
- Language switcher changes `dir` attribute for Arabic

- [ ] **Step 4: Final commit**

```bash
git add src/components/Footer.jsx src/components/Navbar.jsx
git commit -m "feat: update nav and footer links for all new pages"
git tag v2.0.0 -m "Full feature release — PWA, dark mode, i18n, 6 new pages, global UI"
```

---

## Summary of all changes

| Feature | Files | Task |
|---|---|---|
| PWA | manifest.json, sw.js, layout.js | 2 |
| Dark mode | useDarkMode.js, DarkModeToggle.jsx, globals.css | 3 |
| WhatsApp + BackToTop | WhatsAppButton.jsx, BackToTop.jsx | 4 |
| Cookie + Toast | CookieBanner.jsx, Toast.jsx, useToast.js | 5 |
| Static data | 5 JSON files in src/data/ | 6 |
| Actualités | ActualitesContent.jsx, ArticleContent.jsx | 7 |
| FAQ | FaqContent.jsx | 8 |
| Galerie | GalerieContent.jsx | 9 |
| Événements + Bénévoles + Partenaires | 3 content files | 10 |
| Map Leaflet | MapLeaflet.jsx, ContactContent.jsx | 11 |
| Donation progress + QR | DonationProgress.jsx, DonContent.jsx | 12 |
| Newsletter API | /api/newsletter/route.js, Footer.jsx | 13 |
| SEO | robots.txt, sitemap.xml, JSON-LD | 14 |
| Search | useSearch.js, SearchModal.jsx | 15 |
| Language switcher | LanguageSwitcher.jsx, i18n messages | 16 |
| Install prompt + 404 | InstallPrompt.jsx, not-found.js | 17 |
| Nav/Footer links | Navbar.jsx, Footer.jsx | 18 |
