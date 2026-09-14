import GalerieContent from '@/components/pages/GalerieContent';
export const metadata = {
  title: 'Galerie | Association Palmeraies Tighremt',
  description: "Découvrez en images la palmeraie, le ksar de Tighremt, les missions humanitaires et les travaux de terrain menés à Tata, au Maroc.",
  alternates: { canonical: 'https://association-palmeraies-tighremt.com/galerie' },
  openGraph: {
    images: [{ url: 'https://association-palmeraies-tighremt.com/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function GaleriePage() { return <GalerieContent />; }
