'use client';

import dynamic from 'next/dynamic';

// Three.js ne s'exécute que dans le navigateur : pas de rendu serveur.
const Studio3D = dynamic(() => import('./Studio3D'), {
  ssr: false,
  loading: () => (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: '#0c1f12', color: '#f3ecdf', fontFamily: 'system-ui, sans-serif' }}>
      Chargement du Studio 3D…
    </div>
  ),
});

export default function Studio3DClient() {
  return <Studio3D />;
}
