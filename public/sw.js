/* Service Worker — Palmeraies Tighremt */
const CACHE = 'tighremt-v6';

/* ── Seuls les assets statiques sont pré-cachés (pas les pages HTML) ── */
const STATIC_ASSETS = [
  '/lib/gsap.min.js',
  '/lib/ScrollTrigger.min.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(STATIC_ASSETS.map(a => c.add(a)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  /* Ignorer : API, cross-origin */
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) return;

  /* ── Pages HTML → Network-first (toujours fraîches) ── */
  const isHTML = e.request.headers.get('accept')?.includes('text/html')
    || (!url.pathname.includes('.') && url.pathname !== '/');

  if (isHTML) {
    e.respondWith(
      fetch(e.request)
        .then(res => res)
        .catch(() => caches.match(e.request))
    );
    return;
  }

  /* ── Assets statiques → Cache-first ── */
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(res => {
        if (!res || !res.ok) return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
