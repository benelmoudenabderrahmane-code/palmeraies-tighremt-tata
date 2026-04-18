import ProjetsContent from '@/components/pages/ProjetsContent';

export const metadata = {
  title: 'Nos Projets | Association Palmeraies Tighremt',
  description:
    "Sauvegarde de la palmeraie, lutte contre la désertification, missions humanitaires et formation locale : découvrez tous les projets de l'Association Palmeraies Tighremt.",
  alternates: { canonical: 'https://palmeries-tighremt.org/projets' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

export default function ProjetsPage() {
  return <ProjetsContent />;
}
