'use client';
import React, { useRef, useState } from 'react';

export default function AnimatedButton({
  as: Tag = 'button',
  children,
  className = '',
  style = {},
  ...props
}) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <Tag
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.6rem 1.2rem',
        borderRadius: '0.5rem',
        border: '1px solid #e5e7eb',
        background: 'rgba(255,255,255,0.8)',
        color: '#374151',
        fontSize: '0.85rem',
        fontWeight: 500,
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
        ...style,
      }}
      {...props}
    >
      {/* Spotlight effect */}
      <span
        style={{
          position: 'absolute',
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,131,42,0.18) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
          left: pos.x,
          top: pos.y,
          pointerEvents: 'none',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.2s',
        }}
      />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </Tag>
  );
}
