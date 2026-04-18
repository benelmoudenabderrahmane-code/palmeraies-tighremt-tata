import DonContent from '@/components/pages/DonContent';

export const metadata = {
  title: 'Faire un Don | Association Palmeraies Tighremt',
  description:
    "Soutenez l'Association Palmeraies Tighremt. Votre don finance nos actions humanitaires et la sauvegarde de la palmeraie de Tighremt, Tata, Maroc.",
  alternates: { canonical: 'https://palmeries-tighremt.org/don' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

export default function DonPage() {
  return <DonContent />;
}
