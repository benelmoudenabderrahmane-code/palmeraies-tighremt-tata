import EvenementsContent from '@/components/pages/EvenementsContent';
export const metadata = {
  title: 'Événements | Association Palmeraies Tighremt',
  description: "Agenda des prochains événements de l'Association Palmeraies Tighremt : assemblées, collectes, missions terrain à Tata, Maroc.",
  alternates: { canonical: 'https://palmeries-tighremt.org/evenements' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function EvenementsPage() { return <EvenementsContent />; }
