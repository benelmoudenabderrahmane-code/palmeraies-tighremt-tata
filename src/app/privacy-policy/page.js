import MentionsLegalesContent from '@/components/pages/MentionsLegalesContent';

export const metadata = {
  title: 'Privacy Policy | Palmeraies Tighremt',
  description: "Privacy policy, legal notices and data protection information for the Association Palmeraies Tighremt TATA website, a non-profit founded in 2010.",
  alternates: { canonical: 'https://association-palmeraies-tighremt.com/mentions-legales' },
};

const privacySchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Privacy Policy — Association Palmeraies Tighremt',
  description: 'Privacy policy for the Association Palmeraies Tighremt website.',
  url: 'https://association-palmeraies-tighremt.com/privacy-policy',
  about: { '@type': 'NGO', name: 'Association Palmeraies Tighremt' },
};

export default function PrivacyPolicyPage() {
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
