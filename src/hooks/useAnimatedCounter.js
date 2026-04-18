'use client';
import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from `from` to `value` when element enters viewport.
 * Uses easeOutExpo for a premium feel.
 * @param {number} value    — target number
 * @param {number} from     — start number (default 0)
 * @param {number} duration — ms (default 1800)
 */
export function useAnimatedCounter(value, from = 0, duration = 1800) {
  const [display, setDisplay] = useState(from);
  const ref     = useRef(null);
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
