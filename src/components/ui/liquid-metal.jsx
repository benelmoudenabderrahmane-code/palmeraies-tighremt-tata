import React from 'react';
import { LiquidMetal } from '@paper-design/shaders-react';

const SIZE_MAP = { sm: '0.8rem', md: '0.95rem', lg: '1.05rem' };
const PAD_MAP  = { sm: '0.6rem 1.4rem', md: '0.9rem 2rem', lg: '1.1rem 2.5rem' };

export function LiquidMetalButton({
  as: Tag = 'button',
  children,
  icon,
  size = 'md',
  metalConfig = {},
  style = {},
  ...props
}) {
  const {
    colorBack = '#c47030',
    colorTint = '#ffcc88',
    speed = 0.5,
  } = metalConfig;

  return (
    <Tag
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.55rem',
        padding: PAD_MAP[size] || PAD_MAP.md,
        borderRadius: 999,
        border: 'none',
        cursor: 'pointer',
        fontSize: SIZE_MAP[size] || SIZE_MAP.md,
        fontWeight: 600,
        color: '#fff',
        textDecoration: 'none',
        overflow: 'hidden',
        minHeight: 44,
        letterSpacing: '0.02em',
        boxShadow: `0 8px 28px ${colorBack}55`,
        transition: 'transform 0.25s, box-shadow 0.25s',
        ...style,
      }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 14px 36px ${colorBack}77`; }}
      onMouseOut={e =>  { e.currentTarget.style.transform = '';                 e.currentTarget.style.boxShadow = `0 8px 28px ${colorBack}55`; }}
      {...props}
    >
      {/* LiquidMetal shader background */}
      <span style={{ position: 'absolute', inset: 0, zIndex: 0, borderRadius: 999, overflow: 'hidden' }}>
        <LiquidMetal
          style={{ width: '100%', height: '100%' }}
          colorBack={colorBack}
          colorTint={colorTint}
          speed={speed}
        />
      </span>
      {icon && <span style={{ position: 'relative', zIndex: 1, display: 'flex' }}>{icon}</span>}
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </Tag>
  );
}
