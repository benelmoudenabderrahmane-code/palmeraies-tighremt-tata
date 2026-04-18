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
    void el.offsetWidth; // force reflow
    el.classList.add('page-transition-enter');
  }, [pathname]);

  return (
    <div ref={ref} className="page-transition-enter">
      {children}
    </div>
  );
}
