/* Service Worker — Palmeraies Tighremt */
const CACHE   = 'tighremt-v4';
const PRECACHE = ['/', '/mission', '/projets', '/don', '/contact', '/histoire', '/equipe'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
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

  // ── Never cache: API routes, cross-origin requests, browser-extension requests
  if (
    url.pathname.startsWith('/api/') ||
    url.origin !== self.location.origin
  ) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;

      return fetch(e.request).then(res => {
        // Only cache successful responses
        if (!res || !res.ok) return res;

        // Respect Cache-Control: no-store / private — do not cache these
        const cc = res.headers.get('Cache-Control') || '';
        if (cc.includes('no-store') || cc.includes('private')) return res;

        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => cached || new Response('Offline', { status: 503 }));
    })
  );
});
