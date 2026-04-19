# Animations Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development

**Goal:** Integrate 4 premium animation components into the Palmeraies Tighremt Next.js site.

**Architecture:** Each animation is an isolated `src/components/ui/` file (JSX, no TS). They are consumed by `ProjetsContent.jsx` (Tasks 1-3) and `EquipeContent.jsx` (Task 4).

**Tech Stack:** Framer Motion, Tailwind CSS (via globals), inline styles, C tokens, cn() from @/lib/utils.

---

## Task 1 — ImageComparison.jsx (replaces BeforeAfterPixel)
**Files:** Create `src/components/ui/ImageComparison.jsx`, Modify `src/components/pages/ProjetsContent.jsx`

## Task 2 — ProjectsFlipHero.jsx (FlipCard scatter→arc hero)
**Files:** Create `src/components/ui/ProjectsFlipHero.jsx`, Modify `src/components/pages/ProjetsContent.jsx`

## Task 3 — TextEffect.jsx (animated word/char text)
**Files:** Create `src/components/ui/TextEffect.jsx`, Modify `src/components/pages/ProjetsContent.jsx`

## Task 4 — TeamCarousel.jsx (StaggerTestimonials → team members)
**Files:** Create `src/components/ui/TeamCarousel.jsx`, Modify `src/components/pages/EquipeContent.jsx`
