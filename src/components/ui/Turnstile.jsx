'use client';
import { useEffect, useRef } from 'react';

/**
 * Cloudflare Turnstile widget.
 * Site key set via NEXT_PUBLIC_TURNSTILE_SITE_KEY env var.
 * Falls back to Cloudflare test key (always passes) if not set.
 *
 * Usage:
 *   <Turnstile onVerify={(token) => setToken(token)} onExpire={() => setToken(null)} />
 */
export default function Turnstile({ onVerify, onExpire, onError, theme = 'light' }) {
  const containerRef = useRef(null);
  const widgetId     = useRef(null);

  useEffect(() => {
    const SITE_KEY =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

    const initWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      if (widgetId.current !== null) return;

      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey:            SITE_KEY,
        theme,
        callback:           (token) => onVerify?.(token),
        'expired-callback': ()      => { onExpire?.(); widgetId.current = null; },
        'error-callback':   ()      => onError?.(),
      });
    };

    const existing = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (existing) {
      if (window.turnstile) initWidget();
      else existing.addEventListener('load', initWidget);
    } else {
      const s  = document.createElement('script');
      s.src    = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      s.async  = true;
      s.defer  = true;
      s.onload = initWidget;
      document.head.appendChild(s);
    }

    return () => {
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onVerify, onExpire, onError, theme]);

  return <div ref={containerRef} style={{ marginTop: '0.75rem' }} />;
}
