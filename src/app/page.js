import HomeContent from '@/components/pages/HomeContent';

export const metadata = {
  title: 'Association Palmeraies Tighremt | TATA · Maroc',
  description:
    'Association loi 1901 fondée en 2010. Sauvegarde de la palmeraie, missions humanitaires et développement du village de Tighremt, province de Tata, Maroc.',
  alternates: { canonical: 'https://palmeries-tighremt.org' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://palmeries-tighremt.org';

const videoSchema = {
  '@context': 'https://schema.org',
  '@type': 'VideoObject',
  name: 'Palmeraie de Tighremt — Association Palmeraies Tighremt',
  description: 'Découvrez la beauté de la palmeraie de Tighremt, Maroc. Association loi 1901 œuvrant pour la sauvegarde de cet écosystème unique.',
  thumbnailUrl: `${BASE}/images/tighremt/palmeraie-panorama.jpg`,
  uploadDate: '2024-01-01',
  contentUrl: `${BASE}/palmeraie.mp4`,
  embedUrl: BASE,
  publisher: {
    '@type': 'Organization',
    name: 'Association Palmeraies Tighremt',
    logo: { '@type': 'ImageObject', url: `${BASE}/logo.png` },
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }}
      />
      <HomeContent />
    </>
  );
}
