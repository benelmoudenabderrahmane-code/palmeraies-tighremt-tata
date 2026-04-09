'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import PillNav from './ui/PillNav';
import { C } from '@/lib/tokens';

const NAV_ITEMS = [
  { label: 'Accueil',     href: '/' },
  { label: 'Mission',     href: '/mission' },
  { label: 'Nos projets', href: '/projets' },
  { label: 'Équipe',      href: '/equipe' },
  { label: 'Histoire',    href: '/histoire' },
  { label: 'Don',         href: '/don' },
  { label: 'Contact',     href: '/contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Transparent only on home page before scroll, opaque on all other pages
  const transparent = isHome && !scrolled;

  // Determine active href: exact match or prefix match for sub-routes
  const activeHref = NAV_ITEMS.reduce((found, item) => {
    if (item.href === '/' && pathname === '/') return item.href;
    if (item.href !== '/' && pathname.startsWith(item.href)) return item.href;
    return found;
  }, '/');

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: transparent ? 'transparent' : 'rgba(250,247,240,0.96)',
      backdropFilter: transparent ? 'none' : 'blur(14px)',
      boxShadow: transparent ? 'none' : '0 1px 0 rgba(196,112,63,0.15)',
      transition: 'background 0.35s, box-shadow 0.35s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <PillNav
          logo="/logo.png"
          logoAlt="Association Palmeraies Tighremt"
          logoName="Association Palmeraies Tighremt"
          logoSubtitle="TATA · Maroc"
          items={NAV_ITEMS}
          activeHref={activeHref}
          baseColor={transparent ? '#fff' : C.inkMuted}
          pillColor={transparent ? 'rgba(255,255,255,0.15)' : C.greenDeep}
          hoveredPillTextColor={transparent ? C.greenDeep : '#fff'}
          ease="power3.out"
          initialLoadAnimation={false}
        />
      </div>
    </div>
  );
}
