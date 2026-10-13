/** @type {import('next').NextConfig} */

// Dashboard origin for CSP — set NEXT_PUBLIC_DASHBOARD_URL in env
const dashboardOrigin = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_DASHBOARD_URL;
    if (!url) return null;
    const { origin } = new URL(url);
    return origin !== 'http://localhost:8000' ? origin : null;
  } catch { return null; }
})();

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/politique-de-confidentialite', destination: '/mentions-legales', permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https://i.pravatar.cc https://picsum.photos https://images.unsplash.com",
              "media-src 'self'",
              `connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://challenges.cloudflare.com${dashboardOrigin ? ` ${dashboardOrigin}` : ''}`,
              "frame-src 'self' https://challenges.cloudflare.com https://maps.google.com https://www.google.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self' https://www.helloasso.com https://wa.me",
              "worker-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
