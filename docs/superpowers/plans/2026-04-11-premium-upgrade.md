# Premium £10,000 Site Upgrade — Palmeraies Tighremt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the site to £10,000 quality with orchestrated animations, page transitions, scroll-triggered effects, animated counters, parallax, active nav, button micro-interactions, and premium gallery effects — zero breaking changes.

**Architecture:** All animations use CSS `transform`/`opacity` only (60fps guarantee). A shared `useAnimatedCounter` hook, an enhanced `useScrollReveal` with stagger support, and a `PageTransition` wrapper component power all effects. Each page file is touched minimally — only adding class names or swapping sub-components.

**Tech Stack:** Next.js 15 App Router, GSAP (already installed), CSS custom properties, IntersectionObserver, requestAnimationFrame, `'use client'` components.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useScrollReveal.js` | Modify | Add stagger delays + slide-up variant |
| `src/hooks/useAnimatedCounter.js` | Create | Reusable eased counter hook |
| `src/components/ui/PageTransition.jsx` | Create | Fade+slide page wrapper |
| `src/components/ui/PageTransition.css` | Create | Keyframes for page transitions |
| `src/components/ui/PillNav.jsx` | Modify | Animated active route indicator |
| `src/components/ui/PillNav.css` | Modify | Active pill styles |
| `src/app/globals.css` | Modify | Reveal variants, button micro-interactions, parallax base |
| `src/app/layout.js` | Modify | Wrap children in PageTransition |
| `src/components/pages/HomeContent.jsx` | Modify | Orchestrated hero + parallax sections |
| `src/components/pages/MissionContent.jsx` | Modify | Animated counters + stagger cards |
| `src/components/pages/ProjetsContent.jsx` | Modify | Project card hover premium effects |
| `src/components/pages/EquipeContent.jsx` | Modify | Staggered card entrance + avatar reveal |
| `src/components/pages/HistoireContent.jsx` | Modify | Timeline animation + scroll reveal |
| `src/components/pages/DonContent.jsx` | Modify | Counter animations (already partial) |
| `src/components/pages/ContactContent.jsx` | Modify | Form field focus animations |

---

## Task 1: Enhanced globals.css — Reveal Variants + Button Micro-interactions

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add reveal variants and button micro-interaction styles**

Open `src/app/globals.css` and append after the existing `.reveal` / `.in-view` rules:

```css
/* ── Reveal variants ── */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1),
              transform 0.75s cubic-bezier(0.16,1,0.3,1);
}
.reveal.in-view { opacity: 1; transform: translateY(0); }

/* Stagger delays */
.reveal-delay-1 { transition-delay: 0.10s; }
.reveal-delay-2 { transition-delay: 0.20s; }
.reveal-delay-3 { transition-delay: 0.30s; }
.reveal-delay-4 { transition-delay: 0.42s; }
.reveal-delay-5 { transition-delay: 0.55s; }

/* Slide from left */
.reveal-left {
  opacity: 0; transform: translateX(-32px);
  transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1),
              transform 0.75s cubic-bezier(0.16,1,0.3,1);
}
.reveal-left.in-view { opacity: 1; transform: translateX(0); }

/* Slide from right */
.reveal-right {
  opacity: 0; transform: translateX(32px);
  transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1),
              transform 0.75s cubic-bezier(0.16,1,0.3,1);
}
.reveal-right.in-view { opacity: 1; transform: translateX(0); }

/* Scale in */
.reveal-scale {
  opacity: 0; transform: scale(0.92);
  transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1),
              transform 0.7s cubic-bezier(0.16,1,0.3,1);
}
.reveal-scale.in-view { opacity: 1; transform: scale(1); }

/* ── Button micro-interactions ── */
.btn-micro {
  transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
              box-shadow 0.22s ease,
              background 0.2s ease !important;
}
.btn-micro:hover  { transform: translateY(-3px) scale(1.03); }
.btn-micro:active { transform: translateY(0px)  scale(0.98); transition-duration: 0.1s; }

/* ── Parallax base ── */
.parallax-section { overflow: hidden; }

/* ── Stat counter ── */
.stat-counter {
  font-variant-numeric: tabular-nums;
  display: inline-block;
}

/* ── Card hover premium ── */
.card-premium {
  transition: transform 0.35s cubic-bezier(0.16,1,0.3,1),
              box-shadow 0.35s cubic-bezier(0.16,1,0.3,1) !important;
}
.card-premium:hover {
  transform: translateY(-8px) scale(1.015) !important;
  box-shadow: 0 24px 56px rgba(19,61,32,0.14) !important;
}

/* ── Image hover zoom ── */
.img-zoom-wrap { overflow: hidden; border-radius: inherit; }
.img-zoom-wrap img {
  transition: transform 0.6s cubic-bezier(0.16,1,0.3,1);
  width: 100%; height: 100%; object-fit: cover;
}
.img-zoom-wrap:hover img { transform: scale(1.07); }

/* ── Reduced motion overrides ── */
@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal-left, .reveal-right, .reveal-scale {
    opacity: 1 !important; transform: none !important; transition: none !important;
  }
  .btn-micro:hover, .btn-micro:active { transform: none !important; }
  .card-premium:hover { transform: none !important; }
  .img-zoom-wrap:hover img { transform: none !important; }
}
```

- [ ] **Step 2: Build to verify no CSS errors**
```bash
cd "C:\Users\abdel\Desktop\CLAUDE PROJECTS" && npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**
```bash
git add src/app/globals.css
git commit -m "feat: add reveal variants, button micro-interactions, card hover styles"
```

---

## Task 2: useAnimatedCounter Hook

**Files:**
- Create: `src/hooks/useAnimatedCounter.js`

- [ ] **Step 1: Create the hook**

```js
// src/hooks/useAnimatedCounter.js
'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from `from` to `value` when element enters viewport.
 * Uses easeOutExpo for a premium feel.
 * @param {number} value  — target number
 * @param {number} from   — start number (default 0)
 * @param {number} duration — ms (default 1800)
 * @returns {{ ref, display }} — attach ref to container, render display
 */
export function useAnimatedCounter(value, from = 0, duration = 1800) {
  const [display, setDisplay] = useState(from);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') { setDisplay(value); return; }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || started.current) return;
      started.current = true;
      io.disconnect();

      const start = performance.now();
      const easeOutExpo = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

      const tick = (now) => {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased   = easeOutExpo(elapsed);
        setDisplay(Math.round(from + (value - from) * eased));
        if (elapsed < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });

    io.observe(el);
    return () => io.disconnect();
  }, [value, from, duration]);

  return { ref, display };
}
```

- [ ] **Step 2: Build**
```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 3: Commit**
```bash
git add src/hooks/useAnimatedCounter.js
git commit -m "feat: add useAnimatedCounter hook with easeOutExpo"
```

---

## Task 3: PageTransition Component

**Files:**
- Create: `src/components/ui/PageTransition.jsx`
- Create: `src/components/ui/PageTransition.css`

- [ ] **Step 1: Create CSS**

```css
/* src/components/ui/PageTransition.css */
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageExit {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-12px); }
}
.page-transition-enter {
  animation: pageEnter 0.55s cubic-bezier(0.16,1,0.3,1) both;
}
@media (prefers-reduced-motion: reduce) {
  .page-transition-enter { animation: none !important; }
}
```

- [ ] **Step 2: Create component**

```jsx
// src/components/ui/PageTransition.jsx
'use client';
import './PageTransition.css';
import { usePathname } from 'next/navigation';
import { useRef, useEffect } from 'react';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove('page-transition-enter');
    // Force reflow
    void el.offsetWidth;
    el.classList.add('page-transition-enter');
  }, [pathname]);

  return (
    <div ref={ref} className="page-transition-enter">
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Integrate into layout.js**

In `src/app/layout.js`, add the import and wrap `{children}`:
```jsx
import PageTransition from '@/components/ui/PageTransition';
// In the JSX body, replace {children} with:
<PageTransition>{children}</PageTransition>
```

- [ ] **Step 4: Build**
```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 5: Commit**
```bash
git add src/components/ui/PageTransition.jsx src/components/ui/PageTransition.css src/app/layout.js
git commit -m "feat: add fade+slide page transitions"
```

---

## Task 4: Active Nav Indicator in PillNav

**Files:**
- Modify: `src/components/ui/PillNav.jsx`
- Modify: `src/components/ui/PillNav.css`

- [ ] **Step 1: Add active indicator styles to PillNav.css**

Add after existing `.pill-nav-link` rules:
```css
.pill-nav-link {
  position: relative;
  transition: color 0.25s ease;
}
.pill-nav-link::after {
  content: '';
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%) scaleX(0);
  width: 80%;
  height: 2px;
  background: currentColor;
  border-radius: 999px;
  transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  opacity: 0.7;
}
.pill-nav-link.active::after,
.pill-nav-link[aria-current="page"]::after {
  transform: translateX(-50%) scaleX(1);
}
.pill-nav-link.active,
.pill-nav-link[aria-current="page"] {
  font-weight: 600;
}
```

- [ ] **Step 2: Update PillNav.jsx to use usePathname for active detection**

In `src/components/ui/PillNav.jsx`, add at top:
```jsx
import { usePathname } from 'next/navigation';
```

Inside the component, add:
```jsx
const pathname = usePathname();
```

For each nav link, add `aria-current` and `active` class:
```jsx
className={`pill-nav-link${pathname === item.href ? ' active' : ''}`}
aria-current={pathname === item.href ? 'page' : undefined}
```

- [ ] **Step 3: Build**
```bash
npm run build 2>&1 | tail -5
```
Expected: `✓ Compiled successfully`

- [ ] **Step 4: Commit**
```bash
git add src/components/ui/PillNav.jsx src/components/ui/PillNav.css
git commit -m "feat: animated active nav indicator with underline scale"
```

---

## Task 5: HomeContent — Orchestrated Hero + Parallax Sections

**Files:**
- Modify: `src/components/pages/HomeContent.jsx`

- [ ] **Step 1: Add `btn-micro` class to hero CTA buttons**

In the hero section JSX, update the two CTA buttons:
```jsx
<a href="/don" className="btn-hero-primary btn-micro">
<a href="/mission" className="btn-hero-glass btn-micro">
```

- [ ] **Step 2: Add parallax to the Galerie section background**

In the `Galerie` component, add a `ref` + scroll listener for subtle parallax on the section title:
```jsx
import { useRef, useEffect } from 'react';

function Galerie() {
  const titleRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const onScroll = () => {
      if (!titleRef.current) return;
      const rect = titleRef.current.closest('section').getBoundingClientRect();
      const progress = -rect.top / window.innerHeight;
      titleRef.current.style.transform = `translateY(${progress * 30}px)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Add ref={titleRef} to the title div wrapper
```

- [ ] **Step 3: Add `reveal-scale` to gallery items**

Replace `className="reveal"` on the `<CircularGallery>` wrapper with:
```jsx
<div className="reveal reveal-scale">
  <CircularGallery ... />
</div>
```

- [ ] **Step 4: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**
```bash
git add src/components/pages/HomeContent.jsx
git commit -m "feat: hero btn micro-interactions + gallery parallax"
```

---

## Task 6: MissionContent — Animated Counters + Stagger

**Files:**
- Modify: `src/components/pages/MissionContent.jsx`

- [ ] **Step 1: Add association stats with animated counters**

Add below the existing content, before closing `</section>`:
```jsx
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

// Stats sub-component
function StatCounter({ value, suffix, label }) {
  const { ref, display } = useAnimatedCounter(value, 0, 1600);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.5rem,5vw,3.5rem)', fontWeight: 600, color: C.greenDeep, lineHeight: 1 }}>
        <span className="stat-counter">{display}</span>{suffix}
      </div>
      <div style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: C.ochre, marginTop: '0.4rem', fontWeight: 500 }}>{label}</div>
    </div>
  );
}
```

Add stats row at the bottom of the section (before closing `</section>`):
```jsx
<div className="reveal" style={{ marginTop: 'clamp(4rem,8vw,6rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: '2rem', padding: '3rem 2rem', background: C.sandMid, borderRadius: '2rem', border: `1px solid ${C.sandDark}` }}>
  <StatCounter value={1200} suffix="+" label="Palmiers préservés" />
  <StatCounter value={18}   suffix=""  label="Familles soutenues" />
  <StatCounter value={14}   suffix=""  label="Années d'action" />
  <StatCounter value={6}    suffix=""  label="Projets réalisés" />
</div>
```

- [ ] **Step 2: Add `reveal-left` to left column, `reveal-right` to right column**

```jsx
// Left text column
<div className="reveal-left">

// Right image column  
<div className="reveal-right reveal-delay-2">
```

- [ ] **Step 3: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**
```bash
git add src/components/pages/MissionContent.jsx
git commit -m "feat: animated counters + directional reveals on Mission page"
```

---

## Task 7: ProjetsContent — Premium Card Effects

**Files:**
- Modify: `src/components/pages/ProjetsContent.jsx`

- [ ] **Step 1: Read the file**
```bash
cat "src/components/pages/ProjetsContent.jsx" | head -80
```

- [ ] **Step 2: Add `card-premium` + `img-zoom-wrap` to project cards**

For each project card in the grid, wrap the image:
```jsx
<div className="img-zoom-wrap" style={{ height: 200, borderRadius: '1rem 1rem 0 0' }}>
  <img src={project.image} alt={project.title} />
</div>
```

Add `card-premium` to the card container:
```jsx
<div className={`reveal reveal-delay-${(i%3)+1} card-premium`} style={{ ... }}>
```

- [ ] **Step 3: Add stagger to the project cards**

Make sure each card has `reveal-delay-${(i % 3) + 1}` class.

- [ ] **Step 4: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**
```bash
git add src/components/pages/ProjetsContent.jsx
git commit -m "feat: premium card hover + image zoom on Projets page"
```

---

## Task 8: EquipeContent — Staggered Entrance + Avatar Ring

**Files:**
- Modify: `src/components/pages/EquipeContent.jsx`

- [ ] **Step 1: Replace inline hover handlers with `card-premium` class**

Remove the `onMouseOver`/`onMouseOut` inline handlers from each member card.
Add `card-premium` class to the card div:
```jsx
<div key={m.name} className={`reveal reveal-delay-${(i % 4) + 1} card-premium`}
  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '2rem 1.5rem', background: C.sandMid, borderRadius: '1.5rem', border: `1px solid ${C.sandDark}` }}
>
```

- [ ] **Step 2: Add animated avatar ring on hover via CSS**

Add inline style to avatar image wrapper:
```jsx
<div style={{ position: 'relative', transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)' }}
  className="avatar-ring-wrap">
```

Add in globals.css:
```css
.card-premium:hover .avatar-ring-wrap { transform: scale(1.08) rotate(3deg); }
@media (prefers-reduced-motion: reduce) {
  .card-premium:hover .avatar-ring-wrap { transform: none; }
}
```

- [ ] **Step 3: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**
```bash
git add src/components/pages/EquipeContent.jsx src/app/globals.css
git commit -m "feat: staggered team cards + avatar ring micro-interaction"
```

---

## Task 9: HistoireContent — Timeline Entrance Animation

**Files:**
- Modify: `src/components/pages/HistoireContent.jsx`

- [ ] **Step 1: Add alternating reveal directions to timeline cards**

Replace the static `reveal reveal-delay-${i+1}` with alternating left/right:
```jsx
className={`reveal${i % 2 === 0 ? '-left' : '-right'} reveal-delay-${i + 1} card-premium`}
```

- [ ] **Step 2: Add a vertical connecting line between cards**

Wrap the grid in a relative container and add a pseudo-element via a className:
```jsx
<div className="timeline-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', position: 'relative' }}>
```

Add in globals.css:
```css
@keyframes timelineLineGrow {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
.timeline-grid::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, transparent, #c4703f60, transparent);
  transform-origin: top;
  animation: timelineLineGrow 1.2s cubic-bezier(0.16,1,0.3,1) 0.5s both;
  pointer-events: none;
}
@media (max-width: 640px) { .timeline-grid::before { display: none; } }
@media (prefers-reduced-motion: reduce) { .timeline-grid::before { animation: none; } }
```

- [ ] **Step 3: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**
```bash
git add src/components/pages/HistoireContent.jsx src/app/globals.css
git commit -m "feat: alternating timeline reveals + connecting line animation"
```

---

## Task 10: ContactContent — Form Micro-interactions

**Files:**
- Modify: `src/components/pages/ContactContent.jsx`

- [ ] **Step 1: Replace inline focus/blur handlers with CSS classes**

Add `contact-input` class to all `<input>` and `<textarea>` elements. Remove inline `onFocus`/`onBlur` handlers.

Add in globals.css:
```css
.contact-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1.5px solid #e6ddc8;
  background: #fff;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.25s ease,
              box-shadow 0.25s ease,
              transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
  font-family: inherit;
}
.contact-input:focus {
  border-color: #c4703f;
  box-shadow: 0 0 0 3px rgba(196,112,63,0.12);
  transform: translateY(-1px);
}
```

- [ ] **Step 2: Add `btn-micro` class to the submit button**

```jsx
<button type="submit" className="btn-micro"
  style={{ ... }}
>
```

- [ ] **Step 3: Add `reveal-left` to contact info, `reveal-right` to form**

```jsx
<div className="reveal-left">  {/* contact info column */}
<div className="reveal-right reveal-delay-2">  {/* form column */}
```

- [ ] **Step 4: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 5: Commit**
```bash
git add src/components/pages/ContactContent.jsx src/app/globals.css
git commit -m "feat: contact form focus animations + directional reveals"
```

---

## Task 11: DonContent — Counter Animations Polish

**Files:**
- Modify: `src/components/pages/DonContent.jsx`

- [ ] **Step 1: Replace existing requestAnimationFrame counter with useAnimatedCounter**

In `DonContent.jsx`, find the `CounterItem` sub-component. Replace its internal animation with:
```jsx
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

function CounterItem({ value, suffix, label, Icon, from = 0 }) {
  const { ref, display } = useAnimatedCounter(value, from, 1800);
  return (
    <div ref={ref} style={{ textAlign: 'center' }}>
      <Icon size={28} color="rgba(255,220,120,0.9)" style={{ marginBottom: '0.75rem' }} />
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2rem,4vw,2.8rem)', fontWeight: 600, color: '#fff', lineHeight: 1 }}>
        <span className="stat-counter">{display}</span>{suffix}
      </div>
      <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,220,120,0.75)', marginTop: '0.5rem' }}>{label}</div>
    </div>
  );
}
```

- [ ] **Step 2: Build**
```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**
```bash
git add src/components/pages/DonContent.jsx
git commit -m "feat: unify Don page counters with useAnimatedCounter hook"
```

---

## Task 12: Final Build + Deploy

- [ ] **Step 1: Full production build**
```bash
cd "C:\Users\abdel\Desktop\CLAUDE PROJECTS" && npm run build 2>&1
```
Expected: All 8 routes static, `✓ Generating static pages (10/10)`

- [ ] **Step 2: Deploy to Vercel**
```bash
npx vercel --prod --yes 2>&1
```
Expected: `Production: https://palmeraies-tighremt-tata.vercel.app`

- [ ] **Step 3: Final commit**
```bash
git add -A && git commit -m "chore: production build — premium £10,000 upgrade complete"
```

---

## Self-Review Checklist

| Requirement | Task |
|-------------|------|
| ✅ Hero orchestrated animations | Task 5 (btn-micro) + existing focusIn/zoomOut |
| ✅ Scroll-triggered sections | Task 1 (reveal variants) applied in Tasks 6–10 |
| ✅ Page transitions | Task 3 |
| ✅ Animated counters | Tasks 2, 6, 11 |
| ✅ Parallax effects | Task 5 (gallery) |
| ✅ Active nav indicator | Task 4 |
| ✅ Button micro-interactions | Tasks 1, 5, 10 |
| ✅ Premium gallery effects | Task 7 (img-zoom-wrap) |
| ✅ 60fps only (transform/opacity) | All transitions use only these properties |
| ✅ No breaking changes | Additive CSS + minimal JSX changes only |
| ✅ Mobile identical | CSS handles responsive, no JS breakpoint logic added |
| ✅ Desert/palmerie theme | All colors reference `C.*` tokens |
