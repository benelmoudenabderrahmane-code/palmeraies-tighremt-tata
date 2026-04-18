import PartenairesContent from '@/components/pages/PartenairesContent';
export const metadata = {
  title: 'Partenaires | Association Palmeraies Tighremt',
  alternates: { canonical: 'https://palmeries-tighremt.org/partenaires' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function PartenairesPage() { return <PartenairesContent />; }
