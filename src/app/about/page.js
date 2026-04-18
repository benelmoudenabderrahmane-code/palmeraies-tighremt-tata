import HistoireContent from '@/components/pages/HistoireContent';

export const metadata = {
  title: 'About Us — Association Palmeraies Tighremt',
  description: "About the Association Palmeraies Tighremt, founded in 2010: humanitarian actions, commitment to Tighremt's palm grove and how to join us.",
  alternates: { canonical: 'https://palmeries-tighremt.org/histoire' },
};

const aboutSchema = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'About Association Palmeraies Tighremt',
  description: "About the Association Palmeraies Tighremt, non-profit founded in 2010 for the preservation of Tighremt's palm grove.",
  url: 'https://palmeries-tighremt.org/about',
  mainEntity: {
    '@type': 'NGO',
    name: 'Association Palmeraies Tighremt',
    foundingDate: '2010',
    url: 'https://palmeries-tighremt.org',
  },
};

export default function AboutPage() {
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
