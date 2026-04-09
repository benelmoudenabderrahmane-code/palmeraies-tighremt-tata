'use client';
import React from 'react';
import { motion } from 'framer-motion';

export function MaskedAvatars({
  avatars = [],
  size = 56,
  border = 4,
  column = 20,
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
          }}
        >
          <img
            src={a.avatar}
            alt={a.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </motion.div>
      ))}
      <div style={{ marginLeft: 12, fontSize: '0.82rem', color: '#8a8270', fontWeight: 400 }}>
        +{avatars.length} bénévoles actifs
      </div>
    </div>
  );
}
