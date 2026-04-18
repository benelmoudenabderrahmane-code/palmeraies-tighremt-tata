import HistoireContent from '@/components/pages/HistoireContent';

export const metadata = {
  title: 'Notre Histoire | Association Palmeraies Tighremt',
  description:
    "L'histoire de l'Association Palmeraies Tighremt depuis sa fondation en 2010 : nos actions humanitaires, notre engagement pour Tighremt et comment nous rejoindre.",
  alternates: { canonical: 'https://palmeries-tighremt.org/histoire' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

export default function HistoirePage() {
  return <HistoireContent />;
}
