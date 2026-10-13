'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingDock from '@/components/FloatingDock';
import ChatbotClient from '@/components/ui/ChatbotClient';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import BackToTop from '@/components/ui/BackToTop';
import ToastContainer from '@/components/ui/Toast';
import CookieBanner from '@/components/ui/CookieBanner';
import InstallPrompt from '@/components/ui/InstallPrompt';
import PageTransition from '@/components/ui/PageTransition';

/**
 * Renders the association chrome (Navbar, Footer, etc.) for all routes
 * EXCEPT those under /autopublish — those use their own isolated layout.
 */
export default function ConditionalShell({ children }) {
  const pathname = usePathname();
  const isAutopublish = pathname?.startsWith('/autopublish');
  // Le Studio 3D est une application plein écran : pas de navigation du site.
  const isStudio = pathname?.startsWith('/studio-3d');

  if (isAutopublish || isStudio) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <FloatingDock />
      <ChatbotClient />
      <WhatsAppButton />
      <BackToTop />
      <ToastContainer />
      <CookieBanner />
      <InstallPrompt />
      <PageTransition />
    </>
  );
}
