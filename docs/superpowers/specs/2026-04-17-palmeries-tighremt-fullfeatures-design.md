# Design Spec — Palmeries Tighremt Tata : Application Complète
**Date :** 2026-04-17  
**Statut :** Approuvé  
**Stack :** Next.js 15, React 19, Tailwind CSS v4, GSAP, Framer Motion

---

## 1. Vue d'ensemble

Enrichissement complet du site de l'Association Palmeraies Tighremt Tata avec toutes les fonctionnalités manquantes pour en faire une application web de niveau professionnel, installable sur mobile (PWA), multilingue (FR/AR/EN), et dotée de toutes les fonctionnalités attendues d'une association moderne.

---

## 2. Fonctionnalités — Liste exhaustive

### 2.1 PWA (Progressive Web App)
- `public/manifest.json` avec icônes 192x192 et 512x512
- Service worker (`public/sw.js`) : cache offline des pages principales
- Meta tags PWA dans `layout.js` (theme-color, apple-touch-icon, etc.)
- Bannière d'installation personnalisée (hook `useInstallPrompt`)
- Fonctionne sur iOS Safari et Android Chrome

### 2.2 Internationalisation (i18n) — FR / AR / EN
- Librairie : `next-intl`
- Structure : `/src/i18n/messages/{fr,ar,en}.json`
- Routing : `/fr/...`, `/ar/...`, `/en/...` (middleware next-intl)
- RTL automatique pour l'arabe (attribut `dir="rtl"` sur `<html>`)
- Switcher de langue dans la Navbar (drapeaux + libellé)
- Traduction de toutes les pages et composants
- Polices : Noto Sans Arabic pour l'arabe

### 2.3 Mode sombre (Dark Mode)
- Toggle dans la Navbar (icône soleil/lune)
- Détection automatique `prefers-color-scheme`
- Persistance en `localStorage`
- Variables CSS pour tous les tokens de couleur
- Transition fluide (200ms)

### 2.4 Nouvelles pages

#### `/actualites` — Actualités / Blog
- Grille d'articles avec image, titre, date, extrait
- Page article individuelle avec partage social
- Données statiques JSON (pas de CMS requis)
- Filtres par catégorie (environnement, projets, événements)

#### `/galerie` — Galerie complète
- Layout masonry responsive (composant Masonry existant)
- Lightbox avec navigation clavier (composant Lightbox existant)
- Filtres par thème (palmeraie, village, projets, événements)
- Upload communautaire (formulaire de soumission par email)

#### `/evenements` — Événements
- Calendrier des événements à venir
- Carte d'événement : date, lieu, description, lien d'inscription
- Données statiques JSON

#### `/faq` — Questions fréquentes
- Accordéon animé (Framer Motion)
- Catégories : association, dons, bénévolat, projets

#### `/benevoles` — Bénévolat
- Formulaire de candidature bénévole
- Liste des missions disponibles
- Témoignages de bénévoles

#### `/partenaires` — Partenaires
- Logos partenaires en défilement (marquee animé)
- Description de chaque partenaire

### 2.5 Sections ajoutées aux pages existantes

#### Page Accueil (`/`)
- Compteur de dons animé (objectif annuel)
- Section Actualités récentes (3 dernières)
- Bouton WhatsApp flottant
- Section Partenaires (marquee logos)
- Témoignages carousel (donateurs/bénévoles)

#### Page Don (`/don`)
- Barre de progression objectif annuel (ex: 12 450€ / 20 000€)
- Impact calculator : "Avec X€, vous financez Y"
- QR Code pour virement bancaire
- Top donateurs anonymes (avatars + montants)

#### Page Projets (`/projets`)
- Barres de progression par projet (% réalisé)
- Filtre par statut (en cours, terminé, planifié)
- Before/After slider (composant BeforeAfterPixel existant)

#### Page Histoire (`/histoire`)
- Timeline améliorée avec images
- Compteurs animés plus visibles

#### Page Contact (`/contact`)
- Carte interactive Leaflet.js (localisation Tighremt, Maroc)
- Bouton WhatsApp direct
- Horaires de disponibilité

### 2.6 Composants transversaux

#### Bouton WhatsApp flottant
- Fixé en bas à droite
- Numéro configurable via variable d'environnement
- Tooltip "Contactez-nous sur WhatsApp"
- Animation pulse

#### Bouton "Retour en haut"
- Apparaît après 300px de scroll
- Animation smooth
- Fixé en bas à droite (au-dessus du dock)

#### Bannière cookie RGPD
- Première visite uniquement
- Boutons : Accepter / Refuser / Paramètres
- Persistance localStorage

#### Toast notifications
- Système de notifications (succès, erreur, info)
- Utilisé sur formulaires contact, don, newsletter
- Composant `useToast` hook + `<ToastContainer>`

#### Newsletter
- Formulaire dans le Footer (déjà présent, à rendre fonctionnel)
- Validation email côté client
- Envoi vers API route Next.js `/api/newsletter`
- Stockage en JSON local (pas de service tiers requis)

#### Barre de recherche
- Icône loupe dans la Navbar
- Modal de recherche full-screen
- Recherche dans titres des pages, projets, actualités
- Données indexées statiquement

### 2.7 SEO & Technique

- `public/robots.txt` — autorisation des crawlers
- `public/sitemap.xml` — toutes les URLs
- JSON-LD structured data (Organisation + NonProfit) dans layout
- Open Graph images par page
- Meta description sur toutes les pages
- Canonical URLs
- `next/image` optimisé sur toutes les images

### 2.8 Performance

- Lazy loading sur toutes les images (déjà partiel, compléter)
- `loading="lazy"` sur les iframes (carte, vidéos)
- Bundle splitting par route (Next.js default)
- Polices optimisées via `next/font`
- Préchargement des images hero

### 2.9 Accessibilité

- `aria-label` sur tous les boutons icônes
- `aria-live` pour les mises à jour dynamiques (compteurs, toasts)
- Navigation complète au clavier
- Contrastes WCAG AA vérifiés
- `alt` sur toutes les images

### 2.10 Analytics (optionnel, privacy-first)

- Intégration Plausible Analytics (script léger, sans cookies)
- Ou Umami (self-hosted)
- Événements trackés : clics don, inscription newsletter, partages

---

## 3. Architecture technique

### Structure des fichiers nouveaux

```
src/
├── app/
│   ├── [locale]/              # Routing i18n next-intl
│   │   ├── layout.js
│   │   ├── page.js
│   │   ├── actualites/
│   │   ├── galerie/
│   │   ├── evenements/
│   │   ├── faq/
│   │   ├── benevoles/
│   │   └── partenaires/
│   └── api/
│       └── newsletter/route.js
├── i18n/
│   ├── messages/
│   │   ├── fr.json
│   │   ├── ar.json
│   │   └── en.json
│   └── routing.js
├── components/
│   ├── pages/
│   │   ├── ActualitesContent.jsx
│   │   ├── GalerieContent.jsx
│   │   ├── EvenementsContent.jsx
│   │   ├── FaqContent.jsx
│   │   ├── BenevolesContent.jsx
│   │   └── PartenairesContent.jsx
│   └── ui/
│       ├── WhatsAppButton.jsx
│       ├── BackToTop.jsx
│       ├── CookieBanner.jsx
│       ├── Toast.jsx
│       ├── SearchModal.jsx
│       ├── DarkModeToggle.jsx
│       ├── LanguageSwitcher.jsx
│       ├── DonationProgress.jsx
│       ├── MapLeaflet.jsx
│       └── InstallPrompt.jsx
├── hooks/
│   ├── useToast.js
│   ├── useDarkMode.js
│   ├── useInstallPrompt.js
│   └── useSearch.js
└── data/
    ├── actualites.json
    ├── evenements.json
    ├── partenaires.json
    ├── faq.json
    └── missions-benevoles.json

public/
├── manifest.json
├── sw.js
├── robots.txt
├── sitemap.xml
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

### Dépendances à installer

```bash
npm install next-intl leaflet react-leaflet qrcode.react
```

### Variables d'environnement

```env
NEXT_PUBLIC_WHATSAPP_NUMBER=+33XXXXXXXXX
NEXT_PUBLIC_DONATION_GOAL=20000
NEXT_PUBLIC_DONATION_CURRENT=12450
NEXT_PUBLIC_SITE_URL=https://palmeries-tighremt.org
```

---

## 4. Ordre d'implémentation (priorité)

1. **PWA** — manifest + service worker (impact immédiat mobile)
2. **Dark Mode** — toggle + CSS variables
3. **Composants transversaux** — WhatsApp, BackToTop, Cookie, Toast
4. **Nouvelles pages** — Actualités, Galerie, FAQ, Bénévoles, Événements, Partenaires
5. **Améliorations pages existantes** — Don progress, carte contact, projets before/after
6. **i18n (FR/AR/EN)** — next-intl routing + traductions
7. **SEO** — robots, sitemap, JSON-LD
8. **Newsletter API** — route + validation
9. **Recherche** — SearchModal + indexation statique
10. **Performance & Accessibilité** — audit final

---

## 5. Contraintes

- Zéro service payant requis (tout gratuit / open source)
- Compatibilité Next.js 15 App Router
- Pas de base de données (données statiques JSON)
- Maintien des animations existantes
- Mobile-first sur toutes les nouvelles pages
