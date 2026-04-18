import ActualitesContent from '@/components/pages/ActualitesContent';
export const metadata = {
  title: 'Actualités | Association Palmeraies Tighremt',
  description: "Suivez les dernières actualités de l'association Palmeraies Tighremt : missions terrain, projets de conservation, échanges culturels et événements.",
  alternates: { canonical: 'https://palmeries-tighremt.org/actualites' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function ActualitesPage() { return <ActualitesContent />; }
