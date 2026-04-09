'use client';
import React from 'react';

export default function Logo({ size = 44 }) {
  return (
    <img
      src="/logo.png"
      alt="Association Palmeraies Tighremt TATA"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', flexShrink: 0 }}
    />
  );
}
