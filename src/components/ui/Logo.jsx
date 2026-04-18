'use client';
import React from 'react';

export default function Logo({ size = 44, lazy = false }) {
  return (
    <img
      src="/logo.png"
      alt="Association Palmeraies Tighremt TATA"
      width={size}
      height={size}
      loading={lazy ? 'lazy' : undefined}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  );
}
