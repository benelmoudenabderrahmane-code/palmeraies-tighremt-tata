'use client';
import React, { useRef, useState } from 'react';

export function GlassDock({ items = [] }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const getScale = (i) => {
    if (hoveredIndex === null) return 1;
    const dist = Math.abs(i - hoveredIndex);
    if (dist === 0) return 1.5;
    if (dist === 1) return 1.25;
    if (dist === 2) return 1.1;
    return 1;
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-end',
      gap: '0.5rem',
      padding: '0.6rem 0.9rem',
      background: 'rgba(255,255,255,0.18)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.3)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.4)',
    }}>
      {items.map((item, i) => {
        const Icon = item.icon;
        const scale = getScale(i);
        return (
          <a
            key={item.title}
            href={item.href}
            title={item.title}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              width: 40,
              height: 40,
              borderRadius: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: hoveredIndex === i ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.25)',
              textDecoration: 'none',
              transform: `scale(${scale})`,
              transformOrigin: 'bottom center',
              transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.2s',
              cursor: 'pointer',
            }}
          >
            <Icon size={18} color="rgba(20,40,20,0.85)" />
          </a>
        );
      })}
    </div>
  );
}
