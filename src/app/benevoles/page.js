import BenevolesContent from '@/components/pages/BenevolesContent';
export const metadata = {
  title: 'Bénévolat | Association Palmeraies Tighremt',
  description: 'Rejoignez notre équipe de bénévoles et contribuez à la sauvegarde de Tighremt.',
  alternates: { canonical: 'https://palmeries-tighremt.org/benevoles' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function BenevolesPage() { return <BenevolesContent />; }
