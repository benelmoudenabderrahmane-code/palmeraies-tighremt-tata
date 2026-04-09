'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Newspaper, HandHeart, Users, Heart, ImageIcon } from 'lucide-react';
import { GlassDock } from './ui/glass-dock';

const DOCK_ITEMS = [
  { title: 'Accueil',     href: '/',        icon: Home },
  { title: 'Mission',     href: '/mission', icon: Newspaper },
  { title: 'Nos projets', href: '/projets', icon: HandHeart },
  { title: 'Équipe',      href: '/equipe',  icon: Users },
  { title: 'Don',         href: '/don',     icon: Heart },
  { title: 'Galerie',     href: '/#galerie',icon: ImageIcon },
];

export default function FloatingDock() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : 100}px)`,
      opacity: visible ? 1 : 0,
      transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
      zIndex: 200,
    }}>
      <GlassDock items={DOCK_ITEMS} />
    </div>
  );
}
