import EquipeContent from '@/components/pages/EquipeContent';

export const metadata = {
  title: 'Notre Équipe | Association Palmeraies Tighremt',
  description:
    "Rencontrez les bénévoles engagés qui font vivre l'Association Palmeraies Tighremt : président, trésorier, secrétaires et vice-présidents.",
  alternates: { canonical: 'https://palmeries-tighremt.org/equipe' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

export default function EquipePage() {
  return <EquipeContent />;
}
