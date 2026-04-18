import FaqContent from '@/components/pages/FaqContent';
export const metadata = {
  title: 'FAQ | Association Palmeraies Tighremt',
  description: "Questions fréquemment posées sur l'association, les dons, le bénévolat et les projets.",
  alternates: { canonical: 'https://palmeries-tighremt.org/faq' },
  openGraph: {
    images: [{ url: 'https://palmeries-tighremt.org/images/tighremt/palmeraie-panorama.jpg', width: 1200, height: 630, alt: 'Palmeraie de Tighremt' }],
  },
};
export default function FaqPage() { return <FaqContent />; }
