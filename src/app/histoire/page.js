import HistoireContent from '@/components/pages/HistoireContent';

export const metadata = {
  title: 'Notre Histoire | Association Palmeraies Tighremt',
  description:
    "Histoire de l'Association Palmeraies Tighremt, fondée en 2010 : actions humanitaires, engagement pour Tighremt et comment nous rejoindre.",
  alternates: { canonical: 'https://association-palmeraies-tighremt.com/histoire' },
  openGraph: {
    images: [{ url: 'https://association-palmeraies-tighremt.com/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'Notre Histoire — Association Palmeraies Tighremt',
  description: "L'histoire de l'Association Palmeraies Tighremt depuis sa fondation en 2010.",
  url: 'https://association-palmeraies-tighremt.com/histoire',
  about: {
    '@type': 'NGO',
    name: 'Association Palmeraies Tighremt',
    foundingDate: '2010',
    url: 'https://association-palmeraies-tighremt.com',
  },
};

export default function HistoirePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <HistoireContent />
    </>
  );
}
