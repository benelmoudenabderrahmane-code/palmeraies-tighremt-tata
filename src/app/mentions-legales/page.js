import MentionsLegalesContent from '@/components/pages/MentionsLegalesContent';

export const metadata = {
  title: 'Mentions légales & Confidentialité | Palmeraies Tighremt',
  description: 'Mentions légales, politique de confidentialité et conditions d\'utilisation du site de l\'Association Palmeraies Tighremt TATA, association loi 1901.',
  alternates: { canonical: 'https://palmeries-tighremt.org/mentions-legales' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

const privacySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Mentions légales & Politique de confidentialité',
  description: 'Politique de confidentialité et mentions légales de l\'Association Palmeraies Tighremt.',
  url: 'https://palmeries-tighremt.org/mentions-legales',
  about: { '@type': 'NGO', name: 'Association Palmeraies Tighremt' },
};

export default function MentionsLegalesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(privacySchema) }}
      />
      <MentionsLegalesContent />
    </>
  );
}
