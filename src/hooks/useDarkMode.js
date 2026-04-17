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
