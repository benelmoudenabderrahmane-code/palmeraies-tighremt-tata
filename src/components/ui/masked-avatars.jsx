'use client';
import React from 'react';
import { motion } from 'framer-motion';

function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function MaskedAvatars({
  avatars = [],
  size = 56,
  border = 4,
  column = 20,
  label = 'bénévoles actifs',
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {avatars.map((a, i) => (
        <motion.div
          key={a.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 300, damping: 24 }}
          whileHover={{ zIndex: 10, scale: 1.15, y: -4 }}
          title={a.name}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: `${border}px solid #faf7f0`,
            overflow: 'hidden',
            marginLeft: i === 0 ? 0 : -column,
            boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
            cursor: 'default',
            flexShrink: 0,
            background: a.gradient || a.color || '#1e5c30',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {a.avatar ? (
            <img
              src={a.avatar}
              alt={a.name}
              width={size}
              height={size}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: size * 0.36,
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              userSelect: 'none',
              lineHeight: 1,
            }}>
              {getInitials(a.name)}
            </span>
          )}
        </motion.div>
      ))}
      <div style={{ marginLeft: 12, fontSize: '0.82rem', color: '#8a8270', fontWeight: 400 }}>
        +{avatars.length} {label}
      </div>
    </div>
  );
}
