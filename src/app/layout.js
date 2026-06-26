import './globals.css';
import ScrollReset from '@/components/ScrollReset';
import ConditionalShell from '@/components/ConditionalShell';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'Association Palmeraies Tighremt | TATA · Maroc',
  description:
    'Association loi 1901 fondée en 2010. Sauvegarde de la palmeraie, missions humanitaires et développement du village de Tighremt, Tata, Maroc.',
  keywords: 'palmeraie, Tighremt, Tata, Maroc, association, humanitaire, désertification, oasis',
  openGraph: {
    title: 'Association Palmeraies Tighremt',
    description: 'Ensemble pour la sauvegarde de la palmeraie et le développement de Tighremt.',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

const SW_SCRIPT = `if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'))}`;

const LD_NGO = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Association Palmeraies Tighremt",
  "alternateName": "Palmeraies Tighremt TATA",
  "url": "https://palmeries-tighremt.org",
  "logo": "https://palmeries-tighremt.org/logo.png",
  "description": "Association loi 1901 fondee en 2010. Sauvegarde de la palmeraie et developpement du village de Tighremt, province de Tata, Maroc.",
  "foundingDate": "2010",
  "areaServed": { "@type": "Place", "name": "Tighremt, Tata, Maroc" },
  "contactPoint": { "@type": "ContactPoint", "email": "palmeraies.tighremt.tata@gmail.com", "contactType": "customer service" },
});

const LD_VIDEO = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Palmeraie de Tighremt - Association Palmeraies Tighremt",
  "description": "Decouvrez la beaute de la palmeraie de Tighremt, Maroc. Association loi 1901 oeuvrant pour la sauvegarde de cet ecosysteme unique.",
  "thumbnailUrl": "https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg",
  "uploadDate": "2024-01-01",
  "contentUrl": "https://palmeries-tighremt.org/palmeraie-hero.mp4",
  "embedUrl": "https://palmeries-tighremt.org",
  "publisher": {
    "@type": "Organization",
    "name": "Association Palmeraies Tighremt",
    "logo": { "@type": "ImageObject", "url": "https://palmeries-tighremt.org/logo.png" },
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" as="image" href="/logo.png" fetchPriority="high" />
        <link rel="preload" as="image" href="/images/tighremt/palmeraie-panorama.jpg" fetchPriority="high" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#133d20" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tighremt" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Literata:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&family=Noto+Sans+Arabic:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: SW_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LD_NGO }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: LD_VIDEO }} />
      </head>
      <body suppressHydrationWarning>
        {/* Cursor trail — client only */}
        <ScrollReset />

        {/* Skip link for accessibility — CSS-only via .skip-link:focus */}
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>

        <ConditionalShell>
          {children}
        </ConditionalShell>
      </body>
    </html>
  );
}
