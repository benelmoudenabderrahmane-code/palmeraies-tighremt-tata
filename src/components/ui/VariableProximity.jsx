import { useRef, useEffect, useCallback } from 'react';

function parseFontVariation(str) {
  const result = {};
  const matches = [...str.matchAll(/'([^']+)'\s+([\d.]+)/g)];
  for (const match of matches) {
    result[match[1]] = parseFloat(match[2]);
  }
  return result;
}

function interpolateFontVariation(from, to, t) {
  return Object.keys(from)
    .map(key => {
      const fromVal = from[key];
      const toVal = to[key] ?? fromVal;
      return `'${key}' ${(fromVal + (toVal - fromVal) * t).toFixed(2)}`;
    })
    .join(', ');
}

const VariableProximity = ({
  label = '',
  className = '',
  fromFontVariationSettings = "'wght' 400",
  toFontVariationSettings = "'wght' 900",
  containerRef,
  radius = 100,
  falloff = 'linear',
  style = {},
}) => {
  const letterRefs = useRef([]);
  const fromSettings = parseFontVariation(fromFontVariationSettings);
  const toSettings = parseFontVariation(toFontVariationSettings);

  const handleMouseMove = useCallback(
    (e) => {
      letterRefs.current.forEach((letter) => {
        if (!letter) return;
        const rect = letter.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
        );

        let t = 1 - Math.min(distance / radius, 1);

        if (falloff === 'exponential') {
          t = t * t;
        } else if (falloff === 'gaussian') {
          t = Math.exp(-Math.pow(distance / (radius / 2), 2));
        }

        letter.style.fontVariationSettings = interpolateFontVariation(fromSettings, toSettings, t);
      });
    },
    [radius, falloff, fromSettings, toSettings]
  );

  const handleMouseLeave = useCallback(() => {
    letterRefs.current.forEach((letter) => {
      if (!letter) return;
      letter.style.fontVariationSettings = fromFontVariationSettings;
    });
  }, [fromFontVariationSettings]);

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [containerRef, handleMouseMove, handleMouseLeave]);

  return (
    <span className={className} style={style} aria-label={label}>
      {label.split('').map((char, i) => (
        <span
          key={i}
          ref={(el) => (letterRefs.current[i] = el)}
          style={{
            display: 'inline-block',
            fontVariationSettings: fromFontVariationSettings,
            transition: 'font-variation-settings 0.1s ease',
          }}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default VariableProximity;
