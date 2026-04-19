'use client';
import './PageTransition.css';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * PageTransitionController — does NOT wrap children.
 * It imperatively toggles the CSS class on the existing <main> element
 * so the server component tree stays free of any client boundary.
 */
export default function PageTransitionController() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.classList.remove('page-transition-enter');
    // Force reflow so removing + re-adding the class triggers the animation
    void main.offsetWidth;
    main.classList.add('page-transition-enter');
  }, [pathname]);

  return null;
}
