import MissionContent from '@/components/pages/MissionContent';

export const metadata = {
  title: 'Notre Mission | Association Palmeraies Tighremt',
  description:
    "Découvrez la mission de Palmeraies Tighremt : sauvegarde de la palmeraie, aide humanitaire et développement durable à Tata, Maroc.",
  alternates: { canonical: 'https://palmeries-tighremt.org/mission' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

export default function MissionPage() {
  return <MissionContent />;
}
