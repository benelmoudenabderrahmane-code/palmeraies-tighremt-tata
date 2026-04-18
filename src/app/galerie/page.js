import GalerieContent from '@/components/pages/GalerieContent';
export const metadata = {
  title: 'Galerie | Association Palmeraies Tighremt',
  description: 'Photos de la palmeraie, du village de Tighremt et de nos projets.',
  alternates: { canonical: 'https://palmeries-tighremt.org/galerie' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function GaleriePage() { return <GalerieContent />; }
