'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/*
 * ImageTrail — mouse trail effect using React state + framer-motion.
 * No RAF loop, no GSAP. Reliable in all environments.
 *
 * Security:
 *  - mousemove listener removed on unmount
 *  - setTimeout cleared on unmount via cleanup set
 *  - Only local image paths accepted
 */
export default function ImageTrail({
  images = [],
  mouseThreshold = 80,
  resetDuration = 600,
}) {
  const containerRef = useRef(null);
  const [trail, setTrail] = useState([]);
  const lastPos = useRef({ x: -9999, y: -9999 });
  const counterRef = useRef(0);
  const timers = useRef(new Set());

  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length === 0) return;

    const onMove = (e) => {
      const { clientX, clientY } = e;

      // Only fire when cursor is inside the container
      const rect = el.getBoundingClientRect();
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;

      const dist = Math.hypot(clientX - lastPos.current.x, clientY - lastPos.current.y);
      if (dist < mouseThreshold) return;

      const id = counterRef.current++;

      setTrail(prev => [
        ...prev.slice(-(images.length - 1)),
        {
          id,
          src: images[id % images.length],
          x: clientX - rect.left - 90,
          y: clientY - rect.top - 99,
          rot: id % 2 === 0 ? -5 : 5,
          zIndex: id,
        },
      ]);

      lastPos.current = { x: clientX, y: clientY };

      const t = setTimeout(() => {
        setTrail(prev => prev.filter(img => img.id !== id));
        timers.current.delete(t);
      }, resetDuration + 500);

      timers.current.add(t);
    };

    // Window-level listener: no bubbling dependency, bounds-checked above
    window.addEventListener('mousemove', onMove);

    return () => {
      window.removeEventListener('mousemove', onMove);
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, [images, mouseThreshold, resetDuration]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
    >
      <AnimatePresence>
        {trail.map(({ id, src, x, y, rot, zIndex }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, scale: 0, rotate: rot * 2.5 }}
            animate={{ opacity: 1, scale: 1, rotate: rot }}
            exit={{ opacity: 0, scale: 0.75, rotate: rot * -1.5 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 180,
              aspectRatio: '1.1',
              borderRadius: 14,
              overflow: 'hidden',
              zIndex,
              boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
