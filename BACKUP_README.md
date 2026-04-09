# Sauvegarde originale — Vite/React → Next.js 14 migration

> ⚠️ NE PAS MODIFIER CES FICHIERS

## Fichiers sauvegardés

| Fichier sauvegarde | Fichier original | Description |
|---|---|---|
| `src/LandingPage.backup.jsx` | `src/LandingPage.jsx` | Landing page one-page originale (Vite/React) |
| `src/components/ui/PillNavOriginal.jsx` | `src/components/ui/PillNav.jsx` | Navbar PillNav originale avec ancres `#` |

## Note technique importante

Le projet d'origine est un **SPA Vite + React**, PAS un projet Next.js.
La migration consiste à convertir l'ensemble du projet vers **Next.js 14 App Router**.

## Pour restaurer

```bash
cp src/LandingPage.backup.jsx src/LandingPage.jsx
cp src/components/ui/PillNavOriginal.jsx src/components/ui/PillNav.jsx
```
