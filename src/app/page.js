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

export default function HomePage() {
  return <HomeContent />;
}
