import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingDock from '@/components/FloatingDock';
import ClientTrail from '@/components/ClientTrail';
import ScrollReset from '@/components/ScrollReset';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  title: 'Association Palmeraies Tighremt | TATA · Maroc',
  description:
    'Association loi 1901 à but non lucratif fondée en mars 2010. Sauvegarde de la palmeraie, missions humanitaires et développement du village de Tighremt, province de Tata, Maroc.',
  keywords: 'palmeraie, Tighremt, Tata, Maroc, association, humanitaire, désertification, oasis',
  openGraph: {
    title: 'Association Palmeraies Tighremt',
    description: 'Ensemble pour la sauvegarde de la palmeraie et le développement de Tighremt.',
    locale: 'fr_FR',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Literata:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Cursor trail — client only */}
        <ScrollReset />
        <ClientTrail />

        {/* Skip link for accessibility — CSS-only via .skip-link:focus */}
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>

        <Navbar />

        <main id="main-content">
          {children}
        </main>

        <Footer />
        <FloatingDock />
      </body>
    </html>
  );
}
