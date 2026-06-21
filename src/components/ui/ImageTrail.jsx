'use client';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import './ImageTrail.css';

const getPos = (e) => ({ x: e.clientX, y: e.clientY });

/*
 * ImageTrail — mouse trail animation (adapted from React Bits, open-source)
 *
 * Props:
 *  images        : string[]  — local image URLs only (no external URLs)
 *  variant       : 1–8       — animation style
 *  mouseThreshold: number    — px distance before next image shown (default 80)
 *  resetDuration : number    — ms before image fades out (default 500)
 *
 * Security notes:
 *  - RAF cancelled on unmount via _destroyed flag
 *  - mousemove listener removed on unmount
 *  - DOM elements cleaned up on unmount
 *  - Listener attached to parentElement so pointer-events:none still works
 */
export default function ImageTrail({
  images = [],
  variant = 1,
  mouseThreshold = 80,
  resetDuration = 500,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || images.length === 0) return;

    let _destroyed = false;
    let rafId = null;
    let zIndex = 1;
    let ctr = 0;
    let mouse = { x: -9999, y: -9999 };
    let lastMouse = { x: -9999, y: -9999 };

    // Pre-build DOM nodes for all images
    const imgEls = images.map((src) => {
      const wrap = document.createElement('div');
      wrap.className = 'content__img';
      const inner = document.createElement('div');
      inner.className = 'content__img-inner';
      inner.style.backgroundImage = `url(${src})`;
      wrap.appendChild(inner);
      el.appendChild(wrap);
      return { wrap, inner };
    });

    function showImg({ wrap, inner }, x, y) {
      const rect = el.getBoundingClientRect();
      wrap.style.left = `${x - rect.left - 95}px`;
      wrap.style.top = `${y - rect.top - 104}px`;
      wrap.style.zIndex = String(zIndex++);

      gsap.killTweensOf([wrap, inner]);
      const delay = resetDuration / 1000;

      if (variant === 1) {
        gsap.fromTo(wrap,
          { opacity: 0, scale: 0, rotate: gsap.utils.random(-15, 15) },
          { opacity: 1, scale: 1, rotate: gsap.utils.random(-5, 5), duration: 0.4, ease: 'power3.out',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, scale: 0.8, duration: 0.4, delay }); } }
        );
        gsap.fromTo(inner, { scale: 1.8 }, { scale: 1, duration: 0.8, ease: 'power2.out' });
      } else if (variant === 2) {
        gsap.fromTo(wrap,
          { opacity: 0, scale: 0.6, y: 30, rotate: gsap.utils.random(-20, 20) },
          { opacity: 1, scale: 1, y: 0, rotate: gsap.utils.random(-8, 8), duration: 0.5, ease: 'back.out(1.4)',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, y: -20, duration: 0.5, delay }); } }
        );
      } else if (variant === 3) {
        gsap.fromTo(wrap,
          { opacity: 0, scale: 1.4, filter: 'blur(8px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.55, ease: 'power2.out',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, filter: 'blur(6px)', scale: 0.9, duration: 0.45, delay }); } }
        );
      } else if (variant === 4) {
        gsap.fromTo(wrap,
          { opacity: 0, skewX: 20, scale: 0.8 },
          { opacity: 1, skewX: 0, scale: 1, duration: 0.4, ease: 'power3.out',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, skewX: -15, duration: 0.35, delay }); } }
        );
        gsap.fromTo(inner, { scale: 1.4 }, { scale: 1, duration: 0.7, ease: 'power2.out' });
      } else if (variant === 5) {
        gsap.fromTo(wrap,
          { opacity: 0, x: -30, rotate: -10 },
          { opacity: 1, x: 0, rotate: gsap.utils.random(-6, 6), duration: 0.4, ease: 'power2.out',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, x: 30, duration: 0.35, delay }); } }
        );
        gsap.fromTo(inner, { scale: 1.4 }, { scale: 1, duration: 0.7, ease: 'power1.out' });
      } else if (variant === 6) {
        gsap.fromTo(wrap,
          { opacity: 0, y: -40, scale: 0.7 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, y: 20, scale: 0.8, duration: 0.4, delay }); } }
        );
      } else if (variant === 7) {
        gsap.fromTo(wrap,
          { opacity: 0, scale: 0.5, rotate: 45 },
          { opacity: 1, scale: 1, rotate: gsap.utils.random(-5, 5), duration: 0.5, ease: 'power3.out',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, scale: 0.6, rotate: -30, duration: 0.4, delay }); } }
        );
        gsap.fromTo(inner, { scale: 1.6 }, { scale: 1, duration: 0.8, ease: 'power2.out' });
      } else {
        // variant 8
        gsap.fromTo(wrap,
          { opacity: 0, scale: 0.2, x: gsap.utils.random(-60, 60), y: gsap.utils.random(-40, 40) },
          { opacity: 1, scale: 1, x: 0, y: 0, duration: 0.6, ease: 'power4.out',
            onComplete: () => { if (!_destroyed) gsap.to(wrap, { opacity: 0, scale: 0.3, duration: 0.4, delay }); } }
        );
        gsap.fromTo(inner, { scale: 2 }, { scale: 1, duration: 0.9, ease: 'power2.out' });
      }
    }

    function render() {
      if (_destroyed) return;
      const dist = Math.hypot(mouse.x - lastMouse.x, mouse.y - lastMouse.y);
      if (mouse.x > -9000 && dist > mouseThreshold) {
        showImg(imgEls[ctr % imgEls.length], mouse.x, mouse.y);
        lastMouse = { ...mouse };
        ctr++;
      }
      rafId = requestAnimationFrame(render);
    }

    // Attach to parent so pointer-events:none on this container still works
    const target = el.parentElement || el;
    const onMove = (e) => { mouse = getPos(e); };
    target.addEventListener('mousemove', onMove);

    rafId = requestAnimationFrame(render);

    return () => {
      _destroyed = true;
      cancelAnimationFrame(rafId);
      target.removeEventListener('mousemove', onMove);
      imgEls.forEach(({ wrap }) => {
        gsap.killTweensOf(wrap);
        wrap.remove();
      });
    };
  }, [images, variant, mouseThreshold, resetDuration]);

  return (
    <div
      ref={containerRef}
      className="content"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}
    />
  );
}
