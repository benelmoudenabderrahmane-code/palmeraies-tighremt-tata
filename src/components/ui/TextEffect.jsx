'use client';

/**
 * TextEffect — animated text by word, char, or line.
 *
 * Props:
 *   children   {string}   text to animate
 *   per        {'word'|'char'|'line'}  granularity (default: 'word')
 *   as         {string}   HTML tag (default: 'p')
 *   preset     {'blur'|'shake'|'scale'|'fade'|'slide'}
 *   delay      {number}   seconds before stagger begins (default: 0)
 *   trigger    {boolean}  mount/unmount trigger (default: true)
 *   className  {string}
 *   onAnimationComplete {function}
 *   segmentWrapperClassName {string}
 */

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const staggerTimes = { char: 0.03, word: 0.05, line: 0.1 };

const defaultContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  exit:    { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const defaultItem = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
  exit:    { opacity: 0 },
};

const presets = {
  blur: {
    container: defaultContainer,
    item: {
      hidden:  { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
      exit:    { opacity: 0, filter: 'blur(12px)' },
    },
  },
  shake: {
    container: defaultContainer,
    item: {
      hidden:  { x: 0 },
      visible: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.5 } },
      exit:    { x: 0 },
    },
  },
  scale: {
    container: defaultContainer,
    item: {
      hidden:  { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit:    { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainer,
    item: {
      hidden:  { opacity: 0 },
      visible: { opacity: 1 },
      exit:    { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainer,
    item: {
      hidden:  { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit:    { opacity: 0, y: 20 },
    },
  },
};

/* ── AnimationComponent ─────────────────────────────────────── */
const AnimationComponent = React.memo(function AnimationComponent({
  segment, variants, per, segmentWrapperClassName,
}) {
  let content;

  if (per === 'line') {
    content = (
      <motion.span variants={variants} style={{ display: 'block' }}>
        {segment}
      </motion.span>
    );
  } else if (per === 'word') {
    content = (
      <motion.span
        aria-hidden="true"
        variants={variants}
        style={{ display: 'inline-block', whiteSpace: 'pre' }}
      >
        {segment}
      </motion.span>
    );
  } else {
    // char
    content = (
      <motion.span style={{ display: 'inline-block', whiteSpace: 'pre' }}>
        {segment.split('').map((char, ci) => (
          <motion.span
            key={`char-${ci}`}
            aria-hidden="true"
            variants={variants}
            style={{ display: 'inline-block', whiteSpace: 'pre' }}
          >
            {char}
          </motion.span>
        ))}
      </motion.span>
    );
  }

  if (!segmentWrapperClassName) return content;

  const defaultWrap = per === 'line' ? 'block' : 'inline-block';
  return (
    <span className={cn(defaultWrap, segmentWrapperClassName)}>
      {content}
    </span>
  );
});

/* ── TextEffect ─────────────────────────────────────────────── */
export function TextEffect({
  children,
  per       = 'word',
  as        = 'p',
  variants,
  className,
  style,
  preset,
  delay     = 0,
  trigger   = true,
  onAnimationComplete,
  segmentWrapperClassName,
}) {
  let segments;
  if (per === 'line')       segments = children.split('\n');
  else if (per === 'word')  segments = children.split(/(\s+)/);
  else                      segments = children.split('');

  const Tag       = motion[as] || motion.p;
  const chosen    = preset ? presets[preset] : { container: defaultContainer, item: defaultItem };
  const cVars     = variants?.container || chosen.container;
  const iVars     = variants?.item      || chosen.item;
  const stagger   = staggerTimes[per];

  const delayedContainer = {
    hidden: cVars.hidden,
    visible: {
      ...cVars.visible,
      transition: {
        ...(cVars.visible?.transition || {}),
        staggerChildren: cVars.visible?.transition?.staggerChildren || stagger,
        delayChildren:   delay,
      },
    },
    exit: cVars.exit,
  };

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <Tag
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-label={per !== 'line' ? children : undefined}
          variants={delayedContainer}
          style={style}
          className={cn('whitespace-pre-wrap', className)}
          onAnimationComplete={onAnimationComplete}
        >
          {segments.map((seg, i) => (
            <AnimationComponent
              key={`${per}-${i}-${seg}`}
              segment={seg}
              variants={iVars}
              per={per}
              segmentWrapperClassName={segmentWrapperClassName}
            />
          ))}
        </Tag>
      )}
    </AnimatePresence>
  );
}

export default TextEffect;
