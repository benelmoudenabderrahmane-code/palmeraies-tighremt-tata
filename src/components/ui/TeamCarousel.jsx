'use client';

/**
 * TeamCarousel — StaggerTestimonials animation adapted for team members.
 * Staggered hexagonal card stack with prev/next navigation.
 * Pass `members` array: [{ name, role, bio, skills, roleColor, gradient, RoleIcon }]
 */

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { C, FONT } from '@/lib/tokens';

const SQRT_5000 = Math.sqrt(5000);

function MemberCard({ member, position, handleMove, cardSize }) {
  const isCenter = position === 0;

  /* initials */
  const initials = member.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <div
      onClick={() => handleMove(position)}
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        width: cardSize,
        height: cardSize,
        cursor: 'pointer',
        border: `2px solid ${isCenter ? member.roleColor : C.sandDark}`,
        borderRadius: 0,
        padding: '2rem',
        background: isCenter ? member.gradient || C.greenDeep : '#fff',
        clipPath: `polygon(40px 0%, calc(100% - 40px) 0%, 100% 40px, 100% 100%, calc(100% - 40px) 100%, 40px 100%, 0 100%, 0 0)`,
        transform: `
          translate(-50%, -50%)
          translateX(${(cardSize / 1.55) * position}px)
          translateY(${isCenter ? -60 : position % 2 ? 12 : -12}px)
          rotate(${isCenter ? 0 : position % 2 ? 2.5 : -2.5}deg)
        `,
        boxShadow: isCenter
          ? `0 8px 0 4px ${C.sandDark}, 0 16px 40px rgba(19,61,32,0.28)`
          : '0 2px 12px rgba(0,0,0,0.07)',
        transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
        zIndex: isCenter ? 10 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        overflow: 'hidden',
      }}
    >
      {/* Diagonal cut line */}
      <span style={{
        position: 'absolute',
        right: -2,
        top: 38,
        width: SQRT_5000,
        height: 2,
        background: isCenter ? 'rgba(255,255,255,0.2)' : C.sandDark,
        transformOrigin: 'top right',
        transform: 'rotate(45deg)',
        display: 'block',
      }} />

      {/* Avatar initials */}
      <div style={{
        width: 52, height: 48,
        background: isCenter ? 'rgba(255,255,255,0.15)' : member.gradient || C.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `3px 3px 0 ${isCenter ? 'rgba(0,0,0,0.15)' : '#fff'}`,
        flexShrink: 0,
      }}>
        <span style={{
          fontFamily: FONT.alt,
          fontSize: '1.2rem',
          fontWeight: 700,
          color: '#fff',
          letterSpacing: '0.04em',
        }}>
          {initials}
        </span>
      </div>

      {/* Quote / bio */}
      <div style={{
        fontFamily: FONT.alt,
        fontSize: cardSize > 320 ? '1.1rem' : '0.95rem',
        fontWeight: 500,
        color: isCenter ? '#fff' : C.ink,
        lineHeight: 1.55,
        flex: 1,
      }}>
        &ldquo;{member.bio}&rdquo;
      </div>

      {/* Name + role */}
      <div style={{
        position: 'absolute',
        bottom: cardSize > 320 ? '2rem' : '1.5rem',
        left: '2rem',
        right: '2rem',
      }}>
        <div style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          color: isCenter ? '#fff' : C.greenDeep,
          marginBottom: '0.2rem',
        }}>
          {member.name}
        </div>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isCenter ? 'rgba(255,255,255,0.7)' : member.roleColor,
        }}>
          {member.role}
        </div>

        {/* Skills chips (center only) */}
        {isCenter && member.skills && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.6rem' }}>
            {member.skills.slice(0, 3).map((s) => (
              <span key={s} style={{
                fontSize: '0.58rem',
                padding: '2px 8px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.22)',
                fontWeight: 500,
                letterSpacing: '0.04em',
              }}>
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TeamCarousel({ members = [] }) {
  const [cardSize, setCardSize]   = useState(340);
  const [list, setList]           = useState(members);

  const handleMove = (steps) => {
    const next = [...list];
    if (steps > 0) {
      for (let i = steps; i > 0; i--) {
        const item = next.shift();
        if (!item) return;
        next.push({ ...item, _key: Math.random() });
      }
    } else {
      for (let i = steps; i < 0; i++) {
        const item = next.pop();
        if (!item) return;
        next.unshift({ ...item, _key: Math.random() });
      }
    }
    setList(next);
  };

  /* auto-rotate */
  useEffect(() => {
    const t = setInterval(() => handleMove(1), 4000);
    return () => clearInterval(t);
  }, [list]);

  useEffect(() => {
    const update = () => {
      setCardSize(window.matchMedia('(min-width: 640px)').matches ? 340 : 280);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!list.length) return null;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: 560,
      overflow: 'hidden',
      background: C.sandMid,
    }}>
      {list.map((member, idx) => {
        const position = list.length % 2
          ? idx - (list.length + 1) / 2
          : idx - list.length / 2;
        return (
          <MemberCard
            key={member._key || member.name}
            member={member}
            position={position}
            handleMove={handleMove}
            cardSize={cardSize}
          />
        );
      })}

      {/* Controls */}
      <div style={{
        position: 'absolute',
        bottom: '1.25rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.6rem',
        zIndex: 20,
      }}>
        <button
          onClick={() => handleMove(-1)}
          aria-label="Précédent"
          style={{
            width: 52, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff',
            border: `2px solid ${C.sandDark}`,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
            fontSize: '1.2rem',
            color: C.greenDeep,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.greenDeep; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.greenDeep; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = C.greenDeep; e.currentTarget.style.borderColor = C.sandDark; }}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => handleMove(1)}
          aria-label="Suivant"
          style={{
            width: 52, height: 52,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fff',
            border: `2px solid ${C.sandDark}`,
            cursor: 'pointer',
            transition: 'background 0.2s, border-color 0.2s',
            fontSize: '1.2rem',
            color: C.greenDeep,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = C.greenDeep; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.greenDeep; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = C.greenDeep; e.currentTarget.style.borderColor = C.sandDark; }}
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Position dots */}
      <div style={{
        position: 'absolute', bottom: '1.4rem', left: '50%',
        transform: 'translateX(-50%) translateX(70px)',
        display: 'flex', gap: '0.35rem', alignItems: 'center',
      }}>
        {members.map((_, i) => {
          const centerIdx = Math.round(list.length / 2);
          const activeName = list[centerIdx]?.name;
          const isActive = activeName === members[i]?.name;
          return (
            <div key={i} style={{
              width: isActive ? 18 : 6,
              height: 6,
              borderRadius: 99,
              background: isActive ? C.greenDeep : C.sandDark,
              transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
            }} />
          );
        })}
      </div>
    </div>
  );
}

export default TeamCarousel;
