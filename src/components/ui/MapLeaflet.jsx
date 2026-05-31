'use client';
import { C } from '@/lib/tokens';

/**
 * MapLeaflet — carte satellite Google Maps de Tighremt.
 * Vue hybride (satellite + labels) centrée sur le village.
 * Coordonnées : 29.7488°N, 8.0028°W — Province de Tata, Maroc.
 */
export default function MapLeaflet() {
  return (
    <div style={{
      width: '100%',
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(19,61,32,0.14)',
      border: `1px solid ${C.sandDark}`,
      aspectRatio: '16/9',
      minHeight: 320,
    }}>
      <iframe
        title="Tighremt — carte satellite"
        src="https://maps.google.com/maps?q=29.7488,-8.0028&t=h&z=13&output=embed"
        width="100%"
        height="100%"
        style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
