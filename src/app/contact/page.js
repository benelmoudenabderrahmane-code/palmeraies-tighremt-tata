import ContactContent from '@/components/pages/ContactContent';

export const metadata = {
  title: 'Contact | Association Palmeraies Tighremt',
  description:
    "Contactez l'Association Palmeraies Tighremt. Adresse, téléphone, e-mail et formulaire de contact pour rejoindre notre réseau de bénévoles.",
  alternates: { canonical: 'https://association-palmeraies-tighremt.com/contact' },
  openGraph: {
    images: [{ url: 'https://association-palmeraies-tighremt.com/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};

export default function ContactPage() {
  return <ContactContent />;
}
